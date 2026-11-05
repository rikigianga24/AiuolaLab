import assert from "node:assert/strict";
import { test } from "node:test";
import { distToEdges, pointInPolygon } from "../src/lib/geometry.js";
import { autoLayout } from "../src/lib/layout.js";

const square = [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }, { x: 0, y: 4 }];

test("le piante stanno dentro l'aiuola senza sovrapporsi troppo", () => {
  const groups = [
    { key: "a", layer: "alta", quantity: 3, spreadM: 0.8 },
    { key: "b", layer: "copertura", quantity: 10, spreadM: 0.3 },
  ];
  const { placed, skipped } = autoLayout(square, groups);
  assert.equal(skipped, 0);
  assert.equal(placed.length, 13);
  for (const p of placed) assert.ok(pointInPolygon(p, square));
  const tall = placed.filter((p) => p.key === "a");
  const low = placed.filter((p) => p.key === "b");
  const avg = (l) => l.reduce((s, p) => s + distToEdges(p, square), 0) / l.length;
  assert.ok(avg(tall) > avg(low), "le alte devono stare più all'interno delle basse");
  // le tappezzanti occupano più di un lato
  const sides = new Set(low.map((p) => (p.x < 1 ? "W" : p.x > 3 ? "E" : p.y < 1 ? "N" : "S")));
  assert.ok(sides.size >= 3, `tappezzanti su ${[...sides]}`);
});

test("quando lo spazio finisce segnala le piante non posizionate", () => {
  const { placed, skipped } = autoLayout(square, [{ key: "x", layer: "media", quantity: 50, spreadM: 1 }]);
  assert.ok(skipped > 0);
  assert.equal(placed.length + skipped, 50);
});
