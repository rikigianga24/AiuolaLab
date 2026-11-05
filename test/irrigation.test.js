import assert from "node:assert/strict";
import { test } from "node:test";
import { computeIrrigation } from "../src/lib/irrigation.js";

const square = (x0, y0, s) => [{ x: x0, y: y0 }, { x: x0 + s, y: y0 }, { x: x0 + s, y: y0 + s }, { x: x0, y: y0 + s }];
const plant = (id, x, y, extra = {}) => ({ id, name: "Echinacea", x, y, spreadM: 0.5, ...extra });

test("senza rubinetto non calcola nulla", () => {
  const r = computeIrrigation({ beds: [{ id: "a", points: square(0, 0, 2), plants: [plant("p", 1, 1)] }] });
  assert.equal(r.ready, false);
});

test("albero di copertura minimo: rubinetto + 3 piante in fila", () => {
  const bed = { id: "a", name: "A", points: square(0, 0, 4), conditions: { texture: "loamy" }, plants: [plant("1", 1, 1), plant("2", 2, 1), plant("3", 3, 1)] };
  const r = computeIrrigation({ beds: [bed], faucet: { x: -2, y: 1 } });
  assert.equal(r.edges.length, 3);
  assert.ok(Math.abs(r.totals.supplyM - 3) < 1e-9, "adduzione dal rubinetto alla prima pianta");
  assert.ok(Math.abs(r.totals.dripM - 2) < 1e-9, "ala gocciolante tra le piante");
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
  assert.equal(r.totals.dripM, 0);
  assert.ok(Math.abs(r.totals.supplyM - 10) < 1e-9);
  assert.equal(r.zones.length, 2);
});
