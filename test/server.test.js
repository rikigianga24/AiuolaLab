// Test di integrazione delle API con un Postgres reale.
// Si attivano solo se è impostata TEST_DATABASE_URL, per esempio:
//   TEST_DATABASE_URL=postgresql://postgres@localhost:5432/postgres npm test
import assert from "node:assert/strict";
import { after, before, test } from "node:test";

const DB = process.env.TEST_DATABASE_URL;
const skip = !DB && "TEST_DATABASE_URL non impostata";

let base, server, pool;

before(async () => {
  if (!DB) return;
  process.env.DATABASE_URL = DB;
  process.env.SCHEDULER = "off";
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

  let r = await api("/api/auth/register", { method: "POST", body: { email, password: "corta", privacy: true } });
  assert.equal(r.status, 400, "password troppo corta");
  r = await api("/api/auth/register", { method: "POST", body: { email, password: "unapasswordlunga", privacy: false } });
  assert.equal(r.status, 400, "privacy obbligatoria");
  r = await api("/api/auth/register", { method: "POST", body: { email, password: "unapasswordlunga", privacy: true } });
  assert.equal(r.status, 201);
  assert.equal(r.data.user.email, email);
  // senza SMTP l'email è considerata verificata
  assert.equal(r.data.user.emailVerified, true);

  r = await api("/api/auth/register", { method: "POST", body: { email, password: "unapasswordlunga", privacy: true } });
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

  r = await api("/api/auth/login", { method: "POST", body: { email, password: "sbagliatasbagliata" } });
  assert.equal(r.status, 401);
  r = await api("/api/auth/login", { method: "POST", body: { email, password: "unapasswordlunga" } });
  assert.equal(r.status, 200);

  r = await api("/api/account", { method: "DELETE", body: { password: "sbagliata" } });
  assert.equal(r.status, 401);
  r = await api("/api/account", { method: "DELETE", body: { password: "unapasswordlunga" } });
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
