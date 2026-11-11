// Schede dettagliate: completano le righe del catalogo con mesi precisi di
// fioritura, velocità di crescita, consigli d'acqua e particolarità.
//
// Ogni file esporta un array di righe, una per pianta, con campi "|":
//
//   nome scientifico | mesi fioritura | crescita | acqua | particolarità
//
//   nome scientifico  identico a quello della riga del catalogo
//   mesi fioritura    numeri dei mesi: "5-6", "5-6,9-10", "11-3" (a cavallo
//                     d'anno); "-" per le piante coltivate per le foglie
//   crescita          l lenta · m media · r rapida, eventualmente seguita da
//                     ":" e da una frase (es. "m:adulta in 3 anni");
//                     vuoto = valore del genere (generi.js)
//   acqua             frase pratica su quanto e quando bagnare;
//                     vuoto = valore del genere (generi.js)
//   particolarità     consigli ed esperienze di chi la coltiva, separati
//                     da " · "
import { GENERI } from "./generi.js";
import { ROSE } from "./rose.js";
import { PERENNI } from "./perenni.js";
import { ANNUALI } from "./annuali.js";
import { BULBOSE } from "./bulbose.js";
import { ARBUSTI } from "./arbusti.js";
import { RAMPICANTI } from "./rampicanti.js";
import { GRAMINACEE } from "./graminacee.js";
import { AROMATICHE } from "./aromatiche.js";
import { BALCONE } from "./balcone.js";

export const DETAIL_SOURCES = {
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

const RATE = { l: "slow", m: "medium", r: "fast" };

/** "5-6,9-10" -> [5, 6, 9, 10]; "11-2" -> [11, 12, 1, 2]; "-" -> [] */
export function parseMonths(value, errors = []) {
  if (value === "-") return [];
  const out = [];
  for (const part of value.split(",")) {
    const m = /^(\d{1,2})(?:-(\d{1,2}))?$/.exec(part.trim());
    if (!m) {
      errors.push(`mesi: "${part}" non valido`);
      continue;
    }
    const a = Number(m[1]);
    const b = Number(m[2] ?? m[1]);
    if (a < 1 || a > 12 || b < 1 || b > 12) {
      errors.push(`mesi: "${part}" fuori da 1-12`);
      continue;
    }
    for (let i = a; ; i = (i % 12) + 1) {
      if (!out.includes(i)) out.push(i);
      if (i === b) break;
    }
  }
  if (!out.length && value !== "-") errors.push("mesi mancanti");
  return out;
}

function parseGrowth(value, errors) {
  if (!value) return null;
  const [code, ...text] = value.split(":");
  if (!RATE[code.trim()]) {
    errors.push(`crescita: codice "${code}" sconosciuto`);
    return null;
  }
  return { rate: RATE[code.trim()], text: text.join(":").trim() || null };
}

export function parseDetailRow(row) {
  const errors = [];
  const f = row.split("|").map((s) => s.trim());
  if (f.length !== 5) return { name: f[0], detail: null, errors: [`attesi 5 campi, trovati ${f.length}`] };
  const [name, months, growth, water, notes] = f;
  const detail = {
    floweringMonths: parseMonths(months, errors),
    growth: parseGrowth(growth, errors),
    waterNote: water || null,
    highlights: notes
      .split(" · ")
      .map((s) => s.trim())
      .filter(Boolean),
  };
  if (!detail.highlights.length) errors.push("particolarità mancanti");
  return { name, detail, errors };
}

const genusOf = (sci) => sci.split(/\s+/)[0];

/** Valori del genere per crescita e acqua quando la riga li lascia vuoti. */
export function genusDefaults(sci) {
  const g = GENERI[genusOf(sci)];
  if (!g) return { growth: null, waterNote: null };
  const errors = [];
  return { growth: parseGrowth(g.crescita ?? "", errors), waterNote: g.acqua ?? null };
}

function build() {
  const byName = new Map();
  const errors = [];
  for (const [group, rows] of Object.entries(DETAIL_SOURCES)) {
    rows.forEach((row, i) => {
      const { name, detail, errors: rowErrors } = parseDetailRow(row);
      const where = `dettagli/${group}.js riga ${i + 1} (${name})`;
      if (byName.has(name)) rowErrors.push("scheda duplicata");
      if (rowErrors.length) {
        errors.push(...rowErrors.map((e) => `${where}: ${e}`));
        return;
      }
      const def = genusDefaults(name);
      // "m" senza frase: se il genere ha la stessa velocità se ne tiene la frase
      let growth = detail.growth ?? def.growth;
      if (growth && !growth.text && def.growth?.rate === growth.rate) growth = def.growth;
      byName.set(name, { ...detail, growth, waterNote: detail.waterNote ?? def.waterNote });
    });
  }
  return { byName, errors };
}

const built = build();
export const DETAILS = built.byName;
export const DETAIL_ERRORS = built.errors;
