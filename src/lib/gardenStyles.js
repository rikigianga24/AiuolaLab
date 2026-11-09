// Stili di giardino: spiegazioni per chi parte da zero e regole per capire
// a quali stili si adatta ogni pianta del catalogo (anche a più di uno).
//
// Una pianta appartiene a uno stile se il nome corrisponde alle piante
// tipiche di quello stile oppure se le sue caratteristiche (esposizione,
// acqua, altezza, gruppo...) sono quelle che lo stile richiede.

export const GARDEN_STYLES = [
  {
    id: "cottage",
    name: "Cottage garden",
    short: "Cottage",
    tagline: "Un'esplosione romantica di fiori, come nei giardini di campagna inglesi.",
    what:
      "Aiuole fitte e informali dove rose, perenni e fiori annuali si mescolano senza un ordine apparente: piante alte dietro che si appoggiano l'una all'altra, colori tenui, tanti profumi. Il terreno quasi non si vede.",
    origin:
      "Nasce dai piccoli giardini dei cottage contadini inglesi, dove fiori, aromatiche e ortaggi crescevano insieme. Tra Ottocento e Novecento Gertrude Jekyll e William Robinson lo trasformarono nello stile romantico che conosciamo.",
    where: ["casali e agriturismi", "giardini di campagna", "bordure lungo muri, staccionate e vialetti", "anche piccoli giardini di città"],
    features: [
      "piante fitte, senza terra scoperta",
      "colori pastello: rosa, lilla, bianco, azzurro",
      "fiori a spiga accanto a fiori tondi",
      "rose e rampicanti su archi e staccionate",
      "vialetti in ghiaia o mattoni",
    ],
    plants: ["Rosa inglese", "Lavanda", "Digitale", "Lupino", "Speronella", "Nepeta", "Geranio perenne", "Alchemilla", "Aquilegia", "Peonia", "Campanula", "Malvone"],
    maintenance: "media",
    ideal: "Sole o mezz'ombra, terreno fertile e chi ama un effetto naturale e pieno.",
    palette: ["#e88fb4", "#c7a0d6", "#f4f1ea", "#8fb6e8"],
    scene: { ground: "bark", layout: "drifts" },
    match: {
      re: /rosa inglese|david austin|rosa antica|bourbon|damascena|centifolia|rosa alba|gallica|lavand|digital|lupin|delphin|speron|nepeta|geranium|geranio perenne|alchemill|aquileg|paeoni|peoni|campanul|alcea|malvon|phlox|astrantia|leucanthemum|margherit|sweet william|dianthus barbatus|garofan|cosmo|nigell|papaver|aster|salvia nemorosa|clemati|lonicera|caprifoglio|penstemon|scabios|knautia|verbasc|achille|antirrhin|bocca di leone|calendul|zinnia|lathyrus|pisello odoroso|heliotrop|eliotropio|centaure|fiordaliso|dahlia|dalia|cosmos|cosmea|cleome|clarkia|godezia|crocosmia|cerinthe|cephalaria|cefalaria|lychnis|croce di malta|mirabilis|bella di notte|cobaea|cobea|fritillaria|corona imperiale|anemone coronaria|anemone dei fioristi|hemerocall|emerocall|lilium|giglio|gladiol|deutzia|philadelphus|fior d'angelo|filadelfo|kolkwitzia|gypsophila|gipsofila|filipendula|diascia|hyacinth|giacint|agrostemma|gittaione|ornithogal|forsythia|forsizia|exochorda|syringa|lillà|hibiscus syriacus|altea|weigel|spirea|spiraea|viburn|pallon di maggio|ribes|nemesia|nemophila|nemofila|polemon|saponari|ranuncul|reseda|nicotiana|tabacco ornamentale|orlaya|ammi|visnaga|lathyrus|ipomoea|ipomea|thunbergia|passiflora|solanum|solano|humulus|luppolo/,
      groups: ["rose"],
    },
  },
  {
    id: "italiano",
    name: "Giardino all'italiana",
    short: "All'italiana",
    tagline: "Geometria, simmetria e siepi di bosso: il giardino delle ville rinascimentali.",
    what:
      "Un giardino formale costruito sulla geometria: aiuole regolari bordate da siepi basse di bosso potate a disegno, viali dritti, simmetria attorno a un centro (una fontana, un vaso, un agrume). Il colore viene soprattutto dal verde, i fiori sono un accento.",
    origin:
      "Nasce nelle ville toscane e romane del Quattrocento e Cinquecento: Boboli a Firenze, Villa d'Este a Tivoli, Villa Lante a Bagnaia. Esprime l'idea rinascimentale di natura ordinata dall'uomo.",
    where: ["ville e dimore storiche", "ingressi di case di campagna", "cortili con aiuole a croce", "giardini davanti a casa con un impianto regolare"],
    features: [
      "aiuole bordate da siepi basse di bosso",
      "disegno simmetrico attorno a un centro",
      "poche specie ripetute, soprattutto sempreverdi",
      "agrumi in vaso, cipressi, statue o fontane",
      "vialetti in ghiaia",
    ],
    plants: ["Bosso", "Tasso", "Alloro", "Cipresso", "Leccio", "Agrumi in vaso", "Lavanda", "Rosmarino", "Mirto", "Rose", "Glicine"],
    maintenance: "alta",
    ideal: "Chi ama l'ordine e un giardino elegante tutto l'anno, anche d'inverno.",
    palette: ["#3f6b2f", "#f4f1ea", "#e88fb4", "#9b6fc4"],
    scene: { ground: "gravel", layout: "formal" },
    match: {
      re: /buxus|bosso|taxus|tasso|laurus|alloro|cupress|cipress|quercus ilex|leccio|citrus|limon|arancio|agrum|lavand|rosmarin|myrtus|mirto|teucrium|pittospor|ligustr|wisteria|glicine|trachelosperm|falso gelsomino|santolin|ilex|photinia|fotinia|prunus laurocerasus|lauroceras|osmanthus|osmanto|gardenia|jasminum|gelsomino|chamaerops|palma nana/,
    },
  },
  {
    id: "francese",
    name: "Giardino alla francese",
    short: "Alla francese",
    tagline: "Il giardino scenografico di Versailles: ricami di bosso e fioriture in massa.",
    what:
      "È l'evoluzione seicentesca del giardino all'italiana, più grande e teatrale: lunghe prospettive, specchi d'acqua e parterre «a ricamo», cioè disegni di bosso nano su ghiaia colorata. Le aiuole si riempiono di fiori stagionali dello stesso colore, in grandi masse.",
    origin:
      "Lo inventa André Le Nôtre per Luigi XIV a Versailles, nel Seicento. Da lì si diffonde in tutte le corti d'Europa, anche in Italia (la Reggia di Caserta, Venaria Reale).",
    where: ["grandi parchi e dimore", "in piccolo: un parterre davanti a casa", "rotonde e aiuole d'ingresso", "aiuole cittadine"],
    features: [
      "parterre a ricamo con bosso nano",
      "masse di fiori stagionali di un solo colore",
      "simmetria assoluta",
      "arbusti potati a cono, palla o cubo",
      "ghiaie di colori diversi",
    ],
    plants: ["Bosso", "Tasso", "Santolina", "Lavanda", "Rose ad alberello", "Tulipani", "Viole del pensiero", "Begonie", "Tagete", "Carpino"],
    maintenance: "molto alta",
    ideal: "Chi vuole un effetto scenografico e ha tempo per potature e cambi di stagione.",
    palette: ["#3f6b2f", "#d64545", "#f2c94c", "#9b6fc4"],
    scene: { ground: "gravel", layout: "broderie" },
    match: {
      re: /buxus|bosso|taxus|tasso|santolin|lavand|carpin|tulip|viola (×|x )?wittrockiana|viola del pensiero|viole|begoni|tagete|tagetes|salvia splendens|ageratum|pelargon|gerani|cineraria|senecio cineraria|bellis|primul|myosotis|angelonia|bacopa|calibrachoa|bidens|celosia|cresta di gallo|amaranth|amaranto|crisantem|chrysanthemum|petunia|surfinia|impatiens|lobelia erinus|ageratum|zinnia|amarillide|hippeastrum|dipladenia|mandevilla|gerbera|freesia|fresia|eucomis|giacint|hyacinth|ranuncul|nemesia|scaevola|scevola|nicotiana|tabacco ornamentale|gomphrena|perpetuin/,
    },
  },
  {
    id: "giapponese",
    name: "Giardino giapponese",
    short: "Giapponese",
    tagline: "Pietre, ghiaia, aceri e muschio: il paesaggio in miniatura che invita alla calma.",
    what:
      "Rappresenta la natura in piccolo con pochi elementi simbolici: l'acqua (vera o ghiaia rastrellata), le pietre per le montagne, aceri, azalee potate a cuscino, muschio e lanterne. Tutto è asimmetrico e misurato; conta il verde in tante sfumature e il cambio delle stagioni.",
    origin:
      "Nasce nei giardini dei templi buddisti del Giappone, soprattutto a Kyoto, dove i monaci zen crearono i giardini secchi di pietra e ghiaia per la meditazione.",
    where: ["angoli tranquilli e cortili interni", "zone d'ombra luminosa", "spazi piccoli", "terrazzi con vasi, ghiaia e un acero"],
    features: [
      "pochi elementi scelti con cura",
      "asimmetria e gruppi dispari",
      "pietre, ghiaia e acqua (o il suo simbolo)",
      "arbusti potati a cuscino o «a nuvola»",
      "tante sfumature di verde, pochi fiori",
    ],
    plants: ["Acero giapponese", "Azalea", "Camelia", "Pieris", "Bambù (in contenitore)", "Ophiopogon", "Hakonechloa", "Felci", "Hosta", "Iris", "Pino potato"],
    maintenance: "media",
    ideal: "Spazi piccoli o in ombra luminosa, chi cerca calma più che colore.",
    palette: ["#3f6b2f", "#b33a2a", "#e88fb4", "#a8a39b"],
    scene: { ground: "gravel", layout: "sparse" },
    match: {
      re: /acer palmatum|acero giappon|azalea|rhododendr|camell|pieris|phyllostachys|bambù|bambu|fargesia|ophiopogon|liriope|hakonechloa|felc|fern|polystich|dryopter|athyr|matteuccia|hosta|iris|pinus|nandina|enkianthus|paeonia suffrut|peonia arbor|prunus serrul|ciliegio da fiore|cornus kousa|carex|acorus|equisetum|hamamelis|amamelide|akebia|skimmia|fatsia|osmanthus|osmanto|viburnum plicatum|mariesii|weigel|ribes|amelanchier|pero corvino|vitis coignetiae|vite ornamentale/,
    },
  },
  {
    id: "mediterraneo",
    name: "Giardino mediterraneo",
    short: "Mediterraneo",
    tagline: "Aromatiche, foglie grigie e ghiaia: profumato e quasi senza bisogno d'acqua.",
    what:
      "Un giardino asciutto ispirato alla macchia mediterranea: piante aromatiche e dalle foglie grigie che amano il sole e resistono alla siccità, su ghiaia o pietrisco. Profuma, attira le api e dopo il primo anno chiede pochissima acqua.",
    origin:
      "Prende spunto dalla vegetazione spontanea delle coste del Mediterraneo (macchia e gariga). Negli anni Ottanta il vivaista francese Olivier Filippi e la paesaggista inglese Beth Chatto lo resero famoso come «giardino senza irrigazione».",
    where: ["Centro e Sud Italia, isole e coste", "pendii assolati", "terrazze esposte a sud", "giardini senza irrigazione e case di vacanza"],
    features: [
      "foglie grigie, argentate e profumate",
      "piante a cuscino e a palla",
      "pacciamatura di ghiaia o sassi",
      "fiori viola, blu, gialli e bianchi",
      "pochissima acqua dopo il primo anno",
    ],
    plants: ["Lavanda", "Rosmarino", "Salvia", "Santolina", "Cisto", "Elicriso", "Perovskia", "Euforbia", "Stipa", "Timo", "Teucrio", "Olivo", "Oleandro", "Gaura"],
    maintenance: "bassa",
    ideal: "Sole pieno, terreno povero e drenante, poca voglia di annaffiare.",
    palette: ["#9b6fc4", "#a8b39a", "#f2c94c", "#f4f1ea"],
    scene: { ground: "gravel", layout: "drifts-loose" },
    match: {
      re: /lavand|rosmarin|salvia (officinalis|greggii|microphylla|leucantha)|santolin|cistus|cisto|helichrys|elicris|perovsk|euphorb|stipa|thymus|timo|teucrium|olea|olivo|nerium|oleandr|gaura|phlomis|origan|myrtus|mirto|agave|yucca|achillea|artemisia|lantana|westringia|convolvulus cneorum|ceratostigma|erigeron karvinsk|osteosperm|gazania|bougainv|plumbago|eschscholzia|helianthemum|sedum|aloe|aeonium|echeveria|crassula|campsis|bignonia|lobularia|alisso|cineraria marittima|senecio cineraria|callistemon|grevillea|polygala|coronilla|hebe|feijoa|jasminum|gelsomino|hibiscus|ibisco|trachelosperm|pittospor|ceanothus|vitex|punica|melograno|osmanthus|osmanto|chamaerops|palma nana|strelitzi|scaevola|scevola|passiflora|maracuja|solanum|solano/,
      when: (p) => p.watering === "minimum" && (p.sunlight ?? []).includes("full_sun") && ["aromatiche", "arbusti", "perenni", "graminacee"].includes(p.group),
    },
  },
  {
    id: "moderno",
    name: "Giardino moderno",
    short: "Moderno",
    tagline: "Linee pulite, pochi colori e graminacee che ondeggiano al vento.",
    what:
      "Un giardino essenziale: forme semplici, bordi netti, pochi materiali (corten, cemento, legno) e piante ripetute in grandi masse. La tavolozza è ridotta (verde, bianco, viola) e le graminacee danno movimento e bellezza anche d'inverno.",
    origin:
      "Nasce nel Novecento con l'architettura moderna: dal brasiliano Roberto Burle Marx ai paesaggisti contemporanei, che portano nel giardino la stessa pulizia di linee delle case.",
    where: ["case nuove", "giardini piccoli di città", "terrazze e cortili", "spazi davanti a uffici e negozi"],
    features: [
      "aiuole squadrate con bordi netti",
      "poche specie ripetute a blocchi",
      "graminacee e sempreverdi per l'inverno",
      "2-3 colori in tutto",
      "ghiaia scura, lapillo o corten",
    ],
    plants: ["Pennisetum", "Miscanthus", "Festuca blu", "Stipa", "Bosso a palla", "Ophiopogon nero", "Heuchera", "Allium", "Agapanto", "Euforbia", "Lavanda in massa", "Ortensia paniculata"],
    maintenance: "bassa",
    ideal: "Chi vuole ordine con poca manutenzione e un giardino bello tutto l'anno.",
    palette: ["#3f6b2f", "#f4f1ea", "#9b6fc4", "#c2b878"],
    scene: { ground: "lapillo", layout: "blocks" },
    match: {
      re: /pennisetum|miscanth|festuca|stipa|calamagrost|panicum|hakonechloa|carex|ophiopogon|buxus|bosso|heuchera|allium|agapanth|euphorb|hydrangea paniculata|ortensia paniculata|sesleria|deschampsia|molinia|imperata|phormium|lavand|echinops|eryngium|nepeta|salvia nemorosa|verbena bonariensis|gaura|aeonium|aloe|agave|echeveria|cordyline|canna|zantedeschia|calla|cycas|cicas|musa|colocasia|cornus sibirica|corniolo|callicarpa|photinia|fotinia|hebe|strelitzi|chamaerops|palma nana|amelanchier|pero corvino|sambucus|sambuco/,
      groups: ["graminacee"],
    },
  },
  {
    id: "geometrico",
    name: "Giardino geometrico (a nodi e a quadri)",
    short: "Geometrico",
    tagline: "Aiuole a quadri e «nodi» di siepi basse riempiti di aromatiche e fiori.",
    what:
      "Aiuole dalle forme regolari, quadrati, cerchi, spirali, divise da siepi basse che si intrecciano come un nodo e riempite di aromatiche, fiori e anche ortaggi. È ordinato come un giardino all'italiana, ma più piccolo, intimo e produttivo.",
    origin:
      "Unisce il «knot garden» dei giardini inglesi dell'epoca Tudor (Cinquecento) e il «potager», l'orto decorativo dei castelli francesi come Villandry.",
    where: ["piccoli giardini e cortili", "aiuole davanti a casa", "orti decorativi", "giardini delle aromatiche vicino alla cucina"],
    features: [
      "forme regolari ripetute",
      "siepi basse di bosso, teucrio o santolina",
      "ogni scomparto con una pianta sola",
      "aromatiche, fiori e ortaggi insieme",
      "vialetti stretti tra i quadri",
    ],
    plants: ["Bosso", "Teucrio", "Santolina", "Lavanda", "Timo", "Erba cipollina", "Salvia", "Calendula", "Tagete", "Viole", "Insalate colorate"],
    maintenance: "alta",
    ideal: "Spazi piccoli e soleggiati, chi ama le aromatiche e un ordine «da orto».",
    palette: ["#3f6b2f", "#9b6fc4", "#f2994a", "#f2c94c"],
    scene: { ground: "soil", layout: "grid" },
    match: {
      re: /buxus|bosso|teucrium|santolin|lavand|thymus|timo|erba cipollina|allium schoenopr|salvia officinalis|origan|maggiorana|calendul|tagete|tagetes|viola|nasturz|tropaeol|rosmarin|ruta|issopo|hyssop|basilic|prezzemol/,
      groups: ["aromatiche"],
    },
  },
  {
    id: "naturalistico",
    name: "Giardino naturalistico (prateria)",
    short: "Naturalistico",
    tagline: "Graminacee e fiori robusti in grandi gruppi: un prato fiorito che si muove col vento.",
    what:
      "Imita le praterie e i prati fioriti: perenni robuste e graminacee piantate in grandi gruppi che si mescolano tra loro. È bello anche d'inverno, quando le spighe e i fiori secchi restano in piedi, e ospita tanti insetti e uccelli.",
    origin:
      "È il movimento «New Perennial», reso famoso dall'olandese Piet Oudolf (la High Line di New York) e ispirato alle praterie nordamericane e ai prati europei.",
    where: ["grandi aiuole al sole", "bordi di prati", "giardini di campagna", "rotonde e spazi pubblici"],
    features: [
      "grandi gruppi della stessa pianta",
      "graminacee tra i fiori",
      "piante che restano belle anche secche",
      "poca manutenzione: un taglio a fine inverno",
      "tanta biodiversità",
    ],
    plants: ["Echinacea", "Rudbeckia", "Perovskia", "Sanguisorba", "Veronicastrum", "Achillea", "Aster", "Eupatorium", "Verbena bonariensis", "Gaura", "Miscanthus", "Panicum", "Molinia", "Sesleria"],
    maintenance: "bassa",
    ideal: "Aiuole grandi e soleggiate, chi vuole un giardino vivo e poco curato.",
    palette: ["#c7609a", "#f2b632", "#9b6fc4", "#c2b878"],
    scene: { ground: "soil", layout: "drifts" },
    match: {
      re: /echinac|rudbeck|perovsk|sanguisorb|veronicastr|achille|aster|symphyotr|eupatori|verbena bonariensis|gaura|miscanth|panicum|molinia|sesleria|calamagrost|pennisetum|stipa|deschampsia|sporobolus|helenium|coreopsis|monarda|agastache|liatris|knautia|scabios|salvia nemorosa|nepeta|amsonia|baptisia|astrantia|thalictrum|persicaria|lythrum|eryngium|echinops|allium|stachys|betonica|salvia pratensis|origanum|camassia|crocus|croco|colchic|chionodoxa|leucojum|campanellino|galanthus|bucaneve|scilla|muscari|narcis|crocosmia|cephalaria|cefalaria|amaranth|amaranto|cornus sibirica|corniolo|callicarpa|hemerocall|emerocall|inula|heliopsis|eliopsi|filipendula|olmaria|kalimeris|succisa|morso del diavolo|orlaya|ammi|visnaga|lysimachia|lisimachia|persicaria|poligono|polemon|gomphrena|perpetuin/,
    },
  },
  {
    id: "roccioso",
    name: "Giardino roccioso",
    short: "Roccioso",
    tagline: "Piante a cuscino e succulente tra le pietre, come su un pendio di montagna.",
    what:
      "Ricrea un pendio di montagna: pietre grandi e piccole con, tra le fessure, piante basse a cuscino, succulente e fioriture alpine. Il terreno deve essere molto drenante, perché queste piante temono i ristagni più del freddo.",
    origin:
      "Nasce nell'Ottocento in Inghilterra, con la passione per le piante alpine portate dalle spedizioni in montagna; in Italia ricorda i giardini alpini come quello di Paradisia in Val d'Aosta.",
    where: ["scarpate e pendenze", "muretti a secco", "angoli assolati e aridi", "vasche, vasi e fioriere poco profonde"],
    features: [
      "pietre e ghiaia come protagoniste",
      "piante basse a cuscino e succulente",
      "terreno sabbioso e drenante",
      "fioriture piccole ma fittissime",
      "pochissima acqua",
    ],
    plants: ["Sedum", "Sempervivum", "Aubrieta", "Phlox subulata", "Timo", "Saxifraga", "Campanula", "Festuca", "Dianthus", "Iberis", "Armeria", "Cerastium"],
    maintenance: "bassa",
    ideal: "Terreni in pendenza, sassosi o aridi, e chi ama le piccole fioriture.",
    palette: ["#e88fb4", "#c7a0d6", "#f4f1ea", "#a8a39b"],
    scene: { ground: "pebbles", layout: "sparse" },
    match: {
      re: /sedum|sempervivum|aubriet|phlox subulata|thymus|timo|saxifrag|campanula (portensch|poscharsk|carpat)|festuca|dianthus|iberis|armeria|cerastium|arabis|alyssum|aurinia|helianthemum|delosperma|erodium|androsace|gentian|edelweiss|leontopod|lewisia|euphorbia myrsinit|antennaria|pulsatill|calluna|brugo|erica|lobularia|alisso|echeveria/,
      when: (p) => (p.heightCm?.max ?? 999) <= 30 && p.watering === "minimum" && (p.sunlight ?? []).includes("full_sun"),
    },
  },
  {
    id: "ombra",
    name: "Giardino d'ombra",
    short: "D'ombra",
    tagline: "Foglie grandi, felci e fiori chiari che illuminano gli angoli senza sole.",
    what:
      "Il giardino delle zone dove il sole arriva poco: sotto gli alberi, a nord della casa, nei cortili chiusi. Al posto dei fiori sgargianti ci sono foglie grandi e decorative in tante sfumature di verde, variegate e argentate, e fioriture chiare che si vedono anche nella penombra.",
    origin:
      "Si ispira al sottobosco delle foreste. Lo hanno reso popolare i giardini inglesi «woodland» e paesaggiste come Beth Chatto, che ha mostrato come ogni angolo d'ombra possa diventare bello.",
    where: ["il lato nord della casa", "sotto alberi e siepi alte", "cortili interni", "terrazzi e balconi senza sole"],
    features: [
      "foglie grandi e decorative",
      "verdi variegati, argentati e bordeaux",
      "fioriture bianche e chiare",
      "terreno ricco e fresco",
      "tappezzanti al posto del prato",
    ],
    plants: ["Hosta", "Felci", "Elleboro", "Astilbe", "Heuchera", "Brunnera", "Epimedium", "Anemone giapponese", "Ortensia", "Digitale", "Iva (Ajuga)", "Pervinca", "Hakonechloa"],
    maintenance: "media",
    ideal: "Angoli con meno di 3-4 ore di sole e terreno che resta fresco.",
    palette: ["#4f7d5d", "#f4f1ea", "#c7a0d6", "#8fb6e8"],
    scene: { ground: "bark", layout: "drifts" },
    match: {
      re: /hosta|felc|fern|polystich|dryopter|athyr|matteuccia|osmunda|blechnum|helleb|elleb|astilb|heuchera|brunnera|epimedium|anemone (x )?hybrida|anemone giappon|hydrange|ortensi|digital|ajuga|bugola|vinca|pervinc|hakonechloa|pulmonari|tiarella|tellima|convallari|mughetto|polygonatum|dicentra|lamprocapnos|cuore di maria|bergenia|ligularia|rodgersia|aruncus|actaea|cimicifug|tradescantia|begonia|impatiens|lamium|galium odoratum|asperula|ophiopogon|liriope|carex|hamamelis|amamelide|anemone blanda|anemone nemorosa|akebia|aucuba|fatsia|sarcococca|skimmia|viburnum tinus|lentaggine|daphne|dafne|actinidia|leucojum|galanthus|bucaneve|chionodoxa|scilla|gardenia|osmanthus|osmanto|viburn|ribes|polemon|filipendula|olmaria|nerine/,
      when: (p) => (p.sunlight ?? []).includes("full_shade"),
    },
  },
  {
    id: "impollinatori",
    name: "Giardino per api e farfalle",
    short: "Impollinatori",
    tagline: "Fiori ricchi di nettare dalla primavera all'autunno, per api, farfalle e bombi.",
    what:
      "Un giardino pensato per gli impollinatori: fiori semplici e ricchi di nettare e polline, scelti perché ce ne sia sempre qualcuno aperto da marzo a ottobre, senza pesticidi. Ronza di vita e aiuta anche l'orto vicino a dare più frutti.",
    origin:
      "È un'idea recente, nata con la preoccupazione per il calo delle api. Oggi lo promuovono università, associazioni di apicoltori e comuni, anche con i «prati fioriti» nelle città.",
    where: ["ovunque, anche su un balcone", "vicino a orti e frutteti", "bordi dei prati", "scuole e spazi pubblici"],
    features: [
      "fiori semplici (non doppi), facili da visitare",
      "fioriture scalate dalla primavera all'autunno",
      "tante aromatiche",
      "gruppi di piante uguali, ben visibili",
      "niente pesticidi",
    ],
    plants: ["Lavanda", "Nepeta", "Salvia", "Echinacea", "Agastache", "Buddleja", "Verbena bonariensis", "Sedum", "Achillea", "Origano", "Timo", "Borragine", "Cosmos", "Facelia"],
    maintenance: "bassa",
    ideal: "Posti soleggiati e chi vuole un giardino pieno di vita.",
    palette: ["#9b6fc4", "#f2c94c", "#e88fb4", "#5b8fd9"],
    scene: { ground: "bark", layout: "drifts" },
    match: {
      re: /lavand|nepeta|salvia|echinac|agastache|buddleja|buddleia|verbena|sedum|hylotelephium|achille|origan|thymus|timo|borago|borragin|cosmos|phacelia|facelia|rudbeck|helenium|coreopsis|monarda|knautia|scabios|eryngium|echinops|aster|symphyotr|perovsk|calamintha|teucrium|rosmarin|caryopteris|veronica|veronicastr|allium|centaure|helianthus|girasol|calendul|zinnia|lantana|gaura|eupatori|liatris|origanum|mentha|melissa|issopo|hyssop|phlomis|abelia|stachys|betonica|campsis|bignonia|lobularia|alisso|antirrhin|bocca di leone|calluna|erica|heliotrop|eliotropio|weigel|spirea|spiraea|viburn|ribes|amelanchier|pero corvino|sambucus|sambuco|succisa|morso del diavolo|reseda|ammi|visnaga|orlaya|nemophila|nemofila|saponari|polemon|hebe|inula|heliopsis|eliopsi/,
    },
  },
];

export const STYLE_BY_ID = Object.fromEntries(GARDEN_STYLES.map((s) => [s.id, s]));
export const STYLE_IDS = GARDEN_STYLES.map((s) => s.id);

const textOf = (p) => `${p?.scientificName ?? ""} ${p?.commonName ?? p?.name ?? ""} ${(p?.otherNames ?? []).join(" ")}`.toLowerCase();

/** Stili di giardino a cui si adatta una pianta (anche più di uno). */
export function stylesFor(plant) {
  const text = textOf(plant);
  const out = [];
  for (const s of GARDEN_STYLES) {
    const m = s.match;
    if (m.re.test(text) || (m.groups && m.groups.includes(plant?.group)) || (m.when && m.when(plant))) out.push(s.id);
  }
  return out;
}

export const MAINTENANCE_LABEL = { bassa: "Manutenzione bassa", media: "Manutenzione media", alta: "Manutenzione alta", "molto alta": "Manutenzione molto alta" };
