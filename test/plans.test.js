import assert from "node:assert/strict";
import { test } from "node:test";
import { PLANS, planFeatures, planOf, quotaLabel, quotaStatus } from "../src/lib/plans.js";

test("piano: gratis di default, premium solo se indicato", () => {
  assert.equal(planOf(null), "free");
  assert.equal(planOf({ plan: "boh" }), "free");
  assert.equal(planOf({ plan: "premium" }), "premium");
  assert.equal(planFeatures(null).fullForecast, false);
  assert.equal(planFeatures({ plan: "premium" }).fullForecast, true);
});

test("piano: descrizione delle quote", () => {
  assert.equal(quotaLabel(PLANS.free.ai), "1 proposta ogni 2 giorni");
  assert.equal(quotaLabel(PLANS.premium.ai), "3 proposte al giorno");
  assert.equal(quotaLabel({ count: 2, hours: 12 }), "2 proposte ogni 12 ore");
});

test("quota: finestra mobile e prossima proposta", () => {
  const now = Date.parse("2026-11-10T12:00:00Z");
  const h = (n) => now - n * 3600 * 1000;
  // gratis: una ogni 48 ore
  assert.deepEqual(quotaStatus([], PLANS.free.ai, now), { used: 0, remaining: 1, nextAt: null });
  assert.deepEqual(quotaStatus([h(50)], PLANS.free.ai, now), { used: 0, remaining: 1, nextAt: null });
  const s = quotaStatus([h(10)], PLANS.free.ai, now);
  assert.equal(s.remaining, 0);
  assert.equal(s.nextAt, new Date(h(10) + 48 * 3600 * 1000).toISOString());
  // premium: 3 in 24 ore, si libera quando esce la più vecchia
  const p = quotaStatus([h(1), h(20), h(5)], PLANS.premium.ai, now);
  assert.equal(p.remaining, 0);
  assert.equal(p.nextAt, new Date(h(20) + 24 * 3600 * 1000).toISOString());
  assert.equal(quotaStatus([h(1), h(30)], PLANS.premium.ai, now).remaining, 2);
});
