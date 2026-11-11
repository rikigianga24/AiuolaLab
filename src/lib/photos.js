// Foto delle piante (iNaturalist tramite il nostro server), con cache in
// memoria per non richiederle di nuovo scorrendo le pagine.
import { useEffect, useRef, useState } from "react";
import { getPlantPhotos } from "./api";

const cache = new Map();

export function loadPhotos(name, full = false) {
  const key = `${full ? 1 : 0}:${name}`;
  if (!cache.has(key)) {
    const p = getPlantPhotos(name, full).catch((err) => {
      cache.delete(key);
      throw err;
    });
    cache.set(key, p);
  }
  return cache.get(key);
}

export function usePlantPhotos(name, { full = false, enabled = true } = {}) {
  const key = enabled && name ? `${full ? 1 : 0}:${name}` : null;
  const [state, setState] = useState({ key: null, data: null, error: null });

  useEffect(() => {
    if (!key) return;
    let alive = true;
    loadPhotos(name, full)
      .then((data) => alive && setState({ key, data, error: null }))
      .catch((err) => alive && setState({ key, data: null, error: err.message }));
    return () => {
      alive = false;
    };
  }, [key, name, full]);

  const ready = state.key === key;
  return { loading: Boolean(key) && !ready, data: ready ? state.data : null, error: ready ? state.error : null };
}

// true quando l'elemento entra (quasi) nello schermo: le foto si caricano
// solo per le schede che l'utente vede davvero.
export function useInView(margin = "300px") {
  const ref = useRef(null);
  // senza IntersectionObserver (browser molto vecchi) si carica subito
  const [seen, setSeen] = useState(() => typeof IntersectionObserver === "undefined");
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen, margin]);
  return [ref, seen];
}

// Link a una ricerca di immagini sul web per vedere la varietà esatta: le
// foto trovate così non si possono mostrare nell'app (copyright), ma
// l'utente può guardarle sul sito d'origine.
export function webImagesUrl(name) {
  const q = String(name ?? "").replace(/['‘’"“”]/g, "").replace(/\s+/g, " ").trim();
  return `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q)}`;
}
