// Informazioni pratiche sulle piante: tossicità per animali e persone,
// animali selvatici o parassiti che le danneggiano, insetti utili attirati,
// origine (autoctona o no), specie invasive e adattamento alla zona.
//
// Dati indicativi raccolti da fonti divulgative (centri antiveleni
// veterinari, manuali di orticoltura). Non sostituiscono il parere di un
// veterinario o di un medico: in caso di ingestione chiamare subito.

export const PETS = {
  dog: "cani",
  cat: "gatti",
  horse: "cavalli",
  farm: "animali da cortile",
  people: "bambini e persone",
};

const LEVEL = { low: "basso", medium: "medio", high: "alto" };

// tox: { to: [...PETS], level, note }  wildlife: [{ who, note }]
// good: insetti utili  origin: { native, from }  invasive: testo
const SPECIES = [
  // ---- ornamentali ----
  { re: /lavand/, tox: { to: ["dog", "cat"], level: "low", note: "In grandi quantità può dare disturbi digestivi." }, wildlife: [{ who: "caprioli e cinghiali", note: "di solito la evitano: profumo e oli essenziali la rendono poco appetibile" }], good: "api e farfalle", origin: { native: true, from: "Mediterraneo occidentale, spontanea anche in Italia" } },
  { re: /rosmarin/, wildlife: [{ who: "caprioli", note: "di solito lo evitano" }], good: "api, fiorisce anche d'inverno", origin: { native: true, from: "spontaneo sulle coste del Mediterraneo" } },
  { re: /salvia nemorosa|salvia ornamentale/, good: "api e bombi", origin: { native: false, from: "Europa centro-orientale e Asia occidentale" } },
  { re: /perovsk|salvia russa/, wildlife: [{ who: "caprioli", note: "di solito la evitano" }], good: "api", origin: { native: false, from: "Asia centrale" } },
  { re: /echinac/, good: "api e farfalle; d'inverno i semi nutrono i cardellini", origin: { native: false, from: "Nord America" } },
  { re: /rudbeck/, good: "api e farfalle", origin: { native: false, from: "Nord America" } },
  { re: /achille/, tox: { to: ["dog", "cat", "horse"], level: "low", note: "Può dare disturbi digestivi se mangiata." }, good: "api e coccinelle", origin: { native: true, from: "spontanea in tutta Italia" } },
  { re: /gaura/, good: "api", origin: { native: false, from: "Nord America" } },
  { re: /nepeta|erba gatta/, wildlife: [{ who: "gatti", note: "la adorano: ci si strofinano e possono schiacciarla" }], good: "api", origin: { native: false, from: "ibrido da giardino di specie europee e asiatiche" } },
  { re: /geranium ['‘]?rozanne|geranio perenne/, good: "api", origin: { native: false, from: "ibrido da giardino" } },
  { re: /hosta/, tox: { to: ["dog", "cat"], level: "low", note: "Contiene saponine: vomito e diarrea se mangiata." }, wildlife: [{ who: "lumache e chiocciole", note: "bucano le foglie, soprattutto in primavera" }, { who: "caprioli", note: "brucano le foglie" }], origin: { native: false, from: "Giappone e Asia orientale" } },
  { re: /heuchera/, origin: { native: false, from: "Nord America" } },
  { re: /astilbe/, origin: { native: false, from: "Asia orientale" } },
  { re: /helleb|elleb/, tox: { to: ["dog", "cat", "horse", "people"], level: "high", note: "Tutta la pianta è tossica (glicosidi cardioattivi)." }, wildlife: [{ who: "caprioli e roditori", note: "di solito la evitano" }], origin: { native: true, from: "spontaneo nelle Alpi e negli Appennini" } },
  { re: /hydrang|ortensi/, tox: { to: ["dog", "cat", "horse"], level: "medium", note: "Foglie e fiori contengono glicosidi: vomito e diarrea se ingeriti." }, wildlife: [{ who: "caprioli", note: "mangiano germogli e fiori" }], origin: { native: false, from: "Giappone" } },
  { re: /rhododendr|rododendr|azalea/, tox: { to: ["dog", "cat", "horse", "farm", "people"], level: "high", note: "Contiene grayanotossine, pericolose anche per capre e pecore." }, origin: { native: false, from: "ibridi di specie asiatiche" }, zone: { centro: "Vuole terreno acido: nei terreni calcarei del Centro meglio in vaso con terriccio per acidofile.", sud: "Soffre caldo secco e terreni calcarei: al Sud è poco coltivato, meglio in vaso a mezz'ombra." } },
  { re: /camell/, origin: { native: false, from: "Cina e Giappone" }, zone: { centro: "Tipica della Lucchesia e dei laghi; vuole terreno acido.", sud: "Al Sud è poco diffusa: soffre caldo secco e terreni calcarei." } },
  { re: /pieris/, tox: { to: ["dog", "cat", "horse", "farm", "people"], level: "high", note: "Contiene grayanotossine come il rododendro." }, origin: { native: false, from: "Giappone" } },
  { re: /erica/, origin: { native: true, from: "spontanea sulle Alpi" } },
  { re: /pennisetum setaceum/, invasive: "Pennisetum setaceum è nella lista UE delle specie invasive: in Italia non si può vendere né piantare.", origin: { native: false, from: "Africa e Medio Oriente" } },
  { re: /pennisetum/, origin: { native: false, from: "Asia orientale e Australia" }, note: "Attenzione a non confonderlo con Pennisetum setaceum, specie invasiva vietata nell'UE." },
  { re: /stipa tenuissima|lino delle fate/, origin: { native: false, from: "Messico e Sud America" }, note: "Si risemina facilmente: togli le spighe prima che disperdano i semi." },
  { re: /festuca glauca|festuca blu/, origin: { native: false, from: "Francia meridionale" } },
  { re: /sedum|borracina/, good: "api e farfalle in autunno", origin: { native: false, from: "Asia orientale (le specie da giardino)" } },
  { re: /thymus|\btimo\b/, good: "api", origin: { native: true, from: "spontaneo in Italia" } },
  { re: /ajuga|bugola|\biva\b/, good: "bombi in primavera", origin: { native: true, from: "spontanea in Italia" } },
  { re: /vinca|pervinc/, tox: { to: ["dog", "cat", "horse"], level: "low", note: "Contiene alcaloidi: evitarne l'ingestione." }, origin: { native: true, from: "spontanea in Italia" }, note: "Si allarga molto: tienila lontana dalle piante piccole." },
  { re: /agapant/, tox: { to: ["dog", "cat"], level: "low", note: "Contiene saponine irritanti." }, origin: { native: false, from: "Sudafrica" }, zone: { nord: "Teme il gelo: al Nord proteggi il piede in inverno o coltivalo in vaso da riparare." } },
  { re: /hemerocall|emerocall/, tox: { to: ["cat"], level: "high", note: "Molto pericolosa per i gatti: anche poche foglie o il polline possono danneggiare i reni." }, origin: { native: false, from: "Asia orientale, naturalizzata in Italia" } },
  { re: /lilium|giglio/, tox: { to: ["cat"], level: "high", note: "Molto pericoloso per i gatti, anche il polline: danneggia i reni." } },
  { re: /coreops/, good: "api e farfalle", origin: { native: false, from: "Nord America" } },
  { re: /verbena bonar/, good: "farfalle", origin: { native: false, from: "Sud America" }, note: "Si risemina da sola." },
  { re: /buxus|bosso/, tox: { to: ["dog", "cat", "horse"], level: "medium", note: "Foglie tossiche per gli alcaloidi." }, origin: { native: true, from: "spontaneo in Italia" }, note: "Controlla la piralide del bosso, un bruco che può defogliarlo in pochi giorni." },
  { re: /\brosa\b|\brose\b|rosa /, wildlife: [{ who: "caprioli", note: "mangiano boccioli e germogli" }, { who: "afidi", note: "sui germogli in primavera" }], good: "api (le varietà a fiore semplice)" },
  { re: /tagete|tagetes/, origin: { native: false, from: "Messico" }, note: "Nell'orto aiuta a tenere lontani alcuni nematodi del terreno." },
  { re: /impatiens glandulifera/, invasive: "Impatiens glandulifera è nella lista UE delle specie invasive: vietato coltivarla." },
  { re: /impatiens/, origin: { native: false, from: "Africa orientale" } },
  { re: /cosmo|cosmea/, good: "api e farfalle", origin: { native: false, from: "Messico" } },
  { re: /digital/, tox: { to: ["dog", "cat", "horse", "farm", "people"], level: "high", note: "Tutta la pianta è molto velenosa (glicosidi cardiaci): attenzione ai bambini." }, good: "bombi", origin: { native: false, from: "Europa occidentale" } },
  { re: /tulip/, tox: { to: ["dog", "cat", "horse"], level: "medium", note: "Soprattutto i bulbi: attenzione ai cani che scavano." }, wildlife: [{ who: "arvicole e topi", note: "mangiano i bulbi sottoterra: usa cestelli di rete" }, { who: "caprioli", note: "mangiano fiori e boccioli" }], origin: { native: false, from: "Asia centrale (varietà selezionate in Olanda)" } },
  { re: /narcis/, tox: { to: ["dog", "cat", "horse", "people"], level: "medium", note: "Bulbo molto tossico: non confonderlo con la cipolla." }, wildlife: [{ who: "roditori e caprioli", note: "di solito lo evitano" }], origin: { native: true, from: "diverse specie sono spontanee in Italia" } },
  { re: /nerium|oleandr/, tox: { to: ["dog", "cat", "horse", "farm", "people"], level: "high", note: "Tra le piante più velenose: tutte le parti, anche il fumo se bruciato." }, origin: { native: true, from: "spontaneo nel Mediterraneo" } },
  { re: /hedera|edera/, tox: { to: ["dog", "cat", "horse", "people"], level: "low", note: "Le bacche e le foglie possono dare disturbi." }, origin: { native: true, from: "spontanea in Italia" } },
  { re: /pelargon|geranio(?! perenne)/, tox: { to: ["dog", "cat"], level: "low", note: "Può dare vomito o irritazioni." }, origin: { native: false, from: "Sudafrica" } },
  { re: /petunia|surfinia/, origin: { native: false, from: "Sud America" } },
  { re: /ailanth/, invasive: "Ailanthus altissima è nella lista UE delle specie invasive." },
  { re: /asclepias syriaca/, invasive: "Asclepias syriaca è nella lista UE delle specie invasive." },

  // ---- ortaggi ----
  { re: /pomodor|lycopersicum/, tox: { to: ["dog", "cat"], level: "low", note: "Foglie, fusti e frutti verdi contengono solanina." }, wildlife: [{ who: "merli e altri uccelli", note: "beccano i frutti maturi" }, { who: "cimici e nottue", note: "sui frutti in estate" }], origin: { native: false, from: "Sud America" } },
  { re: /patat|tuberosum/, tox: { to: ["dog", "cat", "people"], level: "medium", note: "Tuberi verdi, germogli e foglie contengono solanina: non mangiare le patate verdi." }, wildlife: [{ who: "cinghiali", note: "scavano e distruggono il raccolto: serve una recinzione robusta o elettrificata" }, { who: "istrici", note: "scavano i tuberi di notte" }, { who: "dorifora", note: "il coleottero a strisce che mangia le foglie" }], origin: { native: false, from: "Ande (Sud America)" } },
  { re: /melanzan/, tox: { to: ["dog", "cat"], level: "low", note: "Foglie e fusti contengono solanina." }, origin: { native: false, from: "India" }, zone: { nord: "Al Nord dà il meglio in posizioni calde e riparate." } },
  { re: /peperon/, origin: { native: false, from: "Centro e Sud America" }, zone: { nord: "Al Nord dà il meglio in posizioni calde e riparate." } },
  { re: /zucchin|zucca|cucurbita/, wildlife: [{ who: "cinghiali e istrici", note: "mangiano i frutti, soprattutto quelli maturi" }, { who: "tassi", note: "rosicchiano i frutti a terra" }], good: "api e bombi (impollinano i fiori)", origin: { native: false, from: "Americhe" } },
  { re: /cetriol/, wildlife: [{ who: "lumache", note: "sulle piantine giovani" }], origin: { native: false, from: "India" } },
  { re: /melone|anguria|citrullus|cucumis melo/, wildlife: [{ who: "cinghiali, istrici e tassi", note: "attirati dai frutti maturi e zuccherini" }], origin: { native: false, from: "Africa e Asia" }, zone: { nord: "Al Nord serve un'estate calda: scegli varietà precoci." } },
  { re: /lattug|insalat|radicch|rucol|spinac|bietol/, wildlife: [{ who: "lumache e chiocciole", note: "soprattutto dopo la pioggia" }, { who: "lepri, conigli e caprioli", note: "brucano le foglie tenere" }] },
  { re: /radicch/, zone: { nord: "Ortaggio tipico del Veneto e del Nord-Est.", sud: "Al Sud è meno diffuso: preferisce autunni freschi." } },
  { re: /carot/, wildlife: [{ who: "arvicole e topi", note: "rosicchiano le radici" }, { who: "cinghiali", note: "possono scavare l'aiuola" }, { who: "mosca della carota", note: "le larve scavano gallerie nelle radici" }] },
  { re: /cipoll|aglio|porro|allium/, tox: { to: ["dog", "cat", "horse"], level: "high", note: "Pericolosi per cani e gatti anche cotti: danneggiano i globuli rossi." }, wildlife: [{ who: "la maggior parte degli animali selvatici", note: "li evita per l'odore" }] },
  { re: /fagiol|phaseolus/, tox: { to: ["dog", "cat", "people"], level: "medium", note: "I semi crudi sono tossici: vanno sempre cotti." }, wildlife: [{ who: "lumache", note: "sulle piantine appena nate" }, { who: "lepri e caprioli", note: "brucano i germogli" }], origin: { native: false, from: "Centro e Sud America" } },
  { re: /pisell|pisum/, wildlife: [{ who: "piccioni e gazze", note: "mangiano semi e baccelli" }, { who: "topi", note: "scavano i semi appena seminati" }] },
  { re: /\bfava\b|vicia faba/, tox: { to: ["people"], level: "high", note: "Pericolosa per chi soffre di favismo (carenza di G6PD), anche solo respirando il polline in fioritura." }, wildlife: [{ who: "afidi neri", note: "colonie sulle punte: cimale le piante" }], zone: { nord: "Al Nord è meno diffusa che al Centro-Sud." } },
  { re: /cavol|brocc|brassica oleracea/, wildlife: [{ who: "cavolaia", note: "farfalla bianca i cui bruchi divorano le foglie" }, { who: "piccioni, lepri e caprioli", note: "mangiano le foglie" }] },
  { re: /ravanell/, wildlife: [{ who: "altica", note: "piccoli coleotteri che bucherellano le foglie" }] },
  { re: /fragol|fragaria/, wildlife: [{ who: "merli e altri uccelli", note: "mangiano i frutti: usa una rete" }, { who: "lumache e topi", note: "rosicchiano i frutti vicino a terra" }] },
  { re: /\bmais\b|zea mays/, wildlife: [{ who: "cinghiali", note: "abbattono le piante per le pannocchie" }, { who: "cornacchie", note: "estraggono i semi appena seminati" }, { who: "tassi e istrici", note: "mangiano le pannocchie mature" }], origin: { native: false, from: "Messico" } },
  { re: /basilic/, good: "api quando fiorisce", wildlife: [{ who: "lumache", note: "sulle piantine giovani" }] },
];

// Zona di rusticità USDA minima tipica delle pianure di ogni zona.
const ZONE_MIN = { nord: 7, centro: 8, sud: 9 };
const ZONE_LABEL = { nord: "al Nord", centro: "al Centro", sud: "al Sud" };

const textOf = (p) => [p?.scientificName, p?.commonName, p?.name, ...(p?.otherNames ?? [])].filter(Boolean).join(" ").toLowerCase();

/**
 * Raccoglie le informazioni su una pianta (catalogo, esemplare piantato o ortaggio).
 * @returns {{ tox: object|null, wildlife: object[], good: string|null, origin: object|null, invasive: string|null, notes: string[] }}
 */
export function plantInfo(plant, { climate = "centro" } = {}) {
  const text = textOf(plant);
  const out = { tox: null, wildlife: [], good: null, origin: null, invasive: null, notes: [] };
  for (const s of SPECIES) {
    if (!s.re.test(text)) continue;
    if (s.tox && (!out.tox || rank(s.tox.level) > rank(out.tox.level))) out.tox = s.tox;
    if (s.wildlife) for (const w of s.wildlife) if (!out.wildlife.some((x) => x.who === w.who)) out.wildlife.push(w);
    out.good ??= s.good ?? null;
    out.origin ??= s.origin ?? null;
    out.invasive ??= s.invasive ?? null;
    if (s.note) out.notes.push(s.note);
    if (s.zone?.[climate]) out.notes.push(s.zone[climate]);
  }
  // rusticità: teme il freddo della zona?
  const hMin = plant?.hardiness?.min;
  if (Number.isFinite(hMin) && hMin > ZONE_MIN[climate]) {
    out.notes.push(`Teme il gelo ${ZONE_LABEL[climate]}: proteggila in inverno o coltivala in vaso da riparare.`);
  }
  // acidofile in zone con terreni spesso calcarei
  const acidOnly = plant?.soil?.ph?.length === 1 && plant.soil.ph[0] === "acid";
  if (acidOnly && climate !== "nord" && !out.notes.some((n) => /acid/.test(n))) {
    out.notes.push("Vuole terreno acido, mentre nella tua zona i terreni sono spesso calcarei: meglio in vaso con terriccio per acidofile.");
  }
  return out;
}

const rank = (level) => ({ low: 1, medium: 2, high: 3 })[level] ?? 0;

export const toxLevelLabel = (level) => LEVEL[level] ?? level;

export function toxicTo(info, pets = []) {
  if (!info.tox) return [];
  return info.tox.to.filter((t) => !pets.length || pets.includes(t));
}

// Per il calendario: ortaggi esposti ai cinghiali.
export const boarRisk = (plant) => plantInfo(plant).wildlife.some((w) => /cinghial/.test(w.who));
