// Client minimo per l'API Gemini di Google (generateContent via HTTPS).
// La chiave resta solo sul server e viaggia nell'intestazione x-goog-api-key.
import { config } from "../config.js";

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export class GeminiError extends Error {
  constructor(message, status = 502, { quotaExhausted = false } = {}) {
    super(message);
    this.status = status;
    this.quotaExhausted = quotaExhausted;
  }
}

// Motivi di stop che indicano un blocco dei filtri di sicurezza.
const BLOCKED = new Set(["SAFETY", "RECITATION", "BLOCKLIST", "PROHIBITED_CONTENT", "SPII", "IMAGE_SAFETY"]);

/**
 * Chiede a Gemini una risposta JSON conforme a `schema` (formato OpenAPI di Gemini).
 * Ritorna { data, usage: { input, output } }.
 */
export async function generateJson({ system, prompt, schema, maxOutputTokens = 8192 }, { fetchImpl = fetch } = {}) {
  const { apiKey, model, thinkingBudget, timeoutMs } = config.gemini;
  const generationConfig = {
    responseMimeType: "application/json",
    responseSchema: schema,
    maxOutputTokens,
    temperature: 0.7,
  };
  // Il "ragionamento" consuma token di uscita: lo limitiamo (null = lascia decidere al modello).
  if (thinkingBudget != null) generationConfig.thinkingConfig = { thinkingBudget };

  let res;
  try {
    res = await fetchImpl(`${BASE}/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    if (err.name === "TimeoutError") throw new GeminiError("Il consulente IA ci mette troppo, riprova tra poco.", 504);
    throw new GeminiError("Consulente IA non raggiungibile, riprova tra poco.", 502);
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = body?.error?.message ?? "";
    console.warn(`[ai] Gemini ha risposto ${res.status}: ${msg.slice(0, 200)}`);
    if (res.status === 429) {
      throw new GeminiError("Il consulente IA ha esaurito le richieste disponibili per oggi, riprova domani.", 429, { quotaExhausted: true });
    }
    if (res.status === 401 || res.status === 403 || /api key/i.test(msg)) {
      throw new GeminiError("Chiave API del consulente IA non valida.", 503);
    }
    if (res.status === 503 || res.status === 500) throw new GeminiError("Consulente IA occupato, riprova tra poco.", 503);
    throw new GeminiError(`Errore del consulente IA (${res.status}).`, 502);
  }

  if (body.promptFeedback?.blockReason) {
    throw new GeminiError("Il consulente IA non ha potuto elaborare questa richiesta.", 422);
  }
  const candidate = body.candidates?.[0];
  const reason = candidate?.finishReason;
  if (BLOCKED.has(reason)) throw new GeminiError("Il consulente IA non ha potuto elaborare questa richiesta.", 422);
  if (reason === "MAX_TOKENS") throw new GeminiError("Risposta del consulente IA incompleta, riprova.", 502);

  const text = (candidate?.content?.parts ?? [])
    .filter((p) => !p.thought && typeof p.text === "string")
    .map((p) => p.text)
    .join("");
  if (!text) throw new GeminiError("Risposta vuota dal consulente IA.", 502);

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new GeminiError("Risposta del consulente IA non valida.", 502);
  }
  const u = body.usageMetadata ?? {};
  return {
    data,
    usage: {
      input: u.promptTokenCount ?? null,
      output: (u.candidatesTokenCount ?? 0) + (u.thoughtsTokenCount ?? 0) || null,
    },
  };
}
