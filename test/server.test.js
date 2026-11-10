// Test di integrazione delle API con un Postgres reale.
// Si attivano solo se è impostata TEST_DATABASE_URL, per esempio:
//   TEST_DATABASE_URL=postgresql://postgres@localhost:5432/postgres npm test
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { after, before, test } from "node:test";

// Password generate a ogni esecuzione: nessuna credenziale scritta nel codice.
const PASSWORD = crypto.randomBytes(12).toString("base64url");
const WRONG = crypto.randomBytes(12).toString("base64url");

const DB = process.env.TEST_DATABASE_URL;
const skip = !DB && "TEST_DATABASE_URL non impostata";

let base, server, pool;

// Finto Gemini: le chiamate a Google sono intercettate, le altre passano.
const realFetch = globalThis.fetch;
const gemini = { calls: 0, fail: null };
const FAKE_PROPOSAL = {
  title: "Aiuola di prova",
  concept: "Lavanda e salvia al sole.",
  plants: [
    { scientific_name: "Lavandula angustifolia", common_name: "Lavanda", candidate_id: null, layer: "media", quantity: 5, spacing_cm: 40, height_cm: 60, flower_colors: ["viola"], bloom_seasons: ["summer"], reason: "Ama il sole." },
  ],
  bloom_calendar: "Estate.",
  care_tips: ["Poca acqua."],
  warnings: [],
};
globalThis.fetch = async (url, opts) => {
  if (!String(url).startsWith("https://generativelanguage.googleapis.com/")) return realFetch(url, opts);
  gemini.calls += 1;
  if (gemini.fail) return new Response(JSON.stringify({ error: { message: "boom" } }), { status: gemini.fail });
  return new Response(
    JSON.stringify({
      candidates: [{ finishReason: "STOP", content: { parts: [{ text: "ragiono...", thought: true }, { text: JSON.stringify(FAKE_PROPOSAL) }] } }],
      usageMetadata: { promptTokenCount: 5000, candidatesTokenCount: 900, thoughtsTokenCount: 300 },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
};

before(async () => {
  if (!DB) return;
  process.env.DATABASE_URL = DB;
  process.env.SCHEDULER = "off";
  process.env.GEMINI_API_KEY = "chiave-finta-per-i-test";
  delete process.env.SMTP_HOST;
  const { initDatabase, query } = await import("../server/db.js");
  await initDatabase();
  await query("DELETE FROM projects WHERE owner_key IN (SELECT 'user:' || id FROM users WHERE email LIKE '%@test.aiuolalab')");
  await query("DELETE FROM users WHERE email LIKE '%@test.aiuolalab'");
  pool = { query };
  const { createApp } = await import("../server/app.js");
  server = createApp().listen(0);
  base = `http://localhost:${server.address().port}`;
});

after(() => server?.close());

function client() {
  let cookie = "";
  return async (path, { method = "GET", body, headers = {} } = {}) => {
    const res = await fetch(base + path, {
      method,
      headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(cookie ? { Cookie: cookie } : {}), ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });
    const set = res.headers.getSetCookie?.() ?? [];
    for (const c of set) {
      const [pair] = c.split(";");
      cookie = pair.endsWith("=") ? "" : pair;
    }
    const data = res.headers.get("content-type")?.includes("json") ? await res.json() : await res.text();
    return { status: res.status, data };
  };
}

test("registrazione, accesso, impostazioni, export e cancellazione", { skip }, async () => {
  const api = client();
  const email = `mario${Date.now()}@test.aiuolalab`;

  let r = await api("/api/auth/register", { method: "POST", body: { email, password: PASSWORD.slice(0, 4), privacy: true } });
  assert.equal(r.status, 400, "password troppo corta");
  r = await api("/api/auth/register", { method: "POST", body: { email, password: PASSWORD, privacy: false } });
  assert.equal(r.status, 400, "privacy obbligatoria");
  r = await api("/api/auth/register", { method: "POST", body: { email, password: PASSWORD, privacy: true } });
  assert.equal(r.status, 201);
  assert.equal(r.data.user.email, email);
  // senza SMTP l'email è considerata verificata
  assert.equal(r.data.user.emailVerified, true);

  r = await api("/api/auth/register", { method: "POST", body: { email, password: PASSWORD, privacy: true } });
  assert.equal(r.status, 409);

  r = await api("/api/auth/me");
  assert.equal(r.data.user.email, email);
  const userId = r.data.user.id;

  // progetto salvato da anonimo con la chiave del dispositivo, poi importato nell'account
  const anon = client();
  const deviceKey = "11111111-2222-4333-8444-" + String(Date.now()).slice(-12).padStart(12, "0");
  r = await anon("/api/projects", { method: "POST", headers: { "X-Owner-Key": deviceKey }, body: { name: "Orto", data: { beds: [], type: "vegetable" } } });
  assert.equal(r.status, 201);
  r = await api("/api/projects", { headers: { "X-Owner-Key": deviceKey } });
  assert.equal(r.data.length, 1, "il progetto del dispositivo passa all'account");

  r = await api("/api/account/settings", { method: "PUT", body: { climate: "nord", location: { lat: 45.07, lon: 7.69, name: "Torino" }, notify: { push: true } } });
  assert.equal(r.status, 200);
  assert.equal(r.data.settings.climate, "nord");
  assert.equal(r.data.settings.notify.emailWeekly, true, "le altre preferenze restano");

  r = await api("/api/account/export");
  assert.equal(r.data.account.email, email);
  assert.equal(r.data.projects.length, 1);

  // CSRF: richiesta da un'altra origine rifiutata
  r = await api("/api/auth/logout", { method: "POST", headers: { Origin: "https://evil.example" } });
  assert.equal(r.status, 403);

  r = await api("/api/auth/logout", { method: "POST" });
  assert.equal(r.status, 200);
  r = await api("/api/auth/me");
  assert.equal(r.data.user, null);

  r = await api("/api/auth/login", { method: "POST", body: { email, password: WRONG } });
  assert.equal(r.status, 401);
  r = await api("/api/auth/login", { method: "POST", body: { email, password: PASSWORD } });
  assert.equal(r.status, 200);

  r = await api("/api/account", { method: "DELETE", body: { password: WRONG } });
  assert.equal(r.status, 401);
  r = await api("/api/account", { method: "DELETE", body: { password: PASSWORD } });
  assert.equal(r.status, 200);
  const { rows } = await pool.query("SELECT count(*)::int AS n FROM projects WHERE owner_key = $1", [`user:${userId}`]);
  assert.equal(rows[0].n, 0, "i progetti dell'utente cancellato sono eliminati");
  r = await api("/api/auth/me");
  assert.equal(r.data.user, null);
});

test("pianificatore: attività di oggi per un utente", { skip }, async () => {
  const { query } = pool;
  const { runForUser } = await import("../server/scheduler.js");
  const { rows } = await query(
    "INSERT INTO users (email, password_hash, privacy_version, settings) VALUES ($1, 'x', 't', $2) RETURNING *",
    [`sched${Date.now()}@test.aiuolalab`, JSON.stringify({ climate: "centro", notify: { push: false, emailWeekly: false, emailWeather: false } })],
  );
  const user = rows[0];
  const sq = [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 2 }, { x: 0, y: 2 }];
  await query("INSERT INTO projects (owner_key, name, data) VALUES ($1, 'G', $2)", [
    `user:${user.id}`,
    JSON.stringify({ type: "garden", beds: [{ id: "b", name: "Aiuola", points: sq, plants: [{ id: "r", name: "Rosa", icon: "rose", x: 1, y: 1, spreadM: 0.6 }] }] }),
  ]);
  const res = await runForUser(user, new Date("2027-02-15T08:00:00Z"));
  assert.ok(res.tasksToday >= 1, "a metà febbraio c'è la potatura delle rose");
  await query("DELETE FROM projects WHERE owner_key = $1", [`user:${user.id}`]);
  await query("DELETE FROM users WHERE id = $1", [user.id]);
});

test("notifiche: chiavi generate una volta e salvate nel database", { skip }, async () => {
  const { initPush, pushEnabled } = await import("../server/notify.js");
  const { config } = await import("../server/config.js");
  if (process.env.VAPID_PUBLIC_KEY) return; // chiavi fornite a mano: niente da generare
  await pool.query("DELETE FROM app_settings WHERE key = 'vapid'");
  config.push.publicKey = config.push.privateKey = null;
  assert.equal(await initPush(), true);
  assert.equal(pushEnabled(), true);
  const first = config.push.publicKey;
  const { rows } = await pool.query("SELECT value FROM app_settings WHERE key = 'vapid'");
  assert.equal(rows[0].value.publicKey, first);
  // al riavvio si riusano le stesse (altrimenti i telefoni iscritti non ricevono più niente)
  config.push.publicKey = config.push.privateKey = null;
  await initPush();
  assert.equal(config.push.publicKey, first);
  const r = await fetch(`${base}/api/health`).then((x) => x.json());
  assert.equal(r.push, true);
  assert.equal(r.vapidPublicKey, first);
});

test("notifiche: pulsanti Fatto e Rimanda e notifica del giorno", { skip }, async () => {
  const api = client();
  const email = `push${Date.now()}@test.aiuolalab`;
  let r = await api("/api/auth/register", { method: "POST", body: { email, password: PASSWORD, privacy: true } });
  assert.equal(r.status, 201);
  const id = "g:potatura:rosa:2027";

  r = await api("/api/account/task-state", { method: "POST", body: { id, action: "done" } });
  assert.equal(r.status, 200);
  assert.ok(r.data.state.done);
  r = await api("/api/auth/me");
  assert.ok(r.data.user.settings.taskState[id].done, "segnata fatta anche nel calendario");
  r = await api("/api/account/task-state", { method: "POST", body: { id, action: "snooze" } });
  assert.ok(r.data.state.snoozedUntil);
  r = await api("/api/account/task-state", { method: "POST", body: { id, action: "boh" } });
  assert.equal(r.status, 400);
  r = await client()("/api/account/task-state", { method: "POST", body: { id, action: "done" } });
  assert.equal(r.status, 401, "serve l'accesso");

  r = await api("/api/account/settings", { method: "PUT", body: { notify: { pushStreak: false } } });
  assert.equal(r.data.settings.notify.pushStreak, false);
  assert.equal(r.data.settings.notify.pushTasks, true);

  // notifica del giorno: una sola anche se il pianificatore gira più volte
  const { runForUser } = await import("../server/scheduler.js");
  const { initPush } = await import("../server/notify.js");
  await initPush();
  await pool.query("UPDATE users SET settings = jsonb_set(settings, '{notify,push}', 'true') WHERE email = $1", [email]);
  const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  const user = rows[0];
  const sq = [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 2 }, { x: 0, y: 2 }];
  await pool.query("INSERT INTO projects (owner_key, name, data) VALUES ($1, 'G', $2)", [
    `user:${user.id}`,
    JSON.stringify({ type: "garden", beds: [{ id: "b", name: "Aiuola", points: sq, plants: [{ id: "r", name: "Rosa", icon: "rose", x: 1, y: 1, spreadM: 0.6 }] }] }),
  ]);
  const when = new Date("2027-02-16T08:00:00Z");
  const first = await runForUser(user, when);
  assert.ok(first.pushed, "c'è qualcosa da dire");
  const again = await runForUser(user, when);
  assert.equal(again.pushed, null, "non si ripete nello stesso giorno");

  await pool.query("DELETE FROM projects WHERE owner_key = $1", [`user:${user.id}`]);
  await pool.query("DELETE FROM users WHERE id = $1", [user.id]);
});

test("consulente IA: accesso, quote per piano, cache e tetto giornaliero", { skip }, async () => {
  const api = client();
  const body = (sunlight = "full_sun", notes) => ({
    bed: { areaM2: 4, widthM: 2, depthM: 2 },
    environment: "garden",
    conditions: { sunlight },
    preferences: { notes: notes ?? `prova ${Date.now()}` },
  });

  let r = await api("/api/health");
  assert.equal(r.data.ai, true);
  r = await api("/api/suggest", { method: "POST", body: body() });
  assert.equal(r.status, 401, "serve un account");

  const email = `ia${Date.now()}@test.aiuolalab`;
  r = await api("/api/auth/register", { method: "POST", body: { email, password: PASSWORD, privacy: true } });
  assert.equal(r.data.user.plan, "free");
  const userId = r.data.user.id;

  r = await api("/api/suggest/quota");
  assert.equal(r.data.plan, "free");
  assert.equal(r.data.remaining, 1);
  assert.equal(r.data.label, "1 proposta ogni 2 giorni");

  // una richiesta fallita non consuma la quota
  gemini.fail = 500;
  r = await api("/api/suggest", { method: "POST", body: body() });
  assert.equal(r.status, 503);
  assert.equal(r.data.quota.remaining, 1);
  gemini.fail = null;

  const first = body("full_sun", `prima ${Date.now()}`);
  const before = gemini.calls;
  r = await api("/api/suggest", { method: "POST", body: first });
  assert.equal(r.status, 200);
  assert.equal(r.data.title, "Aiuola di prova");
  assert.equal(r.data.cached, false);
  assert.equal(r.data.quota.remaining, 0);
  assert.ok(new Date(r.data.quota.nextAt) - Date.now() > 47 * 3600 * 1000, "prossima tra circa 2 giorni");
  assert.equal(gemini.calls, before + 1);
  const { rows: usage } = await pool.query("SELECT input_tokens, output_tokens FROM ai_usage WHERE user_id = $1", [userId]);
  assert.deepEqual(usage, [{ input_tokens: 5000, output_tokens: 1200 }]);

  // stessa richiesta: risposta salvata, nessuna chiamata a Google
  r = await api("/api/suggest", { method: "POST", body: first });
  assert.equal(r.status, 200);
  assert.equal(r.data.cached, true);
  assert.equal(gemini.calls, before + 1);

  // richiesta diversa: quota finita
  r = await api("/api/suggest", { method: "POST", body: body("part_shade") });
  assert.equal(r.status, 429);
  assert.match(r.data.error, /piano Gratis/);

  // premium: 3 al giorno
  await pool.query("UPDATE users SET plan = 'premium' WHERE id = $1", [userId]);
  r = await api("/api/suggest/quota");
  assert.equal(r.data.plan, "premium");
  assert.equal(r.data.remaining, 2);

  // tetto giornaliero di tutta l'app
  const { googleDay } = await import("../server/ai/quota.js");
  await pool.query("INSERT INTO ai_usage (user_id, google_day, created_at) SELECT $1, $2, now() - interval '2 days' FROM generate_series(1, 230)", [userId, googleDay()]);
  r = await api("/api/suggest", { method: "POST", body: body("full_shade") });
  assert.equal(r.status, 429);
  assert.match(r.data.error, /per oggi/);

  r = await api("/api/account/export");
  assert.equal(r.data.account.plan, "premium");

  await pool.query("DELETE FROM users WHERE id = $1", [userId]);
  const { rows: left } = await pool.query("SELECT count(*)::int AS n FROM ai_usage WHERE user_id = $1", [userId]);
  assert.equal(left[0].n, 0, "i dati IA si cancellano con l'account");
});

test("condivisione: link in sola lettura, anteprima e revoca", { skip }, async () => {
  const api = client();
  const owner = { "X-Owner-Key": crypto.randomUUID() };
  const other = { "X-Owner-Key": crypto.randomUUID() };
  const bed = { id: "a1", name: "Aiuola", points: [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 }], plants: [{ id: "p1", name: "Lavanda", x: 1, y: 0.5 }] };
  const created = await api("/api/projects", { method: "POST", headers: owner, body: { name: "Il <mio> balcone", data: { type: "balcony", beds: [bed], budget: { segreto: 1 } } } });
  assert.equal(created.status, 201);
  assert.equal(created.data.shareToken, null);

  // solo il proprietario può creare il link
  assert.equal((await api(`/api/projects/${created.data.id}/share`, { method: "POST", headers: other, body: {} })).status, 404);
  const shared = await api(`/api/projects/${created.data.id}/share`, { method: "POST", headers: owner, body: {} });
  assert.equal(shared.status, 200);
  assert.match(shared.data.shareToken, /^[A-Za-z0-9_-]{16}$/);
  // chiederlo di nuovo restituisce lo stesso link
  const again = await api(`/api/projects/${created.data.id}/share`, { method: "POST", headers: owner, body: {} });
  assert.equal(again.data.shareToken, shared.data.shareToken);

  // chiunque abbia il link lo vede, senza chiave e senza i dati privati
  const pub = await client()(`/api/shared/${shared.data.shareToken}`);
  assert.equal(pub.status, 200);
  assert.equal(pub.data.name, "Il <mio> balcone");
  assert.equal(pub.data.data.type, "balcony");
  assert.equal(pub.data.data.beds[0].plants[0].name, "Lavanda");
  assert.equal(pub.data.data.budget, undefined);

  // le modifiche del proprietario si vedono dal link
  const upd = await api(`/api/projects/${created.data.id}`, { method: "PUT", headers: owner, body: { name: "Balcone nuovo", data: { type: "balcony", beds: [bed, { ...bed, id: "a2" }] } } });
  assert.equal(upd.data.shareToken, shared.data.shareToken);
  assert.equal((await client()(`/api/shared/${shared.data.shareToken}`)).data.data.beds.length, 2);

  // l'HTML della pagina ha già il nome giusto (se il frontend è compilato)
  const page = await client()(`/condiviso/${shared.data.shareToken}`);
  if (page.status === 200 && typeof page.data === "string") {
    assert.match(page.data, /«Balcone nuovo» · progetto su AiuolaLab/);
    assert.match(page.data, /name="robots" content="noindex"/);
  }

  // token non valido o inventato
  assert.equal((await client()("/api/shared/nonvalido")).status, 404);
  assert.equal((await client()(`/api/shared/${"x".repeat(16)}`)).status, 404);

  // revoca: il link smette di funzionare
  assert.equal((await api(`/api/projects/${created.data.id}/share`, { method: "DELETE", headers: other })).status, 404);
  assert.equal((await api(`/api/projects/${created.data.id}/share`, { method: "DELETE", headers: owner })).status, 204);
  assert.equal((await client()(`/api/shared/${shared.data.shareToken}`)).status, 404);
  await api(`/api/projects/${created.data.id}`, { method: "DELETE", headers: owner });
});

test("pagine per Google: sitemap e robots", { skip }, async () => {
  const sitemap = await client()("/sitemap.xml");
  assert.equal(sitemap.status, 200);
  assert.match(sitemap.data, /\/stili\/cottage<\/loc>/);
  const robots = await client()("/robots.txt");
  assert.match(robots.data, /Disallow: \/api\//);
  assert.doesNotMatch(robots.data, /condiviso/);
  assert.match(robots.data, /Sitemap: http:\/\/localhost:\d+\/sitemap.xml/);
});
