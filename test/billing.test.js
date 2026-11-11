import assert from "node:assert/strict";
import crypto from "node:crypto";
import { test } from "node:test";
import { premiumSql, subscriptionRow, subscriptionView, verifySignature } from "../server/billing.js";
import { PRICES, formatEuro, yearlySaving } from "../src/lib/plans.js";

// segreto generato a ogni esecuzione: nessuna credenziale nel codice
const SECRET = crypto.randomBytes(24).toString("hex");
const sign = (body, ts, secret = SECRET) => `ts=${ts};h1=${crypto.createHmac("sha256", secret).update(`${ts}:${body}`).digest("hex")}`;

test("pagamenti: firma degli avvisi di Paddle", () => {
  const body = JSON.stringify({ event_id: "evt_1", event_type: "subscription.created" });
  const now = Date.now();
  const ts = Math.floor(now / 1000);
  assert.equal(verifySignature(Buffer.from(body), sign(body, ts), SECRET, { now }), true);
  assert.equal(verifySignature(body, sign(body, ts), SECRET, { now }), true, "anche come testo");
  // corpo modificato, segreto sbagliato, intestazione assente o malformata
  assert.equal(verifySignature(Buffer.from(body + " "), sign(body, ts), SECRET, { now }), false);
  assert.equal(verifySignature(Buffer.from(body), sign(body, ts, "altro"), SECRET, { now }), false);
  assert.equal(verifySignature(Buffer.from(body), undefined, SECRET, { now }), false);
  assert.equal(verifySignature(Buffer.from(body), "ts=abc;h1=123", SECRET, { now }), false);
  assert.equal(verifySignature(Buffer.from(body), sign(body, ts), null, { now }), false);
  // avviso troppo vecchio: potrebbe essere rispedito da qualcun altro
  assert.equal(verifySignature(Buffer.from(body), sign(body, ts - 3600), SECRET, { now }), false);
  // durante il cambio di segreto Paddle manda due firme: ne basta una giusta
  const both = `${sign(body, ts, "vecchio")};h1=${sign(body, ts).split("h1=")[1]}`;
  assert.equal(verifySignature(Buffer.from(body), both, SECRET, { now }), true);
});

const SUB = {
  id: "sub_01",
  status: "active",
  customer_id: "ctm_01",
  custom_data: { user_id: "11111111-2222-4333-8444-555555555555" },
  started_at: "2026-11-01T10:00:00Z",
  current_billing_period: { starts_at: "2026-11-01T10:00:00Z", ends_at: "2026-12-01T10:00:00Z" },
  scheduled_change: null,
  items: [{ price: { id: "pri_mese", billing_cycle: { interval: "month", frequency: 1 } } }],
  updated_at: "2026-11-01T10:00:05Z",
};

test("pagamenti: dall'abbonamento di Paddle alla riga del database", () => {
  const r = subscriptionRow(SUB);
  assert.equal(r.userId, SUB.custom_data.user_id);
  assert.equal(r.interval, "month");
  assert.equal(r.priceId, "pri_mese");
  assert.equal(r.currentPeriodEnd, "2026-12-01T10:00:00Z");
  assert.equal(r.cancelAt, null);
  const cancelled = subscriptionRow({ ...SUB, scheduled_change: { action: "cancel", effective_at: "2026-12-01T10:00:00Z" } });
  assert.equal(cancelled.cancelAt, "2026-12-01T10:00:00Z");
  // un id utente non valido non viene usato
  assert.equal(subscriptionRow({ ...SUB, custom_data: { user_id: "1; DROP TABLE users" } }).userId, null);
});

test("pagamenti: stato mostrato e finestra di recesso di 14 giorni", () => {
  const row = { status: "active", billing_interval: "month", started_at: "2026-11-01T10:00:00Z", current_period_end: "2026-12-01T10:00:00Z", cancel_at: null, withdrawn_at: null };
  const day = (d) => Date.parse(`2026-11-${String(d).padStart(2, "0")}T12:00:00Z`);
  assert.equal(subscriptionView(row, day(10)).canWithdraw, true);
  assert.equal(subscriptionView(row, day(10)).withdrawUntil, "2026-11-15T10:00:00.000Z");
  assert.equal(subscriptionView(row, day(16)).canWithdraw, false, "dopo 14 giorni no");
  assert.equal(subscriptionView({ ...row, withdrawn_at: "2026-11-03T00:00:00Z" }, day(5)).canWithdraw, false, "una volta sola");
  assert.equal(subscriptionView({ ...row, status: "canceled" }, day(5)).active, false);
  assert.equal(subscriptionView({ ...row, status: "past_due" }, day(5)).active, true, "Premium resta mentre Paddle riprova");
  assert.equal(subscriptionView(null), null);
});

test("pagamenti: condizione SQL di Premium con stati fissi", () => {
  const sql = premiumSql("u");
  assert.match(sql, /b\.user_id = u\.id/);
  assert.match(sql, /'active', 'trialing', 'past_due'/);
});

test("prezzi: 3,99 € al mese, 30 € all'anno, risparmio del 37%", () => {
  assert.equal(formatEuro(PRICES.month.cents), "3,99 €");
  assert.equal(formatEuro(PRICES.year.cents), "30 €");
  assert.equal(formatEuro(250), "2,50 €");
  assert.equal(yearlySaving(), 37);
});
