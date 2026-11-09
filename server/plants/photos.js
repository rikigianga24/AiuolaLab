// Foto delle piante da iNaturalist (https://www.inaturalist.org).
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

async function cacheGet(key) {
  if (hasDatabase()) {
    try {
      const { rows } = await query("SELECT data, fetched_at FROM plant_cache WHERE provider = $1 AND cache_key = $2", [PROVIDER, key]);
      const row = rows[0];
      if (!row) return null;
      const ttl = row.data?.photos?.length ? TTL : EMPTY_TTL;
      return Date.now() - new Date(row.fetched_at).getTime() < ttl ? row.data : null;
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

async function inat(path, fetchImpl) {
  const r = await fetchImpl(`${API}${path}`, { headers: { "User-Agent": userAgent(), Accept: "application/json" }, signal: AbortSignal.timeout(10_000) });
  if (!r.ok) throw new Error(`iNaturalist ${r.status}`);
  return r.json();
}

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
  };
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

/**
 * Foto di una pianta dal nome scientifico.
 * full=false: solo la foto principale (per le schede in elenco, 1 richiesta).
 * full=true: galleria fino a 8 foto (2 richieste).
 */
export async function getPlantPhotos(scientificName, { full = false, fetchImpl = fetch, priority = "high" } = {}) {
  const name = cleanScientificName(scientificName);
  if (!name) return { name, taxon: null, photos: [] };
  const key = `${full ? "full" : "main"}:${name.toLowerCase()}`;
  const cached = await cacheGet(key);
  if (cached) return cached;
  if (inflight.has(key)) return inflight.get(key);

  const job = (async () => {
    const search = await schedule(() => inat(`/taxa?q=${encodeURIComponent(name)}&is_active=true&per_page=5&locale=it`, fetchImpl), priority);
    const taxon = pickTaxon(search.results ?? [], name);
    let result = { name, taxon: null, photos: [], source: "iNaturalist" };
    if (taxon) {
      result.taxon = { id: taxon.id, name: taxon.name, commonName: taxon.preferred_common_name ?? null, url: `https://www.inaturalist.org/taxa/${taxon.id}` };
      const main = toPhoto(taxon.default_photo);
      result.photos = main ? [main] : [];
      if (full) {
        const detail = await schedule(() => inat(`/taxa/${taxon.id}?locale=it`, fetchImpl), priority);
        const t = detail.results?.[0];
        const photos = (t?.taxon_photos ?? []).map((tp) => toPhoto(tp.photo)).filter(Boolean);
        const seen = new Set();
        result.photos = [...result.photos, ...photos].filter((p) => !seen.has(p.id) && seen.add(p.id)).slice(0, MAX_PHOTOS);
      }
    }
    await cacheSet(key, result);
    return result;
  })().finally(() => inflight.delete(key));

  inflight.set(key, job);
  return job;
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
  const names = [...new Set(scientificNames.map(cleanScientificName).filter(Boolean))];
  const stats = { total: names.length, cached: 0, fetched: 0, withPhoto: 0, errors: 0 };
  let consecutiveErrors = 0;
  try {
    log(`[photos] Riempimento cache foto: ${names.length} nomi`);
    for (const name of names) {
      if (await cacheGet(`main:${name.toLowerCase()}`)) {
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
