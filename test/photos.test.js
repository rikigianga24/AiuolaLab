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

test("foto: riempimento della cache in sottofondo", async () => {
  const { warmPhotoCache, setRequestSpacing } = await import("../server/plants/photos.js");
  setRequestSpacing(5);
  const asked = [];
  const okFetch = async (url) => {
    asked.push(decodeURIComponent(url));
    return { ok: true, json: async () => ({ results: [{ id: 1, name: "Salvia nemorosa", default_photo: { id: 5, url: "https://s.example/photos/5/square.jpg", license_code: "cc0" } }] }) };
  };
  const logs = [];
  const stats = await warmPhotoCache(["Salvia nemorosa 'Caradonna'", "Salvia nemorosa", "Lavandula angustifolia"], { fetchImpl: okFetch, log: (m) => logs.push(m) });
  // le varietà si riducono alla specie: due nomi distinti, due richieste
  assert.equal(stats.total, 2);
  assert.equal(stats.fetched, 2);
  assert.equal(asked.length, 2);
  // secondo giro: tutto già in cache, nessuna richiesta
  const again = await warmPhotoCache(["Salvia nemorosa", "Lavandula angustifolia"], { fetchImpl: okFetch, log: () => {} });
  assert.equal(again.cached, 2);
  assert.equal(asked.length, 2);

  // iNaturalist irraggiungibile: si ferma dopo 5 errori di fila
  const failing = async () => {
    throw new Error("rete bloccata");
  };
  const names = Array.from({ length: 12 }, (_, i) => `Genere${i} specie`);
  const res = await warmPhotoCache(names, { fetchImpl: failing, log: () => {} });
  assert.equal(res.errors, 5);
  assert.equal(res.stoppedEarly, true);
  setRequestSpacing(1000);
});

test("foto: le richieste degli utenti passano davanti al riempimento", async () => {
  const { getPlantPhotos, setRequestSpacing } = await import("../server/plants/photos.js");
  setRequestSpacing(20);
  const order = [];
  const fetchImpl = async (url) => {
    order.push(decodeURIComponent(url).match(/q=([^&]+)/)[1]);
    return { ok: true, json: async () => ({ results: [] }) };
  };
  const low = ["Aaa uno", "Bbb due", "Ccc tre"].map((n) => getPlantPhotos(n, { fetchImpl, priority: "low" }));
  const high = getPlantPhotos("Zzz utente", { fetchImpl });
  await Promise.all([...low, high]);
  // quella dell'utente parte prima delle altre in attesa
  assert.ok(order.indexOf("Zzz utente") <= 1, order.join(", "));
  assert.ok(order.indexOf("Zzz utente") < order.indexOf("Bbb due"));
  setRequestSpacing(1000);
});
