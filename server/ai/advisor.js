// Consulente IA: propone la composizione di un'aiuola a partire da forma,
// condizioni e preferenze, usando come base le piante del DB.
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { config } from "../config.js";
import { candidatePlants, findByScientificName, getPlant } from "../plants/service.js";
import { CROPS, cropAsPlant, monthsLabel } from "../../src/lib/crops.js";

const client = config.anthropic.enabled ? new Anthropic() : null;

export const SuggestRequest = z.object({
  bed: z.object({
    areaM2: z.number().positive().max(10000),
    widthM: z.number().positive().max(1000),
    depthM: z.number().positive().max(1000),
    viewedFrom: z.enum(["all", "one"]).default("all"),
    container: z
      .object({
        type: z.string().max(40),
        volumeL: z.number().positive().max(5000),
        depthCm: z.number().positive().max(300),
        hanging: z.boolean().default(false),
      })
      .optional(),
  }),
  environment: z.enum(["garden", "balcony", "vegetable"]).default("garden"),
  conditions: z.object({
    sunlight: z.enum(["full_sun", "part_shade", "full_shade"]),
    watering: z.enum(["minimum", "average", "frequent"]).optional(),
    ph: z.enum(["acid", "neutral", "alkaline"]).optional(),
    texture: z.enum(["sandy", "loamy", "clay", "chalky"]).optional(),
    region: z.string().max(120).optional(),
  }),
  preferences: z
    .object({
      colors: z.array(z.string().max(30)).max(8).default([]),
      seasons: z.array(z.enum(["spring", "summer", "autumn", "winter"])).max(4).default([]),
      style: z.string().max(60).optional(),
      maintenance: z.enum(["bassa", "media", "alta"]).optional(),
      maxHeightCm: z.number().int().positive().max(1000).optional(),
      notes: z.string().max(500).optional(),
      pets: z.array(z.enum(["dog", "cat", "horse", "farm", "people"])).max(5).default([]),
      favorites: z.array(z.string().trim().max(120)).max(40).default([]),
    })
    .default({}),
});

const LAYERS = ["alta", "media", "bassa", "copertura"];

// Schema per gli structured output: la risposta è JSON valido per costruzione.
const OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "concept", "plants", "bloom_calendar", "care_tips", "warnings"],
  properties: {
    title: { type: "string", description: "Nome breve del progetto" },
    concept: { type: "string", description: "Idea del progetto in 2-4 frasi" },
    plants: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "scientific_name",
          "common_name",
          "candidate_id",
          "layer",
          "quantity",
          "spacing_cm",
          "height_cm",
          "flower_colors",
          "bloom_seasons",
          "reason",
        ],
        properties: {
          scientific_name: { type: "string" },
          common_name: { type: "string", description: "Nome comune in italiano" },
          candidate_id: {
            anyOf: [{ type: "string" }, { type: "null" }],
            description: "id della pianta candidata se presa dall'elenco, altrimenti null",
          },
          layer: { type: "string", enum: LAYERS },
          quantity: { type: "integer" },
          spacing_cm: { type: "integer", description: "Distanza di impianto tra esemplari" },
          height_cm: { type: "integer", description: "Altezza da adulta" },
          flower_colors: { type: "array", items: { type: "string" } },
          bloom_seasons: { type: "array", items: { type: "string", enum: ["spring", "summer", "autumn", "winter"] } },
          reason: { type: "string", description: "Perché è adatta, una frase" },
        },
      },
    },
    bloom_calendar: { type: "string", description: "Come si susseguono le fioriture nell'anno" },
    care_tips: { type: "array", items: { type: "string" } },
    warnings: { type: "array", items: { type: "string" } },
  },
};

const SYSTEM_PROMPT = `Sei un garden designer esperto di aiuole per giardini italiani.
Progetti composizioni belle e realistiche: piante compatibili tra loro per luce, acqua e terreno, con altezze scalate e fioriture distribuite nell'anno.

Regole:
- Rispetta sempre le condizioni di esposizione, acqua e terreno indicate: non proporre piante che non le tollerano.
- Preferisci le piante dell'elenco di candidate (riporta il loro candidate_id). Puoi aggiungerne altre solo se mancano piante adatte; in quel caso candidate_id è null e il nome scientifico deve essere preciso.
- Le quantità devono stare nell'area disponibile: usa la distanza di impianto (spacing_cm) per calcolarle. Lo spazio occupato da ogni esemplare è circa spacing_cm al quadrato.
- Usa i livelli: "alta" per piante strutturali (al centro se l'aiuola si vede da tutti i lati, sul fondo se si vede da un lato solo), "media" per il riempimento, "bassa" per la bordura, "copertura" per tappezzanti.
- Ripeti poche specie in gruppi (da 3 a 7 specie per aiuole piccole) invece di metterne tante isolate.
- Scrivi in italiano, in modo semplice e pratico.
- Se una pianta proposta è tossica per animali o persone, o attira animali selvatici dannosi (cinghiali, caprioli, istrici), dillo nelle avvertenze.

Vasi e balconi:
- In un vaso scegli piante adatte al volume di terriccio indicato: poche specie (1-3 in un vaso singolo, 2-5 in una fioriera), con distanze di impianto più strette che in piena terra.
- Nei vasi appesi e nelle fioriere da ringhiera privilegia piante ricadenti o compatte (per esempio surfinie, gerani edera, lobelia, bacopa, verbena ricadente, fragole, edera, dicondra) e usa il livello "copertura" o "bassa" per quelle che ricadono oltre il bordo.
Orto:
- Se l'ambiente è un orto proponi solo ortaggi e aromatiche dall'elenco delle candidate, adatti al periodo (semina, trapianto o colture che si possono mettere a dimora nei prossimi 1-2 mesi).
- Rispetta le consociazioni (piante amiche vicine, mai pomodoro con patata o finocchio, legumi lontani da aglio e cipolla) e usa spacing_cm pari alla distanza sulla fila.
- Nel campo reason indica quando seminare/trapiantare e quando si raccoglie.
- In balcone considera vento, riflesso del calore delle pareti e vasi che si asciugano in fretta: indicalo nelle avvertenze se serve.`;

function describeRequest(req, candidates) {
  const { bed, conditions, preferences } = req;
  const lines = [
    "## Dove",
    `- Ambiente: ${{ balcony: "balcone/terrazzo in città", vegetable: "ORTO (ortaggi e aromatiche da coltivare e raccogliere)" }[req.environment] ?? "giardino in piena terra"}`,
    req.environment === "vegetable" && `- Mese attuale: ${new Date().toLocaleDateString("it-IT", { month: "long" })}`,
    bed.container
      ? `- Contenitore: ${bed.container.type}, circa ${bed.container.volumeL} litri di terriccio, profondità ${bed.container.depthCm} cm${bed.container.hanging ? ", APPESO (vista dal basso e di lato)" : ""}`
      : "- Aiuola in piena terra",
    `- Area: ${bed.areaM2.toFixed(2)} m², ingombro circa ${bed.widthM.toFixed(2)} × ${bed.depthM.toFixed(2)} m`,
    !bed.container && `- Si vede da: ${bed.viewedFrom === "one" ? "un lato solo (es. contro un muro)" : "tutti i lati"}`,
    "## Condizioni",
    `- Esposizione: ${conditions.sunlight}`,
    conditions.watering && `- Irrigazione disponibile: ${conditions.watering}`,
    conditions.ph && `- pH terreno: ${conditions.ph}`,
    conditions.texture && `- Tipo di terreno: ${conditions.texture}`,
    conditions.region && `- Zona/clima: ${conditions.region}`,
    "## Preferenze",
    preferences.colors?.length && `- Colori preferiti: ${preferences.colors.join(", ")}`,
    preferences.seasons?.length && `- Fioritura desiderata in: ${preferences.seasons.join(", ")}`,
    preferences.style && `- Stile: ${preferences.style}`,
    preferences.maintenance && `- Manutenzione: ${preferences.maintenance}`,
    preferences.maxHeightCm && `- Altezza massima: ${preferences.maxHeightCm} cm`,
    preferences.notes && `- Note: ${preferences.notes}`,
    preferences.favorites?.length &&
      `- Piante preferite dall'utente (scelte nella pagina Scopri): ${preferences.favorites.join(", ")}. Dagli la precedenza quando sono adatte a esposizione, terreno e spazio; se una non è adatta, non usarla e spiegalo brevemente.`,
    preferences.pets?.length &&
      `- In giardino ci sono: ${preferences.pets.map((p) => ({ dog: "cani", cat: "gatti", horse: "cavalli", farm: "animali da cortile", people: "bambini piccoli" })[p]).join(", ")}. NON proporre piante tossiche per loro (per esempio oleandro, digitale, rododendro, ortensia, gigli ed emerocallidi per i gatti, cipolla e aglio per cani e gatti).`,
    "## Piante candidate dal database",
    candidates.length
      ? candidates.map((p) => `- ${JSON.stringify(compact(p))}`).join("\n")
      : "(nessuna candidata trovata: proponi tu le piante)",
  ];
  return lines.filter(Boolean).join("\n");
}

function compact(p) {
  return {
    id: p.id,
    nome: p.commonName,
    scientifico: p.scientificName,
    ciclo: p.cycle,
    luce: p.sunlight,
    acqua: p.watering,
    ph: p.soil?.ph,
    terreno: p.soil?.texture,
    altezza_cm: p.heightCm,
    larghezza_cm: p.spreadCm,
    colori: p.flowerColors,
    fioritura: p.floweringSeasons,
    sempreverde: p.evergreen,
    tipo: p.group,
    nota: p.description ?? undefined,
    calendario: p.note,
  };
}

function cropCandidates() {
  return CROPS.map((c) => ({
    ...cropAsPlant(c),
    note: `semenzaio ${monthsLabel(c.indoor)}, semina ${monthsLabel(c.direct)}, trapianto ${monthsLabel(c.transplant)}, raccolta ${monthsLabel(c.harvest)}; amiche: ${c.good.join(", ") || "-"}; nemiche: ${c.bad.join(", ") || "-"}${c.varieties.length ? `; varietà: ${c.varieties.map((v) => v.name).join(", ")}` : ""}`,
  }));
}

async function loadCandidates(req) {
  if (req.environment === "vegetable") return cropCandidates();
  const { sunlight, watering, ph, texture } = req.conditions;
  try {
    const groups = req.environment === "balcony" ? ["balcone", "aromatiche", "rose", "perenni", "annuali", "bulbose", "graminacee", "rampicanti"] : undefined;
    return await candidatePlants({ sunlight, watering, ph, texture }, { limit: 60, groups });
  } catch (err) {
    console.warn("[ai] candidate non disponibili:", err.message);
    return [];
  }
}

// Collega ogni pianta proposta a una scheda del DB, se esiste.
async function linkToDatabase(plants, candidates) {
  const byId = new Map(candidates.map((c) => [c.id, c]));
  let lookups = 0;
  return Promise.all(
    plants.map(async (p) => {
      let dbPlant = p.candidate_id ? byId.get(p.candidate_id) : null;
      if (dbPlant && !dbPlant.detailsLoaded) dbPlant = (await getPlant(dbPlant.id).catch(() => null)) ?? dbPlant;
      if (!dbPlant && lookups < 6) {
        lookups += 1;
        dbPlant = await findByScientificName(p.scientific_name).catch(() => null);
      }
      return { ...p, quantity: Math.max(1, Math.min(200, p.quantity)), plant: dbPlant ?? null };
    }),
  );
}

export class AdvisorError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

export async function suggestBed(input) {
  if (!client) throw new AdvisorError("Consulente IA non configurato (manca ANTHROPIC_API_KEY).", 503);
  const req = SuggestRequest.parse(input);
  const candidates = await loadCandidates(req);

  let response;
  try {
    response = await client.beta.messages.create({
      model: config.anthropic.model,
      max_tokens: 16000,
      // Se la richiesta viene rifiutata dai filtri di sicurezza, l'API la
      // riprova in automatico su un modello di riserva.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: OUTPUT_SCHEMA },
      },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: describeRequest(req, candidates) }],
    });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) throw new AdvisorError("Consulente IA occupato, riprova tra poco.", 429);
    if (err instanceof Anthropic.AuthenticationError) throw new AdvisorError("Chiave API del consulente IA non valida.", 503);
    if (err instanceof Anthropic.APIError) throw new AdvisorError(`Errore del consulente IA (${err.status}).`, 502);
    throw err;
  }

  if (response.stop_reason === "refusal") {
    throw new AdvisorError("Il consulente IA non ha potuto elaborare questa richiesta.", 422);
  }
  if (response.stop_reason === "max_tokens") {
    throw new AdvisorError("Risposta del consulente IA incompleta, riprova.", 502);
  }
  const text = response.content.find((b) => b.type === "text")?.text;
  if (!text) throw new AdvisorError("Risposta vuota dal consulente IA.", 502);

  let proposal;
  try {
    proposal = JSON.parse(text);
  } catch {
    throw new AdvisorError("Risposta del consulente IA non valida.", 502);
  }

  return {
    ...proposal,
    plants: await linkToDatabase(proposal.plants ?? [], candidates),
    source: candidates[0]?.source ?? null,
  };
}
