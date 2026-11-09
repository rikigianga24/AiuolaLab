// Modello comune delle piante, indipendente dalla fonte dati.
//
// {
//   id, source, externalId,
//   commonName, scientificName, otherNames[], family, cycle, type,
//   sunlight[]        "full_sun" | "part_shade" | "full_shade"
//   watering          "minimum" | "average" | "frequent" | null
//   soil: { ph[], texture[] }   ph: "acid" | "neutral" | "alkaline"
//                               texture: "sandy" | "loamy" | "clay" | "chalky"
//   heightCm, spreadCm  { min, max } | null
//   flowerColors[]    vedi COLORS
//   floweringSeasons[] "spring" | "summer" | "autumn" | "winter"
//   hardiness         { min, max } zone USDA | null
//   evergreen, droughtTolerant, maintenance, description,
//   image: { thumb, regular } | null,
//   detailsLoaded     true se i campi da scheda completa sono presenti
// }

export const SUNLIGHT = ["full_sun", "part_shade", "full_shade"];
export const WATERING = ["minimum", "average", "frequent"];
export const SOIL_PH = ["acid", "neutral", "alkaline"];
export const SOIL_TEXTURE = ["sandy", "loamy", "clay", "chalky"];
export const SEASONS = ["spring", "summer", "autumn", "winter"];
export const COLORS = ["white", "yellow", "orange", "red", "pink", "purple", "blue", "green"];

const asList = (value) => {
  if (value == null) return [];
  if (Array.isArray(value)) return value.flatMap(asList);
  if (typeof value === "string") return value.split(/[,;/]|\band\b/i).map((s) => s.trim()).filter(Boolean);
  return [String(value)];
};

const uniq = (arr) => [...new Set(arr)];

export function normalizeSunlight(value) {
  const out = [];
  for (const raw of asList(value)) {
    const s = raw.toLowerCase().replace(/[_-]/g, " ");
    if (/full sun|pieno sole/.test(s) || (/\bsun\b/.test(s) && !/part sun/.test(s))) out.push("full_sun");
    if (/part|filtered|partial|dappled|mezz/.test(s)) out.push("part_shade");
    if (/full shade|deep shade|^shade$|ombra$/.test(s)) out.push("full_shade");
  }
  return uniq(out).sort((a, b) => SUNLIGHT.indexOf(a) - SUNLIGHT.indexOf(b));
}

export function normalizeWatering(value) {
  const s = String(value ?? "").toLowerCase();
  if (/frequent|high|alta/.test(s)) return "frequent";
  if (/average|medium|moderate|media/.test(s)) return "average";
  if (/minimum|low|none|minimal|bassa/.test(s)) return "minimum";
  return null;
}

export function normalizeSoil(value) {
  const ph = [];
  const texture = [];
  for (const raw of asList(value)) {
    const s = raw.toLowerCase();
    if (/acid/.test(s)) ph.push("acid");
    if (/neutral/.test(s)) ph.push("neutral");
    if (/alkal|basic|calcare/.test(s)) ph.push("alkaline");
    if (/sand|gravel|rocky/.test(s)) texture.push("sandy");
    if (/loam|humus|rich/.test(s)) texture.push("loamy");
    if (/clay/.test(s)) texture.push("clay");
    if (/chalk|lime/.test(s)) {
      texture.push("chalky");
      ph.push("alkaline");
    }
  }
  return { ph: uniq(ph), texture: uniq(texture) };
}

const COLOR_WORDS = [
  ["white", /white|cream|ivory|bianc/],
  ["yellow", /yellow|gold|giall/],
  ["orange", /orange|apricot|aranc/],
  ["red", /red|scarlet|crimson|burgundy|ross/],
  ["pink", /pink|rose|magenta|ros[ae]/],
  ["purple", /purple|violet|lavender|lilac|mauve|viol|lilla/],
  ["blue", /blue|azzurr|blu/],
  ["green", /green|verd/],
];

export function normalizeColors(value) {
  const out = [];
  for (const raw of asList(value)) {
    const s = raw.toLowerCase();
    for (const [code, re] of COLOR_WORDS) if (re.test(s)) out.push(code);
  }
  return uniq(out);
}

export function normalizeSeasons(value) {
  const out = [];
  for (const raw of asList(value)) {
    const s = raw.toLowerCase();
    if (/spring|primav/.test(s)) out.push("spring");
    if (/summer|estat/.test(s)) out.push("summer");
    if (/fall|autumn|autunn/.test(s)) out.push("autumn");
    if (/winter|invern/.test(s)) out.push("winter");
  }
  return uniq(out).sort((a, b) => SEASONS.indexOf(a) - SEASONS.indexOf(b));
}

const UNIT_TO_CM = { feet: 30.48, foot: 30.48, ft: 30.48, inches: 2.54, inch: 2.54, in: 2.54, m: 100, meters: 100, cm: 1 };

function rangeToCm(min, max, unit) {
  const factor = UNIT_TO_CM[String(unit || "feet").toLowerCase()] ?? 30.48;
  const lo = Number(min);
  const hi = Number(max);
  if (!Number.isFinite(lo) && !Number.isFinite(hi)) return null;
  const a = Number.isFinite(lo) ? lo : hi;
  const b = Number.isFinite(hi) ? hi : lo;
  return { min: Math.round(Math.min(a, b) * factor), max: Math.round(Math.max(a, b) * factor) };
}

// Perenual espone le dimensioni sia come stringa ("1.00 to 2.00 feet")
// sia come array di oggetti { type, min_value, max_value, unit }.
export function parseDimensions(detail) {
  let height = null;
  let spread = null;
  const dims = detail.dimensions ?? detail.dimension;
  const list = Array.isArray(dims) ? dims : dims ? [dims] : [];
  for (const d of list) {
    if (typeof d === "string") {
      const m = d.match(/([\d.]+)\s*(?:to|-)\s*([\d.]+)\s*(\w+)/i) || d.match(/([\d.]+)\s*(\w+)/);
      if (!m) continue;
      const r = m.length === 4 ? rangeToCm(m[1], m[2], m[3]) : rangeToCm(m[1], m[1], m[2]);
      if (/spread|width/i.test(d)) spread = r;
      else height = r;
    } else if (d && typeof d === "object") {
      const r = rangeToCm(d.min_value, d.max_value, d.unit);
      if (/spread|width/i.test(d.type || "")) spread = r;
      else height = r;
    }
  }
  return { height, spread };
}

export function normalizeHardiness(value) {
  if (!value || typeof value !== "object") return null;
  const min = parseInt(value.min, 10);
  const max = parseInt(value.max, 10);
  if (!Number.isFinite(min) && !Number.isFinite(max)) return null;
  return { min: Number.isFinite(min) ? min : null, max: Number.isFinite(max) ? max : null };
}

// Filtri applicabili a qualsiasi pianta normalizzata. Un campo sconosciuto
// (lista vuota o null) non esclude la pianta: viene solo segnalato.
export function matchesFilters(plant, f = {}) {
  const has = (list, wanted) => !wanted || list.length === 0 || list.includes(wanted);
  if (f.q) {
    const q = f.q.toLowerCase();
    const hay = [plant.commonName, plant.scientificName, ...(plant.otherNames || [])].join(" ").toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (!has(plant.sunlight, f.sunlight)) return false;
  if (f.watering && plant.watering && plant.watering !== f.watering) return false;
  if (!has(plant.soil?.ph ?? [], f.ph)) return false;
  if (!has(plant.soil?.texture ?? [], f.texture)) return false;
  if (!has(plant.flowerColors, f.color)) return false;
  if (!has(plant.floweringSeasons, f.season)) return false;
  if (f.cycle && plant.cycle && plant.cycle !== f.cycle) return false;
  if (f.maxHeightCm && plant.heightCm && plant.heightCm.min > f.maxHeightCm) return false;
  return true;
}
