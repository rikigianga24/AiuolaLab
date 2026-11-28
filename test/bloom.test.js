import assert from "node:assert/strict";
import { test } from "node:test";
import { bloomStatus, bloomSummary, coverageByMonth, monthsInRange, peakMonths, periodLabel, plantKey } from "../src/lib/bloom.js";
import { edgeQuotes, fitScale, heightLabel, numberPlants, scaleBarLength } from "../src/lib/printPlan.js";

const sq = [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 2 }, { x: 0, y: 2 }];
const rosa = { id: "r1", plantId: "rosa", name: "Rosa", x: 1, y: 1, spreadM: 0.8, heightCm: 120, floweringMonths: [5, 6, 7, 8, 9] };
const rosa2 = { ...rosa, id: "r2", x: 2 };
const elleboro = { id: "e1", plantId: "elleboro", name: "Elleboro", x: 3, y: 1, spreadM: 0.4, floweringMonths: [11, 12, 1, 2] };
const felce = { id: "f1", plantId: "felce", name: "Felce", x: 3.5, y: 1.5, spreadM: 0.5, floweringMonths: [] };
const ignota = { id: "i1", plantId: "ignota", name: "Ignota", x: 0.5, y: 0.5, spreadM: 0.3 };
const beds = [{ id: "b", name: "Aiuola 1", points: sq, plants: [rosa, rosa2, elleboro, felce, ignota] }];
const monthsOf = (p) => p.floweringMonths;

test("fioritura: intervalli di mesi, anche a cavallo d'anno", () => {
  assert.deepEqual(monthsInRange(5, 8), [5, 6, 7, 8]);
  assert.deepEqual(monthsInRange(11, 2), [11, 12, 1, 2]);
  assert.deepEqual(monthsInRange(3), [3]);
  assert.equal(monthsInRange(1, 12).length, 12);
  assert.equal(periodLabel({ from: 5, to: 8 }), "maggio–agosto");
  assert.equal(periodLabel({ from: 8, to: 8 }), "agosto");
});

test("fioritura: stato di una pianta per ciascuno dei 12 mesi", () => {
  for (let m = 1; m <= 12; m++) {
    assert.equal(bloomStatus([5, 6, 7, 8, 9], [m]), m >= 5 && m <= 9 ? "bloom" : "off");
    // novembre-febbraio: attraversa dicembre/gennaio
    assert.equal(bloomStatus([11, 12, 1, 2], [m]), m >= 11 || m <= 2 ? "bloom" : "off");
  }
  assert.equal(bloomStatus(undefined, [5]), "unknown");
  assert.equal(bloomStatus([], [5]), "unknown");
  // basta un mese dell'intervallo scelto in comune
  assert.equal(bloomStatus([3, 4], monthsInRange(4, 7)), "bloom");
  assert.equal(bloomStatus([3, 4], monthsInRange(5, 7)), "off");
});

test("fioritura: riepilogo del periodo", () => {
  const agosto = bloomSummary(beds, [8], monthsOf);
  assert.equal(agosto.plants, 2);
  assert.equal(agosto.varieties, 1);
  assert.deepEqual([...agosto.bloomingIds].sort(), ["r1", "r2"]);
  assert.equal(agosto.unknown, 2); // la felce e la pianta senza dati
  const gennaio = bloomSummary(beds, [1], monthsOf);
  assert.deepEqual(gennaio.list.map((g) => g.name), ["Elleboro"]);
  const inverno = bloomSummary(beds, monthsInRange(12, 2), monthsOf);
  assert.equal(inverno.plants, 1);
});

test("fioritura: distribuzione annuale e mesi di picco", () => {
  const cov = coverageByMonth(beds, monthsOf);
  assert.equal(cov.length, 12);
  assert.equal(cov[7].plants, 2); // agosto: due rose
  assert.equal(cov[0].plants, 1); // gennaio: elleboro
  assert.equal(cov[2].plants, 0); // marzo
  assert.deepEqual(peakMonths(cov), [5, 6, 7, 8, 9]);
  assert.deepEqual(peakMonths(coverageByMonth([{ plants: [ignota] }], monthsOf)), []);
});

test("fioritura: la stessa pianta con varietà diverse conta separatamente", () => {
  assert.notEqual(plantKey(rosa), plantKey({ ...rosa, variety: "Iceberg" }));
  assert.equal(plantKey(rosa), plantKey(rosa2));
});

test("stampa: numerazione delle piante e quantità", () => {
  const { items, numberOf, total } = numberPlants(beds, monthsOf);
  assert.equal(total, 5);
  assert.deepEqual(items.map((i) => [i.n, i.name, i.count]), [[1, "Elleboro", 1], [2, "Felce", 1], [3, "Ignota", 1], [4, "Rosa", 2]]);
  assert.equal(numberOf.get(plantKey(rosa2)), 4);
});

test("stampa: scala, quote e scala grafica", () => {
  // 4 x 2 m in 160 x 100 mm: serve 1:25 (4 m -> 160 mm)
  assert.equal(fitScale({ w: 4, h: 2 }, { w: 160, h: 100 }), 25);
  assert.equal(fitScale({ w: 4, h: 2 }, { w: 159, h: 100 }), 50);
  const q = edgeQuotes(sq);
  assert.equal(q.length, 4);
  assert.equal(q[0].label, "4,00 m");
  assert.equal(q[1].label, "2,00 m");
  // la normale punta fuori dal poligono (primo lato in basso: y negativa)
  assert.ok(q[0].normal.y < 0);
  assert.ok(q[2].normal.y > 0);
  const bar = scaleBarLength(50);
  assert.equal(bar.m, 1);
  assert.equal(bar.mm, 20);
  assert.equal(heightLabel(40), "40 cm");
  assert.equal(heightLabel(150), "1,5 m");
  assert.equal(heightLabel(null), null);
});
