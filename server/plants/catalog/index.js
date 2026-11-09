// Catalogo piante di AiuolaLab: schede scritte a mano, in italiano, pensate
// per giardini, balconi e orti italiani. È la fonte dati predefinita.
//
// Ogni file del catalogo esporta un array di righe di testo, una per pianta,
// con i campi separati da "|":
//
//   nome scientifico | nome comune | ciclo | esposizione | acqua | pH |
//   terreno | altezza cm | larghezza cm | colori | fioritura | zone USDA |
//   sempreverde | nota
//
// Codici:
//   ciclo        P perenne · A annuale · B biennale
//   esposizione  S sole · P mezz'ombra · O ombra          (anche più lettere)
//   acqua        1 poca · 2 media · 3 tanta
//   pH           a acido · n neutro · b basico (calcareo)
//   terreno      s sabbioso · m medio impasto · c argilloso · k calcareo
//   colori       B bianco · G giallo · O arancio · R rosso · P rosa ·
//                V viola · Z blu · E verde
//   fioritura    p primavera · e estate · a autunno · i inverno
//   altezza, larghezza  in cm, "min-max" oppure un numero solo
//   zone         rusticità USDA minima-massima, es. 5-9
//   sempreverde  s se sempreverde, altrimenti vuoto
//   nota         facoltativa: costitutore, profumo, consigli...
//
// Nel nome comune "~" viene sostituito dalla varietà tra apici del nome
// scientifico: "Echinacea purpurea 'Magnus'" + "Echinacea ~" diventa
// "Echinacea 'Magnus'".
import { ROSE } from "./rose.js";
import { PERENNI } from "./perenni.js";
import { ANNUALI } from "./annuali.js";
import { BULBOSE } from "./bulbose.js";
import { ARBUSTI } from "./arbusti.js";
import { RAMPICANTI } from "./rampicanti.js";
import { GRAMINACEE } from "./graminacee.js";
import { AROMATICHE } from "./aromatiche.js";
import { BALCONE } from "./balcone.js";

export const SOURCES = {
  rose: ROSE,
  perenni: PERENNI,
  annuali: ANNUALI,
  bulbose: BULBOSE,
  arbusti: ARBUSTI,
  rampicanti: RAMPICANTI,
  graminacee: GRAMINACEE,
  aromatiche: AROMATICHE,
  balcone: BALCONE,
};

const CYCLE = { P: "perennial", A: "annual", B: "biennial" };
const SUN = { S: "full_sun", P: "part_shade", O: "full_shade" };
const WATER = { 1: "minimum", 2: "average", 3: "frequent" };
const PH = { a: "acid", n: "neutral", b: "alkaline" };
const SOIL = { s: "sandy", m: "loamy", c: "clay", k: "chalky" };
const COLOR = { B: "white", G: "yellow", O: "orange", R: "red", P: "pink", V: "purple", Z: "blue", E: "green" };
const SEASON = { p: "spring", e: "summer", a: "autumn", i: "winter" };

export const slug = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function codes(value, dict, field, errors) {
  const out = [];
  for (const ch of value) {
    if (!(ch in dict)) errors.push(`${field}: codice "${ch}" sconosciuto`);
    else if (!out.includes(dict[ch])) out.push(dict[ch]);
  }
  return out;
}

function range(value, field, errors) {
  const m = /^(\d+)(?:-(\d+))?$/.exec(value);
  if (!m) {
    errors.push(`${field}: atteso "min-max" o un numero, trovato "${value}"`);
    return null;
  }
  const [min, max] = [Number(m[1]), Number(m[2] ?? m[1])];
  if (min > max) errors.push(`${field}: minimo maggiore del massimo`);
  return { min, max };
}

/** Converte una riga del catalogo nella scheda comune delle piante. */
export function parseRow(row, group) {
  const errors = [];
  const f = row.split("|").map((s) => s.trim());
  if (f.length < 13 || f.length > 14) {
    return { plant: null, errors: [`attesi 13 o 14 campi, trovati ${f.length}`] };
  }
  const [sci, commonRaw, cycle, sun, water, ph, soil, h, w, colors, seasons, zones, evergreen, note = ""] = f;
  if (!sci) errors.push("nome scientifico mancante");
  const cultivar = /'[^']+'/.exec(sci)?.[0];
  if (commonRaw.includes("~") && !cultivar) errors.push("«~» nel nome comune ma nessuna varietà tra apici");
  const commonName = cultivar ? commonRaw.replace("~", cultivar) : commonRaw;
  if (!commonName) errors.push("nome comune mancante");
  if (!CYCLE[cycle]) errors.push(`ciclo "${cycle}" sconosciuto`);
  if (!WATER[water]) errors.push(`acqua "${water}" sconosciuta`);
  if (evergreen && evergreen !== "s") errors.push(`sempreverde: atteso "s" o vuoto, trovato "${evergreen}"`);
  const sunlight = codes(sun, SUN, "esposizione", errors);
  if (!sunlight.length) errors.push("esposizione mancante");
  const hardiness = range(zones, "zone", errors);
  if (hardiness && (hardiness.min < 1 || hardiness.max > 13)) errors.push("zone fuori scala (1-13)");

  const plant = {
    id: `catalogo:${slug(sci)}`,
    source: "catalogo",
    externalId: slug(sci),
    commonName,
    scientificName: sci,
    otherNames: [],
    group,
    family: null,
    cycle: CYCLE[cycle] ?? null,
    type: group === "graminacee" && /grass|carex|festuca|stipa|miscanth|pennisetum|panicum|calamagr|molinia|briza|deschampsia|sesleria|hakonechloa|imperata|eragrostis|muhlenbergia|anemanthele/i.test(sci) ? "grass" : null,
    sunlight,
    watering: WATER[water] ?? null,
    soil: { ph: codes(ph, PH, "pH", errors), texture: codes(soil, SOIL, "terreno", errors) },
    heightCm: range(h, "altezza", errors),
    spreadCm: range(w, "larghezza", errors),
    flowerColors: codes(colors, COLOR, "colori", errors),
    floweringSeasons: codes(seasons, SEASON, "fioritura", errors),
    hardiness,
    evergreen: evergreen === "s",
    droughtTolerant: water === "1",
    maintenance: null,
    description: note || null,
    image: null,
    detailsLoaded: true,
  };
  return { plant, errors };
}

function build() {
  const plants = [];
  const errors = [];
  const seen = new Set();
  for (const [group, rows] of Object.entries(SOURCES)) {
    rows.forEach((row, i) => {
      const { plant, errors: rowErrors } = parseRow(row, group);
      const where = `${group}.js riga ${i + 1} (${row.split("|")[0]})`;
      if (plant && seen.has(plant.externalId)) rowErrors.push("pianta duplicata");
      if (rowErrors.length) {
        errors.push(...rowErrors.map((e) => `${where}: ${e}`));
        return;
      }
      seen.add(plant.externalId);
      plants.push(plant);
    });
  }
  plants.sort((a, b) => a.commonName.localeCompare(b.commonName, "it"));
  return { plants, errors };
}

const built = build();

/** Tutte le schede valide, in ordine alfabetico di nome comune. */
export const CATALOG = built.plants;
/** Righe scartate perché scritte male (controllate dai test). */
export const CATALOG_ERRORS = built.errors;
export const CATALOG_BY_ID = new Map(CATALOG.map((p) => [p.externalId, p]));
