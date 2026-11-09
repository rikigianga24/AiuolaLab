import assert from "node:assert/strict";
import { test } from "node:test";

// configurazione come su Render: chiave API di Brevo, niente SMTP
process.env.BREVO_API_KEY = "chiave-di-prova";
process.env.MAIL_FROM = "AiuolaLab <ciao@esempio.it>";
delete process.env.SMTP_HOST;

const { mailEnabled, parseSender, sendMail } = await import("../server/notify.js");

test("email: mittente letto da MAIL_FROM", () => {
  assert.deepEqual(parseSender("AiuolaLab <ciao@esempio.it>"), { name: "AiuolaLab", email: "ciao@esempio.it", valid: true });
  assert.deepEqual(parseSender('"Riccardo" <r@esempio.it>'), { name: "Riccardo", email: "r@esempio.it", valid: true });
  assert.deepEqual(parseSender("solo@esempio.it"), { email: "solo@esempio.it", valid: true });
  // come scritto nel pannello di Render, con le virgolette dell'esempio
  assert.deepEqual(parseSender('"AiuolaLab <ciao@esempio.it>"'), { name: "AiuolaLab", email: "ciao@esempio.it", valid: true });
  assert.deepEqual(parseSender(" 'AiuolaLab' < ciao@esempio.it > "), { name: "AiuolaLab", email: "ciao@esempio.it", valid: true });
  // anche senza le parentesi angolari
  assert.deepEqual(parseSender("AiuolaLab noreply@aiuolalab.it"), { name: "AiuolaLab", email: "noreply@aiuolalab.it", valid: true });
  assert.equal(parseSender("AiuolaLab").valid, false);
  assert.equal(parseSender("").valid, false);
});

test("email: invio tramite l'API di Brevo (HTTPS, non bloccata da Render)", async () => {
  assert.equal(mailEnabled(), true);
  let req = null;
  const fetchImpl = async (url, opts) => {
    req = { url, opts, body: JSON.parse(opts.body) };
    return { ok: true, text: async () => "" };
  };
  const ok = await sendMail("utente@esempio.it", "Conferma", { html: "<p>Ciao</p>", text: "Ciao" }, { fetchImpl });
  assert.equal(ok, true);
  assert.equal(req.url, "https://api.brevo.com/v3/smtp/email");
  assert.equal(req.opts.headers["api-key"], "chiave-di-prova");
  assert.deepEqual(req.body.sender, { name: "AiuolaLab", email: "ciao@esempio.it" });
  assert.deepEqual(req.body.to, [{ email: "utente@esempio.it" }]);
  assert.equal(req.body.subject, "Conferma");
});

test("email: errore di Brevo riportato con il motivo", async () => {
  const fetchImpl = async () => ({ ok: false, status: 401, text: async () => '{"message":"Key not found"}' });
  await assert.rejects(() => sendMail("u@esempio.it", "x", { html: "", text: "" }, { fetchImpl }), /Brevo 401: .*Key not found/);
});
