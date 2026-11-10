// Foto degli stili di giardino (public/img/stili/).
// Per ogni stile con la foto ci sono quattro file:
//   <id>-640.webp, <id>-960.webp, <id>-1536.webp  (pagina)
//   <id>-og.jpg                                   (anteprima dei link, 1200×630)
// Quando si aggiunge la foto di un nuovo stile, basta aggiungere qui il suo id.
// Modulo condiviso: lo usa anche il server per le anteprime dei link.

const WITH_PHOTO = new Set(["cottage", "italiano", "francese"]);

export const PHOTO_WIDTHS = [640, 960, 1536];

export function stylePhoto(id) {
  if (!WITH_PHOTO.has(id)) return null;
  const base = `/img/stili/${id}`;
  return {
    src: `${base}-960.webp`,
    srcSet: PHOTO_WIDTHS.map((w) => `${base}-${w}.webp ${w}w`).join(", "),
    og: `${base}-og.jpg`,
  };
}

export const hasStylePhoto = (id) => WITH_PHOTO.has(id);

// Foto in apertura della pagina Stili. Per ora quella del cottage; quando
// arriva la foto panoramica, salvarla come public/img/stili/hero.webp e
// cambiare qui il percorso.
export const STYLES_HERO = "/img/stili/cottage-1536.webp";
