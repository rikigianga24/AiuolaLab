// Disposizione a file per l'orto: file parallele al lato più lungo
// dell'aiuola, con le distanze tra le file e sulla fila dell'ortaggio.
import { distToEdges, longestEdge, pointInPolygon } from "./geometry.js";

const rotate = (p, a) => ({ x: p.x * Math.cos(a) - p.y * Math.sin(a), y: p.x * Math.sin(a) + p.y * Math.cos(a) });

/**
 * @param {{x:number,y:number}[]} points contorno dell'aiuola (m)
 * @param {{row:number, plant:number}} spacing distanze in cm
 * @param {{ occupied?: {x:number,y:number,r:number}[], maxRows?: number, margin?: number }} opts
 * @returns {{x:number,y:number,row:number}[]}
 */
export function fillRows(points, spacing, { occupied = [], maxRows = Infinity, margin } = {}) {
  const rowM = Math.max(0.05, spacing.row / 100);
  const plantM = Math.max(0.03, spacing.plant / 100);
  const edgeMargin = margin ?? Math.min(rowM, plantM) / 2;
  const [a, b] = longestEdge(points);
  const angle = Math.atan2(b.y - a.y, b.x - a.x);
  const local = points.map((p) => rotate(p, -angle));
  const xs = local.map((p) => p.x), ys = local.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const out = [];
  let rowIndex = 0;
  for (let y = minY + rowM / 2; y <= maxY - rowM / 4 && rowIndex < maxRows; y += rowM) {
    let placedInRow = 0;
    for (let x = minX + plantM / 2; x <= maxX; x += plantM) {
      const p = rotate({ x, y }, angle);
      if (!pointInPolygon(p, points) || distToEdges(p, points) < edgeMargin) continue;
      if (occupied.some((o) => Math.hypot(o.x - p.x, o.y - p.y) < (o.r ?? 0) + plantM / 2)) continue;
      out.push({ x: p.x, y: p.y, row: rowIndex });
      placedInRow += 1;
    }
    if (placedInRow) rowIndex += 1;
  }
  return out;
}
