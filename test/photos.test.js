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
  const res = await getPlantPhotos("Lavandula angustifolia", { full: true, fetchImpl: fakeFetch });
  assert.equal(res.match, "species");
  assert.equal(res.taxon.commonName, "Lavanda vera");
  assert.deepEqual(res.photos.map((p) => p.id), [10, 11]);
  assert.match(calls[0], /q=Lavandula%20angustifolia/);
  // solo 2 foto per la galleria: si prova anche Wikimedia (qui senza risultati)
  assert.equal(res.fallbackTried, true);
  assert.ok(calls.some((u) => u.includes("wikidata.org")));
  // seconda richiesta: dalla cache, nessuna nuova chiamata
  const before = calls.length;
  await getPlantPhotos("Lavandula angustifolia", { full: true, fetchImpl: fakeFetch });
  assert.equal(calls.length, before);
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
  const stats = await warmPhotoCache(["Salvia nemorosa", "Salvia nemorosa x", "Lavandula angustifolia"], { fetchImpl: okFetch, log: (m) => logs.push(m) });
  // "Salvia nemorosa x" si riduce alla specie: due nomi distinti. La lavanda non
  // ha risultati su iNaturalist (qui risponde sempre la salvia), quindi si
  // prova anche Wikidata: 3 richieste in tutto.
  assert.equal(stats.total, 2);
  assert.equal(stats.fetched, 2);
  assert.equal(asked.length, 3);
  assert.ok(asked[2].includes("wikidata.org"));
  // secondo giro: tutto già in cache, nessuna richiesta
  const again = await warmPhotoCache(["Salvia nemorosa", "Lavandula angustifolia"], { fetchImpl: okFetch, log: () => {} });
  assert.equal(again.cached, 2);
  assert.equal(asked.length, 3);

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
    const q = decodeURIComponent(url).match(/[?&]q=([^&]+)/);
    if (q) order.push(q[1]);
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

test("Wikimedia: solo licenze libere, autore e miniature", async () => {
  const { commonsPhoto } = await import("../server/plants/wikimedia.js");
  const page = (license, short, extra = {}) => ({
    pageid: 7,
    title: "File:Rosa.jpg",
    imageinfo: [
      {
        mime: "image/jpeg",
        thumburl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Rosa.jpg/500px-Rosa.jpg",
        descriptionurl: "https://commons.wikimedia.org/wiki/File:Rosa.jpg",
        extmetadata: { License: { value: license }, LicenseShortName: { value: short }, Artist: { value: '<a href="x">Anna Verdi</a>' }, LicenseUrl: { value: "https://cc.example" }, ...extra },
      },
    ],
  });
  const ok = commonsPhoto(page("cc-by-sa-4.0", "CC BY-SA 4.0"));
  assert.equal(ok.attribution, "© Anna Verdi");
  assert.equal(ok.license, "CC BY-SA 4.0");
  assert.equal(ok.thumb, "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Rosa.jpg/330px-Rosa.jpg");
  assert.equal(ok.large, "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Rosa.jpg/1280px-Rosa.jpg");
  assert.equal(ok.source, "Wikimedia Commons");
  assert.equal(commonsPhoto(page("pd", "Public domain", { Artist: undefined })).attribution, "Pubblico dominio");
  assert.equal(commonsPhoto(page("cc-by-nc-2.0", "CC BY-NC 2.0")), null);
  assert.equal(commonsPhoto(page("gfdl", "GFDL")), null);
  const svg = page("cc0", "CC0");
  svg.imageinfo[0].mime = "image/svg+xml";
  assert.equal(commonsPhoto(svg), null);
});

test("foto: se iNaturalist non ha foto, si usa Wikimedia Commons", async () => {
  const { getPlantPhotos, setRequestSpacing } = await import("../server/plants/photos.js");
  setRequestSpacing(5);
  const hosts = [];
  const fetchImpl = async (url) => {
    const u = new URL(url);
    hosts.push(u.hostname);
    const json = (body) => ({ ok: true, json: async () => body });
    if (u.hostname === "api.inaturalist.org") return json({ results: [] });
    if (u.hostname === "www.wikidata.org" && u.searchParams.get("list") === "search") {
      assert.equal(u.searchParams.get("srsearch"), 'haswbstatement:"P225=Pianta rarissima"');
      return json({ query: { search: [{ title: "Q123" }] } });
    }
    if (u.hostname === "www.wikidata.org")
      return json({ entities: { Q123: { claims: { P18: [{ mainsnak: { datavalue: { value: "Rara.jpg" } } }], P373: [{ mainsnak: { datavalue: { value: "Pianta rarissima" } } }] } } } });
    if (u.hostname === "commons.wikimedia.org")
      return json({
        query: {
          pages: [
            {
              pageid: 1,
              title: "File:Rara.jpg",
              imageinfo: [{ mime: "image/jpeg", thumburl: "https://upload.wikimedia.org/x/500px-Rara.jpg", extmetadata: { License: { value: "cc-by-4.0" }, LicenseShortName: { value: "CC BY 4.0" }, Artist: { value: "Luca" } } }],
            },
          ],
        },
      });
    throw new Error("host inatteso " + url);
  };
  const res = await getPlantPhotos("Pianta rarissima", { fetchImpl });
  assert.equal(res.photos.length, 1);
  assert.equal(res.photos[0].source, "Wikimedia Commons");
  assert.equal(res.source, "Wikimedia Commons");
  assert.deepEqual(hosts, ["api.inaturalist.org", "www.wikidata.org", "www.wikidata.org", "commons.wikimedia.org"]);
  setRequestSpacing(1000);
});

test("foto: le varietà cercano foto proprie e avvisano se sono generiche", async () => {
  const { getPlantPhotos, setRequestSpacing } = await import("../server/plants/photos.js");
  const { categoryCandidates, parseVariety } = await import("../server/plants/varieties.js");
  setRequestSpacing(5);
  assert.deepEqual(parseVariety("Echinacea purpurea 'Magnus'"), { genus: "Echinacea", species: "purpurea", cultivar: "Magnus", base: "Echinacea purpurea" });
  assert.equal(parseVariety("Rosa 'Edith Piaf'").base, "Rosa");
  assert.equal(parseVariety("Nepeta x faassenii").cultivar, null);
  assert.ok(categoryCandidates("Calamagrostis x acutiflora 'Karl Foerster'").includes("Calamagrostis × acutiflora 'Karl Foerster'"));

  const urls = [];
  const json = (body) => ({ ok: true, json: async () => body });
  const file = (id) => ({
    pageid: id,
    title: `File:Foto${id}.jpg`,
    imageinfo: [{ mime: "image/jpeg", thumburl: `https://upload.wikimedia.org/x/500px-Foto${id}.jpg`, extmetadata: { License: { value: "cc-by-4.0" }, LicenseShortName: { value: "CC BY 4.0" }, Artist: { value: "Anna" } } }],
  });
  const fetchImpl = async (url) => {
    const u = new URL(url);
    urls.push(decodeURIComponent(url.replace(/\+/g, " ")));
    if (u.hostname === "commons.wikimedia.org") {
      // categoria esistente solo per 'Bella Rossa'
      if (u.searchParams.get("prop") === "categoryinfo")
        return json({ query: { pages: u.searchParams.get("titles").split("|").map((t) => (t === "Category:Genere specie 'Bella Rossa'" ? { title: t, categoryinfo: { files: 4 } } : { title: t, missing: true })) } });
      if (u.searchParams.get("list") === "search") {
        // la ricerca trova categorie con lo stesso nome ma di un altro genere o di un'altra specie: vanno scartate
        return json({ query: { search: [{ title: "Category:Cantante 'Senza Foto'" }, { title: "Category:Genere altraspecie 'Senza Foto'" }] } });
      }
      if (u.searchParams.get("generator") === "categorymembers") return json({ query: { pages: [file(1), file(2)] } });
    }
    if (u.hostname === "api.inaturalist.org") return json({ results: [{ id: 7, name: "Genere specie", default_photo: { id: 9, url: "https://s.example/photos/9/square.jpg", license_code: "cc-by" } }] });
    if (u.hostname === "www.wikidata.org") return json({ query: { search: [] } });
    throw new Error("host inatteso " + url);
  };

  const own = await getPlantPhotos("Genere specie 'Bella Rossa'", { full: true, fetchImpl });
  assert.equal(own.match, "variety");
  assert.equal(own.variety, "Bella Rossa");
  assert.deepEqual(own.photos.map((p) => p.id), ["wm:1", "wm:2"]);
  assert.ok(urls.some((u) => u.includes("gcmtitle=Category:Genere specie 'Bella Rossa'")));
  assert.ok(!urls.some((u) => u.includes("inaturalist")), "con le foto della varietà non serve iNaturalist");

  const generic = await getPlantPhotos("Genere specie 'Senza Foto'", { fetchImpl });
  assert.equal(generic.match, "species");
  assert.equal(generic.variety, "Senza Foto");
  assert.equal(generic.photos[0].id, 9);

  // varietà già controllata dallo script (null in fotoVarieta.js): nessuna ricerca su Commons
  urls.length = 0;
  const known = await getPlantPhotos("Rosa 'Edith Piaf'", { fetchImpl });
  assert.equal(known.variety, "Edith Piaf");
  assert.equal(known.match, "genus");
  assert.ok(!urls.some((u) => u.includes("commons.wikimedia.org") && u.includes("categoryinfo")));
  setRequestSpacing(1000);
});

test("foto: miniature di Commons in cache corrette alle larghezze standard", async () => {
  const { fixCachedSizes } = await import("../server/plants/photos.js");
  const old = { photos: [{ source: "Wikimedia Commons", thumb: "https://u.org/a/240px-X.jpg", large: "https://u.org/a/1024px-X.jpg" }, { source: "iNaturalist", thumb: "t" }] };
  const fixed = fixCachedSizes(old);
  assert.equal(fixed.photos[0].thumb, "https://u.org/a/330px-X.jpg");
  assert.equal(fixed.photos[0].large, "https://u.org/a/1280px-X.jpg");
  assert.equal(fixed.photos[1].thumb, "t");
});
