// Calendario di fioritura: logica pura (nessuna dipendenza dal browser),
// usata dal pannello, dall'editor e dalla stampa.
//
// I mesi vanno da 1 (gennaio) a 12 (dicembre). Le piante hanno `floweringMonths`
// (elenco di mesi, anche a cavallo d'anno); se manca, la fioritura è "non specificata".

import { MONTH_NAMES } from "./labels.js";

/** "agosto" oppure "maggio–agosto". */
export const periodLabel = ({ from, to }) => (from === to ? MONTH_NAMES[from - 1] : `${MONTH_NAMES[from - 1]}–${MONTH_NAMES[to - 1]}`);

/** Mesi compresi tra `from` e `to`, anche a cavallo d'anno: (11, 2) -> [11, 12, 1, 2]. */
export function monthsInRange(from, to = from) {
  const out = [];
  for (let m = from; out.length < 12; m = (m % 12) + 1) {
    out.push(m);
    if (m === to) break;
  }
  return out;
}

/** Stato di una pianta nei mesi scelti: "bloom" | "off" | "unknown" (mesi non disponibili). */
export function bloomStatus(months, selected) {
  if (!Array.isArray(months) || !months.length) return "unknown";
  return selected.some((m) => months.includes(m)) ? "bloom" : "off";
}

/** Chiave che raggruppa gli esemplari della stessa pianta (specie + varietà). */
export const plantKey = (pl) => `${pl.plantId ?? pl.cropId ?? pl.name}|${pl.variety ?? ""}`;

/** Piante di tutte le aiuole (esclusi i terrazzi senza piante). */
export const allPlants = (beds = []) => beds.flatMap((b) => b.plants ?? []);

/**
 * Riepilogo del periodo scelto.
 * monthsOf(pianta) restituisce i mesi di fioritura oppure undefined.
 */
export function bloomSummary(beds, selected, monthsOf) {
  const groups = new Map();
  const bloomingIds = new Set();
  let total = 0;
  let unknown = 0;
  for (const pl of allPlants(beds)) {
    const months = monthsOf(pl);
    const status = bloomStatus(months, selected);
    if (status === "unknown") unknown++;
    if (status === "bloom") {
      total++;
      bloomingIds.add(pl.id);
      const key = plantKey(pl);
      const g = groups.get(key) ?? { key, name: pl.name, variety: pl.variety ?? null, count: 0, months };
      g.count++;
      groups.set(key, g);
    }
  }
  const list = [...groups.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "it"));
  return { plants: total, varieties: list.length, list, unknown, bloomingIds };
}

/** Per ogni mese: quante piante e quante varietà fioriscono. */
export function coverageByMonth(beds, monthsOf) {
  const rows = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, plants: 0, varieties: new Set() }));
  for (const pl of allPlants(beds)) {
    const months = monthsOf(pl);
    if (!Array.isArray(months)) continue;
    for (const m of months) {
      rows[m - 1].plants++;
      rows[m - 1].varieties.add(plantKey(pl));
    }
  }
  return rows.map((r) => ({ month: r.month, plants: r.plants, varieties: r.varieties.size }));
}

/** Mesi con più fioriture (a parità tutti quelli al massimo); vuoto se nessuna fioritura. */
export function peakMonths(coverage) {
  const max = Math.max(0, ...coverage.map((c) => c.plants));
  return max ? coverage.filter((c) => c.plants === max).map((c) => c.month) : [];
}
