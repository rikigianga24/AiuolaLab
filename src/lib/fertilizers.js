// Concimi: tipi con il loro titolo NPK tipico e quale concime dare a ogni
// pianta (catalogo, ortaggi o esemplare già piantato), con i mesi giusti.
//
// NPK = percentuale di azoto (N), anidride fosforica (P₂O₅) e ossido di
// potassio (K₂O) scritta in etichetta. I valori qui sono quelli tipici dei
// prodotti in commercio: l'etichetta del prodotto scelto può variare di poco.
import { CROP_BY_ID } from "./crops.js";

export const NUTRIENTS = {
  N: { label: "Azoto", short: "N", color: "#4f7942", role: "foglie e crescita verde" },
  P: { label: "Fosforo", short: "P", color: "#c0643b", role: "radici, fiori e semi" },
  K: { label: "Potassio", short: "K", color: "#7b5ea7", role: "fioritura, frutti e resistenza" },
};

export const FERTILIZERS = {
  universale: {
    label: "Concime universale equilibrato",
    npk: [10, 10, 10],
    kind: "minerale o organo-minerale",
    form: "granulare",
    what: "Azoto, fosforo e potassio in parti uguali: va bene per quasi tutto quando non serve niente di speciale.",
    when: "Primavera (marzo-aprile), eventualmente un richiamo a inizio estate.",
    examples: ["concime universale granulare", "nitrophoska 12-12-17"],
  },
  organico: {
    label: "Letame pellettato / stallatico",
    npk: [3, 3, 3],
    kind: "organico",
    form: "pellet",
    what: "Poco titolo ma tanta sostanza organica: nutre il terreno e i suoi microrganismi, migliora la struttura e rilascia piano.",
    when: "Fine inverno (febbraio-marzo) o in autunno nella preparazione delle aiuole.",
    examples: ["letame bovino o equino pellettato", "stallatico", "compost maturo"],
    caution: "Mai letame fresco: brucia le radici e porta semi di erbacce. Deve essere maturo (almeno 6 mesi) o pellettato.",
  },
  rose: {
    label: "Concime specifico per rose",
    npk: [7, 6, 12],
    extra: "+ magnesio e microelementi",
    kind: "organo-minerale",
    form: "granulare a lenta cessione",
    what: "Potassio alto per fiori e rifioritura, magnesio per foglie verdi e lucide, azoto moderato per non fare solo foglie e afidi.",
    when: "Alla ripresa vegetativa (marzo-aprile) e dopo la prima fioritura (giugno). Stop a fine agosto.",
    examples: ["concime rose granulare", "concime organico per rose con stallatico"],
  },
  azoto: {
    label: "Concime ad alto contenuto di azoto",
    npk: [20, 5, 5],
    kind: "minerale o organico",
    form: "granulare o liquido",
    what: "Spinge la crescita di foglie e germogli: per siepi, piante da foglia, ortaggi da foglia e per far ripartire una pianta sfinita.",
    when: "Solo in primavera e inizio estate. Mai dopo agosto.",
    examples: ["cornunghia (organico, 13-0-0, lento)", "sangue secco (organico, veloce)", "nitrato ammonico / urea (minerale, veloce)"],
    caution: "Troppo azoto = tante foglie e pochi fiori, tessuti molli e più afidi e malattie.",
  },
  fosforo: {
    label: "Concime ad alto contenuto di fosforo",
    npk: [5, 15, 10],
    kind: "minerale o organico",
    form: "granulare o farina",
    what: "Aiuta le radici a partire e la formazione dei fiori: utile all'impianto, per bulbi e per le piante giovani.",
    when: "All'impianto, in buca o nel terreno lavorato; per i bulbi alla messa a dimora.",
    examples: ["farina d'ossa (organico, circa 4-20-0)", "perfosfato minerale"],
    caution: "Il fosforo si muove pochissimo nel terreno: va messo vicino alle radici, non sparso in superficie.",
  },
  potassio: {
    label: "Concime ad alto contenuto di potassio",
    npk: [5, 5, 20],
    kind: "minerale",
    form: "granulare o liquido",
    what: "Più fiori, frutti più saporiti e tessuti più robusti contro freddo, siccità e malattie.",
    when: "Dalla formazione dei boccioli in poi; in fine estate aiuta le piante a prepararsi all'inverno.",
    examples: ["solfato di potassio 0-0-50", "concime per pomodori", "cenere di legna (poca, alcalinizza)"],
    caution: "Preferisci il solfato di potassio al cloruro: il cloro brucia le piante sensibili (acidofile, fragole, agrumi).",
  },
  fioritura: {
    label: "Concime liquido per piante fiorite",
    npk: [5, 7, 10],
    extra: "+ microelementi",
    kind: "minerale",
    form: "liquido, nell'acqua di irrigazione",
    what: "Veloce, da dosare col tappo: tiene in fiore per mesi gerani, petunie e piante da balcone.",
    when: "Da aprile a settembre ogni 10-15 giorni, a dose piena; in vasi piccoli anche ogni settimana a mezza dose.",
    examples: ["concime liquido per gerani", "concime liquido per piante fiorite"],
    caution: "Sempre su terriccio già umido: dato su vaso secco brucia le radici.",
  },
  acidofile: {
    label: "Concime per acidofile",
    npk: [7, 5, 8],
    extra: "+ ferro, acidificante",
    kind: "organo-minerale",
    form: "granulare o liquido",
    what: "Tiene il terreno acido e porta ferro e manganese: per rododendri, azalee, camelie, ortensie (blu), gardenie, eriche.",
    when: "Marzo, poi a fine fioritura (maggio-giugno).",
    examples: ["concime per acidofile", "concime per ortensie", "lupini macinati (organico, acidifica)"],
    caution: "Niente cenere, calce o concimi con cloruro. L'acqua del rubinetto calcarea annulla l'effetto: meglio piovana.",
  },
  agrumi: {
    label: "Concime per agrumi",
    npk: [12, 6, 10],
    extra: "+ ferro, magnesio, manganese",
    kind: "organo-minerale",
    form: "granulare o liquido",
    what: "Azoto più alto e tanti microelementi: gli agrumi in vaso ingialliscono facilmente se mancano ferro e magnesio.",
    when: "Da marzo a settembre: granulare a lenta cessione a marzo e luglio, liquido ogni 15 giorni in vaso.",
    examples: ["concime per agrumi", "concime per limoni"],
  },
  frutto: {
    label: "Concime per ortaggi da frutto",
    npk: [8, 5, 15],
    extra: "+ calcio e magnesio",
    kind: "organo-minerale",
    form: "granulare o liquido",
    what: "Potassio alto per pomodori, peperoni, zucchine e meloni: frutti più dolci e che si conservano meglio.",
    when: "Al trapianto una dose leggera, poi alla comparsa dei primi fiori e ogni 3-4 settimane durante la raccolta.",
    examples: ["concime per pomodori", "concime per orto"],
    caution: "Il calcio previene il marciume apicale del pomodoro (macchia nera sotto il frutto), che spesso è dovuto più ad annaffiature irregolari che a carenza.",
  },
  foglia: {
    label: "Concime per ortaggi da foglia",
    npk: [12, 6, 8],
    kind: "organico o organo-minerale",
    form: "granulare o pellet",
    what: "Più azoto per insalate, bietole, spinaci, cavoli e basilico che si raccolgono per le foglie.",
    when: "Alla semina o al trapianto, poi un richiamo dopo 4-5 settimane.",
    examples: ["concime per orto organico", "pollina pellettata"],
    caution: "Non esagerare con l'azoto minerale sulle insalate: le foglie accumulano nitrati.",
  },
  succulente: {
    label: "Concime per piante grasse",
    npk: [4, 8, 12],
    kind: "minerale",
    form: "liquido",
    what: "Poco azoto: le succulente concimate troppo diventano molli, allungate e marciscono.",
    when: "2-3 volte in tutta la stagione calda, a metà dose. Mai d'inverno.",
    examples: ["concime liquido per cactacee e succulente"],
  },
  bulbi: {
    label: "Concime per bulbose",
    npk: [5, 10, 15],
    kind: "organo-minerale",
    form: "granulare",
    what: "Fosforo e potassio per ricostituire il bulbo dopo la fioritura, così rifiorisce l'anno dopo.",
    when: "Alla messa a dimora (in buca) e subito dopo la fioritura, finché le foglie sono verdi.",
    examples: ["concime per bulbi", "farina d'ossa all'impianto"],
  },
  lentaCessione: {
    label: "Concime a lenta cessione",
    npk: [15, 9, 12],
    extra: "+ microelementi",
    kind: "minerale ricoperto",
    form: "granuli ricoperti (durata 3-6 mesi)",
    what: "Una sola dose che nutre per mesi, rilasciando di più quando fa caldo e la pianta cresce: comodissimo per vasi e fioriere.",
    when: "Mescolato al terriccio al rinvaso o sparso in superficie a marzo-aprile.",
    examples: ["concime a lenta cessione per vasi", "granuli ricoperti 3-6 mesi"],
  },
  ferro: {
    label: "Ferro chelato (correttivo)",
    npk: [0, 0, 0],
    extra: "6% ferro EDDHA",
    kind: "correttivo",
    form: "microgranuli da sciogliere in acqua",
    what: "Non è un concime completo: cura la clorosi ferrica (foglie giovani gialle con le nervature verdi) tipica dei terreni calcarei.",
    when: "Alla comparsa della clorosi, da aprile a giugno; 2-3 trattamenti a 15 giorni.",
    examples: ["ferro chelato EDDHA"],
    caution: "Nei terreni calcarei funziona solo il chelato EDDHA. Macchia di arancio i pavimenti: attento a terrazzi e balconi.",
  },
  poco: {
    label: "Poco o niente",
    npk: [0, 0, 0],
    kind: "—",
    form: "—",
    what: "Piante abituate a terreni poveri: concimate diventano molli, sfatte, profumano meno e fioriscono peggio.",
    when: "Al massimo una manciata di concime organico in primavera. Nessun azoto.",
    examples: ["nessuno", "un po' di compost in primavera"],
  },
};

export const npkText = (f) => (f.npk.some(Boolean) ? `NPK ${f.npk.join("-")}` : f.extra ?? "");

export const MONTHS_SHORT = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
export const monthsText = (months) => {
  if (!months?.length) return "";
  const s = [...months].sort((a, b) => a - b);
  // mesi consecutivi come intervallo
  const runs = [];
  for (const m of s) {
    const last = runs.at(-1);
    if (last && m === last[1] + 1) last[1] = m;
    else runs.push([m, m]);
  }
  return runs.map(([a, b]) => (a === b ? MONTHS_SHORT[a - 1] : `${MONTHS_SHORT[a - 1]}–${MONTHS_SHORT[b - 1]}`)).join(", ");
};

const P = (main, months, note, extra = []) => ({ main, months, note, extra });

// Regole sul nome scientifico, controllate in ordine: vince la prima.
const PLANT_RULES = [
  [/^rosa\b/i, P("rose", [3, 4, 6], "Concime per rose alla ripresa e dopo la prima fioritura; da fine agosto stop, per non spingere getti teneri che il gelo brucia.", [{ id: "potassio", months: [6, 7], why: "dopo la prima fioritura, per la rifioritura" }])],
  [/^citrus\b/i, P("agrumi", [3, 4, 5, 6, 7, 8, 9], "Gli agrumi mangiano molto: in vaso concime liquido ogni 15 giorni nella bella stagione.", [{ id: "ferro", months: [4, 5], why: "se le foglie giovani ingialliscono" }])],
  [/^(rhododendron|camellia|pieris|kalmia|gardenia|erica|calluna|skimmia|vaccinium|hydrangea (macrophylla|serrata))\b/i, P("acidofile", [3, 6], "Acidofila: concime specifico e acqua non calcarea, altrimenti le foglie ingialliscono.", [{ id: "ferro", months: [4, 5, 6], why: "se compare la clorosi" }])],
  [/^hydrangea\b/i, P("fioritura", [4, 5, 6], "Le ortensie paniculata e arborescens fioriscono sui rami dell'anno: concime ricco di potassio in primavera.")],
  [/^(agave|aloe|echeveria|sempervivum|sedum|hylotelephium|aeonium|kalanchoe|portulaca|cycas)\b/i, P("succulente", [5, 7], "Poco concime e povero di azoto, solo nella stagione calda.")],
  [/^(lavandula|rosmarinus|salvia (rosmarinus|officinalis)|thymus|cistus|santolina|helichrysum|perovskia|teucrium|westringia|origanum|satureja|hyssopus|artemisia|capparis|myrtus|nerium|phlomis|stipa|festuca|eryngium|echinops|verbascum|gaura|centranthus|euphorbia(?! hypericifolia))\b/i, P("poco", [3], "Pianta di terreni poveri: il concime la rende molle e meno profumata. Al massimo un po' di compost in primavera.")],
  [/^olea\b/i, P("organico", [2, 3], "Organico a fine inverno; in vaso un concime equilibrato in primavera.", [{ id: "potassio", months: [9], why: "a fine estate, per resistere al freddo" }])],
  [/^(wisteria|campsis|lathyrus|lupinus|baptisia|cercis|laburnum)\b/i, P("potassio", [4, 6], "Leguminosa o grande rampicante: niente azoto, altrimenti fa solo foglie e non fiorisce. Potassio e fosforo sì.")],
  [/^clematis\b/i, P("rose", [3, 6], "Le clematidi mangiano come le rose: concime per rose o per piante fiorite in primavera e dopo la fioritura; radici al fresco.")],
  [/^(paeonia|delphinium|dahlia|phlox|chrysanthemum|helianthus|alcea)\b/i, P("potassio", [3, 4, 6], "Perenne esigente: organico alla ripresa e concime ricco di potassio prima della fioritura.", [{ id: "organico", months: [3], why: "alla ripresa vegetativa" }])],
  [/^(buxus|taxus|photinia|laurus|prunus laurocerasus|pittosporum|euonymus|ilex|ligustrum|viburnum tinus|osmanthus)\b/i, P("azoto", [3, 4, 6], "Sempreverde da siepe o da forma: un po' di azoto in primavera per foglie dense e verdi, soprattutto dopo le potature.")],
  [/^(miscanthus|pennisetum|panicum|calamagrostis|molinia|hakonechloa|deschampsia|sesleria|carex|imperata|muhlenbergia|eragrostis|anemanthele|briza|ophiopogon|liriope)\b/i, P("organico", [3, 4], "Le graminacee vogliono poco: un po' di organico alla ripresa basta. Troppo azoto le fa allargare e piegare.")],
  [/^(dryopteris|polystichum|athyrium|asplenium|matteuccia|osmunda|adiantum|blechnum)\b/i, P("organico", [3, 4], "Le felci soffrono i concimi minerali: compost o foglie decomposte in primavera.")],
];

const GROUP_PLAN = {
  rose: P("rose", [3, 4, 6], "Concime per rose alla ripresa e dopo la prima fioritura."),
  bulbose: P("bulbi", [3, 4, 10], "Concime per bulbi all'impianto e dopo la fioritura, finché le foglie sono verdi: ricarica il bulbo."),
  annuali: P("fioritura", [5, 6, 7, 8], "Le annuali fioriscono per mesi e si esauriscono: concime liquido per fiorite ogni 15 giorni.", [{ id: "lentaCessione", months: [4, 5], why: "al trapianto, mescolato al terreno" }]),
  balcone: P("fioritura", [4, 5, 6, 7, 8, 9], "In vaso il terriccio si esaurisce in fretta: concime liquido per fiorite ogni 10-15 giorni.", [{ id: "lentaCessione", months: [4], why: "al rinvaso o all'impianto" }]),
  aromatiche: P("poco", [4], "Le aromatiche mediterranee profumano di più in terreno povero. Basilico, prezzemolo e menta invece gradiscono un po' di concime per orto."),
  perenni: P("organico", [3, 4], "Organico o universale a lenta cessione alla ripresa vegetativa: per le perenni di solito basta.", [{ id: "universale", months: [6], why: "un richiamo leggero se rifioriscono" }]),
  arbusti: P("universale", [3, 4], "Concime universale granulare a fine inverno, sparso sulla proiezione della chioma (lì ci sono le radici che assorbono)."),
  rampicanti: P("universale", [3, 4, 6], "Concime universale in primavera; per le rampicanti da fiore meglio uno ricco di potassio prima della fioritura.", [{ id: "potassio", months: [5], why: "prima della fioritura" }]),
  graminacee: P("organico", [3, 4], "Un po' di organico alla ripresa basta."),
};

// Ortaggi per famiglia botanica.
const CROP_PLAN = {
  solanacee: P("frutto", [5, 6, 7, 8], "Concime per ortaggi da frutto alla fioritura e ogni 3-4 settimane in raccolta.", [{ id: "organico", months: [2, 3], why: "letame maturo nella preparazione del terreno" }]),
  cucurbitacee: P("frutto", [5, 6, 7], "Molto esigenti: letame maturo nella buca e concime ricco di potassio alla fioritura.", [{ id: "organico", months: [3, 4], why: "letame maturo nella buca d'impianto" }]),
  asteracee: P("foglia", [3, 4, 5, 9], "Ortaggio da foglia: azoto moderato alla semina o al trapianto, senza esagerare (nitrati)."),
  amarantacee: P("foglia", [3, 4, 8, 9], "Ortaggio da foglia: concime azotato leggero alla semina o al trapianto."),
  brassicacee: P("foglia", [4, 7, 8], "I cavoli sono voraci di azoto: concime organico abbondante al trapianto e un richiamo dopo un mese.", [{ id: "organico", months: [6, 7], why: "letame maturo prima del trapianto" }]),
  apiacee: P("potassio", [3, 4], "Carote e finocchi: niente letame fresco (radici biforcute) e poco azoto; meglio potassio."),
  alliacee: P("potassio", [2, 3, 10], "Cipolle e aglio: poco azoto e niente letame fresco (marciumi); un po' di potassio per bulbi che si conservano."),
  leguminose: P("fosforo", [3, 4], "Le leguminose fissano l'azoto dell'aria: non serve darlo. Basta un po' di fosforo e potassio alla semina."),
  lamiacee: P("foglia", [5, 6, 7], "Basilico e simili: un concime organico leggero ogni 3-4 settimane, si raccoglie per le foglie."),
  rosacee: P("potassio", [3, 4, 8], "Fragole: concime ricco di potassio (senza cloruro) a inizio primavera e dopo il trapianto estivo."),
  poacee: P("azoto", [5, 6], "Il mais è vorace di azoto: concime organico al trapianto e un richiamo quando è alto al ginocchio."),
  valerianacee: P("foglia", [9, 10], "Il songino non chiede quasi niente: basta il residuo della coltura precedente."),
  asparagacee: P("organico", [2, 3, 7], "Letame maturo a fine inverno e dopo la raccolta, per ricaricare le zampe."),
};

/** Quale concime dare a una pianta: { main, months, note, extra[] } con main/extra come id di FERTILIZERS. */
export function fertilizerPlan(plant) {
  if (!plant) return GROUP_PLAN.perenni;
  const crop = plant.cropId ? CROP_BY_ID[plant.cropId] : null;
  if (crop) return CROP_PLAN[crop.family] ?? P("universale", [3, 4], "Concime per orto alla semina o al trapianto.");
  const sci = plant.scientificName ?? "";
  for (const [re, plan] of PLANT_RULES) if (re.test(sci)) return plan;
  // basilico e prezzemolo tra le aromatiche vogliono un po' di più
  if (/^(ocimum|petroselinum|mentha|melissa|coriandrum|anethum|levisticum|aloysia|stevia)\b/i.test(sci)) return CROP_PLAN.lamiacee;
  return GROUP_PLAN[plant.group] ?? P("universale", [3, 4], "Concime universale granulare in primavera.");
}
