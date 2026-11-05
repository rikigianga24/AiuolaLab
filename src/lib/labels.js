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
