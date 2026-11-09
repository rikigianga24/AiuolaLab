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
  { re: /^nepeta|erba gatta/, wildlife: [{ who: "gatti", note: "la adorano: ci si strofinano e possono schiacciarla" }], good: "api", origin: { native: false, from: "ibrido da giardino di specie europee e asiatiche" } },
  { re: /geranium ['‘]?rozanne|geranio perenne/, good: "api", origin: { native: false, from: "ibrido da giardino" } },
  { re: /hosta/, tox: { to: ["dog", "cat"], level: "low", note: "Contiene saponine: vomito e diarrea se mangiata." }, wildlife: [{ who: "lumache e chiocciole", note: "bucano le foglie, soprattutto in primavera" }, { who: "caprioli", note: "brucano le foglie" }], origin: { native: false, from: "Giappone e Asia orientale" } },
  { re: /heuchera/, origin: { native: false, from: "Nord America" } },
  { re: /astilbe/, origin: { native: false, from: "Asia orientale" } },
  { re: /helleb|elleb/, tox: { to: ["dog", "cat", "horse", "people"], level: "high", note: "Tutta la pianta è tossica (glicosidi cardioattivi)." }, wildlife: [{ who: "caprioli e roditori", note: "di solito la evitano" }], origin: { native: true, from: "spontaneo nelle Alpi e negli Appennini" } },
  { re: /hydrangea\b|\bortensi/, tox: { to: ["dog", "cat", "horse"], level: "medium", note: "Foglie e fiori contengono glicosidi: vomito e diarrea se ingeriti." }, wildlife: [{ who: "caprioli", note: "mangiano germogli e fiori" }], origin: { native: false, from: "Giappone" } },
  { re: /rhododendr|rododendr|azalea/, tox: { to: ["dog", "cat", "horse", "farm", "people"], level: "high", note: "Contiene grayanotossine, pericolose anche per capre e pecore." }, origin: { native: false, from: "ibridi di specie asiatiche" }, zone: { centro: "Vuole terreno acido: nei terreni calcarei del Centro meglio in vaso con terriccio per acidofile.", sud: "Soffre caldo secco e terreni calcarei: al Sud è poco coltivato, meglio in vaso a mezz'ombra." } },
  { re: /camell/, origin: { native: false, from: "Cina e Giappone" }, zone: { centro: "Tipica della Lucchesia e dei laghi; vuole terreno acido.", sud: "Al Sud è poco diffusa: soffre caldo secco e terreni calcarei." } },
  { re: /pieris/, tox: { to: ["dog", "cat", "horse", "farm", "people"], level: "high", note: "Contiene grayanotossine come il rododendro." }, origin: { native: false, from: "Giappone" } },
  { re: /\berica\b/, origin: { native: true, from: "spontanea sulle Alpi" } },
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
  { re: /lilium|giglio(?! torcia)/, tox: { to: ["cat"], level: "high", note: "Molto pericoloso per i gatti, anche il polline: danneggia i reni." } },
  { re: /coreops/, good: "api e farfalle", origin: { native: false, from: "Nord America" } },
  { re: /verbena bonar/, good: "farfalle", origin: { native: false, from: "Sud America" }, note: "Si risemina da sola." },
  { re: /buxus|bosso/, tox: { to: ["dog", "cat", "horse"], level: "medium", note: "Foglie tossiche per gli alcaloidi." }, origin: { native: true, from: "spontaneo in Italia" }, note: "Controlla la piralide del bosso, un bruco che può defogliarlo in pochi giorni." },
  { re: /^ros[ae]\b/, wildlife: [{ who: "caprioli", note: "mangiano boccioli e germogli" }, { who: "afidi", note: "sui germogli in primavera" }], good: "api (le varietà a fiore semplice)" },
  { re: /tagete|tagetes/, origin: { native: false, from: "Messico" }, note: "Nell'orto aiuta a tenere lontani alcuni nematodi del terreno." },
  { re: /impatiens glandulifera/, invasive: "Impatiens glandulifera è nella lista UE delle specie invasive: vietato coltivarla." },
  { re: /impatiens/, origin: { native: false, from: "Africa orientale" } },
  { re: /cosmo|cosmea/, good: "api e farfalle", origin: { native: false, from: "Messico" } },
  { re: /^digitalis|digitale/, tox: { to: ["dog", "cat", "horse", "farm", "people"], level: "high", note: "Tutta la pianta è molto velenosa (glicosidi cardiaci): attenzione ai bambini." }, good: "bombi", origin: { native: false, from: "Europa occidentale" } },
  { re: /tulip/, tox: { to: ["dog", "cat", "horse"], level: "medium", note: "Soprattutto i bulbi: attenzione ai cani che scavano." }, wildlife: [{ who: "arvicole e topi", note: "mangiano i bulbi sottoterra: usa cestelli di rete" }, { who: "caprioli", note: "mangiano fiori e boccioli" }], origin: { native: false, from: "Asia centrale (varietà selezionate in Olanda)" } },
  { re: /narcis/, tox: { to: ["dog", "cat", "horse", "people"], level: "medium", note: "Bulbo molto tossico: non confonderlo con la cipolla." }, wildlife: [{ who: "roditori e caprioli", note: "di solito lo evitano" }], origin: { native: true, from: "diverse specie sono spontanee in Italia" } },
  { re: /nerium|oleandr/, tox: { to: ["dog", "cat", "horse", "farm", "people"], level: "high", note: "Tra le piante più velenose: tutte le parti, anche il fumo se bruciato." }, origin: { native: true, from: "spontaneo nel Mediterraneo" } },
  { re: /hedera/, tox: { to: ["dog", "cat", "horse", "people"], level: "low", note: "Le bacche e le foglie possono dare disturbi." }, origin: { native: true, from: "spontanea in Italia" } },
  { re: /pelargon/, tox: { to: ["dog", "cat"], level: "low", note: "Può dare vomito o irritazioni." }, origin: { native: false, from: "Sudafrica" } },
  { re: /petunia|surfinia/, origin: { native: false, from: "Sud America" } },
  { re: /ailanth/, invasive: "Ailanthus altissima è nella lista UE delle specie invasive." },
  { re: /asclepias syriaca/, invasive: "Asclepias syriaca è nella lista UE delle specie invasive." },


  // ---- catalogo esteso: tossicità e note principali ----
  // Fonti: liste delle piante tossiche dell'ASPCA e dei centri antiveleni,
  // manuali di giardinaggio. Il livello è indicativo.
  { re: /delphin|speron|consolida/, tox: { to: ["dog", "cat", "horse", "farm", "people"], level: "high", note: "Tutta la pianta, soprattutto i semi, contiene alcaloidi pericolosi." }, good: "bombi", origin: { native: false, from: "Europa e Asia (gli ibridi da giardino)" } },
  { re: /lupin/, tox: { to: ["dog", "horse", "farm", "people"], level: "medium", note: "Semi e baccelli contengono alcaloidi, pericolosi soprattutto per pecore e capre." }, wildlife: [{ who: "afidi del lupino", note: "grosse colonie grigie sugli steli a fine primavera" }, { who: "lumache", note: "divorano i germogli in primavera" }], good: "bombi", origin: { native: false, from: "Nord America (gli ibridi Russell sono inglesi)" }, zone: { sud: "Soffre il caldo e i terreni calcarei: al Sud meglio in vaso, a mezz'ombra." } },
  { re: /colchic/, tox: { to: ["dog", "cat", "horse", "farm", "people"], level: "high", note: "Tra le piante più velenose: contiene colchicina. Non confonderlo con lo zafferano." }, origin: { native: true, from: "spontaneo nei prati italiani" } },
  { re: /convallar|mughett/, tox: { to: ["dog", "cat", "horse", "people"], level: "high", note: "Glicosidi cardiaci in tutta la pianta, anche nell'acqua del vaso." }, origin: { native: true, from: "spontaneo nei boschi italiani" } },
  { re: /taxus|\btasso\b(?! barbasso)/, tox: { to: ["dog", "cat", "horse", "farm", "people"], level: "high", note: "Foglie e semi molto velenosi, letali per i cavalli anche in piccole quantità." }, origin: { native: true, from: "spontaneo in Italia" } },
  { re: /cycas|cicas/, tox: { to: ["dog", "cat", "horse", "people"], level: "high", note: "Soprattutto i semi: danni gravi al fegato, spesso letali per i cani." }, origin: { native: false, from: "Giappone meridionale" } },
  { re: /daphne|\bdafne\b/, tox: { to: ["dog", "cat", "horse", "people"], level: "high", note: "Bacche e corteccia molto velenose." } },
  { re: /kalmia/, tox: { to: ["dog", "cat", "horse", "farm", "people"], level: "high", note: "Contiene grayanotossine come il rododendro." }, origin: { native: false, from: "Nord America orientale" } },
  { re: /lantana/, tox: { to: ["dog", "cat", "horse", "farm", "people"], level: "medium", note: "Bacche verdi e foglie tossiche, pericolose per il bestiame." }, good: "farfalle", origin: { native: false, from: "America tropicale" } },
  { re: /wisteria|glicin/, tox: { to: ["dog", "cat", "horse", "people"], level: "medium", note: "Semi e baccelli: vomito e disturbi gravi se ingeriti." }, good: "bombi e api legnaiole", origin: { native: false, from: "Cina e Giappone" } },
  { re: /laurocer|prunus laurocerasus/, tox: { to: ["dog", "cat", "horse", "farm", "people"], level: "high", note: "Foglie e semi liberano cianuro: attenzione agli scarti di potatura." }, origin: { native: false, from: "Balcani e Asia Minore" } },
  { re: /euonymus|evonim/, tox: { to: ["dog", "cat", "horse", "people"], level: "medium", note: "Frutti e semi tossici." } },
  { re: /\bilex\b|agrifogl/, tox: { to: ["dog", "cat", "people"], level: "low", note: "Le bacche danno vomito e diarrea." } },
  { re: /clemat|vitalba/, tox: { to: ["dog", "cat", "horse"], level: "low", note: "Linfa irritante per bocca e pelle." } },
  { re: /anemone|ranuncul|eranthis|piè di gallo/, tox: { to: ["dog", "cat", "horse", "farm"], level: "low", note: "Contiene protoanemonina, irritante per bocca e intestino." } },
  { re: /^aquileg/, tox: { to: ["dog", "cat", "people"], level: "low", note: "Semi e radici possono dare disturbi." }, good: "bombi" },
  { re: /papaver|papavero/, tox: { to: ["dog", "cat", "horse"], level: "low", note: "Contiene alcaloidi: evitarne l'ingestione." }, good: "api (raccolgono il polline)" },
  { re: /euphorb|euforb/, tox: { to: ["dog", "cat", "horse", "people"], level: "medium", note: "Il lattice bianco irrita pelle e occhi: usa i guanti quando la poti." } },
  { re: /nicotian|tabacco/, tox: { to: ["dog", "cat", "horse", "people"], level: "high", note: "Contiene nicotina in tutta la pianta." }, good: "falene la sera" },
  { re: /hyacinth|giacint(?:o a grappolo)?\b/, tox: { to: ["dog", "cat", "horse"], level: "medium", note: "Soprattutto i bulbi: irritanti e tossici." } },
  { re: /galanth|bucanev|leucoj|campanellin|sternberg|nerine|amaryll|hippeastr|amarillid/, tox: { to: ["dog", "cat", "horse", "people"], level: "medium", note: "Bulbo tossico (alcaloidi delle amarillidacee)." }, wildlife: [{ who: "arvicole e roditori", note: "di solito evitano i bulbi" }] },
  { re: /ornithogal|latte di gallina/, tox: { to: ["dog", "cat", "horse", "people"], level: "high", note: "Glicosidi cardiaci soprattutto nel bulbo." } },
  { re: /^muscari|scilla|chionodox/, tox: { to: ["dog", "cat"], level: "low", note: "Bulbi lievemente tossici." } },
  { re: /crocus vernus|crocus tommas/, tox: { to: ["dog", "cat"], level: "low", note: "Può dare disturbi digestivi; molto più pericoloso il colchico, che gli somiglia." }, wildlife: [{ who: "arvicole, topi e scoiattoli", note: "mangiano i bulbi" }] },
  { re: /fritillar/, tox: { to: ["dog", "cat", "people"], level: "medium", note: "Bulbi tossici." } },
  { re: /\biris\b|giaggiol/, tox: { to: ["dog", "cat", "horse"], level: "medium", note: "Soprattutto i rizomi: vomito e diarrea." } },
  { re: /gladiol/, tox: { to: ["dog", "cat"], level: "low", note: "Soprattutto i bulbi." } },
  { re: /zantedesch|\bcalla\b/, tox: { to: ["dog", "cat", "people"], level: "medium", note: "Ossalati: brucia bocca e gola se masticata." }, origin: { native: false, from: "Sudafrica" } },
  { re: /cyclamen|ciclamin/, tox: { to: ["dog", "cat", "horse"], level: "medium", note: "Il tubero è la parte più tossica." } },
  { re: /dahlia|\bdalia\b/, tox: { to: ["dog", "cat"], level: "low", note: "Lievi disturbi digestivi e irritazioni." }, wildlife: [{ who: "lumache e forbicine", note: "rovinano foglie e fiori: controlla di sera" }], origin: { native: false, from: "Messico" } },
  { re: /^chrysanth|crisantem|argyranth|margherita delle canarie/, tox: { to: ["dog", "cat", "horse"], level: "low", note: "Contiene piretrine e lattoni irritanti." } },
  { re: /leucanthem/, tox: { to: ["dog", "cat", "horse"], level: "low", note: "Può dare vomito e dermatiti." }, good: "api, farfalle e sirfidi" },
  { re: /matricaria|chamaemel|camomill|tanacetum|partenio/, tox: { to: ["dog", "cat", "horse"], level: "low", note: "In grandi quantità può dare disturbi." } },
  { re: /begonia/, tox: { to: ["dog", "cat", "horse"], level: "medium", note: "Soprattutto i tuberi: ossalati irritanti." } },
  { re: /lathyrus|pisello odoroso|cicerchia/, tox: { to: ["dog", "cat", "horse", "people"], level: "medium", note: "I semi non sono commestibili: in quantità danneggiano i nervi (latirismo)." }, good: "bombi" },
  { re: /ipomoea (?:purpurea|tricolor|lobata)|ipomea/, tox: { to: ["dog", "cat", "people"], level: "medium", note: "I semi contengono alcaloidi allucinogeni." } },
  { re: /mirabilis|bella di notte/, tox: { to: ["dog", "cat", "people"], level: "low", note: "Semi e radici irritanti." } },
  { re: /agrostemm|gittaion/, tox: { to: ["dog", "cat", "horse", "farm", "people"], level: "medium", note: "Semi tossici (saponine)." } },
  { re: /kalanchoe/, tox: { to: ["dog", "cat"], level: "medium", note: "Glicosidi cardiaci." } },
  { re: /\baloe\b/, tox: { to: ["dog", "cat"], level: "low", note: "Il lattice giallo è lassativo." } },
  { re: /nandina/, tox: { to: ["dog", "cat", "horse"], level: "medium", note: "Le bacche liberano cianuro, pericolose anche per gli uccelli." } },
  { re: /symphoricarp|sinforicarp|lacrime d'italia/, tox: { to: ["dog", "cat", "people"], level: "low", note: "Bacche bianche tossiche per i bambini." } },
  { re: /sambuc/, tox: { to: ["dog", "cat", "horse", "people"], level: "low", note: "Foglie, rami e bacche crude danno disturbi: le bacche vanno cotte." }, good: "api e uccelli" },
  { re: /skimmia/, tox: { to: ["dog", "cat", "people"], level: "low", note: "Bacche lievemente tossiche." } },
  { re: /catharanth|pervinca del madagascar/, tox: { to: ["dog", "cat", "people"], level: "high", note: "Contiene alcaloidi molto potenti." } },
  { re: /lobelia/, tox: { to: ["dog", "cat", "people"], level: "medium", note: "Contiene lobelina." } },
  { re: /senecio|cineraria/, tox: { to: ["horse", "farm", "dog", "cat"], level: "medium", note: "Alcaloidi pirrolizidinici che danneggiano il fegato." } },
  { re: /helenium|elenio/, tox: { to: ["horse", "farm"], level: "medium", note: "Tossico per il bestiame al pascolo." }, good: "api e farfalle", origin: { native: false, from: "Nord America" } },
  { re: /lamprocapn|dicentra|cuore di maria/, tox: { to: ["dog", "cat", "farm"], level: "medium", note: "Contiene alcaloidi isochinolinici." } },
  { re: /paeoni|peoni/, tox: { to: ["dog", "cat", "horse"], level: "low", note: "Soprattutto la corteccia e i semi: disturbi digestivi." }, wildlife: [{ who: "formiche", note: "salgono sui boccioli per lo zucchero: sono innocue" }] },
  { re: /gypsophil|gipsofil/, tox: { to: ["dog", "cat"], level: "low", note: "Vomito e diarrea se mangiata." } },
  { re: /dianthus|garofan/, tox: { to: ["dog", "cat"], level: "low", note: "Lievi disturbi digestivi e dermatiti." } },
  { re: /tradescant/, tox: { to: ["dog", "cat"], level: "low", note: "La linfa irrita la pelle." } },
  { re: /plectranth|coleus/, tox: { to: ["dog", "cat", "horse"], level: "low", note: "Oli essenziali irritanti." } },
  { re: /citrus|limone in vaso|kumquat/, tox: { to: ["dog", "cat", "horse"], level: "low", note: "La buccia e le foglie contengono oli irritanti." } },
  { re: /laurus|alloro/, tox: { to: ["dog", "cat", "horse"], level: "low", note: "In quantità dà disturbi digestivi." }, origin: { native: true, from: "spontaneo nel Mediterraneo" } },
  { re: /mentha|\bment(?:a|astro|uccia)\b/, tox: { to: ["dog", "cat", "horse"], level: "low", note: "Oli essenziali irritanti in grandi quantità." } },
  { re: /solanum (?:laxum|crispum)|solano rampicante/, tox: { to: ["dog", "cat", "people"], level: "medium", note: "Bacche e foglie contengono solanina." } },
  { re: /humulus|luppol/, tox: { to: ["dog"], level: "high", note: "Le infiorescenze (anche quelle usate per la birra) possono essere letali per i cani." } },
  { re: /vitis|\bvite ornamentale/, tox: { to: ["dog"], level: "high", note: "Uva e uvetta danneggiano i reni dei cani." } },
  { re: /parthenocissus|vite americana|vite vergine/, tox: { to: ["dog", "cat", "people"], level: "low", note: "Bacche con ossalati." } },
  { re: /lonicera|caprifogl/, tox: { to: ["dog", "cat", "people"], level: "low", note: "Le bacche danno disturbi digestivi." }, good: "falene e bombi" },
  { re: /cotoneaster|cotognastr|pyracantha|agazzin/, tox: { to: ["dog", "cat", "people"], level: "low", note: "Semi delle bacche lievemente tossici." }, good: "uccelli in inverno (le bacche)" },
  { re: /hypericum|iperico/, tox: { to: ["horse", "farm"], level: "low", note: "Può rendere la pelle sensibile al sole negli animali al pascolo." } },
  { re: /baptisia/, tox: { to: ["dog", "horse", "farm"], level: "low", note: "Alcaloidi nei semi." } },
  { re: /strelitzi/, tox: { to: ["dog", "cat"], level: "low", note: "Semi e frutti danno disturbi digestivi." } },
  { re: /agave/, tox: { to: ["dog", "cat", "people"], level: "low", note: "Linfa irritante; attenzione alle spine." } },
  { re: /polygonat|sigillo di salomone/, tox: { to: ["dog", "cat", "people"], level: "low", note: "Bacche tossiche." } },
  { re: /\bgardenia/, tox: { to: ["dog", "cat", "horse"], level: "low", note: "Lievi disturbi digestivi." }, origin: { native: false, from: "Cina e Giappone" } },
  { re: /passiflor/, tox: { to: ["dog", "cat"], level: "low", note: "Foglie e frutti acerbi della passiflora blu sono lievemente tossici." } },
  { re: /campsis|bignonia/, tox: { to: ["people"], level: "low", note: "Le foglie possono irritare la pelle." } },
  { re: /\bacanth|acanto/, origin: { native: true, from: "spontaneo nel Mediterraneo" } },

  // ---- animali, insetti utili e invasive ----
  { re: /valeriana officinal/, wildlife: [{ who: "gatti", note: "attirati dall'odore delle radici, come per l'erba gatta" }] },
  { re: /actinidia kolomikta/, wildlife: [{ who: "gatti", note: "la adorano e possono rovinare i germogli: proteggi la base" }] },
  { re: /buddlej/, good: "farfalle", invasive: null, note: "In alcune zone d'Europa si diffonde nei terreni incolti: taglia i fiori appassiti prima che facciano seme." },
  { re: /lonicera japonica/, note: "Molto vigoroso: lontano da boschi e siepi naturali può diventare invadente." },
  { re: /fallopia/, note: "Crescita rapidissima: tienilo sotto controllo con potature." },
  { re: /rosa rugosa|roseraie de l|blanc double de coubert/, note: "Si allarga con polloni: in alcune coste del Nord Europa è considerata invasiva." },
  { re: /echinac/, good: "api e farfalle; d'inverno i semi nutrono i cardellini", origin: { native: false, from: "Nord America" } },
  { re: /knautia|scabios|vedovin|succisa/, good: "api e farfalle" },
  { re: /agastach|monarda|calamint|nepitell|origanum|hyssop|issopo|phacelia|facelia|borago|borragin/, good: "api" },
  { re: /eryngium|eringio|echinops|cardo/, good: "api e bombi" },
  { re: /sedum|hylotelephium/, good: "api e farfalle in autunno" },
  { re: /cerinthe/, good: "bombi" },
  { re: /trifolium|trifoglio/, good: "api; arricchisce il terreno di azoto" },
  { re: /helianthus|girasol/, good: "api; i semi nutrono gli uccelli", wildlife: [{ who: "uccelli e scoiattoli", note: "mangiano i semi maturi" }] },
  { re: /lilium|giglio(?! torcia)/, wildlife: [{ who: "criocera del giglio", note: "coleottero rosso che divora le foglie: raccoglilo a mano" }] },
  { re: /hosta|ligularia|delphin|lupin|dahlia|\bdalia\b/, wildlife: [{ who: "lumache e chiocciole", note: "attaccano le foglie giovani, soprattutto dopo la pioggia" }] },
  { re: /tulip|crocus|lilium|giglio|camassia|dahlia|\bdalia\b/, wildlife: [{ who: "arvicole", note: "mangiano bulbi e tuberi: pianta in cestelli di rete" }] },

  // ---- ortaggi ----
  { re: /pomodor|lycopersicum/, tox: { to: ["dog", "cat"], level: "low", note: "Foglie, fusti e frutti verdi contengono solanina." }, wildlife: [{ who: "merli e altri uccelli", note: "beccano i frutti maturi" }, { who: "cimici e nottue", note: "sui frutti in estate" }], origin: { native: false, from: "Sud America" } },
  { re: /patat(?!a americana)|tuberosum/, tox: { to: ["dog", "cat", "people"], level: "medium", note: "Tuberi verdi, germogli e foglie contengono solanina: non mangiare le patate verdi." }, wildlife: [{ who: "cinghiali", note: "scavano e distruggono il raccolto: serve una recinzione robusta o elettrificata" }, { who: "istrici", note: "scavano i tuberi di notte" }, { who: "dorifora", note: "il coleottero a strisce che mangia le foglie" }], origin: { native: false, from: "Ande (Sud America)" } },
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
  { re: /pisum|pisell[oi](?! odoros)/, wildlife: [{ who: "piccioni e gazze", note: "mangiano semi e baccelli" }, { who: "topi", note: "scavano i semi appena seminati" }] },
  { re: /\bfava\b|vicia faba/, tox: { to: ["people"], level: "high", note: "Pericolosa per chi soffre di favismo (carenza di G6PD), anche solo respirando il polline in fioritura." }, wildlife: [{ who: "afidi neri", note: "colonie sulle punte: cimale le piante" }], zone: { nord: "Al Nord è meno diffusa che al Centro-Sud." } },
  { re: /cavol|brocc|brassica oleracea/, wildlife: [{ who: "cavolaia", note: "farfalla bianca i cui bruchi divorano le foglie" }, { who: "piccioni, lepri e caprioli", note: "mangiano le foglie" }] },
  { re: /ravanell/, wildlife: [{ who: "altica", note: "piccoli coleotteri che bucherellano le foglie" }] },
  { re: /fragaria|^fragol/, wildlife: [{ who: "merli e altri uccelli", note: "mangiano i frutti: usa una rete" }, { who: "lumache e topi", note: "rosicchiano i frutti vicino a terra" }] },
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
