// Accesso con Google (OAuth 2.0 / OpenID Connect, flusso "authorization code"
// con PKCE). Serve un client OAuth "Applicazione web" creato nella Google
// Cloud Console, con URI di reindirizzamento:
//   <APP_URL>/api/auth/google/callback
import crypto from "node:crypto";
import { Router } from "express";
import { createSession, parseCookies, randomToken } from "../auth.js";
import { config, PRIVACY_VERSION, TERMS_VERSION } from "../config.js";
import { hasDatabase, query } from "../db.js";

const router = Router();
const STATE_COOKIE = "al_google";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

export const googleEnabled = () => config.google.enabled && hasDatabase();
const redirectUri = () => `${config.appUrl}/api/auth/google/callback`;

function stateCookie(value, maxAgeSec) {
  const parts = [`${STATE_COOKIE}=${encodeURIComponent(value)}`, "Path=/api/auth/google", "HttpOnly", "SameSite=Lax", `Max-Age=${maxAgeSec}`];
  if (config.isProduction) parts.push("Secure");
  return parts.join("; ");
}

// Solo percorsi interni: niente redirect verso altri siti.
export const safeNext = (next) => (typeof next === "string" && /^\/(?!\/)[^\s\\]*$/.test(next) ? next : "/calendario");

const fail = (res, code) => res.redirect(`/accedi?errore=${code}`);

// Legge il payload dell'id_token. La firma non serve verificarla: il token
// arriva direttamente da Google sul canale TLS autenticato con il client
// secret (OpenID Connect Core 3.1.3.7). Si controllano emittente,
// destinatario, scadenza e nonce.
export function readIdToken(idToken, { clientId, nonce, now = Date.now() }) {
  const part = String(idToken).split(".")[1];
  if (!part) return null;
  let claims;
  try {
    claims = JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  const issOk = claims.iss === "https://accounts.google.com" || claims.iss === "accounts.google.com";
  const audOk = Array.isArray(claims.aud) ? claims.aud.includes(clientId) : claims.aud === clientId;
  if (!issOk || !audOk || !(claims.exp * 1000 > now) || claims.nonce !== nonce || !claims.sub) return null;
  return claims;
}

router.get("/", (req, res) => {
  if (!googleEnabled()) return fail(res, "google-off");
  const verifier = randomToken();
  const state = {
    s: randomToken(),
    n: randomToken(),
    v: verifier,
    next: safeNext(req.query.next),
    // registrazione: consenso privacy dato nel modulo, marketing facoltativo
    privacy: req.query.privacy === "1",
    marketing: req.query.marketing === "1",
  };
  res.append("Set-Cookie", stateCookie(Buffer.from(JSON.stringify(state)).toString("base64url"), 600));
  const url = new URL(AUTH_URL);
  url.search = new URLSearchParams({
    client_id: config.google.clientId,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: "openid email",
    state: state.s,
    nonce: state.n,
    code_challenge: crypto.createHash("sha256").update(verifier).digest("base64url"),
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();
  res.redirect(url.toString());
});

router.get("/callback", async (req, res, next) => {
  if (!googleEnabled()) return fail(res, "google-off");
  let state = null;
  try {
    state = JSON.parse(Buffer.from(parseCookies(req.headers.cookie)[STATE_COOKIE] ?? "", "base64url").toString("utf8"));
  } catch {
    /* cookie mancante o rovinato */
  }
  res.append("Set-Cookie", stateCookie("", 0));
  if (req.query.error) return fail(res, "google-annullato");
  if (!state?.s || req.query.state !== state.s || !req.query.code) return fail(res, "google");

  try {
    const tokenRes = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: String(req.query.code),
        client_id: config.google.clientId,
        client_secret: config.google.clientSecret,
        redirect_uri: redirectUri(),
        grant_type: "authorization_code",
        code_verifier: state.v,
      }),
    });
    if (!tokenRes.ok) {
      console.warn("[google] scambio del codice non riuscito:", tokenRes.status, await tokenRes.text().catch(() => ""));
      return fail(res, "google");
    }
    const { id_token: idToken } = await tokenRes.json();
    const claims = readIdToken(idToken, { clientId: config.google.clientId, nonce: state.n });
    if (!claims) return fail(res, "google");
    if (!claims.email || claims.email_verified !== true) return fail(res, "google-email");
    const email = String(claims.email).trim().toLowerCase();

    // 1) account già collegato a Google
    let { rows } = await query("SELECT * FROM users WHERE google_sub = $1", [claims.sub]);
    let user = rows[0];
    // 2) account con la stessa email (verificata da Google): lo collego
    if (!user) {
      ({ rows } = await query(
        "UPDATE users SET google_sub = $2, email_verified_at = COALESCE(email_verified_at, now()) WHERE email = $1 AND google_sub IS NULL RETURNING *",
        [email, claims.sub],
      ));
      user = rows[0];
    }
    // 3) nuovo account: serve l'accettazione dell'informativa
    let created = false;
    if (!user) {
      if (!state.privacy) return res.redirect("/registrati?errore=google-nuovo");
      ({ rows } = await query(
        `INSERT INTO users (email, password_hash, google_sub, privacy_version, terms_version, terms_accepted_at, marketing_consent, marketing_consent_at, email_verified_at)
         VALUES ($1, NULL, $2, $3, $5, now(), $4, CASE WHEN $4 THEN now() END, now()) RETURNING *`,
        [email, claims.sub, PRIVACY_VERSION, state.marketing, TERMS_VERSION],
      ));
      user = rows[0];
      created = true;
    }
    await createSession(res, user.id);
    res.redirect(created ? "/account?benvenuto=google" : state.next);
  } catch (err) {
    next(err);
  }
});

export default router;
