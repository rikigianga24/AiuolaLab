import { Router } from "express";
import { z } from "zod";
import {
  createSession,
  destroySession,
  hashPassword,
  hashToken,
  publicUser,
  randomToken,
  rateLimit,
  verifyPassword,
} from "../auth.js";
import { config, PRIVACY_VERSION } from "../config.js";
import { hasDatabase, query } from "../db.js";
import { emailLayout, mailEnabled, sendMail } from "../notify.js";

const router = Router();
const limiter = rateLimit({ max: 20, windowMs: 15 * 60 * 1000 });

const Email = z.string().trim().toLowerCase().email().max(200);
const Password = z.string().min(10, "La password deve avere almeno 10 caratteri").max(200);

router.use((req, res, next) => {
  if (!hasDatabase()) return res.status(503).json({ error: "Account non disponibili: database non configurato" });
  next();
});

async function issueToken(userId, purpose, hours) {
  const token = randomToken();
  await query("DELETE FROM auth_tokens WHERE user_id = $1 AND purpose = $2", [userId, purpose]);
  await query("INSERT INTO auth_tokens (token_hash, user_id, purpose, expires_at) VALUES ($1, $2, $3, now() + $4::interval)", [
    hashToken(token),
    userId,
    purpose,
    `${hours} hours`,
  ]);
  return token;
}

async function consumeToken(token, purpose) {
  const { rows } = await query(
    "DELETE FROM auth_tokens WHERE token_hash = $1 AND purpose = $2 AND expires_at > now() RETURNING user_id",
    [hashToken(String(token)), purpose],
  );
  return rows[0]?.user_id ?? null;
}

async function sendVerification(user) {
  const token = await issueToken(user.id, "verify", 72);
  const url = `${config.appUrl}/account?verifica=${encodeURIComponent(token)}`;
  await sendMail(
    user.email,
    "Conferma il tuo indirizzo email",
    emailLayout({
      title: "Conferma il tuo indirizzo",
      intro: "Benvenuto in AiuolaLab! Conferma l'indirizzo per ricevere i promemoria del calendario e gli avvisi meteo.",
      cta: { label: "Conferma email", url },
      footer: "Se non hai creato tu l'account, ignora questa email.",
    }),
  );
}

router.get("/me", (req, res) => {
  res.json({ user: publicUser(req.user), mail: mailEnabled() });
});

router.post("/register", limiter, async (req, res, next) => {
  const body = z
    .object({ email: Email, password: Password, privacy: z.literal(true), marketing: z.boolean().default(false) })
    .safeParse(req.body);
  if (!body.success) {
    const msg = body.error.issues.find((i) => i.path[0] === "privacy")
      ? "Per registrarti devi accettare l'informativa privacy."
      : (body.error.issues[0]?.message ?? "Dati non validi");
    return res.status(400).json({ error: msg });
  }
  try {
    const { email, password, marketing } = body.data;
    const { rows: exists } = await query("SELECT 1 FROM users WHERE email = $1", [email]);
    if (exists.length) return res.status(409).json({ error: "Esiste già un account con questa email." });
    const { rows } = await query(
      `INSERT INTO users (email, password_hash, privacy_version, marketing_consent, marketing_consent_at, email_verified_at)
       VALUES ($1, $2, $3, $4, CASE WHEN $4 THEN now() END, CASE WHEN $5 THEN now() END) RETURNING *`,
      [email, await hashPassword(password), PRIVACY_VERSION, marketing, !mailEnabled()],
    );
    const user = rows[0];
    await createSession(res, user.id);
    if (mailEnabled()) sendVerification(user).catch((err) => console.warn("[mail] verifica non inviata:", err.message));
    res.status(201).json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.post("/login", limiter, async (req, res, next) => {
  const body = z.object({ email: Email, password: z.string().max(200) }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Email o password non valide." });
  try {
    const { rows } = await query("SELECT * FROM users WHERE email = $1", [body.data.email]);
    const user = rows[0];
    // stesso tempo di risposta anche se l'utente non esiste
    const ok = user ? await verifyPassword(body.data.password, user.password_hash) : await hashPassword("x").then(() => false);
    if (!ok) return res.status(401).json({ error: "Email o password non corrette." });
    await createSession(res, user.id);
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", async (req, res, next) => {
  try {
    await destroySession(req, res);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post("/verify", limiter, async (req, res, next) => {
  try {
    const userId = await consumeToken(req.body?.token ?? "", "verify");
    if (!userId) return res.status(400).json({ error: "Link di conferma non valido o scaduto." });
    await query("UPDATE users SET email_verified_at = now() WHERE id = $1", [userId]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post("/resend-verification", limiter, async (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Accedi per continuare" });
  if (!mailEnabled()) return res.status(503).json({ error: "Email non configurate sul server." });
  try {
    await sendVerification(req.user);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post("/forgot", limiter, async (req, res, next) => {
  const email = Email.safeParse(req.body?.email);
  if (!mailEnabled()) return res.status(503).json({ error: "Recupero password non disponibile: email non configurate." });
  try {
    if (email.success) {
      const { rows } = await query("SELECT id, email FROM users WHERE email = $1", [email.data]);
      if (rows[0]) {
        const token = await issueToken(rows[0].id, "reset", 2);
        await sendMail(
          rows[0].email,
          "Reimposta la password",
          emailLayout({
            title: "Reimposta la password",
            intro: "Hai chiesto di reimpostare la password di AiuolaLab. Il link vale 2 ore.",
            cta: { label: "Scegli una nuova password", url: `${config.appUrl}/account?reset=${encodeURIComponent(token)}` },
            footer: "Se non l'hai chiesto tu, ignora questa email: la password resta invariata.",
          }),
        );
      }
    }
    // risposta identica anche se l'email non esiste
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post("/reset", limiter, async (req, res, next) => {
  const body = z.object({ token: z.string().max(200), password: Password }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.issues[0]?.message ?? "Dati non validi" });
  try {
    const userId = await consumeToken(body.data.token, "reset");
    if (!userId) return res.status(400).json({ error: "Link non valido o scaduto." });
    await query("UPDATE users SET password_hash = $2, email_verified_at = COALESCE(email_verified_at, now()) WHERE id = $1", [
      userId,
      await hashPassword(body.data.password),
    ]);
    await query("DELETE FROM sessions WHERE user_id = $1", [userId]);
    await createSession(res, userId);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
