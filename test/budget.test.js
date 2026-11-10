import assert from "node:assert/strict";
import { test } from "node:test";
import { CATALOG } from "../server/plants/catalog/index.js";
import { CROPS, cropAsPlant } from "../src/lib/crops.js";
import { PRICE_TIERS, bedMaterials, priceTier, projectBudget } from "../src/lib/budget.js";

const square = (side) => [
  { x: 0, y: 0 },
  { x: side, y: 0 },
  { x: side, y: side },
  { x: 0, y: side },
];

test("prezzi: ogni pianta del catalogo ha una fascia valida", () => {
  const count = { 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const p of CATALOG) count[priceTier(p)] += 1;
  for (const t of [1, 2, 3, 4]) assert.ok(count[t] > 0, `nessuna pianta in fascia ${t}`);
  assert.equal(priceTier(cropAsPlant(CROPS[0])), 1);
});

test("prezzi: fasce sensate per alcune piante note", () => {
  const tier = (sci, group) => priceTier({ scientificName: sci, group });
  assert.equal(tier("Petunia x hybrida", "balcone"), 1);
  assert.equal(tier("Lavandula angustifolia", "arbusti"), 1);
  assert.equal(tier("Echinacea purpurea", "perenni"), 2);
  assert.equal(tier("Rosa 'The Fairy'", "rose"), 3);
  assert.equal(tier("Olea europaea", "arbusti"), 4);
  assert.equal(tier("Paeonia suffruticosa", "perenni"), 4);
  assert.equal(tier("Paeonia lactiflora 'Sarah Bernhardt'", "perenni"), 3);
  // esemplari piantati prima dei prezzi: la fascia si ricava dai loro dati
  assert.equal(priceTier({ name: "Olivo", scientificName: "Olea europaea", group: "arbusti" }), 4);
  assert.equal(priceTier({ priceTier: 2, scientificName: "Olea europaea" }), 2);
});

test("budget: sacchi di terriccio e pacciamatura dai volumi", () => {
  // 2 × 2 m = 4 m²: 10 cm di terriccio = 400 L = 8 sacchi da 50 L
  const bed = { id: "a", name: "A", kind: "bed", points: square(2), surface: "bark", plants: [] };
  const m = bedMaterials(bed, { soilCm: 10 });
  assert.equal(m.soil.litres, 400);
  assert.equal(m.soil.bags, 8);
  // 5 cm di corteccia = 200 L = 4 sacchi
  assert.equal(m.mulch.qty, 4);
  // telo: 4 m² + 15% = 4,6 m² → 1 rotolo da 12 m²
  const nylon = bedMaterials({ ...bed, surface: "nylon" });
  assert.equal(nylon.mulch.qty, 1);
  assert.equal(nylon.mulch.unit, "rotoli");
  assert.equal(bedMaterials({ ...bed, surface: "soil" }).mulch, null);
});

test("budget: totale del progetto", () => {
  const plant = (n, tier) => Array.from({ length: n }, (_, i) => ({ id: `${tier}-${i}`, plantId: `p${tier}`, name: `P${tier}`, priceTier: tier }));
  const project = {
    budget: { soilCm: 10 },
    beds: [
      { id: "a", name: "A", kind: "bed", points: square(2), surface: "bark", plants: [...plant(3, 1), ...plant(2, 3)] },
      { id: "f", name: "Pavimento", kind: "floor", points: square(5), plants: [] },
    ],
  };
  const b = projectBudget(project);
  assert.equal(b.totals.plants, 3 * PRICE_TIERS[1].eur + 2 * PRICE_TIERS[3].eur);
  assert.equal(b.totals.soil, 8 * 8);
  assert.equal(b.totals.mulch, 4 * 7);
  assert.equal(b.totals.all, b.totals.plants + b.totals.soil + b.totals.mulch);
  assert.equal(projectBudget({ ...project, budget: { soilCm: 0 } }).totals.soil, 0);
});
