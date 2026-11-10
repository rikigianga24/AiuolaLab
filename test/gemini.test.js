import assert from "node:assert/strict";
import { before, test } from "node:test";

let generateJson, GeminiError, advisor, googleDay;

before(async () => {
  process.env.GEMINI_API_KEY = "chiave-finta-per-i-test";
  ({ generateJson, GeminiError } = await import("../server/ai/gemini.js"));
  advisor = await import("../server/ai/advisor.js");
  ({ googleDay } = await import("../server/ai/quota.js"));
});

const reply = (body, status = 200) => async () => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

test("gemini: richiesta con schema e chiave, risposta senza i pensieri", async () => {
  let sent;
  const fetchImpl = async (url, opts) => {
    sent = { url, opts, body: JSON.parse(opts.body) };
    return reply({
      candidates: [{ finishReason: "STOP", content: { parts: [{ text: "penso", thought: true }, { text: '{"ok":' }, { text: "true}" }] } }],
      usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 20, thoughtsTokenCount: 5 },
    })();
  };
  const r = await generateJson({ system: "sys", prompt: "ciao", schema: { type: "OBJECT" } }, { fetchImpl });
  assert.deepEqual(r, { data: { ok: true }, usage: { input: 100, output: 25 } });
  assert.match(sent.url, /models\/gemini-[^:]+:generateContent$/);
  assert.equal(sent.opts.headers["x-goog-api-key"], "chiave-finta-per-i-test");
  assert.ok(!sent.url.includes("chiave-finta"), "la chiave non va nell'indirizzo");
  assert.equal(sent.body.generationConfig.responseMimeType, "application/json");
  assert.equal(sent.body.generationConfig.thinkingConfig.thinkingBudget, 1024);
  assert.equal(sent.body.systemInstruction.parts[0].text, "sys");
});

test("gemini: errori tradotti in messaggi chiari", async () => {
  const fail = (body, status) => generateJson({ system: "s", prompt: "p", schema: {} }, { fetchImpl: reply(body, status) });
  await assert.rejects(fail({ error: { message: "quota" } }, 429), (e) => e instanceof GeminiError && e.status === 429 && e.quotaExhausted);
  await assert.rejects(fail({ error: { message: "API key not valid" } }, 400), (e) => e.status === 503);
  await assert.rejects(fail({ candidates: [{ finishReason: "MAX_TOKENS", content: { parts: [] } }] }), (e) => e.status === 502);
  await assert.rejects(fail({ candidates: [{ finishReason: "SAFETY" }] }), (e) => e.status === 422);
  await assert.rejects(fail({ promptFeedback: { blockReason: "OTHER" } }), (e) => e.status === 422);
  await assert.rejects(fail({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: "non json" }] } }] }), (e) => e.status === 502);
});

test("consulente: richiesta compatta e chiave di cache stabile", async () => {
  const req = advisor.SuggestRequest.parse({ bed: { areaM2: 6, widthM: 3, depthM: 2 }, conditions: { sunlight: "full_sun" } });
  const candidates = await advisor._internal.loadCandidates(req);
  assert.ok(candidates.length > 0 && candidates.length <= 40);
  const prompt = advisor._internal.describeRequest(req, candidates);
  // circa 4 caratteri per token: restiamo sotto i ~6.000 token in entrata
  assert.ok(prompt.length + advisor._internal.SYSTEM_PROMPT.length < 24000, `prompt di ${prompt.length} caratteri`);
  assert.equal(advisor.cacheKey(req), advisor.cacheKey(structuredClone(req)));
  const other = advisor.SuggestRequest.parse({ bed: { areaM2: 6, widthM: 3, depthM: 2 }, conditions: { sunlight: "part_shade" } });
  assert.notEqual(advisor.cacheKey(req), advisor.cacheKey(other));
});

test("giorno di Google: fuso di Los Angeles", () => {
  assert.equal(googleDay(new Date("2026-11-10T07:00:00Z")), "2026-11-09");
  assert.equal(googleDay(new Date("2026-11-10T09:00:00Z")), "2026-11-10");
});
