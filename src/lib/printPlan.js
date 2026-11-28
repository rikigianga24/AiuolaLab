// Tavola tecnica del progetto: calcoli puri (numerazione piante, scala, quote).
// Il disegno vero e proprio è in PlanSvg.jsx, in millimetri sulla carta.
import { bbox, centroid, dist, formatM } from "./geometry.js";
import { plantKey } from "./bloom.js";

export const PAPERS = {
  A4: { label: "A4 orizzontale", w: 297, h: 210, legendRows: 17 },
  A3: { label: "A3 orizzontale", w: 420, h: 297, legendRows: 30 },
};
export const MARGIN = 10; // mm
export const SCALES = [10, 20, 25, 30, 40, 50, 60, 75, 100, 125, 150, 200, 250, 300, 400, 500, 1000];

/** Aiuole da stampare: tutte oppure una sola. */
export const bedsToPrint = (project, bedId = null) =>
  bedId ? project.beds.filter((b) => b.id === bedId) : project.beds;

/** Ingombro in metri di tutte le aiuole (con un piccolo margine per le piante sul bordo). */
export function planBounds(beds) {
  const pts = beds.flatMap((b) => b.points ?? []);
  if (!pts.length) return null;
  const b = bbox(pts);
  return { minX: b.minX, minY: b.minY, maxX: b.maxX, maxY: b.maxY, w: b.maxX - b.minX, h: b.maxY - b.minY };
}

/** Il più grande rapporto 1:N della serie standard in cui il disegno sta nell'area (mm). */
export function fitScale(bounds, area) {
  const need = Math.max((bounds.w * 1000) / area.w, (bounds.h * 1000) / area.h, 1e-6);
  return SCALES.find((n) => n >= need) ?? Math.ceil(need / 500) * 500;
}

/**
 * Numera le piante: una voce per specie+varietà, in ordine alfabetico.
 * Restituisce le voci per la legenda e la mappa chiave -> numero.
 */
export function numberPlants(beds, monthsOf = () => undefined) {
  const groups = new Map();
  for (const b of beds) {
    for (const pl of b.plants ?? []) {
      const key = plantKey(pl);
      const g = groups.get(key) ?? { key, name: pl.name, variety: pl.variety ?? null, count: 0, heightCm: pl.heightCm ?? null, spreadM: pl.spreadM ?? null, months: monthsOf(pl) };
      g.count++;
      groups.set(key, g);
    }
  }
  const items = [...groups.values()].sort((a, c) => a.name.localeCompare(c.name, "it") || (a.variety ?? "").localeCompare(c.variety ?? "", "it"));
  const numberOf = new Map();
  items.forEach((it, i) => {
    it.n = i + 1;
    numberOf.set(it.key, it.n);
  });
  return { items, numberOf, total: items.reduce((s, it) => s + it.count, 0) };
}

/** Lunghezza dei lati di un poligono con il punto di mezzeria e il verso "verso l'esterno". */
export function edgeQuotes(points) {
  const c = centroid(points);
  return points.map((a, i) => {
    const b = points[(i + 1) % points.length];
    const len = dist(a, b);
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    let nx = -(b.y - a.y) / (len || 1);
    let ny = (b.x - a.x) / (len || 1);
    if ((mid.x - c.x) * nx + (mid.y - c.y) * ny < 0) {
      nx = -nx;
      ny = -ny;
    }
    return { a, b, len, label: formatM(len), mid, normal: { x: nx, y: ny } };
  });
}

/** Lunghezza "tonda" per la scala grafica: tra 20 e 60 mm sulla carta. */
export function scaleBarLength(scale) {
  const steps = [0.1, 0.2, 0.25, 0.5, 1, 2, 5, 10, 20, 50, 100];
  const m = steps.find((s) => (s * 1000) / scale >= 20) ?? 100;
  return { m, mm: (m * 1000) / scale, label: m < 1 ? `${Math.round(m * 100)} cm` : `${m} m` };
}

export const heightLabel = (cm) => (cm == null ? null : cm >= 100 ? `${(cm / 100).toFixed(cm % 100 ? 1 : 0).replace(".", ",")} m` : `${Math.round(cm)} cm`);

// margini riservati dentro l'area del disegno per quote, scala e freccia del nord
export const PAD = { top: 14, right: 16, bottom: 22, left: 16 };

/** Area utile (mm) per il disegno vero e proprio. */
export const innerArea = (area) => ({ w: area.w - PAD.left - PAD.right, h: area.h - PAD.top - PAD.bottom });
