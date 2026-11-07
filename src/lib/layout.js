// Posizionamento automatico delle piante proposte dal consulente IA dentro
// il poligono dell'aiuola: le piante alte vanno al centro (o sul fondo se
// l'aiuola si vede da un lato solo), le basse verso il bordo. Le specie
// uguali tendono a stare vicine, a gruppi.
import { bbox, distToEdges, distToSegment, longestEdge, pointInPolygon, polygonArea } from "./geometry.js";

const TARGET = { alta: 0.9, media: 0.55, bassa: 0.15, copertura: 0.05 };
const ORDER = ["alta", "media", "bassa", "copertura"];

function candidates(points) {
  const area = polygonArea(points);
  const step = Math.max(0.05, Math.sqrt(area / 5000));
  const b = bbox(points);
  const out = [];
  for (let y = b.minY + step / 2; y < b.maxY; y += step) {
    for (let x = b.minX + step / 2; x < b.maxX; x += step) {
      const p = { x, y };
      if (pointInPolygon(p, points)) out.push({ ...p, edge: distToEdges(p, points) });
    }
  }
  return out;
}

// groups: [{ key, layer, quantity, spreadM }]; blocked: [{ x, y, r }] già occupati
// Restituisce { placed: [{ key, x, y }], skipped: numero non posizionati }
// Nei vasi le piante possono sporgere dal bordo e stare più fitte.
export function autoLayout(points, groups, { viewedFrom = "all", blocked = [], container = false } = {}) {
  const edgeFactor = container ? 0 : 0.6;
  const edgeMargin = container ? 0.02 : 0.06;
  const tolerances = container ? [0.95, 0.75, 0.55, 0.4] : [0.95, 0.75, 0.55];
  const cells = candidates(points);
  if (!cells.length) return { placed: [], skipped: groups.reduce((s, g) => s + g.quantity, 0) };

  // "Profondità": 1 dove vanno le piante alte, 0 sul bordo in vista.
  const maxEdge = Math.max(...cells.map((c) => c.edge)) || 1;
  let depth;
  if (viewedFrom === "one") {
    const [a, b] = longestEdge(points);
    const back = cells.map((c) => distToSegment(c, a, b));
    const maxBack = Math.max(...back) || 1;
    depth = cells.map((c, i) => 1 - back[i] / maxBack);
  } else {
    depth = cells.map((c) => c.edge / maxEdge);
  }

  // Le piante già presenti occupano spazio ma non vengono restituite.
  const placed = blocked.map((b) => ({ key: null, ...b }));
  const fixed = placed.length;
  let skipped = 0;
  const sorted = [...groups].sort((a, b) => ORDER.indexOf(a.layer) - ORDER.indexOf(b.layer));

  for (const g of sorted) {
    const r = g.spreadM / 2;
    const target = TARGET[g.layer] ?? 0.5;
    const spreadOut = g.layer === "bassa" || g.layer === "copertura";
    for (let n = 0; n < g.quantity; n++) {
      let best = null;
      for (const tolerance of tolerances) {
        let bestScore = -Infinity;
        for (let i = 0; i < cells.length; i++) {
          const c = cells[i];
          // non sopra la bordura (circa 6 cm verso l'interno)
          if (c.edge < r * edgeFactor + edgeMargin) continue;
          let ok = true;
          let nearSame = Infinity;
          for (const p of placed) {
            const d = Math.hypot(p.x - c.x, p.y - c.y);
            if (d < (p.r + r) * tolerance) {
              ok = false;
              break;
            }
            if (p.key === g.key) nearSame = Math.min(nearSame, d);
          }
          if (!ok) continue;
          let score = -Math.abs(depth[i] - target) * 3;
          if (spreadOut) {
            // Bordure e tappezzanti: distribuite lungo tutto il perimetro.
            if (nearSame < Infinity) score += Math.min(nearSame / g.spreadM, 6) * 0.25;
          } else if (nearSame < Infinity) {
            // Piante strutturali e di riempimento: a gruppi.
            score += nearSame < g.spreadM * 1.6 ? 1 : -0.2;
          }
          if (score > bestScore) {
            bestScore = score;
            best = c;
          }
        }
        if (best) break;
      }
      if (!best) {
        skipped += 1;
        continue;
      }
      placed.push({ key: g.key, x: best.x, y: best.y, r });
    }
  }
  return { placed: placed.slice(fixed).map(({ key, x, y }) => ({ key, x, y })), skipped };
}
