// Piante "mi piace": scelte nella pagina Scopri, poi usate come filtro nel
// catalogo dell'aiuola. Stanno nelle impostazioni (browser e, con l'account,
// server) insieme a una copia ridotta della scheda, così il filtro funziona
// anche senza rifare la ricerca.
import { useCallback, useMemo } from "react";
import { useSession } from "./session";

const MAX = 300;

function slim(plant) {
  // eslint-disable-next-line no-unused-vars
  const { description, otherNames, detailsLoaded, ...rest } = plant;
  return rest;
}

export const favPlant = (plant) => ({ key: String(plant.id), kind: "plant", plant: slim(plant) });
export const favCrop = (crop) => ({ key: `crop:${crop.id}`, kind: "crop", cropId: crop.id });

export function useFavorites() {
  const { settings, updateSettings } = useSession();
  const list = useMemo(() => settings.favorites ?? [], [settings.favorites]);
  const keys = useMemo(() => new Set(list.map((f) => f.key)), [list]);

  const isFav = useCallback((key) => keys.has(key), [keys]);
  const toggle = useCallback(
    (entry) => {
      const next = keys.has(entry.key) ? list.filter((f) => f.key !== entry.key) : [{ ...entry, at: new Date().toISOString() }, ...list].slice(0, MAX);
      updateSettings({ favorites: next });
    },
    [keys, list, updateSettings],
  );

  const plants = useMemo(() => list.filter((f) => f.kind === "plant" && f.plant).map((f) => f.plant), [list]);
  const cropIds = useMemo(() => new Set(list.filter((f) => f.kind === "crop").map((f) => f.cropId)), [list]);
  return { list, count: list.length, plants, cropIds, isFav, toggle };
}
