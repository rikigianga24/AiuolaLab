// Cerca su Wikimedia Commons le categorie di foto delle singole varietà
// del catalogo (es. "Category:Rosa 'Graham Thomas'") e scrive il risultato
// in server/plants/catalog/fotoVarieta.js.
//
// Uso (serve la rete): node scripts/foto-varieta.mjs [--tutte]
// Senza --tutte controlla solo le varietà non ancora presenti nel file, e
// salva man mano: se Wikimedia rallenta o si interrompe, basta rilanciarlo.
import { writeFileSync } from "node:fs";
import { CATALOG } from "../server/plants/catalog/index.js";
import { FOTO_VARIETA } from "../server/plants/catalog/fotoVarieta.js";
import { categoryCandidates, parseVariety } from "../server/plants/varieties.js";
import { findVarietyCategory } from "../server/plants/wikimedia.js";

const API = "https://commons.wikimedia.org/w/api.php";
const UA = "AiuolaLab/0.3 (script foto varietà)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getUrl(url) {
  for (let i = 0; i < 6; i++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20_000) });
      if (r.ok) return r.json();
    } catch {
      // rete: si riprova
    }
    await sleep(5000 * 2 ** i);
  }
  throw new Error(`Commons non risponde: ${url}`);
}
const api = (params) => getUrl(`${API}?${new URLSearchParams({ format: "json", formatversion: "2", ...params })}`);

const all = process.argv.includes("--tutte");
const found = all ? {} : { ...FOTO_VARIETA };
const names = CATALOG.map((p) => p.scientificName).filter((n) => /'[^']+'/.test(n));
const todo = names.filter((n) => !(n in found));

function save() {
  const sorted = Object.fromEntries(names.filter((n) => n in found).map((n) => [n, found[n]]));
  const out = `// Generato da scripts/foto-varieta.mjs: categorie di Wikimedia Commons con
// foto della singola varietà (null = cercata, nessuna categoria). Non
// modificare a mano: rilancia lo script. Le correzioni a mano vanno in
// FOTO_MANUALI (server/plants/varieties.js).
export const FOTO_VARIETA = ${JSON.stringify(sorted, null, 2)};
`;
  writeFileSync(new URL("../server/plants/catalog/fotoVarieta.js", import.meta.url), out);
}

// prima passata: i nomi più probabili, 50 categorie per richiesta
const wanted = new Map(todo.map((n) => [n, categoryCandidates(n)]));
const titles = [...new Set([...wanted.values()].flat())];
const info = new Map();
for (let i = 0; i < titles.length; i += 50) {
  const res = await api({ action: "query", prop: "categoryinfo", titles: titles.slice(i, i + 50).map((t) => `Category:${t}`).join("|") });
  for (const p of res.query?.pages ?? []) if (!p.missing) info.set(p.title.replace(/^Category:/, ""), p.categoryinfo?.files ?? 0);
  await sleep(1000);
}
const searchTodo = [];
for (const [name, cands] of wanted) {
  const best = cands.find((c) => (info.get(c) ?? 0) > 0);
  if (best) found[name] = best;
  else searchTodo.push(name);
}
save();

// seconda passata: ricerca per titolo per i nomi scritti diversamente
const get = async (url) => {
  await sleep(1500);
  return getUrl(url);
};
let n = 0;
for (const name of searchTodo) {
  found[name] = await findVarietyCategory(parseVariety(name), get);
  if (found[name]) console.log(`  ${name} -> ${found[name]}`);
  if (++n % 10 === 0) save();
}
save();
console.log(`${names.length} varietà, ${Object.values(found).filter(Boolean).length} con categoria su Commons`);
