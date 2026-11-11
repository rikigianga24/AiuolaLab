import assert from "node:assert/strict";
import { test } from "node:test";
import { scrubEvent, scrubUrl } from "../src/lib/scrub.js";

test("scrub: i link perdono parametri e codici di condivisione", () => {
  assert.equal(scrubUrl("https://aiuolalab.it/account?verifica=abc123"), "https://aiuolalab.it/account");
  assert.equal(scrubUrl("https://aiuolalab.it/account?reset=xyz#top"), "https://aiuolalab.it/account");
  assert.equal(scrubUrl("https://aiuolalab.it/condiviso/Ab3dEf6hIj9kLm2n"), "https://aiuolalab.it/condiviso/[codice]");
  assert.equal(scrubUrl("/api/shared/Ab3dEf6hIj9kLm2n"), "/api/shared/[codice]");
  assert.equal(scrubUrl("/piante"), "/piante");
  assert.equal(scrubUrl(undefined), undefined);
});

test("scrub: dagli eventi degli errori restano solo dati tecnici", () => {
  const ev = scrubEvent({
    request: { method: "POST", url: "https://x.it/api/shared/segreto?a=1", headers: { cookie: "al_session=1" }, data: "{}" },
    user: { id: 3, email: "a@esempio.it", ip_address: "1.2.3.4" },
    breadcrumbs: [{ category: "navigation", data: { from: "/condiviso/abc", to: "/account?reset=tok" } }],
  });
  assert.deepEqual(ev.request, { method: "POST", url: "https://x.it/api/shared/[codice]" });
  assert.deepEqual(ev.user, { id: 3 });
  assert.deepEqual(ev.breadcrumbs[0].data, { from: "/condiviso/[codice]", to: "/account" });
});
