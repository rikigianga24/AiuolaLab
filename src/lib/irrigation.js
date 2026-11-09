// Impianto a goccia: percorso dei tubi, gocciolatori, materiali e programma.
//
// Percorso: albero di copertura minimo (algoritmo di Prim) che collega il
// rubinetto a tutte le piante con la minima lunghezza totale di tubo. I tratti
// fuori dalle aiuole sono tubo di adduzione (cieco), quelli dentro un'aiuola
// sono ala gocciolante.
//
// Acqua: fabbisogno giornaliero di ogni pianta stimato come
//   litri = ET0 (mm/giorno) × Kc × area della chioma (m²) / efficienza
// con ET0 tipico italiano per zona e stagione e Kc dal fabbisogno idrico.
import { dist, pointInPolygon } from "./geometry.js";

export const CLIMATES = {
  nord: { label: "Nord Italia", et0: { spring: 3, summer: 5, autumn: 2 } },
  centro: { label: "Centro Italia", et0: { spring: 3.5, summer: 5.5, autumn: 2.5 } },
  sud: { label: "Sud e isole", et0: { spring: 4, summer: 6.5, autumn: 3 } },
};

export const DRIPPER_FLOWS = [1, 2, 4]; // l/h, gocciolatori autocompensanti

const KC = { minimum: 0.35, average: 0.55, frequent: 0.8 };
const EFFICIENCY = 0.9;
const MAX_DRIPPERS = 4;
// Giorni tra un'irrigazione e l'altra in base al terreno.
const INTERVAL = { sandy: 1, chalky: 1, loamy: 2, clay: 3 };
const SEASONS = [
  ["spring", "Primavera", "07:30"],
  ["summer", "Estate", "07:00"],
  ["autumn", "Autunno", "08:00"],
];
// Portata oltre la quale un rubinetto domestico non basta per una sola zona.
const MAX_ZONE_FLOW = 900;
const WASTE = 1.1;

export const DEFAULT_SETTINGS = { climate: "nord", dripperFlow: 2 };

// Fabbisogno idrico di un esemplare: dal dato salvato o dal nome.
function waterNeed(plant) {
  if (plant.watering) return plant.watering;
  const n = `${plant.name} ${plant.scientificName ?? ""}`.toLowerCase();
  if (/lavand|rosmarin|timo|thymus|salvia|sedum|stipa|festuca|perovsk|gaura|achille|verben|cosmo/.test(n)) return "minimum";
  if (/ortensi|hydrang|hosta|astilbe|impatien|rododendr|azalea|felce/.test(n)) return "frequent";
  return "average";
}

const canopyArea = (spreadM) => Math.PI * (spreadM / 2) ** 2;

function dailyLiters(plant, et0) {
  return (et0 * KC[waterNeed(plant)] * canopyArea(plant.spreadM)) / EFFICIENCY;
}

// ---- percorso (Prim, O(n²)) ----

function minimumSpanningTree(points) {
  const n = points.length;
  const inTree = new Array(n).fill(false);
  const best = new Array(n).fill(Infinity);
  const parent = new Array(n).fill(-1);
  best[0] = 0;
  const edges = [];
  for (let k = 0; k < n; k++) {
    let u = -1;
    for (let i = 0; i < n; i++) if (!inTree[i] && (u === -1 || best[i] < best[u])) u = i;
    inTree[u] = true;
    if (parent[u] >= 0) edges.push([parent[u], u]);
    for (let v = 0; v < n; v++) {
      if (inTree[v]) continue;
      const d = dist(points[u], points[v]);
      if (d < best[v]) {
        best[v] = d;
        parent[v] = u;
      }
    }
  }
  return edges;
}

// Un tratto è "ala gocciolante" se resta tutto dentro la stessa aiuola.
function segmentInside(a, b, polygon) {
  for (const t of [0.25, 0.5, 0.75]) {
    if (!pointInPolygon({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }, polygon)) return false;
  }
  return true;
}

const roundTo = (v, step) => Math.max(step, Math.round(v / step) * step);

function addMinutes(hhmm, minutes) {
  const [h, m] = hhmm.split(":").map(Number);
  let t = h * 60 + m + minutes;
  t = ((t % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

/**
 * @param {{ beds: any[], faucet?: {x:number,y:number}, irrigation?: object }} project
 */
export function computeIrrigation(project) {
  const settings = { ...DEFAULT_SETTINGS, ...(project.irrigation ?? {}) };
  const climate = CLIMATES[settings.climate] ?? CLIMATES.nord;
  const flow = settings.dripperFlow;
  const plants = project.beds.flatMap((bed) => (bed.plants ?? []).map((p) => ({ ...p, bed })));
  const result = {
    settings,
    ready: Boolean(project.faucet) && plants.length > 0,
    edges: [],
    drippers: [],
    zones: [],
    materials: [],
    totals: { supplyM: 0, dripM: 0, drippers: 0, flowLph: 0 },
    warnings: [],
  };
  if (!result.ready) return result;

  // --- gocciolatori: più gocciolatori alle piante che bevono di più, così
  // tutte le piante della stessa aiuola ricevono acqua nello stesso tempo.
  for (const bed of project.beds) {
    const list = plants.filter((p) => p.bed.id === bed.id);
    if (!list.length) continue;
    // I vasi si asciugano prima della piena terra, quelli appesi ancora di più.
    const isPot = bed.kind === "pot";
    const potFactor = isPot ? (bed.pot?.hanging ? 1.5 : 1.25) : 1;
    const liters = list.map((p) => dailyLiters(p, climate.et0.summer * potFactor));
    const sorted = [...liters].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const targetH = Math.min(1.5, Math.max(0.1, median / flow));
    const counts = liters.map((l) => Math.min(MAX_DRIPPERS, Math.max(1, Math.round(l / (flow * targetH)))));
    list.forEach((p, i) => result.drippers.push({ plantId: p.id, bedId: bed.id, x: p.x, y: p.y, r: p.spreadM / 2, count: counts[i] }));

    // ore al giorno perché in media ogni pianta riceva il suo fabbisogno
    const hoursPerLiterRatio = (et0) => {
      const need = list.reduce((s, p) => s + dailyLiters(p, et0 * potFactor), 0);
      const supplied = counts.reduce((s, c) => s + c * flow, 0); // l/h
      return need / supplied;
    };
    const texture = isPot ? "pot" : bed.conditions?.texture ?? "loamy";
    const baseInterval = isPot ? 1 : INTERVAL[texture] ?? 2;
    const seasons = SEASONS.map(([key, label, endBy]) => {
      let interval = baseInterval;
      let minutes = hoursPerLiterRatio(climate.et0[key]) * 60 * interval;
      // sessioni troppo brevi: meglio annaffiare meno spesso
      while (minutes < 8 && interval < 4) {
        interval += 1;
        minutes = hoursPerLiterRatio(climate.et0[key]) * 60 * interval;
      }
      minutes = roundTo(minutes, 5);
      const cycles = texture === "sandy" && minutes > 40 ? 2 : 1;
      const perCycle = roundTo(minutes / cycles, 5);
      return {
        key,
        label,
        minutes,
        cycles,
        perCycle,
        interval,
        start: addMinutes(endBy, -perCycle),
        secondStart: cycles > 1 ? "19:00" : null,
      };
    });
    const zoneFlow = counts.reduce((s, c) => s + c * flow, 0);
    result.zones.push({
      bedId: bed.id,
      name: bed.name,
      plants: list.length,
      drippers: counts.reduce((s, c) => s + c, 0),
      flowLph: zoneFlow,
      texture,
      seasons,
    });
  }

  // --- percorso dei tubi
  const nodes = [{ x: project.faucet.x, y: project.faucet.y, kind: "faucet" }, ...plants.map((p) => ({ x: p.x, y: p.y, kind: "plant", bed: p.bed }))];
  const tree = minimumSpanningTree(nodes);
  const degree = new Array(nodes.length).fill(0);
  const dripDegree = new Array(nodes.length).fill(0);
  for (const [i, j] of tree) {
    const a = nodes[i], b = nodes[j];
    const sameBed = a.kind === "plant" && b.kind === "plant" && a.bed.id === b.bed.id;
    const kind = sameBed && segmentInside(a, b, a.bed.points) ? "drip" : "supply";
    const len = dist(a, b);
    result.edges.push({ a: { x: a.x, y: a.y }, b: { x: b.x, y: b.y }, kind, len });
    degree[i]++;
    degree[j]++;
    if (kind === "drip") {
      dripDegree[i]++;
      dripDegree[j]++;
    }
    if (kind === "drip") result.totals.dripM += len;
    else result.totals.supplyM += len;
  }

  // --- raccordi
  let tees = 0, caps = 0, joints = 0;
  nodes.forEach((n, i) => {
    if (n.kind === "faucet") {
      tees += Math.max(0, degree[i] - 1);
      return;
    }
    if (degree[i] === 1) caps += 1;
    if (degree[i] >= 3) tees += degree[i] - 2;
    // passaggio da adduzione ad ala gocciolante sulla stessa pianta
    if (dripDegree[i] > 0 && dripDegree[i] < degree[i]) joints += degree[i] - dripDegree[i];
  });

  const totalDrippers = result.drippers.reduce((s, d) => s + d.count, 0);
  const totalFlow = totalDrippers * flow;
  result.totals.drippers = totalDrippers;
  result.totals.flowLph = totalFlow;

  const m = (v) => Math.ceil(v * WASTE);
  result.materials = [
    { item: "Kit attacco rubinetto (raccordo, filtro, riduttore di pressione)", qty: 1, unit: "pz" },
    { item: "Programmatore da rubinetto", qty: 1, unit: "pz", note: result.zones.length > 1 ? `a ${Math.min(4, result.zones.length)} vie, una per aiuola` : null },
    { item: "Tubo di adduzione PE Ø 16 mm (cieco)", qty: m(result.totals.supplyM), unit: "m" },
    { item: "Ala gocciolante / tubo PE Ø 16 mm in aiuola", qty: m(result.totals.dripM), unit: "m" },
    { item: `Gocciolatori autocompensanti ${flow} l/h`, qty: totalDrippers, unit: "pz" },
    { item: "Raccordi a T Ø 16 mm", qty: tees, unit: "pz" },
    { item: "Manicotti di giunzione Ø 16 mm", qty: joints, unit: "pz" },
    { item: "Tappi di fine linea Ø 16 mm", qty: Math.max(1, caps), unit: "pz" },
    { item: "Picchetti di fissaggio", qty: Math.ceil((result.totals.supplyM + result.totals.dripM) / 0.8), unit: "pz" },
  ].filter((x) => x.qty > 0);

  if (totalFlow > MAX_ZONE_FLOW) {
    const zones = Math.ceil(totalFlow / MAX_ZONE_FLOW);
    result.warnings.push(
      `Portata totale ${Math.round(totalFlow)} l/h: troppa per un solo rubinetto. Dividi l'impianto in almeno ${zones} zone che si accendono in orari diversi.`,
    );
  }
  if (result.totals.supplyM + result.totals.dripM > 150) {
    result.warnings.push("Linea molto lunga: oltre i 150 m usa un tubo da 20 mm per l'adduzione o più zone.");
  }
  if (result.zones.length > 1 && result.zones.some((z) => z.seasons[1].minutes !== result.zones[0].seasons[1].minutes)) {
    result.warnings.push("Le aiuole hanno bisogno di tempi diversi: con un programmatore a una via usa la durata più lunga, oppure uno a più vie.");
  }
  return result;
}

export const TEXTURE_LABEL = { sandy: "sabbioso", chalky: "calcareo", loamy: "franco", clay: "argilloso", pot: "terriccio in vaso" };
