// Spazio disponibile in un'aiuola: serve a non far proporre al consulente IA
// più piante di quante ne stiano, ragionando sulla misura che avranno a 5 anni.
const circleArea = (spreadCm) => Math.PI * (spreadCm / 200) ** 2; // m²

/** Misura (cm) con cui calcolare lo spazio: a 5 anni se nota, altrimenti la distanza di impianto. */
export const planSpreadCm = (p) => p.spread_5y_cm ?? p.spacing_cm ?? 40;

/**
 * Riduce le quantità finché le chiome a 5 anni occupano al massimo `limit` dell'area.
 * Toglie un esemplare alla volta dalla specie più numerosa (a parità, la più grande).
 * Restituisce { plants, reduced } senza modificare l'originale.
 */
export function fitQuantities(plants, areaM2, limit = 0.85) {
  const list = plants.map((p) => ({ ...p }));
  const total = () => list.reduce((s, p) => s + p.quantity * circleArea(planSpreadCm(p)), 0);
  let reduced = false;
  while (total() > areaM2 * limit) {
    const target = list
      .filter((p) => p.quantity > 1)
      .sort((a, b) => b.quantity - a.quantity || planSpreadCm(b) - planSpreadCm(a))[0];
    if (!target) break;
    target.quantity -= 1;
    reduced = true;
  }
  return { plants: list, reduced };
}
