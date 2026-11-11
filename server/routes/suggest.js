import { Router } from "express";
import { ZodError } from "zod";
import { AdvisorError, SuggestRequest, cacheKey, suggestBed } from "../ai/advisor.js";
import { aiQuota, cachedProposal, recordUsage, releaseAi, reserveAi, storeProposal } from "../ai/quota.js";
import { config } from "../config.js";
import { hasDatabase } from "../db.js";

const router = Router();

// Il consulente richiede la chiave di Google e il database (per le quote).
function available(req, res, next) {
  if (!config.gemini.enabled || !hasDatabase()) {
    return res.status(503).json({ error: "Il consulente IA non è attivo in questo momento." });
  }
  if (!req.user) return res.status(401).json({ error: "Accedi o registrati gratis per ricevere le proposte del consulente IA." });
  next();
}

// Una proposta alla volta per utente: senza questo, più richieste partite
// insieme leggerebbero tutte la quota prima che la prima la consumi.
const inFlight = new Set();

const globalMessage = "Il consulente IA ha finito le proposte disponibili per oggi: riprova domani mattina.";

function quotaMessage(q) {
  const when = new Date(q.nextAt).toLocaleString("it-IT", {
    timeZone: "Europe/Rome",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `Hai già usato le proposte del piano ${q.planLabel} (${q.label}). La prossima sarà disponibile ${when}.`;
}

router.get("/quota", available, async (req, res, next) => {
  try {
    res.json(await aiQuota(req.user));
  } catch (err) {
    next(err);
  }
});

router.post("/", available, async (req, res, next) => {
  let request;
  try {
    request = SuggestRequest.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) return res.status(400).json({ error: "Dati dell'aiuola non validi" });
    return next(err);
  }

  if (inFlight.has(req.user.id)) {
    return res.status(429).json({ error: "Sto già preparando una proposta: aspetta che sia pronta." });
  }
  inFlight.add(req.user.id);
  let reservation = null;
  try {
    // Stessa richiesta già fatta (da chiunque): risposta salvata, non consuma quota.
    const key = cacheKey(request);
    const cached = await cachedProposal(key);
    if (cached) return res.json({ ...cached, cached: true, quota: await aiQuota(req.user) });

    const quota = await aiQuota(req.user);
    if (quota.remaining <= 0) return res.status(429).json({ error: quotaMessage(quota), quota });
    if (quota.globalExhausted) return res.status(429).json({ error: globalMessage, quota });

    reservation = await reserveAi(req.user);
    const { proposal, usage } = await suggestBed(request);
    await recordUsage(reservation, usage).catch(() => {});
    await storeProposal(key, proposal).catch((err) => console.warn("[ai] cache non salvata:", err.message));
    console.log(`[ai] proposta per ${req.user.id}: ${usage?.input ?? "?"} token in, ${usage?.output ?? "?"} token out`);
    res.json({ ...proposal, cached: false, quota: await aiQuota(req.user) });
  } catch (err) {
    // Proposta non riuscita: non la contiamo all'utente.
    if (reservation) await releaseAi(reservation).catch(() => {});
    if (err instanceof AdvisorError || err.status) {
      const quota = await aiQuota(req.user).catch(() => null);
      return res.status(err.status).json({ error: err.quotaExhausted ? globalMessage : err.message, quota });
    }
    next(err);
  } finally {
    inFlight.delete(req.user.id);
  }
});

export default router;
