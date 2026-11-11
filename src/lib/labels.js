export const SUNLIGHT = {
  full_sun: { label: "Pieno sole", icon: "fa-sun" },
  part_shade: { label: "Mezz'ombra", icon: "fa-cloud-sun" },
  full_shade: { label: "Ombra", icon: "fa-cloud" },
};

export const WATERING = {
  minimum: { label: "Poca acqua", short: "Poca" },
  average: { label: "Acqua media", short: "Media" },
  frequent: { label: "Molta acqua", short: "Molta" },
};

export const SOIL_PH = {
  acid: "Acido",
  neutral: "Neutro",
  alkaline: "Basico (calcareo)",
};

export const SOIL_TEXTURE = {
  sandy: "Sabbioso / drenante",
  loamy: "Franco / ricco",
  clay: "Argilloso / pesante",
  chalky: "Calcareo / sassoso",
};

export const SEASONS = {
  spring: "Primavera",
  summer: "Estate",
  autumn: "Autunno",
  winter: "Inverno",
};

// Gruppi del catalogo interno (server/plants/catalog).
export const GROUPS = {
  rose: "Rose",
  perenni: "Perenni erbacee",
  annuali: "Annuali e biennali",
  bulbose: "Bulbose",
  arbusti: "Arbusti",
  rampicanti: "Rampicanti",
  graminacee: "Graminacee, felci e tappezzanti",
  aromatiche: "Aromatiche",
  balcone: "Fiori da balcone e vaso",
};

export const CYCLE = {
  perennial: "Perenne",
  annual: "Annuale",
  biennial: "Biennale",
};

export const COLORS = {
  white: { label: "Bianco", hex: "#f4f1ea" },
  yellow: { label: "Giallo", hex: "#f2c94c" },
  orange: { label: "Arancio", hex: "#f2994a" },
  red: { label: "Rosso", hex: "#d64545" },
  pink: { label: "Rosa", hex: "#e88fb4" },
  purple: { label: "Viola", hex: "#9b6fc4" },
  blue: { label: "Blu", hex: "#5b8fd9" },
  green: { label: "Verde", hex: "#6aa84f" },
};

export const LAYERS = {
  alta: "Alta (struttura)",
  media: "Media (riempimento)",
  bassa: "Bassa (bordura)",
  copertura: "Tappezzante",
};

export const STYLES = [
  "Mediterraneo",
  "Cottage / all'inglese",
  "Moderno e minimale",
  "Naturalistico / prateria",
  "Giardino d'ombra",
  "Giardino roccioso",
  "Per impollinatori",
];

const FOLIAGE = "#6f9a5b";

// Colore con cui disegnare una pianta sul canvas.
export function plantColor(plant) {
  const code = plant?.flowerColors?.find((c) => c !== "green");
  return COLORS[code]?.hex ?? FOLIAGE;
}

// Diametro di ingombro in metri, con valori di ripiego sensati.
export function plantSpreadM(plant) {
  const cm = plant?.spreadCm?.max ?? plant?.spreadCm?.min ?? plant?.heightCm?.max;
  if (!cm) return 0.4;
  return Math.min(4, Math.max(0.1, cm / 100));
}

export const formatRangeCm = (r) => {
  if (!r) return "n.d.";
  return r.min === r.max ? `${r.min} cm` : `${r.min}–${r.max} cm`;
};

// Rusticità: la zona USDA indica la temperatura minima invernale che la
// pianta sopporta. Ogni zona copre 10 °F (circa 5,6 °C) a partire da -51 °C
// (zona 1); la pianta resiste fino al limite inferiore della sua zona minima.
export function hardinessMinC(zone) {
  const z = Number.parseFloat(zone);
  if (!Number.isFinite(z)) return null;
  return Math.round(-51.1 + (z - 1) * 5.56);
}

const minus = (n) => (n < 0 ? `−${Math.abs(n)}` : `${n}`);

// { celsius: -18, temp: "−18 °C", text: "Resiste fino a −18 °C", level: { key, label } }
export function hardinessInfo(hardiness) {
  const c = hardinessMinC(hardiness?.min);
  if (c == null) return null;
  const temp = `${minus(c)} °C`;
  let level;
  if (c <= -15) level = { key: "high", label: "molto resistente al freddo" };
  else if (c <= -7) level = { key: "good", label: "resiste al gelo" };
  else if (c <= -1) level = { key: "mild", label: "sopporta solo gelate leggere" };
  else level = { key: "none", label: "non sopporta il gelo" };
  const text = c > 0 ? `Va riparata sotto i ${temp}` : `Resiste fino a ${temp}`;
  return { celsius: c, temp, text, level };
}

// ---- dettagli delle schede: mesi di fioritura e crescita ----

const MONTH_NAMES = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
const MONTH_SHORT = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];

/** Mesi in sequenze continue, anche a cavallo d'anno: [11,12,1,2] -> [[11,2]]. */
export function monthRuns(months = []) {
  const set = new Set(months);
  if (!set.size) return [];
  if (set.size === 12) return [[1, 12]];
  const runs = [];
  // si parte da un mese il cui precedente manca, così dicembre-gennaio resta unito
  const start = [...set].sort((a, b) => a - b).find((m) => !set.has(m === 1 ? 12 : m - 1));
  let cur = null;
  for (let i = 0, m = start; i < 12; i++, m = (m % 12) + 1) {
    if (set.has(m)) {
      if (cur) cur[1] = m;
      else runs.push((cur = [m, m]));
    } else cur = null;
  }
  return runs;
}

/** [5,6,9,10] -> "maggio–giugno e settembre–ottobre"; short: "mag–giu, set–ott". */
export function floweringLabel(months = [], { short = false } = {}) {
  const names = short ? MONTH_SHORT : MONTH_NAMES;
  const runs = monthRuns(months);
  if (!runs.length) return "";
  if (runs.length === 1 && runs[0][0] === 1 && runs[0][1] === 12) return "tutto l'anno";
  const parts = runs.map(([a, b]) => (a === b ? names[a - 1] : `${names[a - 1]}–${names[b - 1]}`));
  if (short) return parts.join(", ");
  return parts.length > 1 ? `${parts.slice(0, -1).join(", ")} e ${parts.at(-1)}` : parts[0];
}

export const GROWTH_RATE = {
  slow: { label: "Lenta", icon: "fa-gauge-simple-low" },
  medium: { label: "Media", icon: "fa-gauge-simple" },
  fast: { label: "Rapida", icon: "fa-gauge-simple-high" },
};

const WOODY = new Set(["arbusti", "rampicanti", "rose"]);

/** Frase su quanto e quanto in fretta cresce la pianta. */
export function growthText(plant) {
  const g = plant?.growth;
  if (!g) return "";
  const rate = GROWTH_RATE[g.rate]?.label ?? "";
  let how = g.text;
  if (!how) {
    if (plant.cycle === "annual") how = g.rate === "fast" ? "completa il ciclo in una stagione" : "cresce in una stagione";
    else if (WOODY.has(plant.group)) how = { slow: "servono 5 anni o più per la dimensione adulta", medium: "adulta in 3-5 anni", fast: "adulta in 2-3 anni" }[g.rate];
    else how = { slow: "servono 3-4 anni per un bel cespo", medium: "adulta in 2-3 anni", fast: "piena dimensione già il primo o il secondo anno" }[g.rate];
  }
  return `${rate}: ${how}`;
}
