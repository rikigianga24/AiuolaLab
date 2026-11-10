import assert from "node:assert/strict";
import { test } from "node:test";
import { readIdToken, safeNext } from "../server/routes/google.js";

const token = (claims) => `x.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.y`;
const base = { iss: "https://accounts.google.com", aud: "client-1", sub: "123", email: "a@b.it", email_verified: true, nonce: "n1", exp: 2000 };
const opts = { clientId: "client-1", nonce: "n1", now: 1000 * 1000 };

test("google: id_token valido", () => {
  assert.equal(readIdToken(token(base), opts).sub, "123");
});

test("google: id_token rifiutato se emittente, destinatario, scadenza o nonce non tornano", () => {
  assert.equal(readIdToken(token({ ...base, iss: "https://evil.example" }), opts), null);
  assert.equal(readIdToken(token({ ...base, aud: "altro" }), opts), null);
  assert.equal(readIdToken(token({ ...base, exp: 500 }), opts), null);
  assert.equal(readIdToken(token({ ...base, nonce: "n2" }), opts), null);
  assert.equal(readIdToken("rotto", opts), null);
});

test("google: dopo l'accesso solo redirect interni", () => {
  assert.equal(safeNext("/account"), "/account");
  assert.equal(safeNext("/piante?q=rosa"), "/piante?q=rosa");
  assert.equal(safeNext("//evil.example"), "/calendario");
  assert.equal(safeNext("https://evil.example"), "/calendario");
  assert.equal(safeNext("/\\evil.example"), "/calendario");
  assert.equal(safeNext(undefined), "/calendario");
});
