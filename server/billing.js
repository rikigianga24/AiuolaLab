// Abbonamento Premium con Paddle (Paddle Billing, API v1).
//
// Come funziona:
// 1. il server crea su Paddle una "transazione" con il prezzo scelto e l'id
//    dell'utente (custom_data); il browser apre il pagamento di Paddle;
// 2. Paddle avvisa il server (webhook firmato) quando l'abbonamento nasce,
//    si rinnova, viene disdetto o non viene pagato;
// 3. il server salva lo stato nella tabella subscriptions: l'utente è
//    Premium finché l'abbonamento è attivo.
// I dati della carta non passano mai da qui.
import crypto from "node:crypto";
import { config } from "./config.js";
import { hasDatabase, query } from "./db.js";
import { PRICES } from "../src/lib/plans.js";

export const billingEnabled = () => config.paddle.enabled && hasDatabase();

const API_BASE = { production: "https://api.paddle.com", sandbox: "https://sandbox-api.paddle.com" };

// Stati in cui l'abbonamento dà diritto a Premium. past_due: il rinnovo non
// è andato a buon fine e Paddle sta riprovando, Premium resta per qualche giorno.
export const ACTIVE_STATUSES = ["active", "trialing", "past_due"];
// Giorni di tolleranza dopo la fine del periodo pagato (avvisi in ritardo,
// nuovi tentativi di pagamento).
const GRACE_DAYS = 3;
// Diritto di recesso: 14 giorni dall'inizio dell'abbonamento, rimborso completo.
export const WITHDRAW_DAYS = 14;

/**
 * Condizione SQL «ha un abbonamento attivo» per l'utente della tabella `alias`.
 * Gli stati sono scritti qui, non arrivano mai dall'esterno.
 */
export const premiumSql = (alias = "u") =>
  `EXISTS (SELECT 1 FROM subscriptions b WHERE b.user_id = ${alias}.id
     AND b.status IN (${ACTIVE_STATUSES.map((s) => `'${s}'`).join(", ")})
     AND (b.current_period_end IS NULL OR b.current_period_end > now() - interval '${GRACE_DAYS} days'))`;

// ---------- firma degli avvisi (webhook) ----------

/**
 * Controlla l'intestazione Paddle-Signature («ts=...;h1=...»): HMAC-SHA256
 * di «ts:corpo» con il segreto della destinazione. Il corpo deve essere
 * quello originale, byte per byte. `toleranceSec` ferma gli avvisi vecchi
 * rispediti da qualcun altro.
 */
export function verifySignature(rawBody, header, secret, { now = Date.now(), toleranceSec = 300 } = {}) {
  if (!header || !secret || rawBody == null) return false;
  const parts = String(header)
    .split(";")
    .map((p) => p.trim().split("="));
  const ts = parts.find(([k]) => k === "ts")?.[1];
  const signatures = parts.filter(([k]) => k === "h1").map(([, v]) => v);
  if (!ts || !/^\d+$/.test(ts) || !signatures.length) return false;
  if (Math.abs(now / 1000 - Number(ts)) > toleranceSec) return false;
  const body = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(String(rawBody));
  const expected = crypto.createHmac("sha256", secret).update(`${ts}:`).update(body).digest();
  return signatures.some((sig) => {
    if (!/^[0-9a-f]{64}$/i.test(sig ?? "")) return false;
    return crypto.timingSafeEqual(Buffer.from(sig, "hex"), expected);
  });
}

// ---------- chiamate all'API di Paddle ----------

export class PaddleError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function paddleRequest(method, path, body, { fetchImpl = fetch } = {}) {
  const res = await fetchImpl(`${API_BASE[config.paddle.environment]}${path}`, {
    method,
    headers: { Authorization: `Bearer ${config.paddle.apiKey}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20_000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data?.error?.detail || data?.error?.code || `HTTP ${res.status}`;
    throw new PaddleError(`Paddle: ${detail}`, res.status, data?.error?.code);
  }
  return data;
}

// ---------- abbonamenti nel database ----------

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Dall'abbonamento di Paddle alla riga della tabella subscriptions. */
export function subscriptionRow(sub) {
  const item = sub.items?.[0];
  const userId = sub.custom_data?.user_id;
  return {
    id: sub.id,
    userId: typeof userId === "string" && UUID.test(userId) ? userId : null,
    customerId: sub.customer_id,
    status: sub.status,
    priceId: item?.price?.id ?? null,
    interval: item?.price?.billing_cycle?.interval ?? sub.billing_cycle?.interval ?? null,
    startedAt: sub.started_at ?? sub.first_billed_at ?? sub.created_at ?? null,
    currentPeriodEnd: sub.current_billing_period?.ends_at ?? null,
    cancelAt: sub.scheduled_change?.action === "cancel" ? sub.scheduled_change.effective_at : null,
    providerUpdatedAt: sub.updated_at ?? null,
  };
}

/**
 * Salva o aggiorna un abbonamento. Gli avvisi possono arrivare in disordine:
 * un aggiornamento più vecchio di quello già salvato viene ignorato.
 * `userIdHint`: utente noto da altre fonti (es. la transazione di acquisto).
 */
export async function saveSubscription(sub, userIdHint = null) {
  const r = subscriptionRow(sub);
  if (!r.id || !r.customerId || !r.status) return;
  const userId = r.userId ?? (UUID.test(userIdHint ?? "") ? userIdHint : null);
  await query(
    `INSERT INTO subscriptions (id, user_id, customer_id, status, price_id, billing_interval, started_at,
                                current_period_end, cancel_at, provider_updated_at)
     VALUES ($1, (SELECT id FROM users WHERE id = $2::uuid), $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (id) DO UPDATE SET
       user_id = COALESCE(EXCLUDED.user_id, subscriptions.user_id),
       customer_id = EXCLUDED.customer_id,
       status = EXCLUDED.status,
       price_id = EXCLUDED.price_id,
       billing_interval = EXCLUDED.billing_interval,
       started_at = COALESCE(subscriptions.started_at, EXCLUDED.started_at),
       current_period_end = EXCLUDED.current_period_end,
       cancel_at = EXCLUDED.cancel_at,
       provider_updated_at = EXCLUDED.provider_updated_at,
       updated_at = now()
     WHERE subscriptions.provider_updated_at IS NULL OR EXCLUDED.provider_updated_at IS NULL
        OR EXCLUDED.provider_updated_at >= subscriptions.provider_updated_at`,
    [r.id, userId, r.customerId, r.status, r.priceId, r.interval, r.startedAt, r.currentPeriodEnd, r.cancelAt, r.providerUpdatedAt],
  );
}

/** Ultimo abbonamento dell'utente (attivo se c'è, altrimenti il più recente). */
export async function latestSubscription(userId) {
  const { rows } = await query(
    `SELECT * FROM subscriptions WHERE user_id = $1
     ORDER BY (status = ANY($2)) DESC, created_at DESC LIMIT 1`,
    [userId, ACTIVE_STATUSES],
  );
  return rows[0] ?? null;
}

/** Cosa vede il browser dell'abbonamento. */
export function subscriptionView(row, now = Date.now()) {
  if (!row) return null;
  const started = row.started_at ? new Date(row.started_at).getTime() : null;
  const withdrawUntil = started ? new Date(started + WITHDRAW_DAYS * 86400000) : null;
  const active = ACTIVE_STATUSES.includes(row.status);
  return {
    status: row.status,
    active,
    interval: row.billing_interval,
    startedAt: row.started_at,
    currentPeriodEnd: row.current_period_end,
    cancelAt: row.cancel_at,
    withdrawnAt: row.withdrawn_at,
    withdrawUntil: withdrawUntil?.toISOString() ?? null,
    canWithdraw: active && !row.withdrawn_at && withdrawUntil != null && withdrawUntil.getTime() > now,
  };
}

// ---------- avvisi di Paddle ----------

/** Applica un avviso di Paddle. Restituisce una breve descrizione per il log. */
export async function processEvent(event, { fetchImpl } = {}) {
  const type = event?.event_type ?? "";
  const data = event?.data ?? {};
  if (type.startsWith("subscription.")) {
    await saveSubscription(data);
    return `abbonamento ${data.id}: ${data.status}`;
  }
  if (type === "transaction.completed" && data.subscription_id) {
    // la transazione di acquisto porta l'id dell'utente: se l'avviso
    // dell'abbonamento non l'avesse, lo colleghiamo da qui
    const userId = data.custom_data?.user_id ?? null;
    const { data: sub } = await paddleRequest("GET", `/subscriptions/${encodeURIComponent(data.subscription_id)}`, null, { fetchImpl });
    await saveSubscription(sub, userId);
    return `pagamento ${data.id} per ${data.subscription_id}`;
  }
  return `ignorato (${type})`;
}

// ---------- azioni dell'utente ----------

/** Disdice tutti gli abbonamenti attivi dell'utente, subito (cancellazione account). */
export async function cancelAllForUser(userId, { fetchImpl } = {}) {
  const { rows } = await query("SELECT id FROM subscriptions WHERE user_id = $1 AND status <> 'canceled'", [userId]);
  if (rows.length && !config.paddle.enabled) throw new PaddleError("Pagamenti non configurati: impossibile disdire l'abbonamento", 503);
  for (const { id } of rows) {
    try {
      const { data } = await paddleRequest("POST", `/subscriptions/${encodeURIComponent(id)}/cancel`, { effective_from: "immediately" }, { fetchImpl });
      await saveSubscription(data);
    } catch (err) {
      // se su Paddle risulta già disdetto va bene lo stesso
      const { data } = await paddleRequest("GET", `/subscriptions/${encodeURIComponent(id)}`, null, { fetchImpl }).catch(() => ({}));
      if (data?.status !== "canceled") throw err;
      await saveSubscription(data);
    }
  }
  return rows.length;
}

/**
 * Recesso entro 14 giorni: disdetta immediata e rimborso completo di quanto
 * pagato. I rimborsi su Paddle vengono approvati da Paddle (di solito in
 * poche ore). Restituisce quanti rimborsi sono stati chiesti e quali no.
 */
export async function withdrawSubscription(row, { fetchImpl } = {}) {
  const { data } = await paddleRequest("POST", `/subscriptions/${encodeURIComponent(row.id)}/cancel`, { effective_from: "immediately" }, { fetchImpl });
  await saveSubscription(data);
  await query("UPDATE subscriptions SET withdrawn_at = now() WHERE id = $1", [row.id]);
  const { data: transactions } = await paddleRequest(
    "GET",
    `/transactions?subscription_id=${encodeURIComponent(row.id)}&status=completed,billed`,
    null,
    { fetchImpl },
  );
  let refunded = 0;
  const failed = [];
  for (const t of transactions ?? []) {
    try {
      await paddleRequest(
        "POST",
        "/adjustments",
        { action: "refund", type: "full", transaction_id: t.id, reason: "Recesso entro 14 giorni (Codice del Consumo)" },
        { fetchImpl },
      );
      refunded++;
    } catch (err) {
      failed.push(`${t.id}: ${err.message}`);
    }
  }
  return { refunded, failed };
}

/**
 * All'avvio: i prezzi su Paddle sono quelli mostrati nella pagina /prezzi?
 * Scrive un avviso nel log se no (non blocca niente).
 */
export async function checkPrices({ fetchImpl } = {}) {
  if (!config.paddle.enabled) return [];
  const problems = [];
  for (const [interval, id] of Object.entries(config.paddle.prices)) {
    try {
      const { data: p } = await paddleRequest("GET", `/prices/${encodeURIComponent(id)}`, null, { fetchImpl });
      const expected = PRICES[interval];
      if (p.unit_price?.currency_code !== "EUR") problems.push(`${interval}: valuta ${p.unit_price?.currency_code}, attesa EUR`);
      if (Number(p.unit_price?.amount) !== expected.cents) problems.push(`${interval}: prezzo ${p.unit_price?.amount} centesimi, attesi ${expected.cents}`);
      if (p.billing_cycle?.interval !== interval || p.billing_cycle?.frequency !== 1) problems.push(`${interval}: rinnovo ogni ${p.billing_cycle?.frequency} ${p.billing_cycle?.interval}`);
      if (p.tax_mode === "external") problems.push(`${interval}: il prezzo è IVA esclusa, deve essere IVA inclusa`);
      if (p.status !== "active") problems.push(`${interval}: prezzo non attivo`);
    } catch (err) {
      problems.push(`${interval}: ${err.message}`);
    }
  }
  for (const p of problems) console.warn(`[pagamenti] Prezzo Paddle da controllare — ${p}`);
  return problems;
}
