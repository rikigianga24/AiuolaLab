// Adattatore per Perenual (https://perenual.com/docs/api), DB pubblico di
// circa 10.000 specie con esposizione, irrigazione, terreno, fioritura,
// colori, rusticità e dimensioni.
import {
  normalizeColors,
  normalizeHardiness,
  normalizeSeasons,
  normalizeSoil,
  normalizeSunlight,
  normalizeWatering,
  parseDimensions,
} from "./normalize.js";

const SUNLIGHT_PARAM = { full_sun: "full_sun", part_shade: "part_shade", full_shade: "full_shade" };

export class PerenualProvider {
  name = "perenual";

  constructor({ apiKey, baseUrl }) {
    if (!apiKey) throw new Error("PERENUAL_API_KEY mancante");
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async #get(path, params = {}) {
    const url = new URL(`${this.baseUrl}${path}`);
    url.searchParams.set("key", this.apiKey);
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    }
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (res.status === 429) {
      const err = new Error("Limite giornaliero del DB piante raggiunto, riprova più tardi.");
      err.status = 429;
      throw err;
    }
    if (!res.ok) {
      const err = new Error(`Perenual ha risposto ${res.status}`);
      err.status = 502;
      throw err;
    }
    return res.json();
  }

  // Perenual filtra lato server solo per nome, esposizione, irrigazione e
  // ciclo. Gli altri filtri vengono applicati dopo, sulle schede complete.
  async search({ q, sunlight, watering, cycle, page = 1 }) {
    const data = await this.#get("/species-list", {
      q,
      page,
      sunlight: SUNLIGHT_PARAM[sunlight],
      watering,
      cycle,
    });
    return {
      page: data.current_page ?? page,
      lastPage: data.last_page ?? page,
      total: data.total ?? (data.data || []).length,
      items: (data.data || []).map((item) => this.normalize(item, false)),
    };
  }

  async details(externalId) {
    const data = await this.#get(`/species/details/${encodeURIComponent(externalId)}`);
    return this.normalize(data, true);
  }

  normalize(raw, full) {
    const sci = Array.isArray(raw.scientific_name) ? raw.scientific_name[0] : raw.scientific_name;
    const others = Array.isArray(raw.other_name) ? raw.other_name : raw.other_name ? [raw.other_name] : [];
    const { height, spread } = full ? parseDimensions(raw) : { height: null, spread: null };
    const img = raw.default_image;
    const okUrl = (u) => (u && !/upgrade_access/.test(u) ? u : null);
    const image = img
      ? { thumb: okUrl(img.thumbnail) || okUrl(img.small_url), regular: okUrl(img.regular_url) || okUrl(img.medium_url) }
      : null;
    const cycle = raw.cycle ? String(raw.cycle).toLowerCase() : null;
    return {
      id: `perenual:${raw.id}`,
      source: "perenual",
      externalId: String(raw.id),
      commonName: raw.common_name || sci || "Sconosciuta",
      scientificName: sci || null,
      otherNames: others,
      family: raw.family || null,
      cycle: cycle && /upgrade/.test(cycle) ? null : cycle,
      type: raw.type || null,
      sunlight: normalizeSunlight(raw.sunlight),
      watering: normalizeWatering(raw.watering),
      soil: normalizeSoil(raw.soil),
      heightCm: height,
      spreadCm: spread,
      flowerColors: normalizeColors(raw.flower_color),
      floweringSeasons: normalizeSeasons(raw.flowering_season),
      hardiness: normalizeHardiness(raw.hardiness),
      evergreen: typeof raw.evergreen === "boolean" ? raw.evergreen : null,
      droughtTolerant: typeof raw.drought_tolerant === "boolean" ? raw.drought_tolerant : null,
      maintenance: raw.maintenance || raw.care_level || null,
      description: raw.description || null,
      image: image && (image.thumb || image.regular) ? image : null,
      detailsLoaded: full,
    };
  }
}
