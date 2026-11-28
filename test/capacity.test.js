import assert from "node:assert/strict";
import { test } from "node:test";
import { fitQuantities, planSpreadCm } from "../src/lib/capacity.js";

const area = (plants) => plants.reduce((s, p) => s + p.quantity * Math.PI * (planSpreadCm(p) / 200) ** 2, 0);

test("capienza: un'aiuola da 8 m² non riceve più di quanto contiene a 5 anni", () => {
  const plants = [
    { quantity: 9, spread_5y_cm: 90, spacing_cm: 60 }, // rose: grandi a 5 anni
    { quantity: 12, spread_5y_cm: 50, spacing_cm: 40 },
    { quantity: 15, spread_5y_cm: 40, spacing_cm: 30 },
  ];
  assert.ok(area(plants) > 8 * 0.85, "la proposta di partenza è troppo piena");
  const fit = fitQuantities(plants, 8);
  assert.equal(fit.reduced, true);
  assert.ok(area(fit.plants) <= 8 * 0.85 + 1e-9);
  assert.ok(fit.plants.every((p) => p.quantity >= 1), "nessuna specie sparisce");
  assert.equal(plants[0].quantity, 9, "l'originale non viene modificato");
});

test("capienza: se ci sta, non cambia nulla; senza spread_5y_cm vale la distanza di impianto", () => {
  const ok = [{ quantity: 4, spread_5y_cm: 40 }];
  const fit = fitQuantities(ok, 8);
  assert.equal(fit.reduced, false);
  assert.deepEqual(fit.plants, ok);
  assert.equal(planSpreadCm({ spacing_cm: 35 }), 35);
});
