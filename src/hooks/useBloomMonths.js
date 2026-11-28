import { useEffect, useMemo, useState } from "react";
import { getPlant } from "../lib/api";

// Mesi di fioritura delle piante già piazzate. Le piante aggiunte di recente li
// portano con sé (floweringMonths); per quelle di progetti più vecchi si chiede
// la scheda al catalogo, una sola volta, e si tiene il risultato in memoria
// (il progetto salvato non viene modificato).
const cache = new Map(); // plantId -> mesi | null (non disponibili)
const inflight = new Set();

/**
 * Restituisce monthsOf(pianta) -> mesi | undefined, più `loading`.
 * Con `enabled` falso non fa nessuna richiesta.
 */
export function useBloomMonths(beds, enabled = true) {
  const [version, setVersion] = useState(0);

  const missingIds = () => {
    const ids = new Set();
    for (const b of beds ?? [])
      for (const pl of b.plants ?? []) if (!Array.isArray(pl.floweringMonths) && pl.plantId && !cache.has(pl.plantId)) ids.add(pl.plantId);
    return ids;
  };

  useEffect(() => {
    if (!enabled) return undefined;
    const todo = [...missingIds()].filter((id) => !inflight.has(id));
    if (!todo.length) return undefined;
    let alive = true;
    for (const id of todo) inflight.add(id);
    Promise.all(
      todo.map((id) =>
        getPlant(id)
          .then((p) => cache.set(id, Array.isArray(p?.floweringMonths) ? p.floweringMonths : null))
          .catch(() => cache.set(id, null))
          .finally(() => inflight.delete(id)),
      ),
    ).then(() => alive && setVersion((v) => v + 1));
    return () => {
      alive = false;
    };
    // missingIds dipende solo da beds
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beds, enabled]);

  // cambia identità solo quando arrivano nuove schede: così i calcoli a valle restano in cache
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const monthsOf = useMemo(() => (pl) => (Array.isArray(pl.floweringMonths) ? pl.floweringMonths : (cache.get(pl.plantId) ?? undefined)), [version]);
  const loading = enabled && missingIds().size > 0;
  return { monthsOf, loading };
}
