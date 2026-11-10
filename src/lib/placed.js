import { newId } from "./ids.js";
import { plantColor, plantSpreadM } from "./labels.js";
import { flowerHexes, iconTypeFor } from "./plantIcons.js";
import { priceTier } from "./budget.js";

// Pianta del catalogo -> esemplare piantato nell'aiuola (coordinate in metri).
export function toPlaced(plant, point, overrides = {}) {
  return {
    id: newId(),
    plantId: plant.id ?? null,
    cropId: plant.cropId ?? null,
    variety: plant.variety ?? null,
    name: plant.commonName ?? plant.name,
    scientificName: plant.scientificName ?? null,
    spreadM: plantSpreadM(plant),
    heightCm: plant.heightCm?.max ?? null,
    watering: plant.watering ?? null,
    color: plantColor(plant),
    icon: iconTypeFor(plant),
    colors: plant.iconColors ?? flowerHexes(plant),
    // dati per la previsione di crescita
    group: plant.group ?? null,
    cycle: plant.cycle ?? null,
    sunlight: plant.sunlight ?? null,
    seasons: plant.floweringSeasons ?? null,
    flowerCodes: plant.flowerColors ?? null,
    soilPh: plant.soil?.ph ?? null,
    hardinessMin: Number.isFinite(Number.parseFloat(plant.hardiness?.min)) ? Number.parseFloat(plant.hardiness.min) : null,
    evergreen: plant.evergreen ?? null,
    priceTier: priceTier(plant),
    x: point.x,
    y: point.y,
    ...overrides,
  };
}
