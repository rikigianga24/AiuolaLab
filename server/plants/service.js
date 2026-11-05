import { config } from "../config.js";
import { hasDatabase, query } from "../db.js";
import { DEMO_PLANTS } from "./demo-catalog.js";
import { matchesFilters } from "./normalize.js";
import { PerenualProvider } from "./perenual.js";

const DAY = 24 * 60 * 60 * 1000;
const TTL = { search: 7 * DAY, details: 60 * DAY };
const PAGE_SIZE = 30;
// Schede complete da caricare al massimo per ogni ricerca quando servono
// filtri che Perenual non applica lato server (pH, colori, stagione...).
const MAX_ENRICH = 8;

class DemoProvider {
  name = "demo";
  async search(filters) {
    const items = DEMO_PLANTS.filter((p) => matchesFilters(p, filters));
    const page = Number(filters.page) || 1;
    return {
      page,
      lastPage: Math.max(1, Math.ceil(items.length / PAGE_SIZE)),
      total: items.length,
      items: items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    };
  }
  async details(externalId) {
    return DEMO_PLANTS.find((p) => p.externalId === externalId) ?? null;
  }
}

function createProvider() {
  if (config.plantProvider === "perenual") {
    return new PerenualProvider(config.perenual);
  }
  return new DemoProvider();
}

const provider = createProvider();
console.log(`[plants] Fonte dati: ${provider.name}`);

// ---- cache (Postgres se disponibile, altrimenti memoria) ----

const memoryCache = new Map();

async function cacheGet(key, ttl) {
  if (provider.name === "demo") return null;
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
  if (provider.name === "demo") return;
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
const DETAIL_FILTERS = ["ph", "texture", "color", "season", "maxHeightCm"];

export async function getPlant(id) {
  const [source, externalId] = String(id).split(":");
  if (source !== provider.name || !externalId) return null;
  const key = `details:${externalId}`;
  const cached = await cacheGet(key, TTL.details);
  if (cached) return cached;
  const plant = await provider.details(externalId);
  if (plant) await cacheSet(key, plant);
  return plant;
}

export async function searchPlants(filters = {}) {
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
  if (!needsDetails || provider.name === "demo") {
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
