// Reindirizzamento dal vecchio indirizzo ...onrender.com al dominio proprio.
import assert from "node:assert/strict";
import http from "node:http";
import { after, before, test } from "node:test";

process.env.APP_URL = "https://aiuolalab.it";
process.env.SCHEDULER = "off";
delete process.env.DATABASE_URL;

const { createApp } = await import("../server/app.js");

let server;
let port;
before(async () => {
  server = createApp().listen(0);
  await new Promise((r) => server.once("listening", r));
  port = server.address().port;
});
after(() => server.close());

// fetch non permette di cambiare l'intestazione Host: si usa http.get
const get = (path, host) =>
  new Promise((resolve, reject) => {
    http
      .get({ port, path, headers: { Host: host } }, (res) => {
        res.resume();
        resolve({ status: res.statusCode, headers: { get: (k) => res.headers[k] } });
      })
      .on("error", reject);
  });

test("il vecchio indirizzo onrender porta al dominio, con percorso e parametri", async () => {
  const res = await get("/stili/mediterraneo?x=1", "aiuolalab.onrender.com");
  assert.equal(res.status, 301);
  assert.equal(res.headers.get("location"), "https://aiuolalab.it/stili/mediterraneo?x=1");
});

test("le chiamate /api sul vecchio indirizzo non vengono spostate", async () => {
  const res = await get("/api/uptime", "aiuolalab.onrender.com");
  assert.equal(res.status, 200);
});

test("sul dominio proprio nessun reindirizzamento", async () => {
  const res = await get("/api/health", "aiuolalab.it");
  assert.equal(res.status, 200);
  const res2 = await get("/robots.txt", "aiuolalab.it");
  assert.equal(res2.status, 200);
});
