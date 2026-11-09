// Ortaggi: calendario indicativo per il Centro Italia (i mesi si spostano
// in base alla zona climatica, vedi care.js), distanze di impianto,
// famiglia botanica per la rotazione e consociazioni.
//
// Mesi: 1 = gennaio ... 12 = dicembre.
// indoor = semina in semenzaio, direct = semina in piena terra,
// transplant = trapianto, harvest = raccolta, days = giorni dalla semina
// (o dal trapianto) alla prima raccolta.

export const FAMILIES = {
  solanacee: "Solanacee",
  cucurbitacee: "Cucurbitacee",
  asteracee: "Asteracee (insalate)",
  amarantacee: "Amarantacee (spinacio, bietola)",
  apiacee: "Ombrellifere",
  alliacee: "Liliacee (aglio, cipolla)",
  leguminose: "Leguminose",
  brassicacee: "Crucifere (cavoli)",
  lamiacee: "Aromatiche",
  rosacee: "Rosacee",
  poacee: "Graminacee",
  valerianacee: "Valerianacee (songino)",
  asparagacee: "Asparagacee (asparago)",
};

const C = (id, name, sci, family, icon, colors, row, plant, months, days, water, good, bad, notes = "") => ({
  id,
  name,
  scientificName: sci,
  family,
  icon,
  colors,
  spacing: { row, plant },
  ...months,
  days,
  watering: water,
  good,
  bad,
  notes,
});

export const CROPS = [
  C("pomodoro", "Pomodoro", "Solanum lycopersicum", "solanacee", "fruiting", ["#d64545"], 80, 50, { indoor: [2, 3], transplant: [4, 5], harvest: [7, 8, 9] }, 90, "frequent", ["basilico", "carota", "prezzemolo", "cipolla", "aglio", "lattuga", "sedano"], ["patata", "finocchio", "cavolo", "broccolo", "mais"], "Servono tutori; togli i germogli ascellari (sfemminellatura)."),
  C("peperone", "Peperone", "Capsicum annuum", "solanacee", "fruiting", ["#d64545", "#f2c94c"], 60, 40, { indoor: [2, 3], transplant: [5], harvest: [7, 8, 9, 10] }, 100, "frequent", ["basilico", "cipolla", "carota"], ["finocchio", "fagiolo"]),
  C("melanzana", "Melanzana", "Solanum melongena", "solanacee", "fruiting", ["#5b2a6e"], 80, 50, { indoor: [2, 3], transplant: [5], harvest: [7, 8, 9] }, 100, "frequent", ["fagiolo", "basilico"], ["finocchio", "patata"]),
  C("patata", "Patata", "Solanum tuberosum", "solanacee", "leafy", [], 70, 30, { direct: [3, 4], harvest: [6, 7, 8] }, 100, "average", ["fagiolo", "cavolo", "fava"], ["pomodoro", "zucca", "zucchina", "cetriolo", "melanzana"], "Rincalza le piante quando sono alte 15–20 cm."),
  C("zucchina", "Zucchina", "Cucurbita pepo", "cucurbitacee", "squash", ["#f2c94c"], 100, 80, { indoor: [3, 4], direct: [4, 5, 6], transplant: [4, 5], harvest: [6, 7, 8, 9] }, 55, "frequent", ["fagiolo", "mais", "cipolla", "lattuga"], ["patata"]),
  C("zucca", "Zucca", "Cucurbita maxima", "cucurbitacee", "squash", ["#f2994a"], 200, 150, { direct: [4, 5], transplant: [5], harvest: [9, 10] }, 120, "average", ["mais", "fagiolo"], ["patata"]),
  C("cetriolo", "Cetriolo", "Cucumis sativus", "cucurbitacee", "squash", ["#f2c94c"], 100, 50, { direct: [4, 5, 6], transplant: [5], harvest: [6, 7, 8, 9] }, 60, "frequent", ["fagiolo", "lattuga", "pisello"], ["patata"]),
  C("melone", "Melone", "Cucumis melo", "cucurbitacee", "squash", ["#f2c94c"], 150, 100, { indoor: [3, 4], transplant: [5], harvest: [7, 8] }, 90, "average", ["mais"], ["patata"]),
  C("anguria", "Anguria", "Citrullus lanatus", "cucurbitacee", "squash", ["#f2c94c"], 200, 120, { indoor: [3, 4], transplant: [5], harvest: [7, 8, 9] }, 100, "average", ["mais"], ["patata"]),
  C("lattuga", "Lattuga", "Lactuca sativa", "asteracee", "leafy", [], 30, 25, { indoor: [2, 3, 8], direct: [3, 4, 5, 6, 7, 8, 9], transplant: [3, 4, 5, 9, 10], harvest: [4, 5, 6, 7, 8, 9, 10, 11] }, 50, "frequent", ["carota", "ravanello", "fragola", "cetriolo", "cipolla"], ["prezzemolo", "sedano"]),
  C("radicchio", "Radicchio", "Cichorium intybus", "asteracee", "leafy", ["#8e2a4a"], 30, 25, { direct: [6, 7], harvest: [10, 11, 12, 1] }, 110, "average", ["finocchio", "lattuga"], []),
  C("rucola", "Rucola", "Eruca vesicaria", "brassicacee", "leafy", [], 20, 5, { direct: [3, 4, 5, 6, 7, 8, 9], harvest: [4, 5, 6, 7, 8, 9, 10, 11] }, 40, "average", ["lattuga"], []),
  C("spinacio", "Spinacio", "Spinacia oleracea", "amarantacee", "leafy", [], 25, 10, { direct: [2, 3, 4, 9, 10], harvest: [3, 4, 5, 10, 11, 12] }, 45, "average", ["fragola", "cavolo"], ["bietola"]),
  C("bietola", "Bietola", "Beta vulgaris", "amarantacee", "leafy", ["#d64545"], 40, 25, { direct: [3, 4, 5, 6, 8, 9], harvest: [5, 6, 7, 8, 9, 10, 11, 12] }, 60, "average", ["cipolla", "lattuga"], ["spinacio"]),
  C("carota", "Carota", "Daucus carota", "apiacee", "feathery", [], 25, 5, { direct: [2, 3, 4, 5, 6, 7], harvest: [5, 6, 7, 8, 9, 10, 11] }, 90, "average", ["cipolla", "porro", "pomodoro", "lattuga", "pisello", "ravanello"], []),
  C("finocchio", "Finocchio", "Foeniculum vulgare", "apiacee", "feathery", [], 40, 25, { direct: [6, 7], transplant: [7, 8], harvest: [10, 11, 12] }, 90, "frequent", ["lattuga"], ["pomodoro", "fagiolo", "peperone", "melanzana"]),
  C("sedano", "Sedano", "Apium graveolens", "apiacee", "feathery", [], 40, 30, { indoor: [3], transplant: [5, 6], harvest: [9, 10, 11] }, 120, "frequent", ["pomodoro", "porro", "cavolo", "fagiolo"], ["lattuga"]),
  C("prezzemolo", "Prezzemolo", "Petroselinum crispum", "apiacee", "feathery", [], 25, 15, { direct: [3, 4, 5, 6, 7, 8, 9], harvest: [5, 6, 7, 8, 9, 10, 11] }, 70, "average", ["pomodoro", "carota"], ["lattuga"]),
  C("basilico", "Basilico", "Ocimum basilicum", "lamiacee", "leafy", [], 30, 25, { indoor: [3, 4], direct: [5, 6], transplant: [5], harvest: [6, 7, 8, 9] }, 50, "average", ["pomodoro", "peperone", "melanzana"], []),
  C("cipolla", "Cipolla", "Allium cepa", "alliacee", "allium", [], 25, 10, { direct: [2, 3, 4, 10, 11], harvest: [6, 7, 8] }, 120, "minimum", ["carota", "lattuga", "pomodoro", "bietola"], ["fagiolo", "pisello", "fava"]),
  C("aglio", "Aglio", "Allium sativum", "alliacee", "allium", [], 25, 10, { direct: [2, 3, 10, 11, 12], harvest: [6, 7] }, 180, "minimum", ["pomodoro", "carota", "fragola"], ["fagiolo", "pisello", "fava"]),
  C("porro", "Porro", "Allium porrum", "alliacee", "allium", [], 40, 15, { indoor: [2, 3, 4], transplant: [5, 6, 7], harvest: [10, 11, 12, 1, 2] }, 140, "average", ["carota", "sedano"], ["fagiolo", "pisello"]),
  C("fagiolo", "Fagiolo / fagiolino", "Phaseolus vulgaris", "leguminose", "legume", ["#f4f1ea"], 50, 10, { direct: [4, 5, 6, 7], harvest: [7, 8, 9] }, 70, "average", ["zucchina", "mais", "patata", "carota", "cetriolo", "cavolo", "sedano"], ["cipolla", "aglio", "porro", "finocchio", "peperone"], "Le leguminose arricchiscono il terreno di azoto: non concimare con azoto."),
  C("pisello", "Pisello", "Pisum sativum", "leguminose", "legume", ["#f4f1ea"], 50, 5, { direct: [2, 3, 10, 11], harvest: [4, 5, 6] }, 80, "average", ["carota", "lattuga", "ravanello", "cetriolo"], ["cipolla", "aglio", "porro"]),
  C("fava", "Fava", "Vicia faba", "leguminose", "legume", ["#f4f1ea"], 60, 20, { direct: [2, 10, 11], harvest: [4, 5, 6] }, 150, "minimum", ["patata", "lattuga"], ["cipolla", "aglio"]),
  C("cavolo", "Cavolo cappuccio", "Brassica oleracea capitata", "brassicacee", "brassica", [], 60, 50, { indoor: [3, 4, 5, 6, 7], transplant: [5, 6, 7, 8], harvest: [9, 10, 11, 12, 1, 2, 3] }, 100, "average", ["sedano", "lattuga", "patata", "fagiolo", "spinacio"], ["pomodoro", "fragola"]),
  C("broccolo", "Broccolo", "Brassica oleracea italica", "brassicacee", "brassica", [], 70, 50, { indoor: [5, 6, 7], transplant: [7, 8], harvest: [10, 11, 12, 1, 2] }, 100, "average", ["sedano", "lattuga", "fagiolo"], ["pomodoro", "fragola"]),
  C("ravanello", "Ravanello", "Raphanus sativus", "brassicacee", "leafy", [], 15, 5, { direct: [2, 3, 4, 5, 6, 7, 8, 9, 10], harvest: [3, 4, 5, 6, 7, 8, 9, 10, 11] }, 30, "average", ["lattuga", "carota", "pisello"], []),
  C("fragola", "Fragola", "Fragaria × ananassa", "rosacee", "berry", ["#d64545"], 40, 30, { transplant: [3, 4, 8, 9], harvest: [5, 6] }, 90, "average", ["spinacio", "lattuga", "aglio"], ["cavolo", "broccolo"]),
  C("mais", "Mais", "Zea mays", "poacee", "grass", [], 70, 30, { direct: [4, 5], harvest: [8, 9] }, 100, "average", ["fagiolo", "zucca", "zucchina", "melone", "anguria"], ["pomodoro"]),
  C("peperoncino", "Peperoncino", "Capsicum annuum (piccante)", "solanacee", "fruiting", ["#d64545"], 50, 40, { indoor: [2, 3], transplant: [5], harvest: [7, 8, 9, 10] }, 100, "average", ["basilico", "cipolla", "carota"], ["finocchio", "fagiolo"], "Anche in vaso; più soffre la sete, più diventa piccante."),
  C("cavolfiore", "Cavolfiore", "Brassica oleracea botrytis", "brassicacee", "brassica", [], 70, 60, { indoor: [5, 6, 7], transplant: [7, 8], harvest: [10, 11, 12, 1, 2, 3] }, 120, "average", ["sedano", "lattuga", "fagiolo", "patata"], ["pomodoro", "fragola"], "Piega le foglie sulla testa per tenerla bianca."),
  C("cavolo_nero", "Cavolo nero", "Brassica oleracea acephala", "brassicacee", "brassica", ["#2f4f3a"], 60, 50, { indoor: [5, 6, 7], transplant: [7, 8, 9], harvest: [10, 11, 12, 1, 2, 3] }, 90, "average", ["sedano", "lattuga", "fagiolo", "patata"], ["pomodoro", "fragola"], "Il gelo lo rende più dolce: si raccolgono le foglie dal basso."),
  C("verza", "Cavolo verza", "Brassica oleracea sabauda", "brassicacee", "brassica", [], 60, 50, { indoor: [5, 6], transplant: [7, 8], harvest: [10, 11, 12, 1, 2, 3] }, 110, "average", ["sedano", "lattuga", "fagiolo", "patata"], ["pomodoro", "fragola"]),
  C("cavolo_bruxelles", "Cavolo di Bruxelles", "Brassica oleracea gemmifera", "brassicacee", "brassica", [], 70, 60, { indoor: [4, 5], transplant: [6, 7], harvest: [10, 11, 12, 1, 2] }, 150, "average", ["sedano", "lattuga", "fagiolo"], ["pomodoro", "fragola"], "Rincalza e lega a un tutore: le piante diventano alte e pesanti."),
  C("cavolo_rapa", "Cavolo rapa", "Brassica oleracea gongylodes", "brassicacee", "brassica", [], 30, 25, { indoor: [3, 4, 7], transplant: [4, 5, 8], harvest: [5, 6, 9, 10] }, 60, "average", ["lattuga", "cipolla", "bietola"], ["pomodoro", "fragola"], "Raccoglilo quando è grande come una pallina da tennis."),
  C("cime_di_rapa", "Cime di rapa", "Brassica rapa sylvestris", "brassicacee", "brassica", [], 40, 10, { direct: [8, 9], harvest: [10, 11, 12, 1, 2] }, 70, "average", ["lattuga", "sedano"], ["pomodoro", "fragola"], "Tipiche del Centro-Sud; si raccolgono le infiorescenze ancora chiuse."),
  C("rapa", "Rapa", "Brassica rapa rapa", "brassicacee", "leafy", [], 30, 10, { direct: [3, 4, 8, 9], harvest: [5, 6, 10, 11, 12] }, 60, "average", ["lattuga", "pisello"], ["pomodoro"]),
  C("barbabietola", "Barbabietola rossa", "Beta vulgaris conditiva", "amarantacee", "leafy", ["#8e2a4a"], 30, 10, { direct: [3, 4, 5, 6, 7], harvest: [6, 7, 8, 9, 10, 11] }, 70, "average", ["cipolla", "lattuga", "cavolo"], ["spinacio"]),
  C("indivia", "Indivia e scarola", "Cichorium endivia", "asteracee", "leafy", [], 35, 30, { direct: [6, 7], transplant: [7, 8, 9], harvest: [9, 10, 11, 12] }, 90, "average", ["finocchio", "lattuga", "porro"], [], "Legala qualche giorno prima della raccolta per imbianchire il cuore."),
  C("catalogna", "Cicoria catalogna", "Cichorium intybus foliosum", "asteracee", "leafy", [], 40, 30, { direct: [6, 7, 8], transplant: [8, 9], harvest: [9, 10, 11, 12] }, 80, "average", ["finocchio", "lattuga"], [], "Le puntarelle sono i germogli della catalogna."),
  C("songino", "Songino (valerianella)", "Valerianella locusta", "valerianacee", "leafy", [], 15, 5, { direct: [8, 9, 10], harvest: [10, 11, 12, 1, 2, 3] }, 50, "average", ["cipolla", "porro", "carota"], [], "Resiste al freddo: insalata di tutto l'inverno."),
  C("sedano_rapa", "Sedano rapa", "Apium graveolens rapaceum", "apiacee", "feathery", [], 40, 30, { indoor: [3], transplant: [5, 6], harvest: [10, 11] }, 150, "frequent", ["porro", "cavolo", "fagiolo"], ["lattuga"]),
  C("scalogno", "Scalogno", "Allium ascalonicum", "alliacee", "allium", [], 25, 15, { direct: [2, 3, 10, 11], harvest: [6, 7] }, 150, "minimum", ["carota", "lattuga", "pomodoro", "bietola"], ["fagiolo", "pisello", "fava"]),
  C("cece", "Cece", "Cicer arietinum", "leguminose", "legume", ["#f4f1ea"], 50, 10, { direct: [3, 4], harvest: [7] }, 110, "minimum", ["patata", "cavolo"], ["cipolla", "aglio"], "Ama terreni asciutti: non bagnare quasi mai."),
  C("asparago", "Asparago", "Asparagus officinalis", "asparagacee", "feathery", [], 120, 40, { transplant: [3, 4], harvest: [4, 5] }, 730, "average", ["pomodoro", "prezzemolo", "basilico"], ["cipolla", "aglio", "patata"], "Si piantano le zampe; si raccoglie dal terzo anno e l'asparagiaia dura 10-15 anni."),
  C("carciofo", "Carciofo", "Cynara scolymus", "asteracee", "leafy", ["#6b4e8a"], 120, 100, { transplant: [3, 4, 9], harvest: [3, 4, 5, 11, 12] }, 180, "average", ["fava", "pisello", "lattuga"], [], "Perenne: si moltiplica con i carducci; dura 4-5 anni."),
];

// Varietà più coltivate negli orti italiani: [nome, nota].
const VARIETIES = {
  pomodoro: [
    ["Cuore di bue", "grosso e carnoso, da insalata"],
    ["San Marzano", "allungato, il pomodoro da salsa per eccellenza"],
    ["Costoluto fiorentino", "antico toscano, costoluto e saporito, da sugo"],
    ["Ciliegino", "piccoli frutti a grappolo, molto produttivo, adatto al vaso"],
    ["Datterino", "piccolo e allungato, dolcissimo"],
    ["Marmande", "costoluto precoce, da insalata"],
    ["Piennolo del Vesuvio", "piccolo a punta, si conserva appeso a grappoli"],
    ["Principe Borghese", "piccolo, da essiccare o appendere"],
    ["Black Krim", "rosso scuro quasi nero, rustico"],
    ["Tondo liscio", "classico tondo per insalata e salsa"],
  ],
  peperone: [
    ["Quadrato d'Asti", "grande e carnoso, giallo o rosso"],
    ["Corno di toro", "allungato a corno, dolce"],
    ["Friggitello", "piccolo verde da friggere"],
    ["Topepo", "tondo a forma di pomodoro, da ripieno"],
    ["Peperone di Senise", "sottile, da essiccare (peperoni cruschi)"],
    ["Lombardo", "lungo e sottile, chiaro, da friggere o sottaceto"],
  ],
  peperoncino: [
    ["Calabrese a mazzetti", "piccante, frutti eretti a gruppi"],
    ["Diavolicchio", "piccolo e molto piccante, da essiccare"],
    ["Cayenna", "lungo e sottile, piccante"],
    ["Tondo calabrese", "tondo, da ripieno sott'olio"],
    ["Jalapeño", "piccantezza media, da mangiare verde"],
    ["Habanero", "piccantissimo, profumo fruttato"],
  ],
  melanzana: [
    ["Violetta lunga", "allungata, viola scuro"],
    ["Violetta di Firenze", "tonda e costoluta, viola chiaro, polpa dolce"],
    ["Black Beauty", "ovale scura, molto produttiva"],
    ["Rotonda bianca sfumata di rosa", "tonda, dolce e senza amaro"],
    ["Prosperosa", "tonda e grossa, tipica della Campania"],
  ],
  patata: [
    ["Kennebec", "pasta bianca, buona per tutti gli usi"],
    ["Agata", "precoce, da novelle"],
    ["Primura", "precoce a pasta gialla"],
    ["Désirée", "buccia rossa, resistente"],
    ["Rossa di Cetica", "antica varietà del Casentino (Arezzo), da gnocchi e tortelli"],
    ["Vitelotte", "buccia e polpa viola"],
  ],
  zucchina: [
    ["Romanesca", "costoluta chiara, si raccoglie con il fiore"],
    ["Genovese", "verde chiaro, tenera"],
    ["Nera di Milano", "verde scuro, molto produttiva"],
    ["Bianca di Trieste", "chiarissima, dolce"],
    ["Tonda di Piacenza", "tonda, da ripieno"],
    ["Trombetta di Albenga", "rampicante, lunghissima e curva"],
  ],
  zucca: [
    ["Delica", "tipo giapponese, polpa asciutta e dolce"],
    ["Butternut", "allungata a pera, polpa arancio"],
    ["Marina di Chioggia", "verde rugosa, dolcissima"],
    ["Mantovana", "piatta grigio-verde, da tortelli"],
    ["Berrettina piacentina", "verde a turbante, da tortelli"],
    ["Hokkaido", "piccola arancio, si mangia anche la buccia"],
    ["Lunga di Napoli", "enorme e allungata, polpa piena"],
  ],
  cetriolo: [
    ["Marketmore", "lungo e liscio, da insalata"],
    ["Mezzo lungo bianco", "chiaro, delicato"],
    ["Carosello barese", "tondo e peloso, pugliese, non amaro"],
    ["Cornichon", "piccolo, da sottaceto"],
    ["Tortarello", "lungo e costoluto (botanicamente un melone), del Sud"],
  ],
  melone: [
    ["Retato", "buccia a rete, polpa arancio"],
    ["Cantalupo", "liscio costoluto, profumato"],
    ["Giallo invernale", "buccia gialla, si conserva fino all'inverno"],
    ["Ananas", "piccolo, profumo intenso"],
  ],
  anguria: [
    ["Crimson Sweet", "tonda striata, molto dolce"],
    ["Sugar Baby", "piccola e scura, adatta agli orti piccoli"],
    ["Charleston Grey", "allungata, buccia chiara"],
  ],
  lattuga: [
    ["Gentilina", "foglia riccia da taglio"],
    ["Romana", "allungata e croccante"],
    ["Trocadero", "cappuccio burrosa"],
    ["Iceberg", "cappuccio croccante, regge il caldo"],
    ["Lollo rosso", "riccia rossa decorativa"],
    ["Foglia di quercia", "da taglio, verde o rossa"],
    ["Canasta", "batavia bordata di rosso, non sale a seme"],
  ],
  radicchio: [
    ["Rosso di Chioggia", "a palla, il più facile"],
    ["Rosso di Treviso precoce", "allungato"],
    ["Tardivo di Treviso", "si forza in acqua al buio a fine autunno"],
    ["Variegato di Castelfranco", "a rosa, screziato"],
    ["Rosso di Verona", "piccolo cespo compatto"],
  ],
  rucola: [
    ["Coltivata", "foglia larga, sapore delicato"],
    ["Selvatica", "Diplotaxis tenuifolia: perenne, più piccante"],
  ],
  spinacio: [
    ["Gigante d'inverno", "resiste al freddo, semina autunnale"],
    ["Matador", "foglie grandi, lento a salire a seme"],
  ],
  bietola: [
    ["Da coste", "coste bianche larghe"],
    ["Da taglio (erbette)", "si taglia più volte"],
    ["Rainbow", "coste gialle, rosse e arancio"],
  ],
  carota: [
    ["Nantese", "cilindrica, dolce e senza cuore duro"],
    ["Chantenay", "corta e conica, per terreni pesanti"],
    ["Parigina", "tonda, adatta anche al vaso"],
    ["Viola", "buccia viola, ricca di antociani"],
  ],
  finocchio: [
    ["Romanesco", "grumolo tondo e grosso, da autunno"],
    ["Zefa Fino", "non va a seme facilmente, anche in primavera"],
    ["Perfezione", "precoce, grumolo compatto"],
  ],
  sedano: [
    ["Dorato", "si imbianca da solo"],
    ["Verde Pascal", "coste verdi carnose"],
    ["Nero di Trevi", "antico umbro, coste lunghe e tenere"],
  ],
  prezzemolo: [
    ["Comune", "foglia liscia, il più aromatico"],
    ["Gigante d'Italia", "foglie grandi"],
    ["Riccio", "decorativo"],
  ],
  basilico: [
    ["Genovese", "foglia piccola, il basilico del pesto"],
    ["Napoletano", "foglia grande bollosa, profumo intenso"],
    ["Greco", "cespuglio compatto a foglia minuta, ottimo in vaso"],
    ["Rosso", "foglie porpora"],
    ["Limone", "profumo di limone"],
  ],
  cipolla: [
    ["Rossa di Tropea", "dolce, da mangiare cruda"],
    ["Dorata di Parma", "da serbo, si conserva a lungo"],
    ["Ramata di Montoro", "rosata, dolce"],
    ["Bianca di Barletta", "cipolline bianche precoci"],
    ["Borettana", "cipolline piatte, da agrodolce"],
    ["Cipollotto", "si raccoglie fresco con le foglie"],
  ],
  aglio: [
    ["Rosso di Sulmona", "tunica rossa, sapore intenso; fa lo scapo (zolla)"],
    ["Bianco piacentino", "da serbo, si conserva a lungo"],
    ["Rosso di Nubia", "rosso, siciliano"],
    ["Aglione della Valdichiana", "spicchi enormi e sapore dolce, tipico dell'aretino"],
    ["Vessalico", "ligure, delicato"],
  ],
  porro: [
    ["Gigante d'inverno", "resiste al gelo"],
    ["Carentan", "fusto lungo, autunnale"],
  ],
  fagiolo: [
    ["Borlotto lingua di fuoco", "rampicante, baccelli striati di rosso"],
    ["Cannellino", "nano, seme bianco allungato"],
    ["Zolfino", "antico toscano del Pratomagno, seme giallo pallido, buccia sottile"],
    ["Fagiolino nano Bobis", "baccelli verdi tondi senza filo"],
    ["Meraviglia di Venezia", "rampicante, baccelli gialli piatti"],
    ["Stortino di Trento", "fagiolino rampicante a baccello curvo"],
    ["Toscanello", "piccolo seme bianco, nano"],
  ],
  pisello: [
    ["Meraviglia d'Italia", "nano, molto produttivo"],
    ["Piccolo provenzale", "nano precoce, seme dolce"],
    ["Telefono", "rampicante alto, baccelli lunghi"],
    ["Taccola", "mangiatutto: si mangia anche il baccello"],
  ],
  fava: [
    ["Aguadulce", "baccelli lunghissimi"],
    ["Superaguadulce", "molto produttiva, semi grandi"],
  ],
  cavolo: [
    ["Cuore di bue", "cappuccio a punta, tenero"],
    ["Rosso", "cappuccio rosso, da insalata"],
  ],
  broccolo: [
    ["Calabrese", "testa verde scuro e getti laterali"],
    ["Romanesco", "piramidi verde chiaro"],
    ["Spigariello", "da foglia, tipico della Campania"],
  ],
  cavolfiore: [
    ["Gigante di Napoli", "bianco, tardivo"],
    ["Violetto di Sicilia", "viola, dolce"],
    ["Arancione", "testa arancio, ricca di betacarotene"],
  ],
  cavolo_nero: [
    ["Nero di Toscana", "foglie lunghe bollose (palmizio)"],
    ["Nero riccio", "foglie arricciate"],
  ],
  ravanello: [
    ["Saxa", "tondo rosso, velocissimo"],
    ["Candela di ghiaccio", "lungo e bianco"],
    ["French Breakfast", "lungo rosso con punta bianca"],
  ],
  fragola: [
    ["Rifiorente quattro stagioni", "produce da maggio all'autunno"],
    ["Gariguette", "precoce, molto profumata"],
    ["Fragolina di bosco", "Fragaria vesca: piccola, profumatissima, anche in mezz'ombra"],
  ],
  mais: [
    ["Dolce", "da mangiare lesso o alla griglia"],
    ["Popcorn", "chicchi piccoli che scoppiano"],
    ["Ottofile", "antico, da polenta"],
  ],
  indivia: [
    ["Scarola", "foglia larga"],
    ["Riccia", "foglia frastagliata"],
  ],
  carciofo: [
    ["Romanesco", "tondo senza spine, primaverile"],
    ["Violetto di Toscana", "allungato viola"],
    ["Spinoso sardo", "con spine, rifiorente in autunno"],
  ],
};
for (const c of CROPS) c.varieties = (VARIETIES[c.id] ?? []).map(([name, note]) => ({ name, note }));

export const CROP_BY_ID = Object.fromEntries(CROPS.map((c) => [c.id, c]));

export const MONTHS = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];

// Mesi come "febbraio–marzo" o "mar, ago".
export function monthsLabel(months = []) {
  if (!months.length) return "—";
  const sorted = [...months].sort((a, b) => a - b);
  const runs = [];
  for (const m of sorted) {
    const last = runs.at(-1);
    if (last && m === last[1] + 1) last[1] = m;
    else runs.push([m, m]);
  }
  return runs.map(([a, b]) => (a === b ? MONTHS[a - 1] : `${MONTHS[a - 1]}–${MONTHS[b - 1]}`)).join(", ");
}

// Cosa si può fare con un ortaggio in un certo mese.
export function cropActions(crop, month) {
  const out = [];
  if (crop.indoor?.includes(month)) out.push("semenzaio");
  if (crop.direct?.includes(month)) out.push("semina");
  if (crop.transplant?.includes(month)) out.push("trapianto");
  if (crop.harvest?.includes(month)) out.push("raccolta");
  return out;
}

// Ortaggio (ed eventuale varietà) -> forma comune delle piante (per catalogo,
// icone, irrigazione).
export function cropAsPlant(crop, variety = null) {
  const v = typeof variety === "string" ? crop.varieties?.find((x) => x.name === variety) : variety;
  return {
    id: v ? `crop:${crop.id}:${v.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` : `crop:${crop.id}`,
    source: "crops",
    cropId: crop.id,
    variety: v?.name ?? null,
    commonName: v ? `${crop.name} '${v.name}'` : crop.name,
    scientificName: crop.scientificName,
    family: FAMILIES[crop.family],
    watering: crop.watering,
    sunlight: ["full_sun"],
    spreadCm: { min: crop.spacing.plant, max: crop.spacing.plant },
    heightCm: null,
    flowerColors: [],
    iconColors: crop.colors,
    detailsLoaded: true,
  };
}

// Consociazioni: coppie di colture vicine (entro `radius` metri) che stanno
// bene o male insieme.
export function companionReport(plants, radius = 0.8) {
  const crops = plants.filter((p) => p.cropId && CROP_BY_ID[p.cropId]);
  const bad = new Map();
  const good = new Map();
  for (let i = 0; i < crops.length; i++) {
    for (let j = i + 1; j < crops.length; j++) {
      const a = crops[i], b = crops[j];
      if (a.cropId === b.cropId) continue;
      if (Math.hypot(a.x - b.x, a.y - b.y) > radius) continue;
      const ca = CROP_BY_ID[a.cropId], cb = CROP_BY_ID[b.cropId];
      const key = [ca.id, cb.id].sort().join("+");
      const pair = { a: ca.name, b: cb.name, points: [a, b] };
      if (ca.bad.includes(cb.id) || cb.bad.includes(ca.id)) {
        if (!bad.has(key)) bad.set(key, { ...pair, segments: [] });
        bad.get(key).segments.push([a, b]);
      } else if (ca.good.includes(cb.id) || cb.good.includes(ca.id)) {
        good.set(key, pair);
      }
    }
  }
  return { bad: [...bad.values()], good: [...good.values()] };
}

// Rotazione: famiglie presenti l'anno scorso nella stessa aiuola.
export function rotationWarnings(bed, year = new Date().getFullYear()) {
  const last = (bed.history ?? []).find((h) => h.year === year - 1);
  if (!last) return [];
  const current = new Set((bed.plants ?? []).map((p) => CROP_BY_ID[p.cropId]?.family).filter(Boolean));
  return last.families.filter((f) => current.has(f)).map((f) => FAMILIES[f] ?? f);
}
