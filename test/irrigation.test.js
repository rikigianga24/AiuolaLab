import assert from "node:assert/strict";
import { test } from "node:test";
import { computeIrrigation } from "../src/lib/irrigation.js";

const square = (x0, y0, s) => [{ x: x0, y: y0 }, { x: x0 + s, y: y0 }, { x: x0 + s, y: y0 + s }, { x: x0, y: y0 + s }];
const plant = (id, x, y, extra = {}) => ({ id, name: "Echinacea", x, y, spreadM: 0.5, ...extra });

test("senza rubinetto non calcola nulla", () => {
  const r = computeIrrigation({ beds: [{ id: "a", points: square(0, 0, 2), plants: [plant("p", 1, 1)] }] });
  assert.equal(r.ready, false);
});

test("tre piante in fila: un solo tubo dritto, niente giunte né derivazioni", () => {
  const bed = { id: "a", name: "A", points: square(0, 0, 4), conditions: { texture: "loamy" }, plants: [plant("1", 1, 1), plant("2", 2, 1), plant("3", 3, 1)] };
  const r = computeIrrigation({ beds: [bed], faucet: { x: -2, y: 1 } });
  assert.equal(r.pipes.length, 2, "adduzione + linea in aiuola");
  assert.ok(Math.abs(r.totals.supplyM - 3) < 1e-6, "adduzione dal rubinetto alla prima pianta");
  assert.ok(Math.abs(r.totals.dripM - 2) < 1e-6, "una linea dritta lungo le piante");
  assert.equal(r.stubs.length, 0, "le piante sono sul tubo: nessun microtubo");
  assert.equal(r.totals.tees, 0);
  assert.equal(r.zones.length, 1);
  const summer = r.zones[0].seasons.find((s) => s.key === "summer");
  assert.ok(summer.minutes >= 5 && summer.minutes <= 180, `durata estate ${summer.minutes}`);
  assert.match(summer.start, /^0[4-6]:\d\d$/);
});

test("le piante assetate ricevono più gocciolatori", () => {
  const bed = {
    id: "a",
    name: "A",
    points: square(0, 0, 5),
    plants: [
      plant("lav", 1, 1, { name: "Lavanda", spreadM: 0.5 }),
      plant("ort", 3, 3, { name: "Ortensia", spreadM: 1.4 }),
      plant("ech", 2, 1, { name: "Echinacea", spreadM: 0.5 }),
    ],
  };
  const r = computeIrrigation({ beds: [bed], faucet: { x: 0, y: -1 } });
  const by = Object.fromEntries(r.drippers.map((d) => [d.plantId, d.count]));
  assert.ok(by.ort > by.lav, `ortensia ${by.ort} vs lavanda ${by.lav}`);
});

test("due aiuole: il collegamento tra aiuole è tubo di adduzione", () => {
  const a = { id: "a", name: "A", points: square(0, 0, 2), plants: [plant("1", 1, 1)] };
  const b = { id: "b", name: "B", points: square(10, 0, 2), plants: [plant("2", 11, 1)] };
  const r = computeIrrigation({ beds: [a, b], faucet: { x: 5, y: 1 } });
  assert.ok(r.totals.dripM < 1e-6, "una pianta per aiuola: nessuna linea in aiuola");
  assert.ok(Math.abs(r.totals.supplyM - 10) < 1e-6);
  assert.equal(r.zones.length, 2);
  assert.equal(r.totals.tees, 1, "un raccordo a T al rubinetto per dividere i due tubi");
});

test("i vasi si irrigano ogni giorno e quelli appesi più a lungo", () => {
  const circle = (cx, cy, r) => Array.from({ length: 16 }, (_, i) => ({ x: cx + Math.cos((i / 16) * 6.283) * r, y: cy + Math.sin((i / 16) * 6.283) * r }));
  const pot = (id, hanging) => ({ id, name: id, kind: "pot", pot: { hanging }, points: circle(id === "a" ? 1 : 3, 1, 0.2), plants: [plant(id + "p", id === "a" ? 1 : 3, 1, { spreadM: 0.3 })] });
  const r = computeIrrigation({ beds: [pot("a", false), pot("b", true)], faucet: { x: 0, y: 0 } });
  const summer = (i) => r.zones[i].seasons.find((s) => s.key === "summer");
  assert.equal(summer(0).interval, 1);
  assert.ok(summer(1).minutes >= summer(0).minutes);
});

// aiuola 5 × 3 m con due file di piante ogni 1 m, file a 1,2 m una dall'altra
const twoRows = (n = 5) => ({
  id: "a",
  name: "A",
  points: [{ x: 0, y: 0 }, { x: 6, y: 0 }, { x: 6, y: 3 }, { x: 0, y: 3 }],
  plants: [
    ...Array.from({ length: n }, (_, i) => plant("r1" + i, 0.5 + i, 0.7)),
    ...Array.from({ length: n }, (_, i) => plant("r2" + i, 0.5 + i, 1.9)),
  ],
});

test("due file di piante: un unico tubo a serpentina, senza tagli né raccordi", () => {
  const r = computeIrrigation({ beds: [twoRows()], faucet: { x: -1, y: 0.7 } });
  assert.equal(r.pipes.filter((p) => p.kind === "drip").length, 1, "un solo tubo in aiuola");
  assert.equal(r.totals.tees, 0);
  assert.equal(r.stubs.length, 0, "tutte le piante sono sul percorso del tubo");
  // due file da 4 m + una curva a U: poco più di 8 m, molto meno di un albero di tubi tagliati
  assert.ok(r.totals.dripM > 8 && r.totals.dripM < 10, `lunghezza ${r.totals.dripM}`);
});

test("il tubo non fa angoli: solo curve ampie", async () => {
  const { maxTurnDeg } = await import("../src/lib/pipes.js");
  const r = computeIrrigation({ beds: [twoRows()], faucet: { x: -1, y: 2.5 } });
  for (const p of r.pipes) assert.ok(maxTurnDeg(p.points) <= 12, `svolta di ${maxTurnDeg(p.points).toFixed(1)}° su un tubo ${p.kind}`);
});

test("piante sparse: ogni pianta è a un microtubo corto dal tubo", () => {
  const plants = [[0.6, 0.5], [1.4, 1.1], [2.3, 0.6], [3.1, 1.3], [4.2, 0.7], [4.9, 1.5], [1.0, 2.3], [3.6, 2.4], [5.2, 2.5]].map(([x, y], i) => plant("s" + i, x, y));
  const bed = { id: "a", name: "A", points: [{ x: 0, y: 0 }, { x: 6, y: 0 }, { x: 6, y: 3 }, { x: 0, y: 3 }], plants };
  const r = computeIrrigation({ beds: [bed], faucet: { x: -1, y: 1 } });
  assert.equal(r.pipes.filter((p) => p.kind === "drip").length, 1);
  assert.ok(r.stubs.every((s) => s.len <= 0.6), "microtubi corti");
  assert.equal(r.longStubs, 0);
  assert.equal(r.totals.tees, 0);
});

test("la fila diagonale si percorre in linea retta", () => {
  const bed = { id: "a", name: "A", points: [{ x: 0, y: 0 }, { x: 6, y: 0 }, { x: 6, y: 6 }, { x: 0, y: 6 }], plants: Array.from({ length: 5 }, (_, i) => plant("d" + i, 1 + i, 1 + i)) };
  const r = computeIrrigation({ beds: [bed], faucet: { x: 0, y: 1 } });
  const drip = r.pipes.find((p) => p.kind === "drip");
  assert.ok(Math.abs(drip.len - Math.hypot(4, 4)) < 0.05, `lunghezza ${drip.len}`);
  assert.equal(r.stubs.length, 0);
});

test("materiali: niente manicotti, un tubo per aiuola, rotolo consigliato", () => {
  const r = computeIrrigation({ beds: [twoRows()], faucet: { x: -1, y: 0.7 } });
  assert.ok(!r.materials.some((m) => /manicott/i.test(m.item)));
  const tube = r.materials.find((m) => /^Tubo PE/.test(m.item));
  assert.match(tube.note, /1 tubo continuo/);
  assert.match(tube.note, /rotolo da 25 m/);
});
