import assert from "node:assert/strict";
import { test } from "node:test";
import {
  matchesFilters,
  normalizeColors,
  normalizeSeasons,
  normalizeSoil,
  normalizeSunlight,
  normalizeWatering,
  parseDimensions,
} from "../server/plants/normalize.js";
import { PerenualProvider } from "../server/plants/perenual.js";

test("esposizione", () => {
  assert.deepEqual(normalizeSunlight(["full sun", "part shade"]), ["full_sun", "part_shade"]);
  assert.deepEqual(normalizeSunlight("sun-part_shade"), ["full_sun", "part_shade"]);
  assert.deepEqual(normalizeSunlight(["part sun/part shade"]), ["part_shade"]);
  assert.deepEqual(normalizeSunlight(["Full shade", "filtered shade"]), ["part_shade", "full_shade"]);
});

test("irrigazione", () => {
  assert.equal(normalizeWatering("Frequent"), "frequent");
  assert.equal(normalizeWatering("Average"), "average");
  assert.equal(normalizeWatering("None"), "minimum");
  assert.equal(normalizeWatering(undefined), null);
});

test("terreno", () => {
  assert.deepEqual(normalizeSoil(["Sandy", "Loamy", "Acidic", "Well-drained"]), { ph: ["acid"], texture: ["sandy", "loamy"] });
  assert.deepEqual(normalizeSoil(["Chalky"]), { ph: ["alkaline"], texture: ["chalky"] });
});

test("colori e stagioni", () => {
  assert.deepEqual(normalizeColors("Purple, Blue"), ["purple", "blue"]);
  assert.deepEqual(normalizeColors(["Lavender", "white"]), ["purple", "white"]);
  assert.deepEqual(normalizeSeasons("Spring and Fall"), ["spring", "autumn"]);
});

test("dimensioni", () => {
  assert.deepEqual(parseDimensions({ dimension: "1.00 to 2.00 feet" }).height, { min: 30, max: 61 });
  const d = parseDimensions({
    dimensions: [
      { type: "Height", min_value: 1, max_value: 3, unit: "feet" },
      { type: "Spread", min_value: 50, max_value: 70, unit: "cm" },
    ],
  });
  assert.deepEqual(d, { height: { min: 30, max: 91 }, spread: { min: 50, max: 70 } });
});

test("scheda Perenual normalizzata", () => {
  const p = new PerenualProvider({ apiKey: "x", baseUrl: "https://example.test/api/v2/" });
  const plant = p.normalize(
    {
      id: 2018,
      common_name: "Lavender",
      scientific_name: ["Lavandula angustifolia"],
      other_name: ["English lavender"],
      cycle: "Perennial",
      watering: "Minimum",
      sunlight: ["full sun"],
      soil: ["Sandy", "Alkaline"],
      dimensions: [{ type: "Height", min_value: 1, max_value: 2, unit: "feet" }],
      flowering_season: "Summer",
      flower_color: "Purple",
      hardiness: { min: "5", max: "9" },
      default_image: { thumbnail: "https://img/t.jpg", regular_url: "https://perenual.com/upgrade_access.jpg" },
    },
    true,
  );
  assert.equal(plant.id, "perenual:2018");
  assert.equal(plant.scientificName, "Lavandula angustifolia");
  assert.deepEqual(plant.sunlight, ["full_sun"]);
  assert.deepEqual(plant.soil.ph, ["alkaline"]);
  assert.deepEqual(plant.flowerColors, ["purple"]);
  assert.deepEqual(plant.hardiness, { min: 5, max: 9 });
  assert.deepEqual(plant.image, { thumb: "https://img/t.jpg", regular: null });
  assert.equal(p.baseUrl, "https://example.test/api/v2");
});

test("filtri: i dati mancanti non escludono", () => {
  const plant = { commonName: "Rosa", scientificName: "Rosa x", sunlight: [], watering: null, soil: { ph: [], texture: [] }, flowerColors: ["pink"], floweringSeasons: [] };
  assert.equal(matchesFilters(plant, { sunlight: "full_sun", ph: "acid" }), true);
  assert.equal(matchesFilters(plant, { color: "blue" }), false);
  assert.equal(matchesFilters(plant, { q: "ros" }), true);
});
