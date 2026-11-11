// Abbonamento Premium: pagamento, gestione, disdetta e recesso (Paddle).
import { Router } from "express";
import { z } from "zod";
import { rateLimit, requireUser } from "../auth.js";
import {
  billingEnabled,
  latestSubscription,
  paddleRequest,
  processEvent,
  saveSubscription,
  subscriptionView,
  verifySignature,
  withdrawSubscription,
} from "../billing.js";
import { config, TERMS_VERSION } from "../config.js";
import { query } from "../db.js";
import { reportError } from "../monitor.js";
import { emailLayout, mailEnabled, sendMail } from "../notify.js";

// ---------- avvisi di Paddle (webhook) ----------

/**
 * POST /api/billing/webhook — riceve il corpo originale (express.raw), non
 * passa dal controllo di origine né dalla sessione: chi chiama è Paddle, e
 * vale solo se la firma è giusta.
 */
export async function billingWebhook(req, res) {
  if (!billingEnabled()) return res.status(404).json({ error: "Pagamenti non configurati" });
  if (!verifySignature(req.body, req.get("Paddle-Signature"), config.paddle.webhookSecret)) {
    console.warn("[pagamenti] avviso con firma non valida, scartato");
    return res.status(401).json({ error: "Firma non valida" });
  }
  let event;
  try {
    event = JSON.parse(req.body.toString("utf8"));
  } catch {
    return res.status(400).json({ error: "Corpo non valido" });
  }
  if (!event?.event_id || !event?.event_type) return res.status(400).json({ error: "Avviso non valido" });
  try {
    // lo stesso avviso può arrivare più volte: si applica una volta sola
    const { rowCount } = await query("INSERT INTO billing_events (event_id, event_type) VALUES ($1, $2) ON CONFLICT DO NOTHING", [
      event.event_id,
      event.event_type,
    ]);
    if (!rowCount) return res.json({ ok: true, duplicate: true });
    try {
      const what = await processEvent(event);
      console.log(`[pagamenti] ${event.event_type}: ${what}`);
    } catch (err) {
      // non segnato come ricevuto: Paddle lo rimanda più tardi
      await query("DELETE FROM billing_events WHERE event_id = $1", [event.event_id]).catch(() => {});
      throw err;
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("[pagamenti] avviso non elaborato:", err.message);
    reportError(err, "pagamenti-webhook");
    res.status(500).json({ error: "Avviso non elaborato" });
  }
}

// ---------- azioni dell'utente ----------

const router = Router();
router.use(requireUser);

// pochi tentativi per IP: basta per chi paga davvero
const limiter = rateLimit({ max: 20, windowMs: 60 * 60 * 1000 });

function requireBilling(req, res, next) {
  if (!billingEnabled()) return res.status(503).json({ error: "Gli abbonamenti non sono ancora attivi." });
  next();
}

// Errori di Paddle: messaggio semplice per l'utente, dettaglio nel log.
function paddleFailure(res, err, what) {
  console.error(`[pagamenti] ${what}:`, err.message);
  reportError(err, `pagamenti-${what}`);
  res.status(502).json({ error: "Il servizio di pagamento non risponde in questo momento. Riprova tra qualche minuto." });
}

router.get("/", async (req, res, next) => {
  try {
    const row = await latestSubscription(req.user.id);
    res.json({
      enabled: billingEnabled(),
      plan: req.user.plan ?? "free",
      // Premium assegnato a mano (users.plan), senza abbonamento
      manualPremium: req.user.plan_manual === "premium",
      subscription: subscriptionView(row),
    });
  } catch (err) {
    next(err);
  }
});

// Prepara il pagamento: il browser apre il modulo di Paddle con questo id.
router.post("/checkout", requireBilling, limiter, async (req, res, next) => {
  const body = z.object({ interval: z.enum(["month", "year"]), acceptTerms: z.literal(true) }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Per continuare accetta le condizioni dell'abbonamento." });
  try {
    const current = await latestSubscription(req.user.id);
    if (current && subscriptionView(current).active) {
      return res.status(409).json({ error: "Hai già un abbonamento Premium attivo: lo trovi nella pagina Account." });
    }
    // accettazione dei termini nella versione in vigore, come alla registrazione
    await query("UPDATE users SET terms_version = $2, terms_accepted_at = now() WHERE id = $1", [req.user.id, TERMS_VERSION]);
    let transaction;
    try {
      ({ data: transaction } = await paddleRequest("POST", "/transactions", {
        items: [{ price_id: config.paddle.prices[body.data.interval], quantity: 1 }],
        // chi si è già abbonato in passato resta lo stesso cliente su Paddle
        ...(current?.customer_id ? { customer_id: current.customer_id } : {}),
        custom_data: { user_id: req.user.id },
      }));
    } catch (err) {
      return paddleFailure(res, err, "checkout");
    }
    res.json({ transactionId: transaction.id, email: req.user.email });
  } catch (err) {
    next(err);
  }
});

// Link temporaneo al portale di Paddle: metodo di pagamento, ricevute, disdetta.
router.post("/portal", requireBilling, limiter, async (req, res, next) => {
  try {
    const row = await latestSubscription(req.user.id);
    if (!row) return res.status(404).json({ error: "Nessun abbonamento trovato." });
    try {
      const { data } = await paddleRequest("POST", `/customers/${encodeURIComponent(row.customer_id)}/portal-sessions`, { subscription_ids: [row.id] });
      const links = data.urls?.subscriptions?.[0] ?? {};
      res.json({ url: data.urls?.general?.overview, paymentMethodUrl: links.update_subscription_payment_method ?? null });
    } catch (err) {
      return paddleFailure(res, err, "portale");
    }
  } catch (err) {
    next(err);
  }
});

// Disdetta del rinnovo: Premium resta fino alla fine del periodo pagato.
router.post("/cancel", requireBilling, limiter, async (req, res, next) => {
  try {
    const row = await latestSubscription(req.user.id);
    if (!row || !subscriptionView(row).active) return res.status(404).json({ error: "Nessun abbonamento attivo." });
    try {
      const { data } = await paddleRequest("POST", `/subscriptions/${encodeURIComponent(row.id)}/cancel`, { effective_from: "next_billing_period" });
      await saveSubscription(data);
    } catch (err) {
      return paddleFailure(res, err, "disdetta");
    }
    res.json({ subscription: subscriptionView(await latestSubscription(req.user.id)) });
  } catch (err) {
    next(err);
  }
});

// Ci hai ripensato: toglie la disdetta programmata, l'abbonamento si rinnova.
router.post("/resume", requireBilling, limiter, async (req, res, next) => {
  try {
    const row = await latestSubscription(req.user.id);
    if (!row || !row.cancel_at || !subscriptionView(row).active) return res.status(404).json({ error: "Nessuna disdetta da annullare." });
    try {
      const { data } = await paddleRequest("PATCH", `/subscriptions/${encodeURIComponent(row.id)}`, { scheduled_change: null });
      await saveSubscription(data);
    } catch (err) {
      return paddleFailure(res, err, "riattivazione");
    }
    res.json({ subscription: subscriptionView(await latestSubscription(req.user.id)) });
  } catch (err) {
    next(err);
  }
});

// Recesso entro 14 giorni: fine immediata e rimborso completo.
router.post("/withdraw", requireBilling, limiter, async (req, res, next) => {
  try {
    const row = await latestSubscription(req.user.id);
    if (!row || !subscriptionView(row).canWithdraw) {
      return res.status(400).json({ error: "Il recesso è possibile entro 14 giorni dall'inizio dell'abbonamento." });
    }
    let result;
    try {
      result = await withdrawSubscription(row);
    } catch (err) {
      return paddleFailure(res, err, "recesso");
    }
    const when = new Date().toLocaleString("it-IT", { timeZone: "Europe/Rome", dateStyle: "long", timeStyle: "short" });
    if (result.failed.length) {
      console.error("[pagamenti] rimborsi da fare a mano:", result.failed.join("; "));
      reportError(new Error(`Rimborso non riuscito per ${row.id}: ${result.failed.join("; ")}`), "pagamenti-rimborso");
    }
    // conferma su supporto durevole (email), come chiede il Codice del Consumo
    if (mailEnabled()) {
      await sendMail(
        req.user.email,
        "Recesso dall'abbonamento Premium",
        emailLayout({
          title: "Abbiamo ricevuto il tuo recesso",
          intro: `Il ${when} hai esercitato il diritto di recesso dall'abbonamento Premium di AiuolaLab. L'abbonamento è terminato e non ti verrà più addebitato nulla. Il rimborso completo è stato chiesto a Paddle, che gestisce i pagamenti: arriva sullo stesso metodo di pagamento, di solito entro 5-10 giorni lavorativi. Il tuo account e i tuoi progetti restano, con il piano Gratis.`,
          cta: { label: "Vai al tuo account", url: `${config.appUrl}/account` },
          footer: "Ricevi questa email perché hai chiesto il recesso dal tuo account AiuolaLab.",
        }),
      ).catch((err) => console.warn("[pagamenti] email di recesso non inviata:", err.message));
      if (config.supportEmail) {
        await sendMail(
          config.supportEmail,
          `Recesso Premium: ${req.user.email}`,
          {
            text: `Recesso il ${when}\nAccount: ${req.user.id} (${req.user.email})\nAbbonamento Paddle: ${row.id}\nRimborsi chiesti: ${result.refunded}\n${result.failed.length ? `DA RIMBORSARE A MANO su Paddle: ${result.failed.join("; ")}` : "Nessun intervento necessario."}`,
            html: `<p>Recesso il ${when}</p><p>Account: ${req.user.id}<br>Abbonamento Paddle: ${row.id}<br>Rimborsi chiesti: ${result.refunded}</p>${result.failed.length ? "<p><strong>Rimborso da fare a mano su Paddle</strong> (vedi i log del server).</p>" : ""}`,
          },
        ).catch(() => {});
      }
    }
    res.json({
      subscription: subscriptionView(await latestSubscription(req.user.id)),
      refundRequested: result.refunded > 0 && !result.failed.length,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
