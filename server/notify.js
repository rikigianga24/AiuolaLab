// Invio di email (API di Brevo o SMTP) e notifiche push (Web Push).
import nodemailer from "nodemailer";
import webpush from "web-push";
import { config } from "./config.js";
import { query } from "./db.js";

let transport = null;
if (config.mail.brevoApiKey) {
  console.log("[mail] Email attive tramite l'API di Brevo");
} else if (config.mail.enabled) {
  transport = nodemailer.createTransport({
    host: config.mail.host,
    port: config.mail.port,
    secure: config.mail.secure,
    auth: config.mail.user ? { user: config.mail.user, pass: config.mail.pass } : undefined,
    // se la porta è bloccata (es. Render gratuito) meglio un errore rapido
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
  });
  console.log(`[mail] SMTP attivo (${config.mail.host})`);
} else {
  console.log("[mail] Email non configurate: imposta BREVO_API_KEY (consigliato) oppure SMTP_HOST.");
}

if (config.push.enabled) {
  webpush.setVapidDetails(config.push.subject, config.push.publicKey, config.push.privateKey);
  console.log("[push] Notifiche push attive.");
}

export const mailEnabled = () => Boolean(config.mail.brevoApiKey || transport);
export const pushEnabled = () => config.push.enabled;

const escape = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Impaginazione comune delle email.
export function emailLayout({ title, intro, sections = [], cta, footer }) {
  const blocks = sections
    .map(
      (s) => `<h2 style="font-size:16px;color:#2f3e2f;margin:20px 0 8px">${escape(s.title)}</h2>
      <ul style="padding-left:18px;margin:0">${s.items
        .map((i) => `<li style="margin-bottom:8px"><strong>${escape(i.title)}</strong>${i.detail ? `<br><span style="color:#555">${escape(i.detail)}</span>` : ""}</li>`)
        .join("")}</ul>`,
    )
    .join("");
  const html = `<!doctype html><html lang="it"><body style="margin:0;background:#f4efea;font-family:Arial,Helvetica,sans-serif;color:#2b2b2b">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <div style="background:#2f3e2f;color:#fff;padding:14px 18px;border-radius:12px 12px 0 0;font-weight:bold">AiuolaLab</div>
    <div style="background:#fff;padding:20px 18px;border-radius:0 0 12px 12px">
      <h1 style="font-size:20px;color:#2f3e2f;margin:0 0 10px">${escape(title)}</h1>
      ${intro ? `<p style="margin:0 0 10px">${escape(intro)}</p>` : ""}
      ${blocks}
      ${cta ? `<p style="margin:22px 0 6px"><a href="${escape(cta.url)}" style="background:#4f7942;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;display:inline-block">${escape(cta.label)}</a></p>` : ""}
    </div>
    <p style="font-size:12px;color:#777;margin-top:14px">${escape(footer ?? "Ricevi questa email perché hai un account AiuolaLab.")}
    Puoi cambiare le preferenze dal tuo <a href="${escape(config.appUrl)}/account" style="color:#4f7942">account</a>.</p>
  </div></body></html>`;
  const text = [
    title,
    intro,
    ...sections.flatMap((s) => [`\n${s.title}`, ...s.items.map((i) => `- ${i.title}${i.detail ? `: ${i.detail}` : ""}`)]),
    cta ? `\n${cta.label}: ${cta.url}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  return { html, text };
}

// "AiuolaLab <noreply@sito.it>" -> { name: "AiuolaLab", email: "noreply@sito.it" }
// Accetta anche le virgolette messe nel pannello di Render (lì non vengono tolte).
const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;
export function parseSender(from) {
  let t = String(from ?? "").trim();
  while (/^["'].*["']$/.test(t)) t = t.slice(1, -1).trim();
  // "Nome <email>" oppure anche "Nome email" (senza parentesi)
  const m = t.match(/^(.*?)<\s*([^>]+?)\s*>\s*$/) ?? t.match(/^(.*\S)\s+(\S+@\S+)$/);
  const name = m ? m[1].replace(/["']/g, "").trim() : "";
  const email = (m ? m[2] : t).replace(/["']/g, "").trim();
  return { ...(name ? { name } : {}), email, valid: EMAIL_RE.test(email) };
}

function senderForBrevo() {
  const { valid, ...sender } = parseSender(config.mail.from);
  if (!valid) throw new Error(`mittente non valido in MAIL_FROM («${config.mail.from}»): scrivi per esempio AiuolaLab <la-tua-email@dominio.it>, senza virgolette`);
  return sender;
}

async function sendViaBrevo(to, subject, content, fetchImpl = fetch) {
  const r = await fetchImpl("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": config.mail.brevoApiKey, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ sender: senderForBrevo(), to: [{ email: to }], subject, htmlContent: content.html, textContent: content.text }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!r.ok) {
    const detail = await r.text().catch(() => "");
    throw new Error(`Brevo ${r.status}: ${detail.slice(0, 200)}`);
  }
}

export async function sendMail(to, subject, content, { fetchImpl } = {}) {
  try {
    if (config.mail.brevoApiKey) await sendViaBrevo(to, subject, content, fetchImpl);
    else if (transport) await transport.sendMail({ from: config.mail.from, to, subject, html: content.html, text: content.text });
    else return false;
    return true;
  } catch (err) {
    console.warn(`[mail] invio a ${to.replace(/^(.).*@/, "$1***@")} non riuscito: ${err.message}`);
    throw err;
  }
}

// Invia una notifica a tutti i dispositivi dell'utente; rimuove quelli scaduti.
export async function sendPush(userId, payload) {
  if (!config.push.enabled) return 0;
  const { rows } = await query("SELECT endpoint, keys FROM push_subscriptions WHERE user_id = $1", [userId]);
  let sent = 0;
  for (const row of rows) {
    try {
      await webpush.sendNotification({ endpoint: row.endpoint, keys: row.keys }, JSON.stringify(payload), { TTL: 6 * 3600 });
      sent += 1;
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        await query("DELETE FROM push_subscriptions WHERE endpoint = $1", [row.endpoint]);
      } else {
        console.warn("[push] invio fallito:", err.statusCode ?? err.message);
      }
    }
  }
  return sent;
}
