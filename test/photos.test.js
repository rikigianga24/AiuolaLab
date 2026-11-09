import assert from "node:assert/strict";
import { test } from "node:test";
import { cleanScientificName, getPlantPhotos, toPhoto } from "../server/plants/photos.js";
import { hardinessInfo, hardinessMinC } from "../src/lib/labels.js";
import { matchesLocal } from "../src/lib/plantFilters.js";

test("rusticità: zona USDA -> temperatura minima", () => {
  assert.equal(hardinessMinC(7), -18);
  assert.equal(hardinessMinC("8a"), -12);
  assert.equal(hardinessMinC(null), null);
  assert.equal(hardinessInfo({ min: 5 }).text, "Resiste fino a −29 °C");
  assert.equal(hardinessInfo({ min: 10 }).level.key, "mild");
  assert.equal(hardinessInfo({ min: 11 }).text, "Va riparata sotto i 4 °C");
  assert.equal(hardinessInfo({}), null);
});

test("nome scientifico pulito per la ricerca", () => {
  assert.equal(cleanScientificName("Geranium 'Rozanne'"), "Geranium");
  assert.equal(cleanScientificName("Nepeta x faassenii"), "Nepeta faassenii");
  assert.equal(cleanScientificName("Lavandula angustifolia 'Hidcote'"), "Lavandula angustifolia");
  assert.equal(cleanScientificName("Rosa (gruppo Floribunda)"), "Rosa");
});

test("foto: solo licenze libere e misure corrette", () => {
  const ok = toPhoto({ id: 1, url: "https://x.org/photos/1/square.jpg", license_code: "cc-by", attribution: "(c) Mario Rossi, some rights reserved (CC BY)" });
  assert.equal(ok.medium, "https://x.org/photos/1/medium.jpg");
  assert.equal(ok.thumb, "https://x.org/photos/1/small.jpg");
  assert.equal(ok.license, "CC BY");
  assert.equal(ok.attribution, "© Mario Rossi");
  assert.equal(toPhoto({ id: 2, url: "https://x.org/photos/2/square.jpg", license_code: "cc-by-nc" }), null);
  assert.equal(toPhoto({ id: 3, url: "https://x.org/photos/3/square.jpg", license_code: null }), null);
});

test("foto: ricerca su iNaturalist con galleria", async () => {
  const calls = [];
  const photo = (id, license = "cc-by") => ({ id, url: `https://static.example/photos/${id}/square.jpg`, license_code: license, attribution: `(c) Autore ${id}` });
  const fakeFetch = async (url) => {
    calls.push(url);
    if (url.includes("/taxa?"))
      return { ok: true, json: async () => ({ results: [{ id: 99, name: "Lavandula angustifolia", preferred_common_name: "Lavanda vera", default_photo: photo(10) }] }) };
    return { ok: true, json: async () => ({ results: [{ id: 99, taxon_photos: [{ photo: photo(10) }, { photo: photo(11) }, { photo: photo(12, "cc-by-nc") }] }] }) };
  };
  const res = await getPlantPhotos("Lavandula angustifolia 'Munstead'", { full: true, fetchImpl: fakeFetch });
  assert.equal(res.taxon.commonName, "Lavanda vera");
  assert.deepEqual(res.photos.map((p) => p.id), [10, 11]);
  assert.match(calls[0], /q=Lavandula%20angustifolia/);
  // seconda richiesta: dalla cache, nessuna nuova chiamata
  await getPlantPhotos("Lavandula angustifolia", { full: true, fetchImpl: fakeFetch });
  assert.equal(calls.length, 2);
});

test("preferite: filtri applicati in locale", () => {
  const p = { commonName: "Lavanda", scientificName: "Lavandula", sunlight: ["full_sun"], watering: "minimum", flowerColors: ["purple"], floweringSeasons: ["summer"], soil: { ph: ["alkaline"] } };
  assert.equal(matchesLocal(p, { q: "lava" }), true);
  assert.equal(matchesLocal(p, { sunlight: "full_shade" }), false);
  assert.equal(matchesLocal(p, { color: "purple", season: "summer", ph: "alkaline" }), true);
});
