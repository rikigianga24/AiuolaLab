// Account: preferenze, notifiche, export e cancellazione dei dati (GDPR).
import { Router } from "express";
import { z } from "zod";
import { destroySession, publicUser, requireUser, verifyPassword } from "../auth.js";
import { cancelAllForUser } from "../billing.js";
import { reportError } from "../monitor.js";
import { config } from "../config.js";
import { query } from "../db.js";
import { emailLayout, mailEnabled, pushEnabled, sendMail, sendPush } from "../notify.js";
import { testMessage } from "../pushMessages.js";

const router = Router();
router.use(requireUser);

const Settings = z
  .object({
    climate: z.enum(["nord", "centro", "sud"]),
    location: z
      .object({ lat: z.number().min(-90).max(90), lon: z.number().min(-180).max(180), name: z.string().max(120) })
      .nullable(),
    notify: z.object({
      push: z.boolean(),
      emailWeekly: z.boolean(),
      emailWeather: z.boolean(),
      hour: z.number().int().min(5).max(21),
      pushTasks: z.boolean(),
      pushWeather: z.boolean(),
      pushStreak: z.boolean(),
    }).partial(),
    pets: z.array(z.enum(["dog", "cat", "horse", "farm", "people"])).max(5),
    // piante "mi piace": chiave, tipo e copia ridotta della scheda
    favorites: z
      .array(
        z.object({
          key: z.string().max(200),
          kind: z.enum(["plant", "crop"]),
          cropId: z.string().max(60).optional(),
          plant: z.record(z.string(), z.unknown()).optional(),
          at: z.string().max(30).optional(),
        }),
      )
      .max(300),
    artStyle: z.enum(["tempera", "classico"]),
    taskState: z.record(z.string().max(300), z.object({ done: z.string().max(10).optional(), snoozedUntil: z.string().max(10).optional() })),
  })
  .partial();

export const DEFAULT_SETTINGS = {
  climate: "centro",
  location: null,
  notify: { push: false, pushTasks: true, pushWeather: true, pushStreak: true, emailWeekly: true, emailWeather: true, hour: config.notifyHour },
  taskState: {},
  pets: [],
  favorites: [],
  artStyle: "tempera",
};

export const userSettings = (u) => ({
  ...DEFAULT_SETTINGS,
  ...(u.settings ?? {}),
  notify: { ...DEFAULT_SETTINGS.notify, ...(u.settings?.notify ?? {}) },
});

router.get("/", (req, res) => {
  res.json({
    user: publicUser(req.user),
    settings: userSettings(req.user),
    features: { mail: mailEnabled(), push: pushEnabled(), vapidPublicKey: config.push.publicKey ?? null },
  });
});

router.put("/settings", async (req, res, next) => {
  const body = Settings.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Impostazioni non valide" });
  if (JSON.stringify(body.data).length > 300_000) return res.status(413).json({ error: "Troppi dati" });
  try {
    const current = userSettings(req.user);
    const next = { ...current, ...body.data, notify: { ...current.notify, ...(body.data.notify ?? {}) } };
    await query("UPDATE users SET settings = $2 WHERE id = $1", [req.user.id, JSON.stringify(next)]);
    res.json({ settings: next });
  } catch (err) {
    next(err);
  }
});

router.put("/consents", async (req, res, next) => {
  const body = z.object({ marketing: z.boolean() }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Dati non validi" });
  try {
    await query("UPDATE users SET marketing_consent = $2, marketing_consent_at = now() WHERE id = $1", [req.user.id, body.data.marketing]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ---- notifiche push ----

router.post("/push", async (req, res, next) => {
  const body = z
    .object({ endpoint: z.string().url().max(1000), keys: z.object({ p256dh: z.string().max(200), auth: z.string().max(100) }) })
    .safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Iscrizione non valida" });
  if (!pushEnabled()) return res.status(503).json({ error: "Notifiche push non configurate sul server" });
  try {
    await query(
      `INSERT INTO push_subscriptions (endpoint, user_id, keys) VALUES ($1, $2, $3)
       ON CONFLICT (endpoint) DO UPDATE SET user_id = EXCLUDED.user_id, keys = EXCLUDED.keys`,
      [body.data.endpoint, req.user.id, JSON.stringify(body.data.keys)],
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.delete("/push", async (req, res, next) => {
  try {
    const endpoint = z.string().max(1000).safeParse(req.body?.endpoint);
    if (endpoint.success) await query("DELETE FROM push_subscriptions WHERE endpoint = $1 AND user_id = $2", [endpoint.data, req.user.id]);
    else await query("DELETE FROM push_subscriptions WHERE user_id = $1", [req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Pulsanti "Fatto" e "Tra una settimana" toccati direttamente nella notifica.
router.post("/task-state", async (req, res, next) => {
  const body = z.object({ id: z.string().max(300), action: z.enum(["done", "snooze", "undo"]) }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Richiesta non valida" });
  try {
    const current = userSettings(req.user);
    const today = new Date().toISOString().slice(0, 10);
    const later = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    const entry = body.data.action === "done" ? { done: today } : body.data.action === "snooze" ? { snoozedUntil: later } : {};
    const next = { ...current, taskState: { ...current.taskState, [body.data.id]: entry } };
    await query("UPDATE users SET settings = $2 WHERE id = $1", [req.user.id, JSON.stringify(next)]);
    res.json({ ok: true, state: entry });
  } catch (err) {
    next(err);
  }
});

router.post("/test-notification", async (req, res, next) => {
  try {
    const pushes = await sendPush(req.user.id, testMessage());
    let mail = false;
    if (req.body?.email && req.user.email_verified_at) {
      mail = await sendMail(
        req.user.email,
        "Prova delle notifiche",
        emailLayout({ title: "Le email funzionano", intro: "Riceverai qui il riepilogo settimanale e gli avvisi meteo importanti." }),
      );
    }
    res.json({ pushes, mail });
  } catch (err) {
    next(err);
  }
});

// ---- GDPR: accesso/portabilità e cancellazione ----

router.get("/export", async (req, res, next) => {
  try {
    const { rows: projects } = await query("SELECT id, name, data, created_at, updated_at FROM projects WHERE owner_key = $1", [
      `user:${req.user.id}`,
    ]);
    const { rows: devices } = await query("SELECT created_at FROM push_subscriptions WHERE user_id = $1", [req.user.id]);
    const { rows: aiUsage } = await query("SELECT created_at FROM ai_usage WHERE user_id = $1 ORDER BY created_at", [req.user.id]);
    const { rows: subscriptions } = await query(
      `SELECT status, billing_interval AS interval, started_at, current_period_end, cancel_at, withdrawn_at
       FROM subscriptions WHERE user_id = $1 ORDER BY created_at`,
      [req.user.id],
    );
    const u = req.user;
    res.setHeader("Content-Disposition", 'attachment; filename="aiuolalab-dati.json"');
    res.json({
      exportedAt: new Date().toISOString(),
      account: {
        email: u.email,
        createdAt: u.created_at,
        emailVerifiedAt: u.email_verified_at,
        privacyVersion: u.privacy_version,
        privacyAcceptedAt: u.privacy_accepted_at,
        termsVersion: u.terms_version ?? null,
        termsAcceptedAt: u.terms_accepted_at ?? null,
        marketingConsent: u.marketing_consent,
        marketingConsentAt: u.marketing_consent_at,
        plan: u.plan ?? "free",
      },
      subscriptions,
      settings: userSettings(u),
      projects,
      pushDevices: devices.length,
      aiProposals: aiUsage.map((r) => r.created_at),
    });
  } catch (err) {
    next(err);
  }
});

router.delete("/", async (req, res, next) => {
  const body = z.object({ password: z.string().max(200).optional(), confirm: z.string().max(20).optional() }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Inserisci la password per confermare" });
  try {
    // chi accede solo con Google non ha una password: conferma scrivendo ELIMINA
    if (req.user.password_hash) {
      if (!(await verifyPassword(body.data.password ?? "", req.user.password_hash))) {
        return res.status(401).json({ error: "Password non corretta" });
      }
    } else if (body.data.confirm?.trim().toUpperCase() !== "ELIMINA") {
      return res.status(400).json({ error: "Scrivi ELIMINA per confermare" });
    }
    // prima si chiude l'abbonamento: senza account non potrebbe più disdirlo
    try {
      await cancelAllForUser(req.user.id);
    } catch (err) {
      console.error("[account] abbonamento non disdetto, cancellazione sospesa:", err.message);
      reportError(err, "account-cancellazione-abbonamento");
      return res.status(502).json({
        error: "Non riusciamo a disdire il tuo abbonamento Premium in questo momento, quindi l'account non è stato cancellato. Riprova tra qualche minuto o scrivici dalla pagina Contatti.",
      });
    }
    await query("DELETE FROM projects WHERE owner_key = $1", [`user:${req.user.id}`]);
    await query("DELETE FROM users WHERE id = $1", [req.user.id]); // sessioni, token, push e log in cascata
    await destroySession(req, res);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
