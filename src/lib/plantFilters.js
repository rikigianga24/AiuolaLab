// Filtri del catalogo applicati in locale alle preferite.
export function matchesLocal(plant, f) {
  const q = (f.q ?? "").trim().toLowerCase();
  if (q && !`${plant.commonName} ${plant.scientificName}`.toLowerCase().includes(q)) return false;
  if (f.sunlight && !plant.sunlight?.includes(f.sunlight)) return false;
  if (f.watering && plant.watering !== f.watering) return false;
  if (f.ph && !plant.soil?.ph?.includes(f.ph)) return false;
  if (f.color && !plant.flowerColors?.includes(f.color)) return false;
  if (f.season && !plant.floweringSeasons?.includes(f.season)) return false;
  return true;
}
