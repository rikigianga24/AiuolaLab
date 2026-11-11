// Modulo "Contatti": il messaggio arriva per email a SUPPORT_EMAIL, con
// "rispondi a" impostato sull'indirizzo di chi scrive. Non salviamo nulla
// nel database: resta solo l'email nella casella di chi gestisce l'app.
import { Router } from "express";
import { z } from "zod";
import { rateLimit } from "../auth.js";
import { config } from "../config.js";
import { reportError } from "../monitor.js";
import { mailEnabled, sendMail } from "../notify.js";

const router = Router();
// pochi messaggi per IP: basta per chi scrive davvero, ferma lo spam
const limiter = rateLimit({ max: 5, windowMs: 60 * 60 * 1000 });

export const contactEnabled = () => Boolean(config.supportEmail && mailEnabled());

export const TOPICS = {
  aiuto: "Aiuto sull'uso dell'app",
  problema: "Segnalazione di un problema",
  idea: "Idea o suggerimento",
  account: "Account e dati personali",
  altro: "Altro",
};

const Body = z.object({
  email: z.string().trim().toLowerCase().email("Indirizzo email non valido").max(200),
  topic: z.enum(Object.keys(TOPICS)).default("altro"),
  message: z.string().trim().min(10, "Scrivi almeno qualche parola (10 caratteri)").max(5000, "Messaggio troppo lungo (massimo 5000 caratteri)"),
  // campo nascosto: le persone lo lasciano vuoto, i programmi di spam no
  website: z.string().max(200).optional(),
  page: z.string().max(200).optional(),
});

const escape = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** Testo e HTML dell'email che riceve chi gestisce l'app. */
export function contactEmail({ email, topic, message, page }, user) {
  const lines = [
    `Da: ${email}${user ? ` (account n. ${user.id}${user.email !== email ? `, email dell'account ${user.email}` : ""})` : " (senza account)"}`,
    `Argomento: ${TOPICS[topic]}`,
    page ? `Pagina: ${page}` : null,
  ].filter(Boolean);
  const text = `${lines.join("\n")}\n\n${message}\n\nPer rispondere usa "Rispondi": la risposta va direttamente a ${email}.`;
  const html = `<!doctype html><html lang="it"><body style="font-family:Arial,Helvetica,sans-serif;color:#2b2b2b">
  ${lines.map((l) => `<p style="margin:0 0 4px;color:#555">${escape(l)}</p>`).join("")}
  <div style="margin:16px 0;padding:12px 14px;background:#f4efea;border-radius:8px;white-space:pre-wrap">${escape(message)}</div>
  <p style="font-size:12px;color:#777">Per rispondere usa "Rispondi": la risposta va direttamente a ${escape(email)}.</p>
  </body></html>`;
  return { text, html };
}

// prima i controlli, poi il limite: contano solo i messaggi validi
function validate(req, res, next) {
  if (!contactEnabled()) return res.status(503).json({ error: "Il modulo non è attivo: scrivici direttamente per email." });
  const body = Body.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.issues[0]?.message ?? "Dati non validi" });
  req.contact = body.data;
  next();
}

router.post("/", validate, limiter, async (req, res) => {
  // spam: rispondiamo come se fosse andato tutto bene, senza inviare niente
  if (req.contact.website) return res.json({ ok: true });
  try {
    await sendMail(config.supportEmail, `[AiuolaLab] ${TOPICS[req.contact.topic]}`, contactEmail(req.contact, req.user), {
      replyTo: req.contact.email,
    });
    res.json({ ok: true });
  } catch (err) {
    reportError(err, "contatti");
    res.status(502).json({ error: "Non siamo riusciti a inviare il messaggio. Riprova tra qualche minuto." });
  }
});

export default router;
