import { lazy } from "react";

const RELOAD_KEY = "aiuolalab:ricaricata-per-aggiornamento";

// Carica una pagina solo quando serve. Se il file non si trova più (succede
// subito dopo un aggiornamento del sito, quando la scheda aperta è vecchia)
// ricarica la pagina una volta sola per prendere la versione nuova.
export function lazyPage(load, exportName = "default") {
  return lazy(() =>
    load().then(
      (mod) => {
        try {
          sessionStorage.removeItem(RELOAD_KEY);
        } catch {
          /* memoria del browser non disponibile */
        }
        return { default: mod[exportName] };
      },
      (err) => {
        let alreadyReloaded = true;
        try {
          alreadyReloaded = sessionStorage.getItem(RELOAD_KEY) === "1";
          if (!alreadyReloaded) sessionStorage.setItem(RELOAD_KEY, "1");
        } catch {
          /* memoria del browser non disponibile */
        }
        if (!alreadyReloaded) {
          window.location.reload();
          return new Promise(() => {});
        }
        throw err;
      },
    ),
  );
}
