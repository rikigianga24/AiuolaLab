// Quote del consulente IA: per utente (secondo il piano) e per tutta l'app
// (tetto giornaliero sotto il limite gratuito di Google).
import { config } from "../config.js";
import { query } from "../db.js";
import { PLANS, planOf, quotaLabel, quotaStatus } from "../../src/lib/plans.js";

// Giorno secondo Google: le quote gratuite si azzerano a mezzanotte di Los Angeles.
export function googleDay(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(now);
}

// Stato della quota di un utente, più il tetto globale.
export async function aiQuota(user, now = new Date()) {
  const plan = planOf(user);
  const ai = PLANS[plan].ai;
  const [{ rows: mine }, { rows: day }] = await Promise.all([
    query("SELECT created_at FROM ai_usage WHERE user_id = $1 AND created_at > $2 ORDER BY created_at", [
      user.id,
      new Date(now.getTime() - ai.hours * 3600 * 1000),
    ]),
    query("SELECT count(*)::int AS n FROM ai_usage WHERE google_day = $1", [googleDay(now)]),
  ]);
  const status = quotaStatus(
    mine.map((r) => r.created_at),
    ai,
    now.getTime(),
  );
  return {
    plan,
    planLabel: PLANS[plan].label,
    limit: ai.count,
    hours: ai.hours,
    label: quotaLabel(ai),
    ...status,
    globalExhausted: day[0].n >= config.gemini.dailyLimit,
  };
}

// Registra la proposta prima di chiamare Google (conta subito anche se la
// risposta arriva dopo un minuto); se la chiamata fallisce si annulla.
export async function reserveAi(user, now = new Date()) {
  const { rows } = await query("INSERT INTO ai_usage (user_id, google_day, created_at) VALUES ($1, $2, $3) RETURNING id", [
    user.id,
    googleDay(now),
    now,
  ]);
  return rows[0].id;
}

export const releaseAi = (id) => query("DELETE FROM ai_usage WHERE id = $1", [id]);

export const recordUsage = (id, usage) =>
  query("UPDATE ai_usage SET input_tokens = $2, output_tokens = $3 WHERE id = $1", [id, usage?.input ?? null, usage?.output ?? null]);

export async function cachedProposal(key) {
  const { rows } = await query("SELECT data FROM ai_cache WHERE cache_key = $1 AND created_at > now() - interval '30 days'", [key]);
  return rows[0]?.data ?? null;
}

export const storeProposal = (key, data) =>
  query(
    `INSERT INTO ai_cache (cache_key, data) VALUES ($1, $2)
     ON CONFLICT (cache_key) DO UPDATE SET data = EXCLUDED.data, created_at = now()`,
    [key, data],
  );
