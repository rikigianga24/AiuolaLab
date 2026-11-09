import assert from "node:assert/strict";
import { test } from "node:test";
import { speciesFor, tonesFrom } from "../src/lib/tempera.js";
import { flowerHexes } from "../src/lib/plantIcons.js";

test("tempera: specie riconosciute dal nome", () => {
  assert.equal(speciesFor("Rosa inglese 'Gertrude Jekyll'"), "rosa_inglese");
  assert.equal(speciesFor("Rosa rampicante 'New Dawn'"), "rosa_rampicante");
  assert.equal(speciesFor("Rosa rugosa"), "rosa_botanica");
  assert.equal(speciesFor("Rosa bourbon"), "rosa_antica");
  assert.equal(speciesFor("Echinacea 'Magnus'"), "echinacea");
  assert.equal(speciesFor("Lupino"), "lupino");
  assert.equal(speciesFor("Photinia 'Red Robin'"), "photinia");
  assert.equal(speciesFor("Girasole"), "girasole");
  assert.equal(speciesFor("Zucca"), "zucca");
  assert.equal(speciesFor("Zucchina"), null);
  assert.equal(speciesFor("Cipolla rossa di Tropea"), "cipolla");
  // il geranio perenne (Geranium) non è il geranio da balcone
  assert.equal(speciesFor("Geranio perenne Rozanne"), null);
  assert.equal(speciesFor("Geranio"), "geranio");
  assert.equal(speciesFor("Lavanda"), null);
});

test("tempera: tonalità dalle descrizioni del catalogo", () => {
  assert.deepEqual(tonesFrom("David Austin 1986 · rosa intenso · profumo fortissimo di rosa antica"), ["#d9578a"]);
  assert.deepEqual(tonesFrom("albicocca e rosa · profumo fruttato"), ["#f3a46c"]);
  assert.deepEqual(tonesFrom("profumo di limone"), []);
  assert.deepEqual(tonesFrom("cremisi scuro vellutato"), ["#6e1426"]);
  // le tonalità valgono solo per le piante con fiori colorati
  assert.deepEqual(flowerHexes({ flowerColors: ["pink"], description: "rosa tenue a coppa" }), ["#f5cdd6"]);
  assert.deepEqual(flowerHexes({ flowerColors: ["green"], description: "giallo oro" }), []);
  assert.deepEqual(flowerHexes({ flowerColors: ["red"] }), ["#d64545"]);
});
