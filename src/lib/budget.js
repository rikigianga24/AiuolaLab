// Prezzi indicativi e budget stimato di un progetto: piante, terriccio e
// pacciamatura. Funziona sia sulle schede del catalogo sia sulle piante già
// messe nelle aiuole (anche quelle dei progetti salvati prima dei prezzi).
import { polygonArea } from "./geometry.js";
import { isFloor, isPot, potVolumeL } from "./containers.js";

// Fasce di prezzo di una pianta in vaso da vivaio.
export const PRICE_TIERS = {
  1: { label: "Economica", short: "€", eur: 5, range: "circa 5 €" },
  2: { label: "Media", short: "€€", eur: 10, range: "circa 10 €" },
  3: { label: "Costosa", short: "€€€", eur: 20, range: "circa 20 €" },
  4: { label: "Premium", short: "€€€€", eur: 40, range: "40 € e oltre" },
};

// Fascia predefinita per gruppo del catalogo.
const GROUP_TIER = {
  annuali: 1,
  balcone: 1,
  aromatiche: 1,
  bulbose: 1,
  perenni: 2,
  graminacee: 2,
  rose: 3,
  arbusti: 3,
  rampicanti: 3,
};

// Eccezioni sul nome scientifico, controllate in ordine: vince la prima.
const OVERRIDES = [
  // premium: alberelli, piante a crescita lenta, esemplari innestati
  [4, /^(olea|acer palmatum|magnolia|cercis|hamamelis|cycas|chamaerops|strelitzia|citrus)\b|paeonia (suffruticosa|x itoh)/i],
  // costose
  [3, /^(paeonia|agapanthus|camellia|gardenia|osmanthus fragrans|lagerstroemia|feijoa|amelanchier|kalmia|daphne|wisteria|clematis armandii|trachelospermum|mandevilla|bougainvillea|hippeastrum|zantedeschia|hibiscus rosa-sinensis|osmunda|matteuccia|aeonium|agave)\b/i],
  // medie
  [2, /^(lilium|dahlia(?! 'gallery')|canna|fritillaria imperialis|eucomis|nerine|amaryllis|laurus|aloysia|capparis|hedera|parthenocissus|fallopia|humulus|jasminum nudiflorum|passiflora caerulea|buxus|euonymus fortunei|cotoneaster|symphoricarpos|spiraea|erica|calluna|hebe|fuchsia|cistus|santolina|teucrium|westringia|helichrysum|perovskia|caryopteris|ceratostigma|pelargonium 'citronella'|begonia 'dragon wing'|lantana|echeveria|kalanchoe|jasminum sambac)\b/i],
  // economiche
  [1, /^(lavandula|lathyrus|rhodochiton|thymus|dichondra|trifolium|sagina|phyla)\b/i],
];

/** Fascia di prezzo (1-4) di una pianta del catalogo, di un ortaggio o di un esemplare piantato. */
export function priceTier(plant) {
  if (!plant) return 2;
  if (PRICE_TIERS[plant.priceTier]) return plant.priceTier;
  if (plant.cropId) return 1; // piantine dell'orto
  const sci = plant.scientificName ?? "";
  for (const [tier, re] of OVERRIDES) if (re.test(sci)) return tier;
  return GROUP_TIER[plant.group] ?? 2;
}

export const plantPrice = (plant) => PRICE_TIERS[priceTier(plant)].eur;

// Terriccio universale in sacchi.
export const SOIL_BAG = { label: "Terriccio universale", bagL: 50, eur: 8 };
// Strato di terriccio da aggiungere nelle aiuole in piena terra (cm).
export const DEFAULT_SOIL_CM = 10;

// Pacciamature: per le coperture sfuse quanti litri ha un sacco e quanto
// spesso è lo strato; per il telo quanti m² ha un rotolo.
export const MULCHES = {
  bark: { label: "Corteccia", unit: "sacchi", bagL: 50, layerCm: 5, eur: 7 },
  gravel: { label: "Ghiaia bianca", unit: "sacchi", bagL: 15, layerCm: 5, eur: 6, note: "sacchi da 25 kg" },
  pebbles: { label: "Ciottoli di fiume", unit: "sacchi", bagL: 15, layerCm: 5, eur: 8, note: "sacchi da 25 kg" },
  lapillo: { label: "Lapillo vulcanico", unit: "sacchi", bagL: 50, layerCm: 5, eur: 12 },
  nylon: { label: "Telo pacciamante in nylon", unit: "rotoli", rollM2: 12, overlap: 0.15, eur: 9, note: "rotoli da 1,2 × 10 m" },
  soil: null, // terra nuda: niente pacciamatura
};

const bags = (litres, size) => (litres > 0 ? Math.ceil(litres / size) : 0);

/** Terriccio e pacciamatura di una sola aiuola o vaso. */
export function bedMaterials(bed, { soilCm = DEFAULT_SOIL_CM } = {}) {
  if (!bed || isFloor(bed)) return { soil: null, mulch: null };
  const area = polygonArea(bed.points ?? []);
  const soilL = isPot(bed) ? potVolumeL(bed.pot) : Math.round(area * (soilCm / 100) * 1000);
  const soil = soilL > 0 ? { litres: soilL, bags: bags(soilL, SOIL_BAG.bagL) } : null;
  if (soil) soil.eur = soil.bags * SOIL_BAG.eur;

  let mulch = null;
  const kind = isPot(bed) ? null : bed.surface ?? "bark";
  const def = kind ? MULCHES[kind] : null;
  if (def && area > 0) {
    if (def.rollM2) {
      const m2 = area * (1 + def.overlap);
      const rolls = Math.ceil(m2 / def.rollM2);
      mulch = { kind, label: def.label, m2: Math.round(m2 * 10) / 10, qty: rolls, unit: def.unit, eur: rolls * def.eur };
    } else {
      const litres = Math.round(area * (def.layerCm / 100) * 1000);
      const qty = bags(litres, def.bagL);
      mulch = { kind, label: def.label, litres, qty, unit: def.unit, eur: qty * def.eur };
    }
  }
  return { soil, mulch };
}

/** Budget stimato di tutto il progetto. */
export function projectBudget(project, { soilCm = project?.budget?.soilCm ?? DEFAULT_SOIL_CM } = {}) {
  const plants = new Map();
  const beds = [];
  let soilL = 0;
  const mulches = new Map();
  for (const bed of project?.beds ?? []) {
    if (isFloor(bed)) continue;
    let bedPlants = 0;
    for (const p of bed.plants ?? []) {
      const key = p.cropId ?? p.plantId ?? p.name;
      const tier = priceTier(p);
      const row = plants.get(key) ?? { key, name: p.name, tier, count: 0, eur: 0 };
      row.count += 1;
      row.eur += PRICE_TIERS[tier].eur;
      plants.set(key, row);
      bedPlants += PRICE_TIERS[tier].eur;
    }
    const m = bedMaterials(bed, { soilCm });
    if (m.soil) soilL += m.soil.litres;
    if (m.mulch) {
      const tot = mulches.get(m.mulch.kind) ?? { kind: m.mulch.kind, label: m.mulch.label, unit: m.mulch.unit, litres: 0, m2: 0 };
      tot.litres += m.mulch.litres ?? 0;
      tot.m2 += m.mulch.m2 ?? 0;
      mulches.set(m.mulch.kind, tot);
    }
    beds.push({ id: bed.id, name: bed.name, plants: bedPlants, ...m });
  }

  // I sacchi si comprano per tutto il progetto: si arrotonda sul totale.
  const soilBags = bags(soilL, SOIL_BAG.bagL);
  const soil = { litres: soilL, bags: soilBags, eur: soilBags * SOIL_BAG.eur, layerCm: soilCm };
  const mulch = [...mulches.values()].map((t) => {
    const def = MULCHES[t.kind];
    const qty = def.rollM2 ? Math.ceil(t.m2 / def.rollM2) : bags(t.litres, def.bagL);
    return { ...t, m2: Math.round(t.m2 * 10) / 10, qty, eur: qty * def.eur, note: def.note ?? null };
  });

  const plantRows = [...plants.values()].sort((a, b) => b.eur - a.eur);
  const totals = {
    plants: plantRows.reduce((s, r) => s + r.eur, 0),
    soil: soil.eur,
    mulch: mulch.reduce((s, r) => s + r.eur, 0),
  };
  totals.all = totals.plants + totals.soil + totals.mulch;
  return { plants: plantRows, soil, mulch, beds, totals };
}

export const formatEur = (n) => `${Math.round(n).toLocaleString("it-IT")} €`;
