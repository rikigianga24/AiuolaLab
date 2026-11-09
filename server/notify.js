// Invio di email (SMTP) e notifiche push (Web Push).
import nodemailer from "nodemailer";
import webpush from "web-push";
import { config } from "./config.js";
import { query } from "./db.js";

let transport = null;
if (config.mail.enabled) {
  transport = nodemailer.createTransport({
    host: config.mail.host,
    port: config.mail.port,
    secure: config.mail.secure,
    auth: config.mail.user ? { user: config.mail.user, pass: config.mail.pass } : undefined,
  });
  console.log(`[mail] SMTP attivo (${config.mail.host})`);
} else {
  console.log("[mail] SMTP non configurato: email disattivate.");
}

if (config.push.enabled) {
  webpush.setVapidDetails(config.push.subject, config.push.publicKey, config.push.privateKey);
  console.log("[push] Notifiche push attive.");
}

export const mailEnabled = () => Boolean(transport);
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

export async function sendMail(to, subject, content) {
  if (!transport) return false;
  await transport.sendMail({ from: config.mail.from, to, subject, html: content.html, text: content.text });
  return true;
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
