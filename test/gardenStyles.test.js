import assert from "node:assert/strict";
import { test } from "node:test";
import { GARDEN_STYLES, STYLE_IDS, stylesFor } from "../src/lib/gardenStyles.js";
import { CATALOG } from "../server/plants/catalog/index.js";
import { matchesFilters } from "../server/plants/normalize.js";
import { matchesLocal } from "../src/lib/plantFilters.js";

const find = (sci) => CATALOG.find((p) => p.scientificName.startsWith(sci));

test("stili: ogni stile ha i testi per chi parte da zero", () => {
  assert.equal(GARDEN_STYLES.length, 11);
  for (const s of GARDEN_STYLES) {
    for (const k of ["name", "tagline", "what", "origin", "ideal", "maintenance"]) assert.ok(s[k], `${s.id}: manca ${k}`);
    assert.ok(s.where.length >= 3 && s.features.length >= 4 && s.plants.length >= 8, s.id);
  }
});

test("stili: le piante finiscono negli stili giusti, anche in più di uno", () => {
  const lav = stylesFor(find("Lavandula angustifolia"));
  for (const id of ["cottage", "mediterraneo", "impollinatori"]) assert.ok(lav.includes(id), id);
  assert.ok(stylesFor(find("Buxus sempervirens")).includes("italiano"));
  assert.ok(stylesFor(find("Hosta")).includes("ombra"));
  assert.ok(stylesFor(find("Hosta")).includes("giapponese"));
  assert.ok(stylesFor(find("Echinacea purpurea")).includes("naturalistico"));
  assert.ok(stylesFor(find("Pennisetum")).includes("moderno"));
  assert.ok(stylesFor(find("Sedum")).includes("roccioso"));
  assert.ok(stylesFor(find("Tulipa")).includes("francese"));
  // quasi tutto il catalogo ha almeno uno stile
  const none = CATALOG.filter((p) => !stylesFor(p).length).length;
  assert.ok(none / CATALOG.length < 0.02, `${none} piante senza stile`);
});

test("stili: filtro del catalogo (server) e delle preferite (browser)", () => {
  const jap = CATALOG.filter((p) => matchesFilters(p, { style: "giapponese" }));
  assert.ok(jap.length > 30 && jap.every((p) => stylesFor(p).includes("giapponese")));
  assert.equal(matchesLocal(find("Lavandula angustifolia"), { style: "ombra" }), false);
  assert.equal(matchesLocal(find("Lavandula angustifolia"), { style: "mediterraneo" }), true);
  assert.ok(STYLE_IDS.includes("cottage"));
});
