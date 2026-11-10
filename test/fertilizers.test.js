import assert from "node:assert/strict";
import { test } from "node:test";
import { CATALOG } from "../server/plants/catalog/index.js";
import { CROPS, cropAsPlant } from "../src/lib/crops.js";
import { FERTILIZERS, fertilizerPlan, monthsText, npkText } from "../src/lib/fertilizers.js";
import { FEEDING_CALENDAR } from "../src/lib/guide.js";

const plan = (sci, group) => fertilizerPlan({ scientificName: sci, group });

test("concimi: ogni pianta e ogni ortaggio ha un piano valido", () => {
  for (const p of [...CATALOG, ...CROPS.map((c) => cropAsPlant(c))]) {
    const f = fertilizerPlan(p);
    assert.ok(FERTILIZERS[f.main], `${p.scientificName}: ${f.main}`);
    assert.ok(f.months.length && f.months.every((m) => m >= 1 && m <= 12), p.scientificName);
    for (const x of f.extra) assert.ok(FERTILIZERS[x.id], `${p.scientificName}: ${x.id}`);
  }
  for (const row of FEEDING_CALENDAR) for (const id of Object.values(row.months)) assert.ok(FERTILIZERS[id], id);
});

test("concimi: piante tipiche", () => {
  assert.equal(plan("Rosa 'The Fairy'", "rose").main, "rose");
  assert.equal(plan("Rhododendron 'Nova Zembla'", "arbusti").main, "acidofile");
  assert.equal(plan("Hydrangea macrophylla", "arbusti").main, "acidofile");
  assert.equal(plan("Hydrangea paniculata 'Limelight'", "arbusti").main, "fioritura");
  assert.equal(plan("Lavandula angustifolia", "arbusti").main, "poco");
  assert.equal(plan("Wisteria sinensis", "rampicanti").main, "potassio");
  assert.equal(plan("Citrus x limon", "balcone").main, "agrumi");
  assert.equal(plan("Buxus sempervirens", "arbusti").main, "azoto");
  assert.equal(plan("Ocimum basilicum", "aromatiche").main, "foglia");
  assert.equal(plan("Euphorbia hypericifolia 'Diamond Frost'", "balcone").main, "fioritura");
  assert.equal(fertilizerPlan(cropAsPlant(CROPS.find((c) => c.id === "pomodoro"))).main, "frutto");
  assert.equal(fertilizerPlan(cropAsPlant(CROPS.find((c) => c.id === "fagiolo"))).main, "fosforo");
  // esemplare già piantato (ha cropId ma non scientificName del catalogo)
  assert.equal(fertilizerPlan({ cropId: "lattuga", name: "Lattuga" }).main, "foglia");
});

test("concimi: testi", () => {
  assert.equal(npkText(FERTILIZERS.rose), "NPK 7-6-12");
  assert.equal(monthsText([3, 4, 6]), "mar–apr, giu");
});
