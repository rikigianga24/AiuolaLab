// Geometria 2D. Tutte le coordinate del progetto sono in metri.

export const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);

export function polygonArea(points) {
  let sum = 0;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    sum += (points[j].x + points[i].x) * (points[j].y - points[i].y);
  }
  return Math.abs(sum / 2);
}

export function perimeter(points) {
  let total = 0;
  for (let i = 0; i < points.length; i++) total += dist(points[i], points[(i + 1) % points.length]);
  return total;
}

export function bbox(points) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

export function centroid(points) {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const f = points[j].x * points[i].y - points[i].x * points[j].y;
    a += f;
    cx += (points[j].x + points[i].x) * f;
    cy += (points[j].y + points[i].y) * f;
  }
  if (Math.abs(a) < 1e-9) {
    const b = bbox(points);
    return { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 };
  }
  return { x: cx / (3 * a), y: cy / (3 * a) };
}

export function pointInPolygon(p, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x, yi = points[i].y, xj = points[j].x, yj = points[j].y;
    if (yi > p.y !== yj > p.y && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function distToSegment(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

export function distToEdges(p, points) {
  let min = Infinity;
  for (let i = 0; i < points.length; i++) min = Math.min(min, distToSegment(p, points[i], points[(i + 1) % points.length]));
  return min;
}

export function longestEdge(points) {
  let best = { i: 0, len: -1 };
  for (let i = 0; i < points.length; i++) {
    const len = dist(points[i], points[(i + 1) % points.length]);
    if (len > best.len) best = { i, len };
  }
  return [points[best.i], points[(best.i + 1) % points.length]];
}

// True se due segmenti si intersecano propriamente (usato per impedire
// aiuole con lati che si incrociano).
export function segmentsCross(a, b, c, d) {
  const o = (p, q, r) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
  return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0;
}

export function wouldSelfIntersect(points, next) {
  if (points.length < 2) return false;
  const last = points[points.length - 1];
  for (let i = 0; i < points.length - 2; i++) {
    if (segmentsCross(points[i], points[i + 1], last, next)) return true;
  }
  return false;
}

export const snap = (v, step) => (step ? Math.round(v / step) * step : v);

export const formatM = (m) => (m < 1 ? `${Math.round(m * 100)} cm` : `${m.toFixed(2).replace(".", ",")} m`);
export const formatM2 = (m2) => `${m2.toFixed(m2 < 10 ? 2 : 1).replace(".", ",")} m²`;
