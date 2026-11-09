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

let queue = Promise.resolve();
const SPACING_MS = 1000;
const inflight = new Map();

function throttled(fn) {
  const run = queue.then(fn);
  queue = run.catch(() => {}).then(() => new Promise((r) => setTimeout(r, SPACING_MS)));
  return run;
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
export async function getPlantPhotos(scientificName, { full = false, fetchImpl = fetch } = {}) {
  const name = cleanScientificName(scientificName);
  if (!name) return { name, taxon: null, photos: [] };
  const key = `${full ? "full" : "main"}:${name.toLowerCase()}`;
  const cached = await cacheGet(key);
  if (cached) return cached;
  if (inflight.has(key)) return inflight.get(key);

  const job = (async () => {
    const search = await throttled(() => inat(`/taxa?q=${encodeURIComponent(name)}&is_active=true&per_page=5&locale=it`, fetchImpl));
    const taxon = pickTaxon(search.results ?? [], name);
    let result = { name, taxon: null, photos: [], source: "iNaturalist" };
    if (taxon) {
      result.taxon = { id: taxon.id, name: taxon.name, commonName: taxon.preferred_common_name ?? null, url: `https://www.inaturalist.org/taxa/${taxon.id}` };
      const main = toPhoto(taxon.default_photo);
      result.photos = main ? [main] : [];
      if (full) {
        const detail = await throttled(() => inat(`/taxa/${taxon.id}?locale=it`, fetchImpl));
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
