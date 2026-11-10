// Consigli pratici per ogni stile di giardino: costo, spazio, errori da
// evitare, come cambia con le stagioni e come portarlo su un balcone.
// Modulo condiviso (lo usa anche il server per le anteprime dei link).

export const COST_LABEL = { 1: "Costo contenuto", 2: "Costo medio", 3: "Costo alto" };

export const STYLE_GUIDE = {
  cottage: {
    cost: { level: 2, text: "Le perenni costano poco e si moltiplicano da sole; spendi di più se vuoi rose inglesi e archi in ferro." },
    space: "Funziona anche in pochi metri quadri: basta una bordura lungo un muro o una staccionata.",
    mistake: "Piantare troppo distanziato: il cottage deve essere fitto. Con la terra scoperta sembra solo disordinato.",
    seasons: {
      primavera: "Aquilegie, peonie e i primi bulbi: il giardino si riempie in fretta.",
      estate: "Il momento migliore: rose, digitali, speronelle e lavanda tutte insieme.",
      autunno: "Aster, anemoni e la seconda fioritura delle rose rifiorenti.",
      inverno: "Riposo: restano le strutture (archi, staccionate) e qualche sempreverde.",
    },
    balcony: {
      text: "Un vaso grande o una cassetta lunga piena di fiori diversi, con una rosa rampicante sulla ringhiera.",
      plants: ["Rosa rampicante", "Lavanda", "Nepeta", "Geranio perenne", "Campanula"],
    },
    sizes: ["balcone", "piccolo", "grande"],
  },
  italiano: {
    cost: { level: 3, text: "Le siepi di bosso e i grandi vasi in terracotta costano, e servono molte piante uguali per la simmetria." },
    space: "Serve un'area regolare di almeno 30–40 m² per apprezzare il disegno simmetrico.",
    mistake: "Usare troppe specie diverse: la forza dell'italiano è la ripetizione di poche piante sempreverdi.",
    seasons: {
      primavera: "Il glicine sulla pergola e le rose dentro le aiuole di bosso.",
      estate: "Lavanda in fiore e agrumi in vaso: il verde scuro fa da cornice.",
      autunno: "Le siepi appena potate disegnano di nuovo le geometrie.",
      inverno: "Resta bello quasi come d'estate: bosso, cipressi e alloro sono sempreverdi.",
    },
    balcony: {
      text: "Due vasi uguali ai lati della porta con un limone o un bosso a palla, e una fila di lavanda in mezzo.",
      plants: ["Limone in vaso", "Bosso a palla", "Lavanda", "Rosmarino", "Mirto"],
    },
    sizes: ["grande"],
  },
  francese: {
    cost: { level: 3, text: "È lo stile più impegnativo: tante siepi basse da potare, fioriture stagionali da rinnovare ogni anno." },
    space: "Dà il meglio su spazi ampi e pianeggianti, da guardare dall'alto (una terrazza o una finestra).",
    mistake: "Sottovalutare il lavoro: senza potature regolari i ricami di bosso perdono subito la forma.",
    seasons: {
      primavera: "Tulipani e viole del pensiero riempiono i disegni di bosso.",
      estate: "Begonie e tagete sostituiscono i bulbi; le rose ad alberello sono in fiore.",
      autunno: "Si cambiano le fioriture e si ripassano le siepi.",
      inverno: "Restano i ricami di bosso e la ghiaia colorata, ordinati e leggibili.",
    },
    balcony: {
      text: "Una cassetta con un bordo di bosso nano e dentro una fioritura in massa di un solo colore, da cambiare a ogni stagione.",
      plants: ["Bosso nano", "Viole del pensiero", "Tulipani", "Begonie", "Santolina"],
    },
    sizes: ["grande"],
  },
  giapponese: {
    cost: { level: 2, text: "Le piante sono poche; la spesa vera sono le pietre, la ghiaia e un acero di buona qualità." },
    space: "Si adatta a spazi piccolissimi: anche un angolo di 4–5 m² o un cortile interno.",
    mistake: "Riempire troppo: nel giardino giapponese lo spazio vuoto (ghiaia, muschio) conta quanto le piante.",
    seasons: {
      primavera: "Azalee e camelie in fiore, foglie nuove dell'acero.",
      estate: "Verde fresco e ombra: felci, hosta e muschio.",
      autunno: "Il momento più bello: l'acero giapponese diventa rosso fuoco.",
      inverno: "Pietre, ghiaia rastrellata e pini potati: calmo ed essenziale.",
    },
    balcony: {
      text: "Un acero giapponese in un vaso basso e largo, ghiaia chiara, una pietra e un ciuffo di erba Hakonechloa.",
      plants: ["Acero giapponese", "Hakonechloa", "Ophiopogon", "Felci", "Azalea"],
    },
    sizes: ["balcone", "piccolo"],
  },
  mediterraneo: {
    cost: { level: 1, text: "Le aromatiche costano poco, crescono in fretta e non chiedono quasi acqua: spendi soprattutto per la ghiaia." },
    space: "Va bene in ogni misura, dal vaso al grande giardino in pendenza.",
    mistake: "Terreno troppo ricco e troppa acqua: lavanda e rosmarino marciscono. Serve terra drenante e povera.",
    seasons: {
      primavera: "Cisti, rosmarino in fiore ed euforbie: i primi colori.",
      estate: "Lavanda, perovskia e gaura: profumo e api ovunque, senza annaffiare.",
      autunno: "Le graminacee come la stipa diventano dorate.",
      inverno: "Le foglie grigie e argentate restano: il giardino non è mai spoglio.",
    },
    balcony: {
      text: "Vasi di terracotta con lavanda, rosmarino e salvia, e un olivo in un vaso grande. Perfetto per i balconi al sole.",
      plants: ["Olivo in vaso", "Lavanda", "Rosmarino", "Salvia", "Timo"],
    },
    sizes: ["balcone", "piccolo", "grande"],
  },
  moderno: {
    cost: { level: 2, text: "Le piante sono poche specie ripetute; la spesa è nei materiali (lastre, acciaio corten, vasche)." },
    space: "Ottimo per giardini di città e terrazzi, anche piccoli: le linee pulite fanno sembrare lo spazio più grande.",
    mistake: "Mescolare troppi colori e materiali: il moderno funziona con 2–3 colori e tanta ripetizione.",
    seasons: {
      primavera: "Allium e foglie nuove delle graminacee.",
      estate: "Agapanti e ortensie paniculata: bianco, blu e verde.",
      autunno: "Le graminacee in fiore si muovono col vento e prendono la luce.",
      inverno: "Le spighe secche restano in piedi: non tagliarle fino a fine inverno.",
    },
    balcony: {
      text: "Vasi alti e squadrati tutti uguali, in fila: graminacee, un bosso a palla e una sola pianta fiorita ripetuta.",
      plants: ["Pennisetum", "Festuca blu", "Bosso a palla", "Agapanto", "Ophiopogon nero"],
    },
    sizes: ["balcone", "piccolo", "grande"],
  },
  geometrico: {
    cost: { level: 2, text: "Le siepi basse si possono fare con aromatiche economiche (santolina, timo, teucrio) invece del bosso." },
    space: "Basta un quadrato di 3×3 metri diviso in quattro aiuole con un vialetto a croce.",
    mistake: "Vialetti troppo stretti: devono essere larghi almeno 40–50 cm per passare e curare le piante.",
    seasons: {
      primavera: "Insalate colorate, viole ed erba cipollina in fiore.",
      estate: "Calendule, tagete e aromatiche pronte da raccogliere.",
      autunno: "Si rinnovano le aiuole: cavoli ornamentali e insalate invernali.",
      inverno: "Restano le siepi basse che disegnano i quadrati.",
    },
    balcony: {
      text: "Una cassetta quadrata divisa in quattro scomparti: in ognuno un'aromatica diversa.",
      plants: ["Timo", "Erba cipollina", "Salvia", "Basilico", "Calendula"],
    },
    sizes: ["balcone", "piccolo"],
  },
  naturalistico: {
    cost: { level: 1, text: "Tante piante piccole e robuste, che si allargano da sole: il costo al metro quadro è basso." },
    space: "Più è grande più è bello; sotto i 15–20 m² meglio scegliere poche specie in gruppi grandi.",
    mistake: "Piantare un esemplare per specie: servono gruppi di 5–9 piante uguali, ripetuti.",
    seasons: {
      primavera: "Le graminacee ricrescono; si taglia tutto il vecchio a fine inverno.",
      estate: "Echinacea, rudbeckia e achillea in grandi macchie di colore.",
      autunno: "Aster e graminacee in fiore: il periodo più spettacolare.",
      inverno: "Spighe e semi secchi restano in piedi e nutrono gli uccelli.",
    },
    balcony: {
      text: "Una cassetta lunga con un'erba leggera e due o tre perenni robuste ripetute, come un piccolo prato fiorito.",
      plants: ["Stipa", "Echinacea", "Achillea", "Verbena bonariensis", "Gaura"],
    },
    sizes: ["piccolo", "grande"],
  },
  roccioso: {
    cost: { level: 1, text: "Le piante sono piccole ed economiche; il costo dipende da quanta pietra devi comprare." },
    space: "Basta un piccolo pendio, una scarpata o anche un'aiuola rialzata di 2–3 m².",
    mistake: "Terra che trattiene acqua: serve tanta ghiaia nel terreno, altrimenti le piante a cuscino marciscono.",
    seasons: {
      primavera: "Aubrieta, phlox e iberis: cuscini fioriti tra le pietre.",
      estate: "Sedum, dianthus e armeria; le pietre si scaldano al sole.",
      autunno: "Il sedum fiorisce di rosa e attira le farfalle.",
      inverno: "Rosette di sempervivum e festuca blu restano colorate.",
    },
    balcony: {
      text: "Una ciotola larga e bassa con ghiaia, qualche pietra e succulente rustiche: quasi nessuna cura.",
      plants: ["Sempervivum", "Sedum", "Festuca blu", "Timo serpillo", "Dianthus"],
    },
    sizes: ["balcone", "piccolo"],
  },
  ombra: {
    cost: { level: 2, text: "Hosta, felci ed ellebori costano un po' di più, ma durano per molti anni." },
    space: "Qualsiasi angolo all'ombra: sotto gli alberi, lungo il lato nord della casa, un cortile chiuso.",
    mistake: "Scegliere piante da sole sperando che si adattino: all'ombra fioriscono poco e si ammalano.",
    seasons: {
      primavera: "Ellebori, brunnera e foglie nuove delle hosta.",
      estate: "Astilbe e ortensie; tutto resta fresco e verde.",
      autunno: "Anemoni giapponesi bianchi e rosa.",
      inverno: "Ellebori in fiore e felci sempreverdi.",
    },
    balcony: {
      text: "Il balcone esposto a nord diventa un angolo verde: hosta, felci e heuchera in vasi grandi e un'ortensia.",
      plants: ["Hosta", "Felci", "Heuchera", "Ortensia", "Elleboro"],
    },
    sizes: ["balcone", "piccolo", "grande"],
  },
  impollinatori: {
    cost: { level: 1, text: "Molte piante si seminano (facelia, borragine, cosmos) e costano pochissimo." },
    space: "Va bene ovunque: anche un vaso di lavanda sul balcone aiuta le api.",
    mistake: "Scegliere fiori doppi: sono belli ma le api non riescono a raggiungere il nettare.",
    seasons: {
      primavera: "Borragine, facelia e timo: il primo cibo per le api.",
      estate: "Lavanda, nepeta, echinacea e agastache: il giardino ronza.",
      autunno: "Sedum, aster e cosmos per le farfalle di fine stagione.",
      inverno: "Lascia steli secchi e foglie: proteggono gli insetti che svernano.",
    },
    balcony: {
      text: "Vasi pieni di aromatiche in fiore e una cassetta di nepeta o lavanda: le api arrivano anche al quinto piano.",
      plants: ["Lavanda", "Nepeta", "Timo", "Origano", "Cosmos"],
    },
    sizes: ["balcone", "piccolo", "grande"],
  },
};

export const guideFor = (id) => STYLE_GUIDE[id] ?? null;
