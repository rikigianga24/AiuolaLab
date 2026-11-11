// Titolo, descrizione e anteprima dei link scritti direttamente nell'HTML.
// Google, WhatsApp, Facebook e Telegram leggono l'HTML senza eseguire
// l'app: senza questo vedrebbero sempre e solo "AiuolaLab".
import { DEFAULT_IMAGE, SITE_NAME, SITEMAP_PATHS, pageMeta, sharedMeta } from "../src/lib/seo.js";
import { config } from "./config.js";
import { findShared } from "./routes/shared.js";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// L'indirizzo del sito: quello configurato (su Render è automatico),
// altrimenti quello della richiesta (sviluppo e test).
const configuredOrigin = process.env.APP_URL || process.env.RENDER_EXTERNAL_URL ? config.appUrl : null;
export const siteOrigin = (req) => configuredOrigin ?? `${req.protocol}://${req.get("host")}`;

/** Meta della pagina; per i progetti condivisi legge il nome dal database. */
export async function metaFor(pathname) {
  const shared = pathname.match(/^\/condiviso\/([^/]+)\/?$/);
  if (shared) {
    try {
      const row = await findShared(shared[1]);
      return sharedMeta(row?.name ?? null);
    } catch {
      return sharedMeta(null);
    }
  }
  return pageMeta(pathname);
}

/** Inserisce i meta nell'index.html compilato. */
export function renderIndex(html, meta, { origin, pathname }) {
  const url = `${origin}${pathname}`;
  const image = `${origin}${meta.image ?? DEFAULT_IMAGE}`;
  const tags = [
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:locale" content="it_IT" />`,
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    meta.noindex ? `<meta name="robots" content="noindex" />` : `<link rel="canonical" href="${esc(url)}" />`,
  ].join("\n    ");
  // sostituzioni con una funzione: nel nome di un progetto condiviso
  // caratteri come "$&" o "$'" verrebbero altrimenti interpretati
  return html
    .replace(/<title>[^<]*<\/title>/, () => `<title>${esc(meta.title)}</title>`)
    .replace(/<meta name="description" content="[^"]*" \/>/, () => `<meta name="description" content="${esc(meta.description)}" />`)
    .replace("</head>", () => `    ${tags}\n  </head>`);
}

export function sitemapXml(origin) {
  const urls = SITEMAP_PATHS.map((p) => `  <url><loc>${esc(origin + p)}</loc></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

// I progetti condivisi non si bloccano qui (i social non mostrerebbero
// l'anteprima): Google non li indicizza grazie al meta "noindex" della pagina.
export function robotsTxt(origin) {
  return ["User-agent: *", "Allow: /", "Disallow: /api/", "Disallow: /account", `Sitemap: ${origin}/sitemap.xml`, ""].join("\n");
}
