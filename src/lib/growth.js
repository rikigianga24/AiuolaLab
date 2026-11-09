// Come crescono le piante nel tempo: dati di crescita e misure previste.
//
// Il catalogo dice quanto è grande una pianta da adulta. Qui si aggiunge
// COME ci arriva: velocità, anni per diventare adulta, radici, portamento
// (resta a cespo, si allarga, si autosemina), durata e manutenzione.
// Ogni gruppo del catalogo ha valori predefiniti; i generi con un
// comportamento particolare hanno un'eccezione.

const BASE = {
  speed: "media", // lenta | media | veloce
  matureYears: 3,
  roots: "fascicolate", // superficiali | fascicolate | profonde | stolonifere | invasive
  habit: "cespo", // cespo | si allarga | si autosemina | arbusto | rampicante | annuale
  lifespan: null, // anni di vita utile; null = lunga
  divideEvery: null, // ogni quanti anni va divisa
  prune: "leggera", // nessuna | leggera | annuale | frequente
};

const GROUP_DEFAULTS = {
  rose: { speed: "media", matureYears: 3, roots: "profonde", habit: "arbusto", prune: "annuale" },
  perenni: { speed: "veloce", matureYears: 2, roots: "fascicolate", habit: "cespo", divideEvery: 4, lifespan: 10 },
  annuali: { speed: "veloce", matureYears: 0.4, roots: "superficiali", habit: "annuale", lifespan: 1, prune: "nessuna" },
  bulbose: { speed: "veloce", matureYears: 1, roots: "superficiali", habit: "cespo", divideEvery: 5, prune: "nessuna" },
  arbusti: { speed: "media", matureYears: 5, roots: "profonde", habit: "arbusto", prune: "annuale" },
  rampicanti: { speed: "veloce", matureYears: 4, roots: "profonde", habit: "rampicante", prune: "annuale" },
  graminacee: { speed: "media", matureYears: 3, roots: "fascicolate", habit: "cespo", divideEvery: 5, prune: "annuale" },
  aromatiche: { speed: "media", matureYears: 2, roots: "fascicolate", habit: "arbusto", lifespan: 8, prune: "annuale" },
  balcone: { speed: "veloce", matureYears: 0.5, roots: "superficiali", habit: "annuale", lifespan: 1, prune: "frequente" },
};

// Eccezioni per genere/specie (sul nome scientifico o comune, minuscolo).
const OVERRIDES = [
  [/mentha|menta/, { speed: "veloce", roots: "invasive", habit: "si allarga", matureYears: 1, divideEvery: 2 }],
  [/phyllostachys|bambù|bambu/, { speed: "veloce", roots: "invasive", habit: "si allarga", matureYears: 3 }],
  [/houttuynia|physalis|anemone (x )?hybrida|anemone giappon|lysimachia (clethroides|punctata)/, { roots: "invasive", habit: "si allarga", speed: "veloce" }],
  [/vinca|pervinca|ajuga|bugola|lysimachia nummularia|hypericum calycinum|lamium|campanula poscharsk|cerastium|phlox subulata|aubriet/, { roots: "stolonifere", habit: "si allarga", speed: "veloce", matureYears: 2 }],
  [/achillea|monarda|aster|symphyotrich|rudbeckia|helianthus (?!annuus)|solidago/, { roots: "stolonifere", habit: "si allarga", divideEvery: 3 }],
  [/geranium|geranio perenne/, { habit: "si allarga", divideEvery: 4 }],
  [/acanthus|acanto/, { roots: "profonde", habit: "si allarga", matureYears: 3 }],
  [/echinacea/, { lifespan: 4, divideEvery: null }],
  [/lupin/, { lifespan: 4, roots: "profonde", divideEvery: null }],
  [/gaillardia|leucanthemum|coreopsis grandiflora/, { lifespan: 3 }],
  [/verbena bonariensis|digitalis|digitale|alchemilla|aquilegia|stipa tenuissima|nigella|calendula|myosotis|cosmos/, { habit: "si autosemina" }],
  [/digitalis|digitale/, { lifespan: 2 }],
  [/stipa tenuissima/, { lifespan: 4 }],
  [/lavand/, { speed: "media", matureYears: 2, lifespan: 8, habit: "arbusto", divideEvery: null, prune: "annuale" }],
  [/rosmarin|salvia officinalis|santolina|perovskia|helichrysum|teucrium/, { habit: "arbusto", lifespan: 10, divideEvery: null, prune: "annuale" }],
  [/thymus|timo/, { habit: "si allarga", lifespan: 5, divideEvery: null }],
  [/hosta|helleborus|elleboro|paeonia|peonia|dictamnus|baptisia/, { speed: "lenta", matureYears: 4, divideEvery: null, lifespan: null }],
  [/hemerocallis|emerocall|agapanth|iris/, { divideEvery: 4, roots: "fascicolate" }],
  [/agapanth/, { speed: "lenta", matureYears: 3 }],
  [/miscanthus|calamagrostis|panicum|molinia/, { speed: "media", matureYears: 3, divideEvery: 6 }],
  [/hakonechloa|carex|ophiopogon|liriope/, { speed: "lenta", matureYears: 3, habit: "si allarga", divideEvery: 5 }],
  [/buxus|bosso/, { speed: "lenta", matureYears: 6, prune: "frequente" }],
  [/taxus|tasso|ilex|agrifoglio/, { speed: "lenta", matureYears: 8, prune: "annuale" }],
  [/photinia|fotinia|prunus laurocerasus|lauroceras|ligustr|pittospor|elaeagnus/, { speed: "veloce", matureYears: 4, prune: "frequente" }],
  [/hydrange|ortensi/, { speed: "media", matureYears: 4, roots: "superficiali" }],
  [/rhododendr|azalea|camellia|camelia|pieris/, { speed: "lenta", matureYears: 6, roots: "superficiali" }],
  [/clemati/, { speed: "media", matureYears: 3 }],
  [/wisteria|glicine|parthenocissus|campsis/, { speed: "veloce", matureYears: 5, roots: "profonde" }],
  [/fragaria|fragola/, { habit: "si allarga", roots: "stolonifere", lifespan: 3, matureYears: 1, prune: "annuale" }],
  [/asparag|carciof|cynara|rabarbaro/, { habit: "cespo", matureYears: 2, lifespan: 10, roots: "profonde" }],
  [/sedum|hylotelephium/, { speed: "media", matureYears: 2, divideEvery: 4, roots: "superficiali" }],
  [/nepeta|salvia nemorosa|calamintha/, { speed: "veloce", matureYears: 2, divideEvery: 4 }],
];

const CROP_PERENNIAL = /asparag|carciof|fragol|rabarbaro/;

/** Profilo di crescita di una pianta piantata (o del catalogo). */
export function growthProfile(p) {
  const text = `${p?.scientificName ?? ""} ${p?.name ?? p?.commonName ?? ""}`.toLowerCase();
  let prof = { ...BASE };
  // ortaggi: annuali, salvo i pochi pluriennali
  if (p?.cropId && !CROP_PERENNIAL.test(text)) {
    prof = { ...prof, speed: "veloce", matureYears: 0.4, roots: "fascicolate", habit: "annuale", lifespan: 1, prune: "nessuna", divideEvery: null };
  } else if (p?.group && GROUP_DEFAULTS[p.group]) {
    prof = { ...prof, ...GROUP_DEFAULTS[p.group] };
  } else {
    // piante salvate prima di questi dati: si deduce dal tipo di icona
    const byIcon = { shrub: "arbusti", grass: "graminacee", groundcover: "perenni", rose: "rose", cup: "bulbose", star: "perenni" }[p?.icon];
    if (byIcon) prof = { ...prof, ...GROUP_DEFAULTS[byIcon] };
    else prof = { ...prof, ...GROUP_DEFAULTS.perenni };
    if (p?.icon === "groundcover") prof.habit = "si allarga";
  }
  if (p?.cycle === "annual") prof = { ...prof, habit: prof.habit === "si autosemina" ? prof.habit : "annuale", lifespan: 1, matureYears: Math.min(prof.matureYears, 0.5), divideEvery: null };
  if (p?.cycle === "biennial") prof = { ...prof, lifespan: 2, habit: "si autosemina", divideEvery: null };
  for (const [re, o] of OVERRIDES) if (re.test(text)) prof = { ...prof, ...o };
  if (prof.habit === "annuale") prof.divideEvery = null;
  return prof;
}

// radice rispetto alla chioma: le stolonifere e le invasive si spingono oltre
export const ROOT_SPREAD = { superficiali: 0.9, fascicolate: 1.0, profonde: 0.8, stolonifere: 1.5, invasive: 2.0 };
// forza nella competizione per acqua e spazio
export const ROOT_VIGOR = { superficiali: 1, fascicolate: 2, profonde: 3, stolonifere: 4, invasive: 5 };
const SPEED_VIGOR = { lenta: 0, media: 1, veloce: 2 };

export function vigor(p, prof = growthProfile(p)) {
  return ROOT_VIGOR[prof.roots] + SPEED_VIGOR[prof.speed] + Math.min(3, (p.spreadM ?? 0.4) * 2);
}

const START_SPREAD = 0.22; // vaso del vivaio, circa
const START_HEIGHT = 0.25;

/**
 * Misure previste dopo `years` anni dalla messa a dimora.
 * Restituisce { spread, height, alive, note } in metri.
 * Le annuali si riseminano ogni anno: dopo la prima stagione restano adulte.
 */
export function sizeAt(p, years, prof = growthProfile(p)) {
  const S = Math.max(0.1, p.spreadM ?? 0.4);
  const H = Math.max(0.05, (p.heightCm ?? S * 100) / 100);
  const annual = prof.habit === "annuale";
  if (years <= 0) {
    return { spread: Math.min(S, annual ? 0.12 : START_SPREAD), height: Math.min(H, annual ? 0.1 : START_HEIGHT), alive: true, note: null };
  }
  if (annual) return { spread: S, height: H, alive: true, note: years >= 1 ? "da riseminare ogni anno" : null };

  const k = Math.min(1, years / prof.matureYears);
  const f = 1 - Math.pow(1 - k, 1.6); // cresce in fretta all'inizio, poi rallenta
  const s0 = Math.min(S, START_SPREAD), h0 = Math.min(H, START_HEIGHT);
  let spread = s0 + (S - s0) * f;
  const height = h0 + (H - h0) * f;
  // le piante che si allargano continuano anche da adulte
  const extra = Math.max(0, years - prof.matureYears);
  if (prof.roots === "invasive") spread *= Math.min(2.5, 1 + 0.35 * extra);
  else if (prof.habit === "si allarga") spread *= Math.min(1.8, 1 + 0.15 * extra);

  let alive = true, note = null;
  if (prof.lifespan && years > prof.lifespan) {
    if (prof.habit === "si autosemina") note = "la pianta madre è esaurita, restano le piantine nate dai semi";
    else {
      alive = false;
      note = "a fine vita: va sostituita";
    }
  } else if (prof.lifespan && years >= prof.lifespan - 1) note = "comincia a invecchiare";
  return { spread, height, alive, note };
}

// Etichette leggibili per il rapporto.
export const SPEED_LABEL = { lenta: "crescita lenta", media: "crescita media", veloce: "crescita veloce" };
export const ROOTS_LABEL = {
  superficiali: "radici superficiali",
  fascicolate: "radici a ciuffo",
  profonde: "radici profonde",
  stolonifere: "radici che si allargano (stoloni)",
  invasive: "radici invasive",
};
