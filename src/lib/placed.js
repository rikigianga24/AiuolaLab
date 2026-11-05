import { newId } from "./ids.js";
import { plantColor, plantSpreadM } from "./labels.js";
import { flowerHexes, iconTypeFor } from "./plantIcons.js";

// Pianta del catalogo -> esemplare piantato nell'aiuola (coordinate in metri).
export function toPlaced(plant, point, overrides = {}) {
  return {
    id: newId(),
    plantId: plant.id ?? null,
    cropId: plant.cropId ?? null,
    name: plant.commonName ?? plant.name,
    scientificName: plant.scientificName ?? null,
    spreadM: plantSpreadM(plant),
    heightCm: plant.heightCm?.max ?? null,
    watering: plant.watering ?? null,
    color: plantColor(plant),
    icon: iconTypeFor(plant),
    colors: plant.iconColors ?? flowerHexes(plant),
    x: point.x,
    y: point.y,
    ...overrides,
  };
}
