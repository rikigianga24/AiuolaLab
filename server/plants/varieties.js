// Nomi delle varietà (cultivar) e categorie di foto su Wikimedia Commons.
//
// Le foto di iNaturalist sono per specie: per "Rosa 'Edith Piaf'" troverebbe
// solo "Rosa", cioè una rosa qualsiasi. Per le varietà cerchiamo quindi
// prima una categoria di Commons dedicata (es. "Category:Rosa 'Graham
// Thomas'"), dove i volontari raccolgono le foto di quella sola varietà.

/** "Echinacea purpurea 'Magnus'" -> { genus, species, cultivar, base } */
export function parseVariety(name) {
  const s = String(name ?? "").trim();
  const cultivar = /['‘’]([^'‘’]+)['‘’]/.exec(s)?.[1]?.trim() ?? null;
  const words = s
    .replace(/['‘’][^'‘’]*['‘’]/g, " ")
    .replace(/\(.*?\)/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ");
  const genus = words[0] || null;
  // "x" e "×" degli ibridi, "var." e simili non fanno parte della specie
  const rest = words.slice(1).filter((w) => !/^(x|×|cv\.?|var\.?|subsp\.?|ssp\.?|f\.)$/i.test(w));
  const species = rest[0] && /^[a-z-]+$/.test(rest[0]) ? rest[0] : null;
  return { genus, species, cultivar, base: [genus, species].filter(Boolean).join(" ") };
}

/** Titoli di categoria da provare su Commons, dal più preciso. */
export function categoryCandidates(name) {
  const { genus, species, cultivar } = parseVariety(name);
  if (!genus || !cultivar) return [];
  const out = [];
  const raw = String(name).trim().replace(/[‘’]/g, "'").replace(/\s+/g, " ");
  out.push(raw);
  if (species) out.push(`${genus} ${species} '${cultivar}'`, `${genus} × ${species} '${cultivar}'`);
  out.push(`${genus} '${cultivar}'`);
  // le rose ibride di tea spesso sono classificate come Rosa × hybrida
  if (genus === "Rosa") out.push(`Rosa × hybrida '${cultivar}'`);
  return [...new Set(out)];
}

// Categorie scelte a mano quando il nome su Commons è diverso da quello del
// catalogo (es. nome commerciale e nome di registrazione). Nome scientifico
// del catalogo -> nome della categoria senza "Category:".
export const FOTO_MANUALI = {
  // su Commons la categoria ha un errore di battitura nella specie
  "Hebe pinguifolia 'Pagei'": "Hebe pinguafolia 'Pagei'",
  // Leucanthemum maximum: nome usato spesso per le margherite x superbum
  "Leucanthemum x superbum 'Silberprinzesschen'": "Leucanthemum maximum 'Silberprinzesschen'",
};
