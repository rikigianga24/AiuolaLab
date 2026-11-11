// Foto di riserva da Wikimedia Commons (l'archivio di Wikipedia), usate
// quando iNaturalist non ha foto libere di una pianta.
//
// Percorso:
//   1. Wikidata: dal nome scientifico (proprietà P225) si trova la specie;
//      la sua "immagine" (P18) è scelta a mano dai volontari, quindi è la
//      foto più rappresentativa. P373 indica la categoria su Commons.
//   2. Commons: per ogni file si leggono autore, licenza e miniature.
//      Per la galleria si aggiungono le foto della categoria della specie.
//
// Commons accetta solo contenuti liberi, ma controlliamo comunque la
// licenza di ogni file: teniamo CC0, pubblico dominio, CC BY e CC BY-SA.

import { parseVariety } from "./varieties.js";

const WIKIDATA = "https://www.wikidata.org/w/api.php";
const COMMONS = "https://commons.wikimedia.org/w/api.php";
const OK_LICENSE = /^(cc0|pd|public domain|cc[- ]by(-sa)?([- ][\d.]+)?)/i;
const BAD_LICENSE = /\b(nc|nd)\b/i;
const OK_MIME = /^image\/(jpeg|png|webp)$/;

const stripHtml = (s) =>
  String(s ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const qs = (params) => new URLSearchParams({ format: "json", formatversion: "2", ...params }).toString();

// Commons crea miniature cambiando "500px-" nel link, ma solo nelle
// larghezze standard (250, 330, 500, 960, 1280...): le altre danno errore 400.
function sizedThumb(thumbUrl, width) {
  return thumbUrl?.includes("/500px-") ? thumbUrl.replace("/500px-", `/${width}px-`) : thumbUrl;
}

export function commonsPhoto(page) {
  const info = page?.imageinfo?.[0];
  if (!info || !OK_MIME.test(info.mime ?? "")) return null;
  const meta = info.extmetadata ?? {};
  const license = meta.License?.value ?? "";
  const short = stripHtml(meta.LicenseShortName?.value) || license;
  if (!(OK_LICENSE.test(license) || OK_LICENSE.test(short)) || BAD_LICENSE.test(license) || BAD_LICENSE.test(short)) return null;
  const isPd = /^(pd|public domain)/i.test(license) || /public domain|pubblico dominio/i.test(short);
  const artist = stripHtml(meta.Artist?.value).slice(0, 120);
  const thumb = info.thumburl ?? info.url;
  return {
    id: `wm:${page.pageid ?? page.title}`,
    thumb: sizedThumb(thumb, 330),
    medium: thumb,
    large: sizedThumb(thumb, 1280),
    attribution: artist ? `© ${artist}` : isPd ? "Pubblico dominio" : "Autore su Wikimedia Commons",
    license: isPd ? "Pubblico dominio" : short.toUpperCase().replace(/^CC0.*/, "CC0"),
    licenseUrl: meta.LicenseUrl?.value ?? (isPd ? "https://creativecommons.org/publicdomain/mark/1.0/" : null),
    sourceUrl: info.descriptionurl ?? `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`,
    source: "Wikimedia Commons",
  };
}

export const IMAGEINFO = { prop: "imageinfo", iiprop: "url|mime|extmetadata", iiurlwidth: "500", iiextmetadatafilter: "License|LicenseShortName|LicenseUrl|Artist" };

/**
 * get(url) esegue la richiesta (in coda, con User-Agent) e restituisce il JSON.
 * Ritorna { item, photos } oppure null se la specie non è su Wikidata.
 */
export async function findWikimediaPhotos(name, get, { full = false, max = 8 } = {}) {
  const search = await get(`${WIKIDATA}?${qs({ action: "query", list: "search", srsearch: `haswbstatement:"P225=${name}"`, srlimit: "1" })}`);
  const id = search?.query?.search?.[0]?.title;
  if (!id) return null;

  const entity = await get(`${WIKIDATA}?${qs({ action: "wbgetentities", ids: id, props: "claims" })}`);
  const claims = entity?.entities?.[id]?.claims ?? {};
  const files = (claims.P18 ?? []).map((c) => c.mainsnak?.datavalue?.value).filter(Boolean).slice(0, 3);
  const category = claims.P373?.[0]?.mainsnak?.datavalue?.value;

  const photos = [];
  if (files.length) {
    const info = await get(`${COMMONS}?${qs({ action: "query", titles: files.map((f) => `File:${f}`).join("|"), ...IMAGEINFO })}`);
    for (const page of info?.query?.pages ?? []) {
      const p = commonsPhoto(page);
      if (p) photos.push(p);
    }
  }
  if (category && (full || !photos.length)) {
    const cat = await get(
      `${COMMONS}?${qs({ action: "query", generator: "categorymembers", gcmtitle: `Category:${category}`, gcmtype: "file", gcmlimit: "15", ...IMAGEINFO })}`,
    );
    for (const page of cat?.query?.pages ?? []) {
      const p = commonsPhoto(page);
      if (p && !photos.some((x) => x.id === p.id)) photos.push(p);
    }
  }
  return { item: { id, url: `https://www.wikidata.org/wiki/${id}` }, photos: photos.slice(0, full ? max : 1) };
}

/** Foto dei file di una categoria di Commons (es. "Rosa 'Graham Thomas'"). */
export async function commonsCategoryPhotos(category, get, { max = 8 } = {}) {
  const cat = await get(
    `${COMMONS}?${qs({ action: "query", generator: "categorymembers", gcmtitle: `Category:${category}`, gcmtype: "file", gcmlimit: "20", ...IMAGEINFO })}`,
  );
  const photos = [];
  for (const page of cat?.query?.pages ?? []) {
    const p = commonsPhoto(page);
    if (p && !photos.some((x) => x.id === p.id)) photos.push(p);
  }
  return photos.slice(0, max);
}

const fold = (t) =>
  String(t ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[‘’]/g, "'")
    .toLowerCase();

/**
 * Cerca su Commons la categoria di una varietà: prima i nomi più probabili
 * (candidates), poi una ricerca per titolo che accetta solo categorie con
 * il genere e il nome della varietà, così "Edith Piaf" non porta alla
 * cantante. Ritorna il nome della categoria o null.
 */
export async function findVarietyCategory({ genus, species, cultivar, candidates }, get) {
  if (!genus || !cultivar) return null;
  if (candidates?.length) {
    const info = await get(`${COMMONS}?${qs({ action: "query", prop: "categoryinfo", titles: candidates.map((c) => `Category:${c}`).join("|") })}`);
    const pages = info?.query?.pages ?? [];
    for (const c of candidates) {
      const page = pages.find((p) => p.title === `Category:${c}`);
      if (page && !page.missing && (page.categoryinfo?.files ?? 0) > 0) return c;
    }
  }
  const search = await get(
    `${COMMONS}?${qs({ action: "query", list: "search", srsearch: `intitle:"${cultivar}" ${genus}`, srnamespace: "14", srlimit: "10" })}`,
  );
  const want = fold(cultivar);
  const hit = (search?.query?.search ?? []).find((r) => {
    const title = r.title.replace(/^Category:/, "");
    const t = fold(title);
    if (!t.startsWith(fold(genus)) || !(t.includes(`'${want}'`) || t.includes(`"${want}"`))) return false;
    // stessa varietà ma specie diversa: probabilmente un'altra pianta
    const other = parseVariety(title).species;
    return !(species && other && other !== species);
  });
  return hit ? hit.title.replace(/^Category:/, "") : null;
}
