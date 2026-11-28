// Impianto a goccia: percorso dei tubi, gocciolatori, materiali e programma.
//
// Percorso pensato per essere montato davvero: in ogni aiuola passa UN solo
// tubo continuo (senza giunte né tagli), dritto in file lungo la direzione che
// serve meglio le piante e piegato con curve ampie da una fila all'altra, a
// serpentina. I gocciolatori si innestano sul tubo; le piante un po' discoste
// ricevono l'acqua da un microtubo corto. Dal rubinetto parte un tubo per ogni
// aiuola (che si può derivare con un raccordo a T da un tubo già steso, se
// conviene); i tratti fuori dalle aiuole sono tubo di adduzione (cieco).
//
// Acqua: fabbisogno giornaliero di ogni pianta stimato come
//   litri = ET0 (mm/giorno) × Kc × area della chioma (m²) / efficienza
// con ET0 tipico italiano per zona e stagione e Kc dal fabbisogno idrico.
import { dist, distToEdges, pointInPolygon } from "./geometry.js";
import { nearestOnPolyline, polylineLength, roundCorners, trimEnd } from "./pipes.js";

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

// ---- percorso: file dritte e serpentina ----

const REACH = 0.4; // m: da un tubo il microtubo arriva fino a 40 cm
const MAX_REACH = 0.5;
const MIN_ROW_GAP = 0.5; // m: due file più vicine si fondono (il tubo non fa curve a U troppo strette)
const BEND_R = 0.25; // m: raggio di curvatura del tubo da 16 mm
const TURN_COST = 0.3; // m equivalenti per ogni curva a U: preferisce file lunghe
const TRUNK_SKIP = 0.5; // m: una derivazione non parte a meno di mezzo metro dalla fine di un tubo
const STEP_DEG = 5;
const ALIGN_GAP = 0.12; // m: piante con questo scarto stanno sullo stesso tubo
const STUB_FIXED = 0.6; // m equivalenti per ogni microtubo (raccordo e fatica in più)

const unit = (theta) => ({ u: { x: Math.cos(theta), y: Math.sin(theta) }, v: { x: -Math.sin(theta), y: Math.cos(theta) } });

// Raggruppa le piante in file parallele alla direzione theta: ogni fila ha un tubo
// dritto a metà, e le sue piante stanno entro la portata del microtubo.
function buildRows(list, theta, tight) {
  const { u, v } = unit(theta);
  const pts = list.map((p) => ({ p, a: p.x * u.x + p.y * u.y, c: p.x * v.x + p.y * v.y })).sort((x, y) => x.c - y.c);
  const rows = [];
  for (const q of pts) {
    const last = rows.at(-1);
    // tight: file esatte (piante allineate sullo stesso tubo); altrimenti fasce larghe con microtubi
    const joins = tight ? q.c - last?.cMax <= ALIGN_GAP && q.c - last.cMin <= 2 * MAX_REACH : q.c - last?.cMin <= 2 * REACH;
    if (last && joins) {
      last.members.push(q);
      last.cMax = q.c;
    } else rows.push({ cMin: q.c, cMax: q.c, members: [q] });
  }
  // file troppo vicine: una sola
  for (let i = 0; i < rows.length - 1; ) {
    const ci = (rows[i].cMin + rows[i].cMax) / 2;
    const cj = (rows[i + 1].cMin + rows[i + 1].cMax) / 2;
    if (cj - ci < MIN_ROW_GAP && rows[i + 1].cMax - rows[i].cMin <= 2 * MAX_REACH) {
      rows[i].members.push(...rows[i + 1].members);
      rows[i].cMax = rows[i + 1].cMax;
      rows.splice(i + 1, 1);
    } else i++;
  }
  return rows.map((r) => ({
    c: (r.cMin + r.cMax) / 2,
    a0: Math.min(...r.members.map((m) => m.a)),
    a1: Math.max(...r.members.map((m) => m.a)),
    // quanto microtubo serve: la distanza dei membri dal tubo e un costo fisso per ogni raccordo in più
    offset: r.members.reduce((sum, m) => {
      const off = Math.abs(m.c - (r.cMin + r.cMax) / 2);
      return sum + (off > 0.05 ? off + STUB_FIXED : 0);
    }, 0),
  }));
}

// Spezzata con raggi di curva: le file in sequenza, collegate da curve a U.
// reverse: si parte dall'ultima fila; startHigh: si percorre la prima fila al contrario.
function snake(rows, theta, { reverse, startHigh }) {
  const { u, v } = unit(theta);
  const P = (a, c) => ({ x: u.x * a + v.x * c, y: u.y * a + v.y * c });
  const seq = reverse ? [...rows].reverse() : rows;
  const m = seq.length;
  const dir = (i) => (startHigh ? -1 : 1) * (i % 2 ? -1 : 1); // +1: da a0 verso a1
  const turn = (i) => (dir(i) > 0 ? Math.max(seq[i].a1, seq[i + 1].a1) : Math.min(seq[i].a0, seq[i + 1].a0));
  const first = dir(0) > 0 ? seq[0].a0 : seq[0].a1;
  const corners = [{ ...P(first, seq[0].c), r: 0 }];
  let tight = 0;
  for (let i = 0; i < m - 1; i++) {
    const gap = Math.abs(seq[i + 1].c - seq[i].c);
    const r = Math.min(BEND_R, gap / 2);
    if (r < 0.15) tight += 1;
    const T = turn(i) + dir(i) * r;
    corners.push({ ...P(T, seq[i].c), r }, { ...P(T, seq[i + 1].c), r });
  }
  const last = seq[m - 1];
  corners.push({ ...P(dir(m - 1) > 0 ? last.a1 : last.a0, last.c), r: 0 });
  return { corners, turns: m - 1, tight, dirOut: { x: u.x * dir(0), y: u.y * dir(0) } };
}

// Lunghezza della spezzata che esce dal poligono dell'aiuola (con una piccola tolleranza).
function outsideLength(pts, polygon, tol) {
  let out = 0;
  for (let i = 1; i < pts.length; i++) {
    const n = Math.max(1, Math.ceil(dist(pts[i - 1], pts[i]) / 0.1));
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n;
      const q = { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * t };
      if (!pointInPolygon(q, polygon) && distToEdges(q, polygon) > tol) out += dist(pts[i - 1], pts[i]) / n;
    }
  }
  return out;
}

// Tubo di adduzione dalla sorgente F all'inizio E della linea, che arriva nella direzione di marcia.
function feedCorners(F, E, dirOut) {
  const d = dist(F, E);
  if (d < 1e-6) return [{ ...E, r: 0 }];
  const k = Math.min(0.6, d / 2);
  return [{ ...F, r: 0 }, { x: E.x - dirOut.x * k, y: E.y - dirOut.y * k, r: BEND_R }, { ...E, r: 0 }];
}

// Sceglie direzione e verso della serpentina di un'aiuola: minimo tubo in tutto
// (adduzione + file + curve), con la linea dentro l'aiuola.
function routeBed(list, bed, sources) {
  const angles = new Set();
  for (let d = 0; d < 180; d += STEP_DEG) angles.add(d);
  // direzioni dei lati: le file parallele al bordo sono le più naturali
  const poly = bed.points;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    if (dist(a, b) > 0.3) angles.add(Math.round((((Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI) % 180 + 180) % 180));
  }
  const tol = bed.kind === "pot" ? 0.2 : 0.1;
  let best = null;
  for (const deg of angles) {
    const theta = (deg * Math.PI) / 180;
    for (const tight of [true, false]) {
      const rows = buildRows(list, theta, tight);
      const offset = rows.reduce((s, r) => s + r.offset, 0);
      for (const reverse of [false, true]) {
        if (rows.length === 1 && reverse) continue;
        for (const startHigh of [false, true]) {
          const sn = snake(rows, theta, { reverse, startHigh });
          const E = sn.corners[0];
          const src = sources(E);
          const feed = roundCorners(feedCorners(src.point, E, sn.dirOut));
          const drip = roundCorners(sn.corners);
          const cost =
            polylineLength(feed) +
            polylineLength(drip) +
            offset +
            TURN_COST * sn.turns +
            5 * sn.tight +
            10 * outsideLength(drip, poly, tol);
          if (!best || cost < best.cost - 1e-9) best = { cost, feed, drip, src };
        }
      }
    }
  }
  return best;
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
    pipes: [],
    stubs: [],
    longStubs: 0,
    drippers: [],
    zones: [],
    materials: [],
    totals: { supplyM: 0, dripM: 0, stubM: 0, drippers: 0, flowLph: 0, pieces: 0, tees: 0, caps: 0 },
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

  // --- percorso dei tubi: un tubo continuo per ogni aiuola, a partire dalle più vicine al rubinetto
  const faucet = { x: project.faucet.x, y: project.faucet.y };
  const byBed = project.beds
    .map((bed) => ({ bed, list: plants.filter((p) => p.bed.id === bed.id) }))
    .filter((b) => b.list.length)
    .map((b) => ({ ...b, d: Math.min(...b.list.map((p) => dist(p, faucet))) }))
    .sort((a, b) => a.d - b.d);
  const trunks = []; // tubi di adduzione già stesi (su cui si può derivare)
  let faucetBranches = 0;
  let tees = 0;
  for (const { bed, list } of byBed) {
    // sorgente più vicina all'inizio della linea: il rubinetto o un tubo di adduzione già steso
    const sources = (E) => {
      let pick = { point: faucet, dist: dist(faucet, E), onTrunk: false };
      for (const t of trunks) {
        const n = nearestOnPolyline(t, E);
        if (n.dist < pick.dist - 1e-9) pick = { point: n.point, dist: n.dist, onTrunk: true };
      }
      return pick;
    };
    const route = routeBed(list, bed, sources);
    if (route.src.onTrunk) tees += 1;
    else faucetBranches += 1;
    const supplyLen = polylineLength(route.feed);
    const dripLen = polylineLength(route.drip);
    if (supplyLen > 0.01) {
      result.pipes.push({ kind: "supply", bedId: bed.id, points: route.feed, len: supplyLen });
      trunks.push(trimEnd(route.feed, TRUNK_SKIP));
    }
    result.pipes.push({ kind: "drip", bedId: bed.id, points: route.drip, len: dripLen });
    result.totals.supplyM += supplyLen;
    result.totals.dripM += dripLen;
    result.totals.caps += 1;
    // microtubo dalla linea alle piante che non ci sono sopra
    for (const p of list) {
      const n = nearestOnPolyline(route.drip, p);
      if (n.dist < 0.05) continue;
      result.stubs.push({ bedId: bed.id, plantId: p.id, a: n.point, b: { x: p.x, y: p.y }, len: n.dist });
      result.totals.stubM += n.dist;
      if (n.dist > 0.7) result.longStubs += 1;
    }
  }
  tees += Math.max(0, faucetBranches - 1);
  result.totals.pieces = result.pipes.filter((x) => x.kind === "drip").length;
  result.totals.tees = tees;

  const totalDrippers = result.drippers.reduce((s, d) => s + d.count, 0);
  const totalFlow = totalDrippers * flow;
  result.totals.drippers = totalDrippers;
  result.totals.flowLph = totalFlow;

  const m = (v) => Math.ceil(v * WASTE);
  const tubeM = m(result.totals.supplyM + result.totals.dripM);
  const roll = [25, 50, 100].find((r) => r >= tubeM);
  result.materials = [
    { item: "Kit attacco rubinetto (raccordo, filtro, riduttore di pressione)", qty: 1, unit: "pz" },
    { item: "Programmatore da rubinetto", qty: 1, unit: "pz", note: result.zones.length > 1 ? `a ${Math.min(4, result.zones.length)} vie, una per aiuola` : null },
    {
      item: "Tubo PE Ø 16 mm",
      qty: tubeM,
      unit: "m",
      note: `${result.totals.pieces} ${result.totals.pieces === 1 ? "tubo continuo" : "tubi continui"}, senza giunte: uno per aiuola${roll ? `; basta un rotolo da ${roll} m` : "; più rotoli, tagliando solo a fine aiuola"}`,
    },
    { item: "Microtubo Ø 4 mm (dalla linea alla pianta)", qty: Math.ceil(result.totals.stubM * WASTE), unit: "m" },
    { item: `Gocciolatori autocompensanti ${flow} l/h`, qty: totalDrippers, unit: "pz", note: "si innestano sul tubo con la pinza foratubi" },
    { item: "Raccordi a T Ø 16 mm", qty: result.totals.tees, unit: "pz", note: "solo dove un tubo si dirama da un altro" },
    { item: "Tappi di fine linea Ø 16 mm", qty: Math.max(1, result.totals.caps), unit: "pz" },
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
  const longLine = result.pipes.find((p) => p.kind === "drip" && p.len > 60);
  if (longLine) result.warnings.push("Una linea in aiuola supera i 60 m: la pressione cala lungo il tubo, meglio dividerla in due zone.");
  if (result.longStubs) result.warnings.push(`${result.longStubs} ${result.longStubs === 1 ? "pianta è" : "piante sono"} a più di 70 cm dal tubo: microtubo lungo, meglio avvicinare la pianta o la linea.`);
  if (result.zones.length > 1 && result.zones.some((z) => z.seasons[1].minutes !== result.zones[0].seasons[1].minutes)) {
    result.warnings.push("Le aiuole hanno bisogno di tempi diversi: con un programmatore a una via usa la durata più lunga, oppure uno a più vie.");
  }
  return result;
}

export const TEXTURE_LABEL = { sandy: "sabbioso", chalky: "calcareo", loamy: "franco", clay: "argilloso", pot: "terriccio in vaso" };
