import assert from "node:assert/strict";
import { test } from "node:test";
import { generateTasks } from "../src/lib/care.js";
import { boarRisk, plantInfo } from "../src/lib/plantInfo.js";

test("tossicità e fauna", () => {
  const ortensia = plantInfo({ commonName: "Ortensia", scientificName: "Hydrangea macrophylla" });
  assert.equal(ortensia.tox.level, "medium");
  assert.ok(ortensia.tox.to.includes("cat"));
  assert.equal(ortensia.origin.native, false);

  const emero = plantInfo({ commonName: "Emerocallide", scientificName: "Hemerocallis fulva" });
  assert.deepEqual(emero.tox.to, ["cat"]);
  assert.equal(emero.tox.level, "high");

  const patata = plantInfo({ name: "Patata", scientificName: "Solanum tuberosum" });
  assert.ok(patata.wildlife.some((w) => /cinghiali/.test(w.who)));
  assert.ok(boarRisk({ name: "Mais" }));
  assert.ok(!boarRisk({ name: "Cipolla" }));

  assert.equal(plantInfo({ name: "Rosmarino" }).origin.native, true);
  assert.equal(plantInfo({ name: "Camelia" }).tox, null);
});

test("specie invasive e zona", () => {
  assert.match(plantInfo({ scientificName: "Pennisetum setaceum" }).invasive, /lista UE/);
  const agap = plantInfo({ name: "Agapanto", hardiness: { min: 8, max: 11 } }, { climate: "nord" });
  assert.ok(agap.notes.some((n) => /gelo/.test(n)));
  const acid = plantInfo({ name: "X", soil: { ph: ["acid"] } }, { climate: "sud" });
  assert.ok(acid.notes.some((n) => /acido/.test(n)));
  assert.equal(plantInfo({ name: "X", soil: { ph: ["acid"] } }, { climate: "nord" }).notes.length, 0);
});

test("calendario: difesa dai cinghiali per le patate", () => {
  const sq = [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 2 }, { x: 0, y: 2 }];
  const tasks = generateTasks([{ type: "vegetable", beds: [{ id: "o", name: "Orto", kind: "veg", points: sq, plants: [{ id: "1", name: "Patata", cropId: "patata", x: 1, y: 1, spreadM: 0.3 }] }] }], { years: [2027] });
  const boar = tasks.find((t) => /cinghiali/.test(t.title));
  assert.ok(boar);
  assert.equal(boar.start, "2027-05-01");
});
