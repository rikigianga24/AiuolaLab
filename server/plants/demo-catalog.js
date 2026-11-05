// Piccolo catalogo di esempio, usato quando PERENUAL_API_KEY non è
// configurata. Serve per sviluppare e provare l'app senza dipendere dal DB
// esterno: in produzione i dati arrivano da Perenual.
//
// Formato compatto: [scientifico, comune, ciclo, esposizione, acqua, pH,
// terreno, altezza cm [min,max], larghezza cm [min,max], colori, stagioni,
// zone USDA [min,max], sempreverde]
const S = "full_sun", P = "part_shade", O = "full_shade";

const ROWS = [
  ["Lavandula angustifolia", "Lavanda", "perennial", [S], "minimum", ["neutral", "alkaline"], ["sandy", "chalky"], [40, 60], [50, 70], ["purple"], ["summer"], [5, 9], true],
  ["Salvia nemorosa", "Salvia ornamentale", "perennial", [S], "minimum", ["neutral", "alkaline"], ["sandy", "loamy"], [40, 60], [40, 50], ["purple", "blue"], ["spring", "summer"], [4, 8], false],
  ["Rosmarinus officinalis", "Rosmarino", "perennial", [S], "minimum", ["neutral", "alkaline"], ["sandy", "chalky"], [60, 120], [60, 100], ["blue"], ["winter", "spring"], [7, 10], true],
  ["Echinacea purpurea", "Echinacea", "perennial", [S, P], "average", ["neutral"], ["loamy", "clay"], [60, 100], [40, 50], ["pink", "purple"], ["summer", "autumn"], [3, 9], false],
  ["Rudbeckia fulgida", "Rudbeckia", "perennial", [S, P], "average", ["acid", "neutral", "alkaline"], ["loamy", "clay"], [50, 80], [40, 60], ["yellow", "orange"], ["summer", "autumn"], [3, 9], false],
  ["Achillea millefolium", "Achillea", "perennial", [S], "minimum", ["neutral", "alkaline"], ["sandy", "loamy"], [40, 70], [40, 60], ["white", "pink", "yellow", "red"], ["summer"], [3, 9], false],
  ["Gaura lindheimeri", "Gaura", "perennial", [S], "minimum", ["neutral", "alkaline"], ["sandy", "loamy"], [60, 120], [60, 90], ["white", "pink"], ["summer", "autumn"], [5, 9], false],
  ["Nepeta x faassenii", "Nepeta (erba gatta)", "perennial", [S, P], "minimum", ["neutral", "alkaline"], ["sandy", "loamy", "chalky"], [30, 50], [45, 60], ["blue", "purple"], ["spring", "summer"], [3, 8], false],
  ["Geranium 'Rozanne'", "Geranio perenne Rozanne", "perennial", [S, P], "average", ["acid", "neutral", "alkaline"], ["loamy", "clay"], [40, 50], [60, 90], ["blue", "purple"], ["summer", "autumn"], [5, 8], false],
  ["Hosta sieboldiana", "Hosta", "perennial", [P, O], "frequent", ["acid", "neutral"], ["loamy", "clay"], [60, 90], [90, 120], ["white", "purple"], ["summer"], [3, 9], false],
  ["Heuchera micrantha", "Heuchera", "perennial", [P, O], "average", ["acid", "neutral"], ["loamy"], [20, 40], [30, 45], ["pink", "red", "white"], ["spring", "summer"], [4, 9], true],
  ["Astilbe x arendsii", "Astilbe", "perennial", [P, O], "frequent", ["acid", "neutral"], ["loamy", "clay"], [50, 90], [40, 60], ["pink", "red", "white"], ["summer"], [4, 8], false],
  ["Helleborus niger", "Elleboro (rosa di Natale)", "perennial", [P, O], "average", ["neutral", "alkaline"], ["loamy", "chalky"], [20, 30], [30, 45], ["white"], ["winter", "spring"], [3, 8], true],
  ["Hydrangea macrophylla", "Ortensia", "perennial", [P], "frequent", ["acid", "neutral"], ["loamy"], [100, 180], [100, 180], ["blue", "pink", "white"], ["summer"], [6, 9], false],
  ["Rhododendron 'Hybrid'", "Rododendro", "perennial", [P, O], "frequent", ["acid"], ["loamy"], [120, 200], [120, 200], ["pink", "purple", "red", "white"], ["spring"], [5, 8], true],
  ["Camellia japonica", "Camelia", "perennial", [P, O], "average", ["acid"], ["loamy"], [150, 300], [120, 250], ["red", "pink", "white"], ["winter", "spring"], [7, 9], true],
  ["Pieris japonica", "Pieris", "perennial", [P, O], "average", ["acid"], ["loamy", "sandy"], [100, 200], [100, 150], ["white", "pink"], ["spring"], [5, 8], true],
  ["Erica carnea", "Erica invernale", "perennial", [S, P], "average", ["acid", "neutral", "alkaline"], ["sandy", "loamy"], [15, 30], [30, 50], ["pink", "white"], ["winter", "spring"], [5, 7], true],
  ["Pennisetum alopecuroides", "Pennisetum", "perennial", [S, P], "average", ["acid", "neutral", "alkaline"], ["loamy", "clay"], [60, 100], [60, 90], ["white", "pink"], ["summer", "autumn"], [5, 9], false],
  ["Stipa tenuissima", "Stipa (lino delle fate)", "perennial", [S], "minimum", ["neutral", "alkaline"], ["sandy"], [40, 60], [30, 45], ["yellow"], ["summer"], [6, 10], false],
  ["Festuca glauca", "Festuca blu", "perennial", [S], "minimum", ["acid", "neutral", "alkaline"], ["sandy", "chalky"], [20, 30], [25, 30], ["blue"], ["summer"], [4, 8], true],
  ["Sedum spectabile", "Sedum (borracina)", "perennial", [S], "minimum", ["neutral", "alkaline"], ["sandy", "chalky"], [40, 60], [40, 60], ["pink"], ["autumn"], [3, 9], false],
  ["Thymus serpyllum", "Timo serpillo", "perennial", [S], "minimum", ["neutral", "alkaline"], ["sandy", "chalky"], [5, 10], [30, 60], ["pink", "purple"], ["summer"], [4, 9], true],
  ["Ajuga reptans", "Iva (bugola)", "perennial", [P, O], "average", ["acid", "neutral", "alkaline"], ["loamy", "clay"], [10, 20], [45, 60], ["blue", "purple"], ["spring"], [3, 9], true],
  ["Vinca minor", "Pervinca", "perennial", [P, O], "average", ["acid", "neutral", "alkaline"], ["loamy"], [10, 15], [60, 90], ["blue", "purple"], ["spring"], [4, 9], true],
  ["Agapanthus africanus", "Agapanto", "perennial", [S], "average", ["neutral"], ["loamy"], [60, 90], [45, 60], ["blue", "white"], ["summer"], [8, 11], false],
  ["Hemerocallis fulva", "Emerocallide", "perennial", [S, P], "average", ["acid", "neutral", "alkaline"], ["loamy", "clay"], [60, 100], [60, 90], ["orange", "yellow", "red"], ["summer"], [3, 9], false],
  ["Coreopsis verticillata", "Coreopsis", "perennial", [S], "minimum", ["acid", "neutral"], ["sandy", "loamy"], [40, 60], [40, 50], ["yellow"], ["summer", "autumn"], [3, 9], false],
  ["Verbena bonariensis", "Verbena di Buenos Aires", "perennial", [S], "minimum", ["neutral", "alkaline"], ["sandy", "loamy"], [90, 150], [30, 45], ["purple"], ["summer", "autumn"], [7, 11], false],
  ["Perovskia atriplicifolia", "Perovskia (salvia russa)", "perennial", [S], "minimum", ["neutral", "alkaline"], ["sandy", "chalky"], [90, 120], [60, 90], ["blue", "purple"], ["summer", "autumn"], [4, 9], false],
  ["Buxus sempervirens", "Bosso", "perennial", [S, P, O], "average", ["neutral", "alkaline"], ["loamy", "chalky"], [50, 200], [50, 150], ["green"], ["spring"], [5, 8], true],
  ["Rosa 'The Fairy'", "Rosa paesaggistica", "perennial", [S], "average", ["neutral"], ["loamy", "clay"], [60, 90], [90, 120], ["pink"], ["summer", "autumn"], [4, 9], false],
  ["Tagetes patula", "Tagete", "annual", [S], "average", ["neutral"], ["loamy"], [20, 30], [20, 30], ["orange", "yellow", "red"], ["summer", "autumn"], [2, 11], false],
  ["Impatiens walleriana", "Impatiens (fior di vetro)", "annual", [P, O], "frequent", ["acid", "neutral"], ["loamy"], [20, 40], [20, 40], ["pink", "red", "white", "orange"], ["spring", "summer", "autumn"], [10, 11], false],
  ["Cosmos bipinnatus", "Cosmea", "annual", [S], "minimum", ["neutral", "alkaline"], ["sandy", "loamy"], [60, 120], [30, 45], ["pink", "white", "red"], ["summer", "autumn"], [2, 11], false],
  ["Digitalis purpurea", "Digitale", "biennial", [P], "average", ["acid", "neutral"], ["loamy"], [90, 150], [30, 45], ["purple", "pink", "white"], ["spring", "summer"], [4, 8], false],
  ["Tulipa gesneriana", "Tulipano", "perennial", [S, P], "average", ["neutral", "alkaline"], ["sandy", "loamy"], [30, 60], [10, 15], ["red", "yellow", "pink", "white", "purple", "orange"], ["spring"], [3, 8], false],
  ["Narcissus pseudonarcissus", "Narciso", "perennial", [S, P], "average", ["acid", "neutral", "alkaline"], ["loamy"], [30, 45], [10, 15], ["yellow", "white"], ["spring"], [3, 8], false],
];

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const DEMO_PLANTS = ROWS.map(
  ([sci, common, cycle, sunlight, watering, ph, texture, h, w, colors, seasons, zones, evergreen]) => ({
    id: `demo:${slug(sci)}`,
    source: "demo",
    externalId: slug(sci),
    commonName: common,
    scientificName: sci,
    otherNames: [],
    family: null,
    cycle,
    type: null,
    sunlight,
    watering,
    soil: { ph, texture },
    heightCm: { min: h[0], max: h[1] },
    spreadCm: { min: w[0], max: w[1] },
    flowerColors: colors,
    floweringSeasons: seasons,
    hardiness: { min: zones[0], max: zones[1] },
    evergreen,
    droughtTolerant: watering === "minimum",
    maintenance: null,
    description: null,
    image: null,
    detailsLoaded: true,
  }),
);
