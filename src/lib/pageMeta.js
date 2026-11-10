// Aggiorna titolo e descrizione della pagina nel browser.
import { useEffect } from "react";
import { pageMeta } from "./seo.js";

function setTag(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!content) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function applyPageMeta(meta) {
  document.title = meta.title;
  setTag("name", "description", meta.description);
  setTag("property", "og:title", meta.title);
  setTag("property", "og:description", meta.description);
  setTag("name", "robots", meta.noindex ? "noindex" : null);
}

/** Meta della pagina in base al percorso (le pagine possono poi cambiarli). */
export function usePathMeta(pathname) {
  useEffect(() => {
    applyPageMeta(pageMeta(pathname));
  }, [pathname]);
}
