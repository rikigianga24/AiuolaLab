// Foto delle piante da iNaturalist (https://www.inaturalist.org), con
// Wikimedia Commons come riserva (vedi wikimedia.js).
//
// Non usiamo un motore di ricerca immagini: le foto trovate sul web sono
// quasi sempre coperte da copyright. iNaturalist offre milioni di foto di
// piante identificate dalla comunità, ciascuna con autore e licenza. Teniamo
// solo le licenze che consentono il riuso anche commerciale (CC0, CC BY,
// CC BY-SA) e mostriamo sempre l'attribuzione.
//
// Le immagini non vengono copiate sul nostro server: salviamo in cache solo
// i link e le attribuzioni (tabella plant_cache, provider "inat").
import { config } from "../config.js";
import { hasDatabase, query } from "../db.js";
import { FOTO_VARIETA } from "./catalog/fotoVarieta.js";
import { flickrPhotosFor } from "./flickr.js";
import { FOTO_MANUALI, categoryCandidates, parseVariety } from "./varieties.js";
import { commonsCategoryPhotos, findVarietyCategory, findWikimediaPhotos } from "./wikimedia.js";

const API = "https://api.inaturalist.org/v1";
const PROVIDER = "inat";
const TTL = 60 * 24 * 60 * 60 * 1000; // 60 giorni
const EMPTY_TTL = 3 * 24 * 60 * 60 * 1000; // ritenta dopo 3 giorni se non c'erano foto
const MAX_PHOTOS = 8;
const OK_LICENSES = new Set(["cc0", "cc-by", "cc-by-sa"]);
const LICENSE_LABEL = { cc0: "CC0", "cc-by": "CC BY", "cc-by-sa": "CC BY-SA" };
const LICENSE_URL = {
  cc0: "https://creativecommons.org/publicdomain/zero/1.0/",
  "cc-by": "https://creativecommons.org/licenses/by/4.0/",
  "cc-by-sa": "https://creativecommons.org/licenses/by-sa/4.0/",
};

const userAgent = () => `AiuolaLab/0.3 (${config.appUrl}${config.weatherContact ? `; ${config.weatherContact}` : ""})`;

// ---- cache ----

const memory = new Map();

// Le voci salvate prima del 2026-11 hanno miniature di Commons a 240 e
// 1024 px, larghezze che Wikimedia non serve più: si correggono in lettura.
const fixSize = (url) => url?.replace(/\/240px-/, "/330px-").replace(/\/1024px-/, "/1280px-");
export function fixCachedSizes(data) {
  if (!data?.photos?.some((p) => p.source === "Wikimedia Commons")) return data;
  return {
    ...data,
    photos: data.photos.map((p) => (p.source === "Wikimedia Commons" ? { ...p, thumb: fixSize(p.thumb), large: fixSize(p.large) } : p)),
  };
}

async function cacheGet(key) {
  if (hasDatabase()) {
    try {
      const { rows } = await query("SELECT data, fetched_at FROM plant_cache WHERE provider = $1 AND cache_key = $2", [PROVIDER, key]);
      const row = rows[0];
      if (!row) return null;
      const ttl = row.data?.photos?.length ? TTL : EMPTY_TTL;
      return Date.now() - new Date(row.fetched_at).getTime() < ttl ? fixCachedSizes(row.data) : null;
    } catch (err) {
      console.warn("[photos] lettura cache fallita:", err.message);
      return null;
    }
  }
  const hit = memory.get(key);
  if (!hit) return null;
  const ttl = hit.data?.photos?.length ? TTL : EMPTY_TTL;
  return Date.now() - hit.at < ttl ? hit.data : null;
}

async function cacheSet(key, data) {
  if (hasDatabase()) {
    try {
      await query(
        `INSERT INTO plant_cache (provider, cache_key, data, fetched_at) VALUES ($1, $2, $3, now())
         ON CONFLICT (provider, cache_key) DO UPDATE SET data = EXCLUDED.data, fetched_at = now()`,
        [PROVIDER, key, JSON.stringify(data)],
      );
    } catch (err) {
      console.warn("[photos] scrittura cache fallita:", err.message);
    }
    return;
  }
  if (memory.size > 3000) memory.delete(memory.keys().next().value);
  memory.set(key, { at: Date.now(), data });
}

// ---- richieste a iNaturalist, in fila (chiedono al massimo ~1 al secondo) ----
//
// Due code: "high" per chi sta guardando la pagina, "low" per il
// riempimento automatico in sottofondo. Le richieste degli utenti passano
// sempre davanti.

let spacingMs = 1000;
// solo per i test
export const setRequestSpacing = (ms) => {
  spacingMs = ms;
};
const queues = { high: [], low: [] };
let pumping = false;
const inflight = new Map();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function schedule(fn, priority = "high") {
  return new Promise((resolve, reject) => {
    queues[priority === "low" ? "low" : "high"].push({ fn, resolve, reject });
    pump();
  });
}

async function pump() {
  if (pumping) return;
  pumping = true;
  while (queues.high.length || queues.low.length) {
    const job = queues.high.shift() ?? queues.low.shift();
    try {
      job.resolve(await job.fn());
    } catch (err) {
      job.reject(err);
    }
    await sleep(spacingMs);
  }
  pumping = false;
}

async function getJson(url, fetchImpl, label) {
  const r = await fetchImpl(url, { headers: { "User-Agent": userAgent(), Accept: "application/json" }, signal: AbortSignal.timeout(10_000) });
  if (!r.ok) throw new Error(`${label} ${r.status}`);
  return r.json();
}

const inat = (path, fetchImpl) => getJson(`${API}${path}`, fetchImpl, "iNaturalist");

// "Geranium 'Rozanne'" -> "Geranium"; "Nepeta x faassenii" -> "Nepeta faassenii"
export function cleanScientificName(name) {
  return String(name ?? "")
    .replace(/['‘’"“”].*?['‘’"“”]/g, " ")
    .replace(/\b(cv|var|subsp|ssp|f)\.\s*\S+/gi, " ")
    .replace(/\s[x×]\s/gi, " ")
    .replace(/\(.*?\)/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 2)
    .join(" ");
}

// Le foto di iNaturalist hanno lo stesso indirizzo in varie misure:
// .../photos/123/square.jpg -> small (240px), medium (500px), large (1024px).
const sized = (url, size) => (url ? url.replace(/\/(square|small|medium|large|original|thumb)\.(jpe?g|png)/i, `/${size}.$2`) : null);

export function toPhoto(p) {
  const license = (p?.license_code ?? "").toLowerCase();
  if (!p?.url || !OK_LICENSES.has(license)) return null;
  return {
    id: p.id,
    thumb: sized(p.url, "small"),
    medium: sized(p.url, "medium"),
    large: sized(p.url, "large"),
    attribution: (p.attribution ?? "").replace(/,?\s*(some|alcuni|no) rights reserved.*$/i, "").replace(/\s*\(c\)\s*/i, "© ").trim() || "Autore su iNaturalist",
    license: LICENSE_LABEL[license],
    licenseUrl: LICENSE_URL[license],
    sourceUrl: `https://www.inaturalist.org/photos/${p.id}`,
    source: "iNaturalist",
  };
}

// Una voce in cache è valida se ha foto o se anche la riserva è stata
// provata (le voci vuote salvate prima della ricerca di riserva si rifanno).
const isComplete = (cached) => Boolean(cached && (cached.photos?.length || cached.fallbackTried));

function dedupe(photos) {
  const seen = new Set();
  return photos.filter((p) => !seen.has(p.id) && seen.add(p.id));
}

function pickTaxon(results, name) {
  const lower = name.toLowerCase();
  const genus = lower.split(" ")[0];
  return (
    results.find((t) => t.name?.toLowerCase() === lower) ??
    results.find((t) => t.name?.toLowerCase().startsWith(genus) && t.default_photo) ??
    null
  );
}

// "species" se la foto è della specie, "genus" se c'è solo il genere
// (es. "Rosa"): serve all'interfaccia per avvisare che la foto è generica.
const withMatch = (res) => ({ ...res, match: res.name?.includes(" ") ? "species" : "genus" });

/**
 * Foto della specie (senza varietà).
 * Prima iNaturalist; se non ha foto libere, Wikimedia Commons.
 */
async function getSpeciesPhotos(scientificName, { full = false, fetchImpl = fetch, priority = "high" } = {}) {
  const name = cleanScientificName(scientificName);
  if (!name) return { name, taxon: null, photos: [] };
  const key = `${full ? "full" : "main"}:${name.toLowerCase()}`;
  const cached = await cacheGet(key);
  if (isComplete(cached)) return withMatch(cached);
  if (inflight.has(key)) return inflight.get(key).then(withMatch);

  const job = (async () => {
    const result = { name, taxon: null, photos: [], source: "iNaturalist" };
    let inatError = null;
    try {
      const search = await schedule(() => inat(`/taxa?q=${encodeURIComponent(name)}&is_active=true&per_page=5&locale=it`, fetchImpl), priority);
      const taxon = pickTaxon(search.results ?? [], name);
      if (taxon) {
        result.taxon = { id: taxon.id, name: taxon.name, commonName: taxon.preferred_common_name ?? null, url: `https://www.inaturalist.org/taxa/${taxon.id}` };
        const main = toPhoto(taxon.default_photo);
        result.photos = main ? [main] : [];
        if (full) {
          const detail = await schedule(() => inat(`/taxa/${taxon.id}?locale=it`, fetchImpl), priority);
          const t = detail.results?.[0];
          const photos = (t?.taxon_photos ?? []).map((tp) => toPhoto(tp.photo)).filter(Boolean);
          result.photos = dedupe([...result.photos, ...photos]).slice(0, MAX_PHOTOS);
        }
      }
    } catch (err) {
      inatError = err;
    }

    // Riserva: Wikimedia Commons, se iNaturalist non ha foto libere
    // (o, per la galleria, ne ha poche).
    if (result.photos.length < (full ? 3 : 1)) {
      try {
        const get = (url) => schedule(() => getJson(url, fetchImpl, "Wikimedia"), priority);
        const wm = await findWikimediaPhotos(name, get, { full, max: MAX_PHOTOS });
        result.fallbackTried = true;
        if (wm?.photos.length) {
          result.photos = dedupe([...result.photos, ...wm.photos]).slice(0, full ? MAX_PHOTOS : 1);
          result.wikidata = wm.item;
          if (!result.photos.some((p) => p.source === "iNaturalist")) result.source = "Wikimedia Commons";
        }
      } catch (err) {
        // entrambe le fonti irraggiungibili: niente cache, si riprova più avanti
        if (inatError) throw inatError;
        console.warn("[photos] Wikimedia:", err.message);
      }
    }
    // iNaturalist irraggiungibile e nessuna foto di riserva: non si salva un
    // risultato vuoto, si riprova più avanti
    if (inatError && !result.photos.length) throw inatError;

    await cacheSet(key, result);
    return result;
  })().finally(() => inflight.delete(key));

  inflight.set(key, job);
  return job.then(withMatch);
}

// Nome della varietà come lo cerchiamo e lo salviamo in cache.
const varietyLabel = (v) => `${v.base || v.genus} '${v.cultivar}'`;

/** Categoria di Commons della varietà: scelta a mano, già cercata dallo script, o da cercare. */
function knownCategory(scientificName) {
  if (scientificName in FOTO_MANUALI) return FOTO_MANUALI[scientificName];
  // null = lo script l'ha già cercata senza trovarla
  if (scientificName in FOTO_VARIETA) return FOTO_VARIETA[scientificName];
  return undefined;
}

/**
 * Foto di una varietà (es. "Rosa 'Edith Piaf'"). Si cercano solo foto di
 * quella varietà su Wikimedia Commons; se non ce ne sono si restituiscono
 * le foto della specie o del genere con match "species"/"genus", e
 * l'interfaccia avvisa che non mostrano la varietà.
 */
async function getVarietyPhotos(scientificName, v, { full = false, fetchImpl = fetch, priority = "high" } = {}) {
  const label = varietyLabel(v);
  const key = `${full ? "full" : "main"}:v:${label.toLowerCase()}`;
  const cached = await cacheGet(key);
  if (cached) return cached;
  if (inflight.has(key)) return inflight.get(key);

  const job = (async () => {
    const get = (url) => schedule(() => getJson(url, fetchImpl, "Wikimedia"), priority);
    let failed = false;
    let category = knownCategory(scientificName);
    if (category === undefined) {
      try {
        category = await findVarietyCategory({ ...v, candidates: categoryCandidates(scientificName) }, get);
      } catch (err) {
        failed = true;
        console.warn("[photos] categoria varietà:", err.message);
      }
    }
    let photos = [];
    if (category) {
      try {
        photos = await commonsCategoryPhotos(category, get, { max: full ? MAX_PHOTOS : 1 });
      } catch (err) {
        failed = true;
        console.warn("[photos] foto varietà:", err.message);
      }
    }
    // foto Flickr scelte a mano per questa varietà, dopo quelle di Commons
    const flickr = flickrPhotosFor(scientificName);
    if (flickr.length) photos = [...photos, ...flickr].slice(0, full ? MAX_PHOTOS : 1);
    let result;
    if (photos.length) {
      result = {
        name: label,
        variety: v.cultivar,
        match: "variety",
        taxon: null,
        photos,
        source: photos[0].source,
        category: category && { name: category, url: `https://commons.wikimedia.org/wiki/Category:${encodeURIComponent(category.replace(/ /g, "_"))}` },
      };
    } else {
      const base = await getSpeciesPhotos(v.base || v.genus, { full, fetchImpl, priority });
      result = { ...base, variety: v.cultivar };
    }
    // se Commons non ha risposto si riprova più avanti invece di salvare
    if (!failed) await cacheSet(key, result);
    return result;
  })().finally(() => inflight.delete(key));

  inflight.set(key, job);
  return job;
}

/**
 * Foto di una pianta dal nome scientifico.
 * full=false: solo la foto principale (per le schede in elenco).
 * full=true: galleria fino a 8 foto.
 * Il risultato ha match: "variety" (foto della varietà esatta), "species"
 * oppure "genus" (foto generiche: la varietà non ha foto libere).
 */
export async function getPlantPhotos(scientificName, opts = {}) {
  const v = parseVariety(scientificName);
  if (v.genus && v.cultivar) return getVarietyPhotos(String(scientificName).trim(), v, opts);
  return getSpeciesPhotos(scientificName, opts);
}

/** Chiave di cache della foto principale, per saltare le piante già pronte. */
function mainKey(scientificName) {
  const v = parseVariety(scientificName);
  if (v.genus && v.cultivar) return `main:v:${varietyLabel(v).toLowerCase()}`;
  return `main:${cleanScientificName(scientificName).toLowerCase()}`;
}

// ---- riempimento automatico della cache ----
//
// All'avvio (e poi ogni settimana) il server cerca in sottofondo la foto
// principale di tutte le piante del catalogo e degli ortaggi, una al
// secondo. Così nella pagina "Scopri le piante" le foto compaiono subito.
// Le piante già in cache vengono saltate senza fare richieste.

const WEEK = 7 * 24 * 60 * 60 * 1000;
let warming = false;

export async function warmPhotoCache(scientificNames, { fetchImpl = fetch, log = console.log } = {}) {
  if (warming) return null;
  warming = true;
  // una voce per specie e una per varietà (le varietà hanno foto proprie)
  const byKey = new Map();
  for (const n of scientificNames) if (cleanScientificName(n)) byKey.set(mainKey(n), n);
  const names = [...byKey.values()];
  const stats = { total: names.length, cached: 0, fetched: 0, withPhoto: 0, errors: 0 };
  let consecutiveErrors = 0;
  try {
    log(`[photos] Riempimento cache foto: ${names.length} nomi`);
    for (const name of names) {
      const cached = await cacheGet(mainKey(name));
      if (mainKey(name).startsWith("main:v:") ? cached : isComplete(cached)) {
        stats.cached++;
        continue;
      }
      try {
        const res = await getPlantPhotos(name, { fetchImpl, priority: "low" });
        stats.fetched++;
        if (res.photos.length) stats.withPhoto++;
        consecutiveErrors = 0;
      } catch (err) {
        stats.errors++;
        consecutiveErrors++;
        // iNaturalist non raggiungibile: si riprova al prossimo giro
        if (consecutiveErrors >= 5) {
          log(`[photos] iNaturalist non risponde (${err.message}): riprovo tra un'ora`);
          stats.stoppedEarly = true;
          break;
        }
      }
      if ((stats.fetched + stats.errors) % 100 === 0) log(`[photos] ...${stats.fetched} piante cercate, ${stats.withPhoto} con foto`);
    }
    log(`[photos] Cache foto: ${stats.cached} già pronte, ${stats.fetched} cercate (${stats.withPhoto} con foto), ${stats.errors} errori`);
    return stats;
  } finally {
    warming = false;
  }
}

const HOUR = 60 * 60 * 1000;

export function startPhotoWarmup(getNames, { delayMs = 30_000 } = {}) {
  let retry = null;
  const run = async () => {
    try {
      const stats = await warmPhotoCache(getNames());
      // iNaturalist non raggiungibile: nuovo tentativo tra un'ora
      if (stats?.stoppedEarly) {
        retry = setTimeout(run, HOUR);
        retry.unref?.();
      }
    } catch (err) {
      console.warn("[photos] riempimento fallito:", err.message);
    }
  };
  const first = setTimeout(run, delayMs);
  const weekly = setInterval(run, WEEK);
  first.unref?.();
  weekly.unref?.();
  return () => {
    clearTimeout(first);
    clearTimeout(retry);
    clearInterval(weekly);
  };
}
