import assert from "node:assert/strict";
import { after, before, test } from "node:test";

// email con l'API di Brevo e indirizzo che riceve i messaggi, niente database
process.env.BREVO_API_KEY = "chiave-di-prova";
process.env.MAIL_FROM = "AiuolaLab <ciao@esempio.it>";
process.env.SUPPORT_EMAIL = "aiuto@esempio.it";
process.env.SCHEDULER = "off";
delete process.env.DATABASE_URL;
delete process.env.SMTP_HOST;

const { createApp } = await import("../server/app.js");
const { contactEmail } = await import("../server/routes/contact.js");

// le chiamate a Brevo vengono intercettate, le altre passano
const sent = [];
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, opts) => {
  if (String(url).startsWith("https://api.brevo.com/")) {
    sent.push(JSON.parse(opts.body));
    return new Response("{}", { status: 201 });
  }
  return realFetch(url, opts);
};

let server;
let base;
before(async () => {
  server = createApp().listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => {
  server.close();
  globalThis.fetch = realFetch;
});

const post = (body) =>
  realFetch(`${base}/api/contact`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

test("contatti: il messaggio arriva per email con «rispondi a» chi scrive", async () => {
  const health = await realFetch(`${base}/api/health`).then((r) => r.json());
  assert.equal(health.contact, true);
  sent.length = 0;
  const r = await post({ email: "Mario@Esempio.it", topic: "problema", message: "Il disegno non si salva <b>più</b>" });
  assert.equal(r.status, 200);
  assert.equal(sent.length, 1);
  assert.deepEqual(sent[0].to, [{ email: "aiuto@esempio.it" }]);
  assert.deepEqual(sent[0].replyTo, { email: "mario@esempio.it" });
  assert.match(sent[0].subject, /Segnalazione di un problema/);
  assert.ok(sent[0].htmlContent.includes("&lt;b&gt;più&lt;/b&gt;"), "il testo del messaggio è protetto nell'HTML");
});

test("contatti: dati non validi e spam", async () => {
  sent.length = 0;
  assert.equal((await post({ email: "non-una-email", message: "Messaggio abbastanza lungo" })).status, 400);
  assert.equal((await post({ email: "a@esempio.it", message: "corto" })).status, 400);
  assert.equal((await post({ email: "a@esempio.it", topic: "boh", message: "Messaggio abbastanza lungo" })).status, 400);
  // campo trappola compilato: risposta normale, ma niente email
  const r = await post({ email: "a@esempio.it", message: "Compra subito i nostri prodotti", website: "http://spam.example" });
  assert.equal(r.status, 200);
  assert.equal(sent.length, 0);
});

test("contatti: testo dell'email con e senza account", () => {
  const anon = contactEmail({ email: "a@esempio.it", topic: "idea", message: "Ciao" }, null);
  assert.match(anon.text, /senza account/);
  assert.match(anon.text, /Argomento: Idea o suggerimento/);
  const withUser = contactEmail({ email: "b@esempio.it", topic: "account", message: "Ciao", page: "/account" }, { id: 7, email: "c@esempio.it" });
  assert.match(withUser.text, /account n\. 7, email dell'account c@esempio\.it/);
  assert.match(withUser.text, /Pagina: \/account/);
});

test("uptime: risponde 200 anche senza database", async () => {
  const r = await realFetch(`${base}/api/uptime`);
  assert.equal(r.status, 200);
  assert.equal((await r.json()).ok, true);
});

test("contatti: se l'email non parte l'errore è chiaro", async () => {
  const prev = globalThis.fetch;
  globalThis.fetch = async (url, opts) =>
    String(url).startsWith("https://api.brevo.com/") ? new Response("Key not found", { status: 401 }) : prev(url, opts);
  try {
    const r = await post({ email: "a@esempio.it", message: "Messaggio abbastanza lungo" });
    assert.equal(r.status, 502);
    assert.match((await r.json()).error, /Riprova tra qualche minuto/);
  } finally {
    globalThis.fetch = prev;
  }
});
