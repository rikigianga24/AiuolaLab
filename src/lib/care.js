// Calendario di cura: genera le attività (potature, concimazioni,
// trattamenti, semine, raccolte...) per le piante dei progetti, con date
// spostate in base alla zona climatica.
//
// Usato sia dal browser (pagina Calendario) sia dal server (notifiche).
import { CROP_BY_ID, FAMILIES } from "./crops.js";
import { iconForPlaced } from "./plantIcons.js";

export const TASK_KINDS = {
  potatura: { label: "Potatura", icon: "fa-scissors", color: "#8a5a2b" },
  concimazione: { label: "Concimazione", icon: "fa-flask", color: "#6a8f2f" },
  trattamento: { label: "Difesa", icon: "fa-shield-halved", color: "#b5542c" },
  semina: { label: "Semina", icon: "fa-seedling", color: "#4f7942" },
  trapianto: { label: "Trapianto", icon: "fa-trowel", color: "#7a6a3a" },
  raccolta: { label: "Raccolta", icon: "fa-basket-shopping", color: "#c47a2c" },
  cura: { label: "Cura", icon: "fa-hand-holding-heart", color: "#3f7a8f" },
  irrigazione: { label: "Irrigazione", icon: "fa-droplet", color: "#2f80ed" },
};

// Spostamento in giorni rispetto al Centro Italia: al Nord la primavera
// arriva dopo e l'autunno prima, al Sud il contrario.
export function zoneOffset(month, climate = "centro") {
  if (climate === "centro") return 0;
  const springSummer = month >= 2 && month <= 7;
  const sign = climate === "nord" ? 1 : -1;
  return (springSummer ? 10 : -10) * sign;
}

const pad = (n) => String(n).padStart(2, "0");
const iso = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const addDays = (d, n) => new Date(d.getTime() + n * 86400000);

function windowDates(year, [from, to], climate) {
  const start = addDays(new Date(Date.UTC(year, from - 1, 1)), zoneOffset(from, climate));
  const endYear = to < from ? year + 1 : year;
  const end = addDays(new Date(Date.UTC(endYear, to, 0)), zoneOffset(to, climate));
  return { start: iso(start), end: iso(end) };
}

const nameOf = (p) => `${p.name ?? ""} ${p.scientificName ?? ""}`.toLowerCase();
const typeOf = (p) => iconForPlaced(p).type;
const isType = (...types) => (p) => types.includes(typeOf(p));
const nameMatch = (re) => (p) => re.test(nameOf(p));
const and = (...fns) => (p) => fns.every((f) => f(p));
const not = (fn) => (p) => !fn(p);

// ---- regole per piante ornamentali (si applicano alla singola specie) ----
const ROSE = nameMatch(/\brosa\b|\brose\b|rosa /);
const PLANT_RULES = [
  { id: "rose-prune", match: ROSE, window: [2, 3], kind: "potatura", title: "Potatura delle rose",
    detail: "Accorcia i rami a 3–5 gemme con un taglio inclinato sopra una gemma rivolta verso l'esterno; elimina legno secco e rami che si incrociano." },
  { id: "rose-feed", match: ROSE, window: [3, 4], kind: "concimazione", title: "Concima le rose",
    detail: "Concime organico o specifico per rose a lenta cessione, interrato leggermente intorno alla pianta.", product: "concime per rose" },
  { id: "rose-potassium", match: ROSE, window: [6, 6], kind: "concimazione", title: "Concime al potassio per le rose",
    detail: "Dopo la prima fioritura un concime ricco di potassio stimola la rifioritura e rinforza i tessuti.", product: "concime potassico" },
  { id: "rose-fungi", match: ROSE, window: [4, 6], kind: "trattamento", title: "Controlla oidio e ticchiolatura sulle rose",
    detail: "Macchie nere o polvere bianca sulle foglie: togli le foglie colpite e, se serve, tratta con prodotti a base di zolfo o rame.", product: "zolfo bagnabile" },
  { id: "deadhead", match: and(isType("flower", "daisy", "rose", "cluster", "star"), not(nameMatch(/ortensi|hydrang/))), window: [6, 8], kind: "cura",
    title: "Togli i fiori appassiti", detail: "Eliminare i fiori sfioriti prolunga la fioritura e mantiene la pianta in ordine." },
  { id: "lavender-prune", match: nameMatch(/lavand/), window: [8, 9], kind: "potatura", title: "Pota la lavanda",
    detail: "Dopo la fioritura accorcia di circa un terzo dando una forma a cupola, senza tagliare nel legno vecchio senza foglie." },
  { id: "hydrangea-prune", match: nameMatch(/ortensi|hydrang/), window: [3, 3], kind: "potatura", title: "Pota le ortensie",
    detail: "Togli i fiori secchi tagliando sopra la prima coppia di gemme gonfie ed elimina i rami deboli o secchi." },
  { id: "hydrangea-feed", match: nameMatch(/ortensi|hydrang/), window: [4, 4], kind: "concimazione", title: "Concime acidificante per le ortensie",
    detail: "Un concime per acidofile mantiene il terreno acido (e il blu dei fiori, nelle varietà che cambiano colore).", product: "concime per acidofile" },
  { id: "acid-feed", match: nameMatch(/rododendr|azalea|camell|pieris|erica/), window: [3, 3], kind: "concimazione", title: "Concime per acidofile",
    detail: "Concime specifico per piante acidofile all'inizio della ripresa vegetativa.", product: "concime per acidofile" },
  { id: "grass-cut", match: isType("grass"), window: [2, 3], kind: "potatura", title: "Taglia le graminacee",
    detail: "Taglia il ciuffo secco a 10–15 cm da terra prima che spunti la nuova vegetazione." },
  { id: "perennial-feed", match: and(isType("flower", "daisy", "spike", "cluster", "foliage", "groundcover"), not(nameMatch(/lavand|rosmarin|timo|thymus/))), window: [3, 4], kind: "concimazione",
    title: "Concime di inizio stagione", detail: "Concime organico granulare a lenta cessione, sparso intorno alle piante e interrato leggermente.", product: "concime organico granulare" },
  { id: "perennial-cut", match: isType("daisy", "spike", "cluster"), window: [11, 11], kind: "potatura", title: "Taglio autunnale delle perenni",
    detail: "Taglia gli steli secchi delle erbacee perenni; lascia qualche infiorescenza per uccelli e insetti utili." },
  { id: "bulb-leaves", match: isType("cup", "star"), window: [4, 5], kind: "cura", title: "Lascia seccare le foglie dei bulbi",
    detail: "Dopo la fioritura non tagliare le foglie finché non sono gialle: nutrono il bulbo per l'anno prossimo." },
  { id: "bulb-plant", match: isType("cup", "star"), window: [10, 11], kind: "trapianto", title: "Periodo per piantare nuovi bulbi primaverili",
    detail: "Interra i bulbi a una profondità pari a 2–3 volte la loro altezza, con la punta verso l'alto.", product: "bulbi primaverili" },
  { id: "slugs", match: nameMatch(/hosta|lattuga|fragol|basilic/), window: [4, 5], kind: "trattamento", title: "Attenzione a lumache e chiocciole",
    detail: "Controlla la sera dopo la pioggia; usa esche a base di fosfato ferrico, ammesse in agricoltura biologica.", product: "esca per lumache al fosfato ferrico" },
  { id: "box-prune-1", match: nameMatch(/bosso|buxus/), window: [5, 6], kind: "potatura", title: "Prima potatura del bosso",
    detail: "Rifila la forma con cesoie ben affilate in una giornata nuvolosa. Controlla la presenza della piralide del bosso." },
  { id: "box-prune-2", match: nameMatch(/bosso|buxus/), window: [9, 9], kind: "potatura", title: "Seconda potatura del bosso",
    detail: "Ultima rifinitura dell'anno, leggera, per arrivare all'inverno con una forma ordinata." },
  { id: "shrub-prune", match: and(isType("shrub"), not(nameMatch(/bosso|buxus/))), window: [5, 6], kind: "potatura", title: "Pota gli arbusti dopo la fioritura",
    detail: "Accorcia i rami che hanno fiorito e togli quelli vecchi alla base per rinnovare la pianta." },
  { id: "groundcover-trim", match: isType("groundcover"), window: [7, 7], kind: "potatura", title: "Rifinisci le tappezzanti",
    detail: "Dopo la fioritura una tosatura leggera le mantiene compatte." },
];

// ---- regole per ortaggi ----
const CROP_RULES = [
  { id: "stake", match: (c) => ["pomodoro", "peperone", "melanzana"].includes(c.id), window: [5, 6], kind: "cura", title: "Tutori e legature",
    detail: "Lega le piante ai tutori man mano che crescono, senza stringere." },
  { id: "sucker", match: (c) => c.id === "pomodoro", window: [6, 8], kind: "potatura", title: "Sfemminella i pomodori",
    detail: "Togli ogni settimana i germogli che nascono all'ascella delle foglie, quando sono lunghi pochi centimetri." },
  { id: "fruit-potassium", match: (c) => c.icon === "fruiting" || c.family === "cucurbitacee", window: [6, 6], kind: "concimazione", title: "Concime al potassio alla fioritura",
    detail: "All'inizio della fruttificazione un concime ricco di potassio migliora sapore e conservazione.", product: "concime per ortaggi da frutto" },
  { id: "earth-up", match: (c) => ["patata", "porro"].includes(c.id), window: [5, 6], kind: "cura", title: "Rincalza",
    detail: "Accumula terra alla base delle piante: protegge i tuberi dalla luce (patate) e imbianca i fusti (porri)." },
  { id: "cabbage-butterfly", match: (c) => c.family === "brassicacee" && c.icon === "brassica", window: [7, 9], kind: "trattamento", title: "Controlla la cavolaia",
    detail: "Cerca uova e bruchi sotto le foglie; in caso di attacco usa Bacillus thuringiensis, ammesso in biologico.", product: "Bacillus thuringiensis" },
  { id: "powdery", match: (c) => c.family === "cucurbitacee", window: [7, 8], kind: "trattamento", title: "Previeni l'oidio",
    detail: "Polvere bianca sulle foglie: irriga alla base e non sulle foglie, togli le foglie colpite; si può usare zolfo.", product: "zolfo bagnabile" },
];

const ACTIONS = [
  ["indoor", "semina", "Semina in semenzaio"],
  ["direct", "semina", "Semina in piena terra"],
  ["transplant", "trapianto", "Trapianta"],
  ["harvest", "raccolta", "Periodo di raccolta"],
];

function runs(months = []) {
  const sorted = [...new Set(months)].sort((a, b) => a - b);
  const out = [];
  for (const m of sorted) {
    const last = out.at(-1);
    if (last && m === last[1] + 1) last[1] = m;
    else out.push([m, m]);
  }
  // dicembre-gennaio: unisce le due estremità
  if (out.length > 1 && out[0][0] === 1 && out.at(-1)[1] === 12) {
    const first = out.shift();
    out.at(-1)[1] = first[1];
  }
  return out;
}

const ENV_LABEL = { garden: "Giardino", balcony: "Balcone", vegetable: "Orto" };

/**
 * @param {Array<{id?:string,type?:string,beds:any[],faucet?:object}>} projects
 * @param {{ climate?: string, years?: number[] }} options
 */
export function generateTasks(projects, { climate = "centro", years = [new Date().getFullYear()] } = {}) {
  const tasks = [];
  const push = (base, year, window) => {
    const { start, end } = windowDates(year, window, climate);
    tasks.push({ ...base, id: `${base.id}|${year}`, start, end });
  };

  for (const project of projects) {
    const env = project.type ?? "garden";
    const where = (bed) => `${ENV_LABEL[env] ?? "Giardino"} · ${bed.name}`;
    for (const bed of project.beds ?? []) {
      const plants = bed.plants ?? [];
      if (!plants.length) continue;
      const pot = bed.kind === "pot";

      // specie diverse nell'aiuola
      const species = new Map();
      for (const p of plants) {
        const key = p.cropId ?? p.plantId ?? p.name;
        if (!species.has(key)) species.set(key, p);
      }

      for (const year of years) {
        for (const p of species.values()) {
          const crop = p.cropId ? CROP_BY_ID[p.cropId] : null;
          if (crop) {
            for (const [field, kind, label] of ACTIONS) {
              for (const window of runs(crop[field])) {
                push({ id: `crop-${field}|${bed.id}|${crop.id}`, kind, title: `${label}: ${crop.name.toLowerCase()}`, detail: `${crop.name} (${FAMILIES[crop.family]}). Distanze: ${crop.spacing.row} cm tra le file, ${crop.spacing.plant} cm sulla fila.${crop.notes ? " " + crop.notes : ""}`, where: where(bed), env, plants: [crop.name] }, year, window);
              }
            }
            for (const rule of CROP_RULES) {
              if (rule.match(crop)) push({ id: `${rule.id}|${bed.id}|${crop.id}`, kind: rule.kind, title: rule.title.toLowerCase().includes(crop.name.toLowerCase().slice(0, 6)) ? rule.title : `${rule.title}: ${crop.name.toLowerCase()}`, detail: rule.detail, product: rule.product, where: where(bed), env, plants: [crop.name] }, year, rule.window);
            }
            continue;
          }
          for (const rule of PLANT_RULES) {
            if (rule.match(p)) {
              const key = p.plantId ?? p.name;
              push({ id: `${rule.id}|${bed.id}|${key}`, kind: rule.kind, title: rule.title, detail: rule.detail, product: rule.product, where: where(bed), env, plants: [p.name] }, year, rule.window);
            }
          }
        }

        // regole per l'aiuola / il vaso
        if (pot) {
          push({ id: `repot|${bed.id}`, kind: "cura", title: "Rinvaso o cambio del terriccio superficiale", detail: "Se le radici escono dai fori passa a un vaso più grande; altrimenti sostituisci i primi 3–5 cm di terriccio.", product: "terriccio universale", where: where(bed), env, plants: [] }, year, [3, 3]);
          for (const m of [4, 5, 6, 7, 8, 9]) {
            push({ id: `pot-feed-${m}|${bed.id}`, kind: "concimazione", title: "Concime liquido per i vasi", detail: "Nei vasi il terriccio si esaurisce presto: concime liquido nell'acqua di irrigazione ogni 15 giorni.", product: "concime liquido universale", where: where(bed), env, plants: [] }, year, [m, m]);
          }
          push({ id: `pot-winter|${bed.id}`, kind: "cura", title: "Proteggi i vasi dal gelo", detail: "Avvolgi il vaso in juta o tessuto non tessuto e sollevalo da terra con dei piedini; sposta al riparo le piante delicate.", product: "tessuto non tessuto", where: where(bed), env, plants: [] }, year, [11, 11]);
        } else if (env === "vegetable") {
          push({ id: `soil-prep|${bed.id}`, kind: "cura", title: "Prepara il terreno dell'orto", detail: "Lavora il terreno in profondità e incorpora letame maturo o compost (circa 3–4 kg al m²).", product: "letame pellettato", where: where(bed), env, plants: [] }, year, [2, 3]);
          push({ id: `season-end|${bed.id}`, kind: "cura", title: "Fine stagione: registra le colture", detail: "Premi «Fine stagione» nella scheda dell'orto: l'app si ricorderà le famiglie coltivate per consigliarti la rotazione.", where: where(bed), env, plants: [] }, year, [10, 10]);
        } else if (bed.kind !== "floor") {
          push({ id: `mulch|${bed.id}`, kind: "cura", title: "Rinnova la pacciamatura", detail: "Aggiungi 3–5 cm di corteccia o altro materiale: trattiene l'umidità e frena le erbe infestanti.", product: "corteccia per pacciamatura", where: where(bed), env, plants: [] }, year, [4, 4]);
        }
      }
    }

    if (project.faucet && (project.beds ?? []).some((b) => b.plants?.length)) {
      for (const year of years) {
        const where = `${ENV_LABEL[env] ?? "Giardino"} · impianto a goccia`;
        push({ id: `irr-start|${project.id ?? env}`, kind: "irrigazione", title: "Riattiva l'impianto a goccia", detail: "Pulisci il filtro, cerca perdite e gocciolatori otturati, imposta il programma primaverile (scheda Irrigazione).", where, env, plants: [] }, year, [4, 4]);
        push({ id: `irr-summer|${project.id ?? env}`, kind: "irrigazione", title: "Imposta il programma estivo", detail: "Aumenta durata e frequenza secondo il programma estivo consigliato nella scheda Irrigazione.", where, env, plants: [] }, year, [6, 6]);
        push({ id: `irr-winter|${project.id ?? env}`, kind: "irrigazione", title: "Svuota l'impianto prima del gelo", detail: "Stacca il programmatore, svuota i tubi e conserva programmatore e filtro al riparo.", product: null, where, env, plants: [] }, year, [11, 11]);
      }
    }
  }

  // stesse attività per più specie nella stessa aiuola: unisci
  const merged = new Map();
  for (const t of tasks) {
    const key = `${t.title}|${t.where}|${t.start}`;
    const existing = merged.get(key);
    if (existing) existing.plants = [...new Set([...existing.plants, ...t.plants])];
    else merged.set(key, { ...t });
  }
  return [...merged.values()].sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title));
}

// Stato: { [taskId]: { done?: "YYYY-MM-DD", snoozedUntil?: "YYYY-MM-DD" } }
export function taskStatus(task, state = {}, today = iso(new Date())) {
  const s = state[task.id];
  if (s?.done) return "done";
  if (s?.snoozedUntil && s.snoozedUntil > today) return "snoozed";
  if (task.end < today) return "past";
  if (task.start <= today) return "now";
  return "upcoming";
}

export const todayISO = () => iso(new Date());
export const addDaysISO = (isoDate, n) => iso(addDays(new Date(`${isoDate}T00:00:00Z`), n));
