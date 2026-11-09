// Ortaggi: calendario indicativo per il Centro Italia (i mesi si spostano
// in base alla zona climatica, vedi care.js), distanze di impianto,
// famiglia botanica per la rotazione e consociazioni.
//
// Mesi: 1 = gennaio ... 12 = dicembre.
// indoor = semina in semenzaio, direct = semina in piena terra,
// transplant = trapianto, harvest = raccolta, days = giorni dalla semina
// (o dal trapianto) alla prima raccolta.

export const FAMILIES = {
  solanacee: "Solanacee",
  cucurbitacee: "Cucurbitacee",
  asteracee: "Asteracee (insalate)",
  amarantacee: "Amarantacee (spinacio, bietola)",
  apiacee: "Ombrellifere",
  alliacee: "Liliacee (aglio, cipolla)",
  leguminose: "Leguminose",
  brassicacee: "Crucifere (cavoli)",
  lamiacee: "Aromatiche",
  rosacee: "Rosacee",
  poacee: "Graminacee",
};

const C = (id, name, sci, family, icon, colors, row, plant, months, days, water, good, bad, notes = "") => ({
  id,
  name,
  scientificName: sci,
  family,
  icon,
  colors,
  spacing: { row, plant },
  ...months,
  days,
  watering: water,
  good,
  bad,
  notes,
});

export const CROPS = [
  C("pomodoro", "Pomodoro", "Solanum lycopersicum", "solanacee", "fruiting", ["#d64545"], 80, 50, { indoor: [2, 3], transplant: [4, 5], harvest: [7, 8, 9] }, 90, "frequent", ["basilico", "carota", "prezzemolo", "cipolla", "aglio", "lattuga", "sedano"], ["patata", "finocchio", "cavolo", "broccolo", "mais"], "Servono tutori; togli i germogli ascellari (sfemminellatura)."),
  C("peperone", "Peperone", "Capsicum annuum", "solanacee", "fruiting", ["#d64545", "#f2c94c"], 60, 40, { indoor: [2, 3], transplant: [5], harvest: [7, 8, 9, 10] }, 100, "frequent", ["basilico", "cipolla", "carota"], ["finocchio", "fagiolo"]),
  C("melanzana", "Melanzana", "Solanum melongena", "solanacee", "fruiting", ["#5b2a6e"], 80, 50, { indoor: [2, 3], transplant: [5], harvest: [7, 8, 9] }, 100, "frequent", ["fagiolo", "basilico"], ["finocchio", "patata"]),
  C("patata", "Patata", "Solanum tuberosum", "solanacee", "leafy", [], 70, 30, { direct: [3, 4], harvest: [6, 7, 8] }, 100, "average", ["fagiolo", "cavolo", "fava"], ["pomodoro", "zucca", "zucchina", "cetriolo", "melanzana"], "Rincalza le piante quando sono alte 15–20 cm."),
  C("zucchina", "Zucchina", "Cucurbita pepo", "cucurbitacee", "squash", ["#f2c94c"], 100, 80, { indoor: [3, 4], direct: [4, 5, 6], transplant: [4, 5], harvest: [6, 7, 8, 9] }, 55, "frequent", ["fagiolo", "mais", "cipolla", "lattuga"], ["patata"]),
  C("zucca", "Zucca", "Cucurbita maxima", "cucurbitacee", "squash", ["#f2994a"], 200, 150, { direct: [4, 5], transplant: [5], harvest: [9, 10] }, 120, "average", ["mais", "fagiolo"], ["patata"]),
  C("cetriolo", "Cetriolo", "Cucumis sativus", "cucurbitacee", "squash", ["#f2c94c"], 100, 50, { direct: [4, 5, 6], transplant: [5], harvest: [6, 7, 8, 9] }, 60, "frequent", ["fagiolo", "lattuga", "pisello"], ["patata"]),
  C("melone", "Melone", "Cucumis melo", "cucurbitacee", "squash", ["#f2c94c"], 150, 100, { indoor: [3, 4], transplant: [5], harvest: [7, 8] }, 90, "average", ["mais"], ["patata"]),
  C("anguria", "Anguria", "Citrullus lanatus", "cucurbitacee", "squash", ["#f2c94c"], 200, 120, { indoor: [3, 4], transplant: [5], harvest: [7, 8, 9] }, 100, "average", ["mais"], ["patata"]),
  C("lattuga", "Lattuga", "Lactuca sativa", "asteracee", "leafy", [], 30, 25, { indoor: [2, 3, 8], direct: [3, 4, 5, 6, 7, 8, 9], transplant: [3, 4, 5, 9, 10], harvest: [4, 5, 6, 7, 8, 9, 10, 11] }, 50, "frequent", ["carota", "ravanello", "fragola", "cetriolo", "cipolla"], ["prezzemolo", "sedano"]),
  C("radicchio", "Radicchio", "Cichorium intybus", "asteracee", "leafy", ["#8e2a4a"], 30, 25, { direct: [6, 7], harvest: [10, 11, 12, 1] }, 110, "average", ["finocchio", "lattuga"], []),
  C("rucola", "Rucola", "Eruca vesicaria", "brassicacee", "leafy", [], 20, 5, { direct: [3, 4, 5, 6, 7, 8, 9], harvest: [4, 5, 6, 7, 8, 9, 10, 11] }, 40, "average", ["lattuga"], []),
  C("spinacio", "Spinacio", "Spinacia oleracea", "amarantacee", "leafy", [], 25, 10, { direct: [2, 3, 4, 9, 10], harvest: [3, 4, 5, 10, 11, 12] }, 45, "average", ["fragola", "cavolo"], ["bietola"]),
  C("bietola", "Bietola", "Beta vulgaris", "amarantacee", "leafy", ["#d64545"], 40, 25, { direct: [3, 4, 5, 6, 8, 9], harvest: [5, 6, 7, 8, 9, 10, 11, 12] }, 60, "average", ["cipolla", "lattuga"], ["spinacio"]),
  C("carota", "Carota", "Daucus carota", "apiacee", "feathery", [], 25, 5, { direct: [2, 3, 4, 5, 6, 7], harvest: [5, 6, 7, 8, 9, 10, 11] }, 90, "average", ["cipolla", "porro", "pomodoro", "lattuga", "pisello", "ravanello"], []),
  C("finocchio", "Finocchio", "Foeniculum vulgare", "apiacee", "feathery", [], 40, 25, { direct: [6, 7], transplant: [7, 8], harvest: [10, 11, 12] }, 90, "frequent", ["lattuga"], ["pomodoro", "fagiolo", "peperone", "melanzana"]),
  C("sedano", "Sedano", "Apium graveolens", "apiacee", "feathery", [], 40, 30, { indoor: [3], transplant: [5, 6], harvest: [9, 10, 11] }, 120, "frequent", ["pomodoro", "porro", "cavolo", "fagiolo"], ["lattuga"]),
  C("prezzemolo", "Prezzemolo", "Petroselinum crispum", "apiacee", "feathery", [], 25, 15, { direct: [3, 4, 5, 6, 7, 8, 9], harvest: [5, 6, 7, 8, 9, 10, 11] }, 70, "average", ["pomodoro", "carota"], ["lattuga"]),
  C("basilico", "Basilico", "Ocimum basilicum", "lamiacee", "leafy", [], 30, 25, { indoor: [3, 4], direct: [5, 6], transplant: [5], harvest: [6, 7, 8, 9] }, 50, "average", ["pomodoro", "peperone", "melanzana"], []),
  C("cipolla", "Cipolla", "Allium cepa", "alliacee", "allium", [], 25, 10, { direct: [2, 3, 4, 10, 11], harvest: [6, 7, 8] }, 120, "minimum", ["carota", "lattuga", "pomodoro", "bietola"], ["fagiolo", "pisello", "fava"]),
  C("aglio", "Aglio", "Allium sativum", "alliacee", "allium", [], 25, 10, { direct: [2, 3, 10, 11, 12], harvest: [6, 7] }, 180, "minimum", ["pomodoro", "carota", "fragola"], ["fagiolo", "pisello", "fava"]),
  C("porro", "Porro", "Allium porrum", "alliacee", "allium", [], 40, 15, { indoor: [2, 3, 4], transplant: [5, 6, 7], harvest: [10, 11, 12, 1, 2] }, 140, "average", ["carota", "sedano"], ["fagiolo", "pisello"]),
  C("fagiolo", "Fagiolo / fagiolino", "Phaseolus vulgaris", "leguminose", "legume", ["#f4f1ea"], 50, 10, { direct: [4, 5, 6, 7], harvest: [7, 8, 9] }, 70, "average", ["zucchina", "mais", "patata", "carota", "cetriolo", "cavolo", "sedano"], ["cipolla", "aglio", "porro", "finocchio", "peperone"], "Le leguminose arricchiscono il terreno di azoto: non concimare con azoto."),
  C("pisello", "Pisello", "Pisum sativum", "leguminose", "legume", ["#f4f1ea"], 50, 5, { direct: [2, 3, 10, 11], harvest: [4, 5, 6] }, 80, "average", ["carota", "lattuga", "ravanello", "cetriolo"], ["cipolla", "aglio", "porro"]),
  C("fava", "Fava", "Vicia faba", "leguminose", "legume", ["#f4f1ea"], 60, 20, { direct: [2, 10, 11], harvest: [4, 5, 6] }, 150, "minimum", ["patata", "lattuga"], ["cipolla", "aglio"]),
  C("cavolo", "Cavolo cappuccio", "Brassica oleracea capitata", "brassicacee", "brassica", [], 60, 50, { indoor: [3, 4, 5, 6, 7], transplant: [5, 6, 7, 8], harvest: [9, 10, 11, 12, 1, 2, 3] }, 100, "average", ["sedano", "lattuga", "patata", "fagiolo", "spinacio"], ["pomodoro", "fragola"]),
  C("broccolo", "Broccolo", "Brassica oleracea italica", "brassicacee", "brassica", [], 70, 50, { indoor: [5, 6, 7], transplant: [7, 8], harvest: [10, 11, 12, 1, 2] }, 100, "average", ["sedano", "lattuga", "fagiolo"], ["pomodoro", "fragola"]),
  C("ravanello", "Ravanello", "Raphanus sativus", "brassicacee", "leafy", [], 15, 5, { direct: [2, 3, 4, 5, 6, 7, 8, 9, 10], harvest: [3, 4, 5, 6, 7, 8, 9, 10, 11] }, 30, "average", ["lattuga", "carota", "pisello"], []),
  C("fragola", "Fragola", "Fragaria × ananassa", "rosacee", "berry", ["#d64545"], 40, 30, { transplant: [3, 4, 8, 9], harvest: [5, 6] }, 90, "average", ["spinacio", "lattuga", "aglio"], ["cavolo", "broccolo"]),
  C("mais", "Mais", "Zea mays", "poacee", "grass", [], 70, 30, { direct: [4, 5], harvest: [8, 9] }, 100, "average", ["fagiolo", "zucca", "zucchina", "melone", "anguria"], ["pomodoro"]),
];

export const CROP_BY_ID = Object.fromEntries(CROPS.map((c) => [c.id, c]));

export const MONTHS = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];

// Mesi come "febbraio–marzo" o "mar, ago".
export function monthsLabel(months = []) {
  if (!months.length) return "—";
  const sorted = [...months].sort((a, b) => a - b);
  const runs = [];
  for (const m of sorted) {
    const last = runs.at(-1);
    if (last && m === last[1] + 1) last[1] = m;
    else runs.push([m, m]);
  }
  return runs.map(([a, b]) => (a === b ? MONTHS[a - 1] : `${MONTHS[a - 1]}–${MONTHS[b - 1]}`)).join(", ");
}

// Cosa si può fare con un ortaggio in un certo mese.
export function cropActions(crop, month) {
  const out = [];
  if (crop.indoor?.includes(month)) out.push("semenzaio");
  if (crop.direct?.includes(month)) out.push("semina");
  if (crop.transplant?.includes(month)) out.push("trapianto");
  if (crop.harvest?.includes(month)) out.push("raccolta");
  return out;
}

// Ortaggio -> forma comune delle piante (per catalogo, icone, irrigazione).
export function cropAsPlant(crop) {
  return {
    id: `crop:${crop.id}`,
    source: "crops",
    cropId: crop.id,
    commonName: crop.name,
    scientificName: crop.scientificName,
    family: FAMILIES[crop.family],
    watering: crop.watering,
    sunlight: ["full_sun"],
    spreadCm: { min: crop.spacing.plant, max: crop.spacing.plant },
    heightCm: null,
    flowerColors: [],
    iconColors: crop.colors,
    detailsLoaded: true,
  };
}

// Consociazioni: coppie di colture vicine (entro `radius` metri) che stanno
// bene o male insieme.
export function companionReport(plants, radius = 0.8) {
  const crops = plants.filter((p) => p.cropId && CROP_BY_ID[p.cropId]);
  const bad = new Map();
  const good = new Map();
  for (let i = 0; i < crops.length; i++) {
    for (let j = i + 1; j < crops.length; j++) {
      const a = crops[i], b = crops[j];
      if (a.cropId === b.cropId) continue;
      if (Math.hypot(a.x - b.x, a.y - b.y) > radius) continue;
      const ca = CROP_BY_ID[a.cropId], cb = CROP_BY_ID[b.cropId];
      const key = [ca.id, cb.id].sort().join("+");
      const pair = { a: ca.name, b: cb.name, points: [a, b] };
      if (ca.bad.includes(cb.id) || cb.bad.includes(ca.id)) {
        if (!bad.has(key)) bad.set(key, { ...pair, segments: [] });
        bad.get(key).segments.push([a, b]);
      } else if (ca.good.includes(cb.id) || cb.good.includes(ca.id)) {
        good.set(key, pair);
      }
    }
  }
  return { bad: [...bad.values()], good: [...good.values()] };
}

// Rotazione: famiglie presenti l'anno scorso nella stessa aiuola.
export function rotationWarnings(bed, year = new Date().getFullYear()) {
  const last = (bed.history ?? []).find((h) => h.year === year - 1);
  if (!last) return [];
  const current = new Set((bed.plants ?? []).map((p) => CROP_BY_ID[p.cropId]?.family).filter(Boolean));
  return last.families.filter((f) => current.has(f)).map((f) => FAMILIES[f] ?? f);
}
