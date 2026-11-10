// Titolo, descrizione e immagine di anteprima di ogni pagina.
// Modulo condiviso: il server li scrive nell'HTML (Google, WhatsApp e social
// leggono quello), il browser li aggiorna quando si cambia pagina.
import { GARDEN_STYLES, STYLE_BY_ID } from "./gardenStyles.js";
import { stylePhoto } from "./stylePhotos.js";

export const SITE_NAME = "AiuolaLab";
export const DEFAULT_IMAGE = "/img/og-aiuolalab.jpg";
const DEFAULT_DESCRIPTION = "Progetta aiuole, balconi e orti in scala reale, scegli le piante giuste e ricevi consigli dall'IA. Gratis e in italiano.";

const STATIC = {
  "/": { title: "AiuolaLab · progetta il tuo giardino, balcone e orto", description: DEFAULT_DESCRIPTION },
  "/piante": { title: "Scopri le piante · AiuolaLab", description: "Quasi 1000 piante con foto, esposizione, acqua, altezza e cure: filtra per stile, colore e ambiente." },
  "/stili": {
    title: "Stili di giardino: quale fa per te? · AiuolaLab",
    description: "Cottage, all'italiana, giapponese, mediterraneo e altri: storia, piante tipiche, costi e come portarli anche sul balcone.",
  },
  "/guida": { title: "Guida al giardino · AiuolaLab", description: "Consigli pratici per progettare e curare aiuole, balconi e orti." },
  "/gardencanvas": { title: "Progetta · AiuolaLab", description: "Disegna aiuole, balconi e orti in scala reale e scegli le piante adatte." },
  "/calendario": { title: "Calendario delle cure · AiuolaLab", description: "Cosa fare nel tuo giardino, settimana per settimana." },
  "/aboutme": { title: "Chi sono · AiuolaLab", description: DEFAULT_DESCRIPTION },
  "/privacy": { title: "Privacy · AiuolaLab", description: DEFAULT_DESCRIPTION },
  "/cookie": { title: "Cookie · AiuolaLab", description: DEFAULT_DESCRIPTION },
};

export function styleMeta(style) {
  return {
    title: `${style.name}: come farlo, piante e consigli · AiuolaLab`,
    description: `${style.tagline} Piante tipiche, costi, errori da evitare e come portarlo sul balcone.`,
    image: stylePhoto(style.id)?.og ?? DEFAULT_IMAGE,
  };
}

export const sharedMeta = (name) => ({
  title: name ? `«${name}» · progetto su AiuolaLab` : "Un progetto su AiuolaLab",
  description: "Guarda questo progetto disegnato con AiuolaLab, l'app gratuita per progettare giardini, balconi e orti.",
  image: DEFAULT_IMAGE,
  noindex: true,
});

/** Meta della pagina per un percorso (senza dati dal server). */
export function pageMeta(pathname) {
  const path = pathname.replace(/\/+$/, "") || "/";
  const style = path.match(/^\/stili\/([a-z]+)$/);
  if (style && STYLE_BY_ID[style[1]]) return styleMeta(STYLE_BY_ID[style[1]]);
  if (path.startsWith("/condiviso/")) return sharedMeta(null);
  const m = STATIC[path];
  return m ? { image: DEFAULT_IMAGE, ...m } : { title: SITE_NAME, description: DEFAULT_DESCRIPTION, image: DEFAULT_IMAGE };
}

/** Pagine da far trovare a Google (sitemap.xml). */
export const SITEMAP_PATHS = ["/", "/piante", "/stili", ...GARDEN_STYLES.map((s) => `/stili/${s.id}`), "/guida", "/gardencanvas", "/calendario", "/aboutme"];
