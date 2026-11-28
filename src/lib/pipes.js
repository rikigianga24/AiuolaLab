// Geometria dei tubi: lunghezze, punto più vicino, raccordi curvi.
// Il tubo in PE da 16 mm non si piega ad angolo: le svolte sono archi di cerchio.
import { dist } from "./geometry.js";

export function polylineLength(pts) {
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += dist(pts[i - 1], pts[i]);
  return len;
}

/** Punto della spezzata più vicino a p: { point, dist, index }. */
export function nearestOnPolyline(pts, p) {
  let best = { point: pts[0], dist: Infinity, index: 0 };
  for (let i = 0; i + 1 < pts.length || i === 0; i++) {
    const a = pts[i];
    const b = pts[i + 1] ?? a;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const l2 = dx * dx + dy * dy;
    const t = l2 ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2)) : 0;
    const q = { x: a.x + dx * t, y: a.y + dy * t };
    const d = dist(p, q);
    if (d < best.dist) best = { point: q, dist: d, index: i };
    if (pts.length < 2) break;
  }
  return best;
}

/** Toglie gli ultimi `m` metri da una spezzata (per non derivare un tubo proprio dove finisce). */
export function trimEnd(pts, m) {
  let left = m;
  const out = [...pts];
  while (out.length > 1) {
    const d = dist(out.at(-2), out.at(-1));
    if (d > left) {
      const k = (d - left) / d;
      const a = out.at(-2);
      const b = out.at(-1);
      out[out.length - 1] = { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
      return out;
    }
    left -= d;
    out.pop();
  }
  return out;
}

/**
 * Arrotonda gli angoli di una spezzata. corners: [{ x, y, r? }] con r = raggio
 * di curvatura in metri sull'angolo (0 o assente = nessuna curva).
 * Gli archi sono campionati a circa 11° l'uno dall'altro.
 */
export function roundCorners(corners) {
  const out = [{ x: corners[0].x, y: corners[0].y }];
  for (let i = 1; i < corners.length - 1; i++) {
    const A = corners[i - 1];
    const P = corners[i];
    const B = corners[i + 1];
    const r = P.r ?? 0;
    const d1 = dist(A, P);
    const d2 = dist(B, P);
    if (r <= 0 || d1 < 1e-9 || d2 < 1e-9) {
      out.push({ x: P.x, y: P.y });
      continue;
    }
    const u1 = { x: (A.x - P.x) / d1, y: (A.y - P.y) / d1 };
    const u2 = { x: (B.x - P.x) / d2, y: (B.y - P.y) / d2 };
    const cos = Math.max(-1, Math.min(1, u1.x * u2.x + u2.y * u1.y));
    const phi = Math.acos(cos); // angolo tra i due tratti (π = rettilineo)
    if (phi > Math.PI - 0.01) {
      out.push({ x: P.x, y: P.y });
      continue;
    }
    // tratto di tangenza; i tratti vicini si dividono lo spazio (al massimo metà ciascuno)
    const t = Math.min(r / Math.tan(phi / 2), d1 / 2, d2 / 2);
    const rr = t * Math.tan(phi / 2);
    const T1 = { x: P.x + u1.x * t, y: P.y + u1.y * t };
    const T2 = { x: P.x + u2.x * t, y: P.y + u2.y * t };
    const bx = u1.x + u2.x;
    const by = u1.y + u2.y;
    const bl = Math.hypot(bx, by) || 1;
    const k = rr / Math.sin(phi / 2);
    const C = { x: P.x + (bx / bl) * k, y: P.y + (by / bl) * k };
    const a1 = Math.atan2(T1.y - C.y, T1.x - C.x);
    let da = Math.atan2(T2.y - C.y, T2.x - C.x) - a1;
    while (da > Math.PI) da -= 2 * Math.PI;
    while (da < -Math.PI) da += 2 * Math.PI;
    const n = Math.max(2, Math.ceil(Math.abs(da) / (Math.PI / 16)));
    for (let s = 0; s <= n; s++) {
      const a = a1 + (da * s) / n;
      out.push({ x: C.x + Math.cos(a) * rr, y: C.y + Math.sin(a) * rr });
    }
  }
  out.push({ x: corners.at(-1).x, y: corners.at(-1).y });
  return out;
}

/** Svolta più stretta tra due tratti consecutivi, in gradi (0 = tubo dritto). */
export function maxTurnDeg(pts) {
  let max = 0;
  for (let i = 1; i + 1 < pts.length; i++) {
    const ax = pts[i].x - pts[i - 1].x;
    const ay = pts[i].y - pts[i - 1].y;
    const bx = pts[i + 1].x - pts[i].x;
    const by = pts[i + 1].y - pts[i].y;
    if (Math.hypot(ax, ay) < 1e-9 || Math.hypot(bx, by) < 1e-9) continue;
    const ang = Math.abs(Math.atan2(ax * by - ay * bx, ax * bx + ay * by));
    max = Math.max(max, (ang * 180) / Math.PI);
  }
  return max;
}
