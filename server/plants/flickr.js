// Foto di varietà scelte a mano su Flickr (fotoFlickr.js), solo con licenze
// che permettono l'uso commerciale: CC BY, CC BY-SA, CC0 e pubblico dominio.
// Non chiamiamo l'API di Flickr: i link sono fissi e le foto si caricano
// direttamente da Flickr, come quelle di iNaturalist.
import { FOTO_FLICKR } from "./catalog/fotoFlickr.js";

const LICENSES = {
  by: "CC BY",
  "by-sa": "CC BY-SA",
  cc0: "CC0",
  pdm: "Pubblico dominio",
};

// .../12345_abcdef_b.jpg -> stessa foto in un'altra misura
// (n = 320 px, z = 640 px, b = 1024 px)
export function flickrSized(url, size) {
  const m = /^(https:\/\/live\.staticflickr\.com\/\d+\/\d+_[0-9a-f]+)(?:_[a-z])?\.jpg$/i.exec(url ?? "");
  return m ? `${m[1]}_${size}.jpg` : null;
}

export function flickrPhoto(p) {
  const label = LICENSES[p.license];
  const medium = flickrSized(p.url, "z");
  if (!label || !medium) return null;
  return {
    id: `fl:${p.id}`,
    thumb: flickrSized(p.url, "n"),
    medium,
    large: flickrSized(p.url, "b"),
    attribution: p.creator ? `© ${p.creator}` : label === "Pubblico dominio" ? "Pubblico dominio" : "Autore su Flickr",
    license: p.version && label !== "Pubblico dominio" ? `${label} ${p.version}` : label,
    licenseUrl: p.licenseUrl ?? null,
    sourceUrl: p.landing,
    source: "Flickr",
  };
}

/** Foto Flickr scelte per una varietà del catalogo (nome scientifico esatto). */
export function flickrPhotosFor(scientificName) {
  return (FOTO_FLICKR[scientificName] ?? []).map(flickrPhoto).filter(Boolean);
}
