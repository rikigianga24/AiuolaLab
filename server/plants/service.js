import { config } from "../config.js";
import { hasDatabase, query } from "../db.js";
import { CATALOG, CATALOG_BY_ID, CATALOG_ERRORS } from "./catalog/index.js";
import { matchesFilters } from "./normalize.js";
import { PerenualProvider } from "./perenual.js";

const DAY = 24 * 60 * 60 * 1000;
const TTL = { search: 7 * DAY, details: 60 * DAY };
const PAGE_SIZE = 30;
// Schede complete da caricare al massimo per ogni ricerca quando servono
// filtri che Perenual non applica lato server (pH, colori, stagione...).
const MAX_ENRICH = 8;

// Catalogo interno (server/plants/catalog): nessuna chiamata esterna.
class CatalogProvider {
  name = "catalogo";
  local = true;
  async search(filters) {
    let items = CATALOG.filter((p) => matchesFilters(p, filters));
    if (filters.q) {
      // ordine: nome che inizia con la parola cercata, parola del nome che
      // inizia così, nome che la contiene, e infine solo la nota (es. "Austin")
      const fold = (t) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      const q = fold(filters.q.trim());
      const rank = (p) => {
        const name = fold(`${p.commonName} ${p.scientificName}`);
        if (name.startsWith(q)) return 0;
        if (name.split(/[\s'(]+/).some((w) => w.startsWith(q))) return 1;
        return name.includes(q) ? 2 : 3;
      };
      items = items.map((p) => [rank(p), p]).sort((a, b) => a[0] - b[0]).map(([, p]) => p);
    }
    const page = Number(filters.page) || 1;
    return {
      page,
      lastPage: Math.max(1, Math.ceil(items.length / PAGE_SIZE)),
      total: items.length,
      items: items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    };
  }
  async details(externalId) {
    return CATALOG_BY_ID.get(externalId) ?? null;
  }
}

function createProvider() {
  if (config.plantProvider === "perenual") {
    return new PerenualProvider(config.perenual);
  }
  if (CATALOG_ERRORS.length) {
    console.warn(`[plants] ${CATALOG_ERRORS.length} righe del catalogo scartate:\n  ${CATALOG_ERRORS.join("\n  ")}`);
  }
  return new CatalogProvider();
}

const provider = createProvider();
console.log(`[plants] Fonte dati: ${provider.name}${provider.local ? ` (${CATALOG.length} piante)` : ""}`);

// ---- cache (Postgres se disponibile, altrimenti memoria) ----

const memoryCache = new Map();

async function cacheGet(key, ttl) {
  if (provider.local) return null;
  if (hasDatabase()) {
    try {
      const { rows } = await query(
        "SELECT data, fetched_at FROM plant_cache WHERE provider = $1 AND cache_key = $2",
        [provider.name, key],
      );
      if (rows[0] && Date.now() - new Date(rows[0].fetched_at).getTime() < ttl) return rows[0].data;
    } catch (err) {
      console.warn("[plants] lettura cache fallita:", err.message);
    }
    return null;
  }
  const hit = memoryCache.get(key);
  return hit && Date.now() - hit.at < ttl ? hit.data : null;
}

async function cacheSet(key, data) {
  if (provider.local) return;
  if (hasDatabase()) {
    try {
      await query(
        `INSERT INTO plant_cache (provider, cache_key, data, fetched_at) VALUES ($1, $2, $3, now())
         ON CONFLICT (provider, cache_key) DO UPDATE SET data = EXCLUDED.data, fetched_at = now()`,
        [provider.name, key, JSON.stringify(data)],
      );
    } catch (err) {
      console.warn("[plants] scrittura cache fallita:", err.message);
    }
    return;
  }
  if (memoryCache.size > 2000) memoryCache.delete(memoryCache.keys().next().value);
  memoryCache.set(key, { at: Date.now(), data });
}

// ---- API del servizio ----

export const providerName = provider.name;

const SERVER_FILTERS = ["q", "sunlight", "watering", "cycle", "page"];
const DETAIL_FILTERS = ["ph", "texture", "color", "season", "maxHeightCm", "group"];

// I progetti salvati prima del catalogo usano ancora gli id "demo:...".
const SOURCE_ALIASES = { demo: "catalogo" };

export async function getPlant(id) {
  const [rawSource, externalId] = String(id).split(":");
  const source = SOURCE_ALIASES[rawSource] ?? rawSource;
  if (source !== provider.name || !externalId) return null;
  const key = `details:${externalId}`;
  const cached = await cacheGet(key, TTL.details);
  if (cached) return cached;
  const plant = await provider.details(externalId);
  if (plant) await cacheSet(key, plant);
  return plant;
}

export async function searchPlants(filters = {}) {
  if (provider.local) return provider.search(filters);
  const serverFilters = Object.fromEntries(
    SERVER_FILTERS.filter((k) => filters[k]).map((k) => [k, filters[k]]),
  );
  const key = `search:${JSON.stringify(serverFilters)}`;
  let result = await cacheGet(key, TTL.search);
  if (!result) {
    result = await provider.search(serverFilters);
    await cacheSet(key, result);
  }

  const needsDetails = DETAIL_FILTERS.some((k) => filters[k]);
  if (!needsDetails) {
    return { ...result, items: result.items.filter((p) => matchesFilters(p, filters)) };
  }

  // Arricchisce i primi risultati con la scheda completa e poi filtra.
  const enriched = [];
  for (const [i, item] of result.items.entries()) {
    let plant = item;
    if (i < MAX_ENRICH) {
      try {
        plant = (await getPlant(item.id)) ?? item;
      } catch (err) {
        if (err.status === 429) break;
        throw err;
      }
    }
    if (!plant.detailsLoaded || matchesFilters(plant, filters)) enriched.push(plant);
  }
  return { ...result, items: enriched };
}

// Cerca una pianta per nome scientifico (usato per collegare i consigli
// dell'IA al DB). Restituisce null se non trovata.
export async function findByScientificName(name) {
  if (!name) return null;
  const genusSpecies = name.split(/\s+/).slice(0, 2).join(" ");
  const res = await searchPlants({ q: genusSpecies });
  const lower = genusSpecies.toLowerCase();
  const match =
    res.items.find((p) => p.scientificName?.toLowerCase().startsWith(lower)) ??
    res.items.find((p) => p.scientificName?.toLowerCase().startsWith(lower.split(" ")[0]));
  if (!match) return null;
  return (await getPlant(match.id).catch(() => null)) ?? match;
}

// Piante candidate per il consulente IA: con il catalogo interno prende un
// campione vario da tutti i gruppi (rose, perenni, arbusti...) invece della
// sola prima pagina, che sarebbe in ordine alfabetico.
export async function candidatePlants(filters = {}, { limit = 60, groups } = {}) {
  if (!provider.local) {
    const res = await searchPlants(filters);
    return res.items.slice(0, limit);
  }
  const all = CATALOG.filter((p) => matchesFilters(p, filters) && (!groups || groups.includes(p.group)));
  const byGroup = new Map();
  for (const p of all) {
    if (!byGroup.has(p.group)) byGroup.set(p.group, []);
    byGroup.get(p.group).push(p);
  }
  // mescola in modo stabile per giorno, così le proposte variano nel tempo
  const seed = Math.floor(Date.now() / 86400000);
  const score = (p) => {
    let h = seed;
    for (const ch of p.externalId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return h;
  };
  const queues = [...byGroup.values()].map((list) => [...list].sort((a, b) => score(a) - score(b)));
  const out = [];
  while (out.length < limit && queues.some((q) => q.length)) {
    for (const q of queues) if (q.length && out.length < limit) out.push(q.shift());
  }
  return out;
}
