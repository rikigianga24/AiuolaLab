// Autenticazione: password con scrypt, sessioni in un cookie tecnico httpOnly.
import crypto from "node:crypto";
import { promisify } from "node:util";
import { config } from "./config.js";
import { hasDatabase, query } from "./db.js";

const scrypt = promisify(crypto.scrypt);
const SCRYPT = { N: 16384, r: 8, p: 1 };
export const SESSION_COOKIE = "al_session";
const SESSION_DAYS = 30;

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(password, salt, 64, SCRYPT);
  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password, stored) {
  const [alg, saltB64, keyB64] = String(stored).split("$");
  if (alg !== "scrypt" || !saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, "base64");
  const key = await scrypt(password, Buffer.from(saltB64, "base64"), expected.length, SCRYPT);
  return crypto.timingSafeEqual(key, expected);
}

export const randomToken = () => crypto.randomBytes(32).toString("base64url");
export const hashToken = (t) => crypto.createHash("sha256").update(t).digest("hex");

export function parseCookies(header = "") {
  const out = {};
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    try {
      out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
    } catch {
      /* cookie malformato */
    }
  }
  return out;
}

function cookieString(name, value, maxAgeSec) {
  const parts = [`${name}=${encodeURIComponent(value)}`, "Path=/", "HttpOnly", "SameSite=Lax", `Max-Age=${maxAgeSec}`];
  if (config.isProduction) parts.push("Secure");
  return parts.join("; ");
}

export async function createSession(res, userId) {
  const token = randomToken();
  await query("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, now() + $3::interval)", [
    hashToken(token),
    userId,
    `${SESSION_DAYS} days`,
  ]);
  res.append("Set-Cookie", cookieString(SESSION_COOKIE, token, SESSION_DAYS * 86400));
}

export async function destroySession(req, res) {
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  if (token && hasDatabase()) await query("DELETE FROM sessions WHERE token_hash = $1", [hashToken(token)]);
  res.append("Set-Cookie", cookieString(SESSION_COOKIE, "", 0));
}

// Carica req.user se c'è una sessione valida.
export async function sessionMiddleware(req, res, next) {
  req.user = null;
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  if (!token || !hasDatabase()) return next();
  try {
    const { rows } = await query(
      `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = $1 AND s.expires_at > now()`,
      [hashToken(token)],
    );
    req.user = rows[0] ?? null;
  } catch (err) {
    console.warn("[auth] sessione non leggibile:", err.message);
  }
  next();
}

export function requireUser(req, res, next) {
  if (!hasDatabase()) return res.status(503).json({ error: "Account non disponibili: database non configurato" });
  if (!req.user) return res.status(401).json({ error: "Accedi per continuare" });
  next();
}

// Protezione CSRF: oltre al cookie SameSite=Lax, le richieste che modificano
// dati devono arrivare dalla stessa origine.
export function sameOrigin(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origin = req.get("Origin") || req.get("Referer");
  if (!origin) return next();
  try {
    const o = new URL(origin);
    const allowed = new Set([req.get("Host"), new URL(config.appUrl).host]);
    if (allowed.has(o.host)) return next();
  } catch {
    /* origine non valida */
  }
  res.status(403).json({ error: "Origine della richiesta non consentita" });
}

// Limite semplice per IP (tentativi di accesso, richieste di reset...).
export function rateLimit({ max, windowMs }) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const list = (hits.get(req.ip) || []).filter((t) => t > now - windowMs);
    if (list.length >= max) return res.status(429).json({ error: "Troppi tentativi, riprova tra qualche minuto." });
    list.push(now);
    hits.set(req.ip, list);
    next();
  };
}

export const publicUser = (u) =>
  u && {
    id: u.id,
    email: u.email,
    emailVerified: Boolean(u.email_verified_at),
    hasPassword: Boolean(u.password_hash),
    google: Boolean(u.google_sub),
    marketingConsent: u.marketing_consent,
    createdAt: u.created_at,
    plan: u.plan ?? "free",
    settings: u.settings ?? {},
  };
