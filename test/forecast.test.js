import assert from "node:assert/strict";
import { test } from "node:test";
import { growthProfile, sizeAt } from "../src/lib/growth.js";
import { analyzeBed } from "../src/lib/forecast.js";

const rect = (w, h) => [
  { x: 0, y: 0 },
  { x: w, y: 0 },
  { x: w, y: h },
  { x: 0, y: h },
];
const lav = (id, x, y) => ({ id, name: "Lavanda", scientificName: "Lavandula angustifolia", group: "aromatiche", cycle: "perennial", x, y, spreadM: 0.6, heightCm: 60, icon: "spike", sunlight: ["full_sun"], watering: "minimum", seasons: ["summer"], flowerCodes: ["purple"] });

test("crescita: profili da gruppo ed eccezioni", () => {
  assert.equal(growthProfile(lav("a", 0, 0)).lifespan, 8);
  assert.equal(growthProfile({ name: "Menta", scientificName: "Mentha spicata", group: "aromatiche" }).roots, "invasive");
  assert.equal(growthProfile({ name: "Pomodoro", cropId: "pomodoro" }).habit, "annuale");
  assert.equal(growthProfile({ name: "Asparago", cropId: "asparago" }).habit, "cespo");
  assert.equal(growthProfile({ name: "Echinacea", scientificName: "Echinacea purpurea", group: "perenni" }).lifespan, 4);
  // piante salvate senza gruppo: si deduce dall'icona
  assert.equal(growthProfile({ name: "Siepe", icon: "shrub" }).habit, "arbusto");
});

test("crescita: misure nel tempo", () => {
  const p = lav("a", 0, 0);
  const s0 = sizeAt(p, 0), s1 = sizeAt(p, 1), s3 = sizeAt(p, 3);
  assert.ok(s0.spread < s1.spread && s1.spread <= s3.spread);
  assert.ok(Math.abs(s3.spread - 0.6) < 1e-9, "adulta dopo gli anni di maturità");
  assert.equal(sizeAt(p, 9).alive, false, "la lavanda dopo 8 anni va sostituita");
  const ann = { name: "Tagete", group: "annuali", cycle: "annual", spreadM: 0.3, heightCm: 30 };
  assert.equal(sizeAt(ann, 3).spread, 0.3, "le annuali si riseminano: sempre adulte");
  const menta = { name: "Menta", scientificName: "Mentha", spreadM: 0.5 };
  assert.ok(sizeAt(menta, 5).spread > 0.5 * 1.5, "le invasive continuano ad allargarsi");
});

test("previsione: due lavande troppo vicine si sovrappongono", () => {
  const bed = { points: rect(2, 1), conditions: { sunlight: "full_sun" }, plants: [lav("a", 0.8, 0.5), lav("b", 1.1, 0.5)] };
  const r = analyzeBed(bed);
  assert.equal(r.ok, true);
  assert.ok(r.current.tooClose.length === 1, "segnalate come troppo vicine già nel progetto");
  assert.ok(r.years[3].overlaps.some((o) => o.severe), "a 3 anni sovrapposizione forte");
  assert.ok(r.problems.some((t) => /troppo vicine/.test(t)));
  assert.ok(r.years[3].coverage > r.years[1].coverage - 1);
});

test("previsione: pianta alta a sud fa ombra a una che vuole sole", () => {
  // nord in alto: il sud è verso il basso (y più grande)
  const tall = { id: "t", name: "Lauroceraso", scientificName: "Prunus laurocerasus", group: "arbusti", x: 1, y: 1.6, spreadM: 1, heightCm: 200, icon: "shrub", sunlight: ["full_sun", "part_shade"] };
  const small = { ...lav("s", 1, 0.6) };
  const bed = { points: rect(2, 2.2), conditions: { sunlight: "full_sun" }, plants: [tall, small] };
  const north = analyzeBed(bed, { northDeg: 0 });
  assert.ok(north.years[5].shade.some((s) => s.small.id === "s"), "con il nord in alto il lauroceraso è a sud: fa ombra");
  // girando il disegno (nord in basso) l'arbusto finisce a nord: niente ombra
  const south = analyzeBed(bed, { northDeg: 180 });
  assert.equal(south.years[5].shade.length, 0);
  assert.ok(north.suggestions.alternatives.some((a) => a.forName === "Lavanda" && a.filters.sunlight === "part_shade"));
});

test("previsione: chi guarda vede le piante basse davanti", () => {
  const tall = { id: "t", name: "Miscanthus", scientificName: "Miscanthus sinensis", group: "graminacee", x: 1, y: 1.6, spreadM: 0.8, heightCm: 150, icon: "grass" };
  const low = { id: "l", name: "Timo", scientificName: "Thymus serpyllum", group: "aromatiche", x: 1, y: 0.5, spreadM: 0.4, heightCm: 10, icon: "groundcover" };
  const bed = { points: rect(2, 2.2), plants: [tall, low] };
  // occhi a sud (in basso): il miscanthus è davanti al timo e lo nasconde
  const front = analyzeBed(bed, { viewer: { x: 1, y: 3 } });
  const back = analyzeBed(bed, { viewer: { x: 1, y: -1 } });
  const layer = (r) => r.scores.why.aestheticNow.find((p) => p.key === "altezze").value;
  assert.ok(layer(front) < layer(back));
});

test("previsione: aiuola vuota", () => {
  assert.equal(analyzeBed({ points: rect(1, 1), plants: [] }).ok, false);
});

test("previsione: voti tra 0 e 10 e radici invasive", () => {
  const menta = { id: "m", name: "Menta", scientificName: "Mentha spicata", group: "aromatiche", x: 0.5, y: 0.5, spreadM: 0.5, heightCm: 40, icon: "leafy" };
  const r = analyzeBed({ points: rect(2, 1), plants: [menta, lav("a", 1.4, 0.5)] });
  for (const k of ["aestheticNow", "aesthetic3", "aesthetic5", "maintenance", "overcrowding"]) assert.ok(r.scores[k] >= 0 && r.scores[k] <= 10, k);
  assert.ok(r.suggestions.reduce.some((s) => s.name === "Menta"));
  assert.ok(r.maintenance[3].some((t) => /radici/.test(t)));
});
