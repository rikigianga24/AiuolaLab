import assert from "node:assert/strict";
import { test } from "node:test";
import { CATALOG, CATALOG_BY_ID, CATALOG_ERRORS, parseRow } from "../server/plants/catalog/index.js";
import { CROPS, CROP_BY_ID, cropAsPlant } from "../src/lib/crops.js";
import { matchesFilters } from "../server/plants/normalize.js";
import { plantInfo } from "../src/lib/plantInfo.js";

test("catalogo: tutte le righe sono valide", () => {
  assert.deepEqual(CATALOG_ERRORS, []);
  assert.ok(CATALOG.length >= 900, `solo ${CATALOG.length} piante`);
});

test("catalogo: schede complete e coerenti", () => {
  for (const p of CATALOG) {
    assert.ok(p.commonName && !p.commonName.includes("~"), p.scientificName);
    assert.ok(p.sunlight.length, `${p.scientificName}: esposizione`);
    assert.ok(p.heightCm && p.spreadCm && p.hardiness, `${p.scientificName}: misure`);
    assert.ok(p.hardiness.min >= 1 && p.hardiness.max <= 13, `${p.scientificName}: zone`);
  }
});

test("catalogo: gli id dei progetti salvati con il vecchio catalogo esistono ancora", () => {
  for (const id of ["lavandula-angustifolia", "rosa-the-fairy", "rhododendron-hybrid", "digitalis-purpurea", "verbena-bonariensis"]) {
    assert.ok(CATALOG_BY_ID.has(id), id);
  }
});

test("catalogo: formato delle righe", () => {
  const { plant, errors } = parseRow("Echinacea purpurea 'Magnus'|Echinacea ~|P|SP|2|n|mc|80-100|45|P|ea|3-9||nota", "perenni");
  assert.deepEqual(errors, []);
  assert.equal(plant.commonName, "Echinacea 'Magnus'");
  assert.deepEqual(plant.sunlight, ["full_sun", "part_shade"]);
  assert.deepEqual(plant.spreadCm, { min: 45, max: 45 });
  assert.equal(plant.description, "nota");
  assert.ok(parseRow("X|Y|Q|S|2|n|m|1-2|1-2|B|e|5-9|", "perenni").errors.length > 0);
});

test("catalogo: ricerca per nome, nota e tipo", () => {
  const roses = CATALOG.filter((p) => matchesFilters(p, { group: "rose" }));
  assert.ok(roses.length >= 100);
  assert.ok(CATALOG.some((p) => matchesFilters(p, { q: "jude the obscure" })));
  assert.ok(CATALOG.some((p) => matchesFilters(p, { q: "banksiae" })));
  assert.ok(CATALOG.filter((p) => matchesFilters(p, { q: "david austin" })).length >= 50);
});

test("sicurezza: generi tossici del catalogo esteso", () => {
  const delph = CATALOG_BY_ID.get("delphinium-black-knight");
  assert.equal(plantInfo(delph).tox.level, "high");
  assert.ok(plantInfo(CATALOG_BY_ID.get("lupinus-the-governor")).tox);
  // nessuna confusione tra nomi simili
  assert.equal(plantInfo(CATALOG_BY_ID.get("verbascum-thapsus")).tox, null);
  assert.equal(plantInfo(CATALOG_BY_ID.get("lavandula-angustifolia-rosea")).wildlife.some((w) => /afidi/.test(w.who)), false);
  assert.equal(plantInfo(CATALOG_BY_ID.get("ipomoea-batatas-marguerite")).tox, null);
});

test("orto: varietà e riferimenti tra ortaggi", () => {
  const ids = new Set(CROPS.map((c) => c.id));
  for (const c of CROPS) for (const other of [...c.good, ...c.bad]) assert.ok(ids.has(other), `${c.id} -> ${other}`);
  assert.ok(CROPS.reduce((n, c) => n + c.varieties.length, 0) >= 120);
  const sm = cropAsPlant(CROP_BY_ID.pomodoro, "San Marzano");
  assert.equal(sm.commonName, "Pomodoro 'San Marzano'");
  assert.equal(sm.cropId, "pomodoro");
  assert.equal(cropAsPlant(CROP_BY_ID.pomodoro).commonName, "Pomodoro");
});
