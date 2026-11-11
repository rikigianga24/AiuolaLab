// Registro degli errori (Sentry), facoltativo: si accende con SENTRY_DSN.
// Senza, gli errori finiscono solo nei log di Render come prima.
// Privacy: niente IP, cookie, intestazioni o corpo delle richieste; dai
// link si tolgono i parametri (?verifica=, ?reset=...) e i codici dei
// progetti condivisi, che danno accesso ai dati.
import { scrubEvent } from "../src/lib/scrub.js";
import { config } from "./config.js";

let sentry = null;

export async function initMonitoring() {
  if (!config.sentry.dsn) return false;
  try {
    sentry = await import("@sentry/node");
    sentry.init({
      dsn: config.sentry.dsn,
      environment: config.sentry.environment,
      release: config.sentry.release,
      sendDefaultPii: false,
      tracesSampleRate: 0,
      beforeSend: scrubEvent,
      beforeBreadcrumb: (b) => (b.category === "console" ? null : b),
    });
    console.log("[monitor] Registro degli errori attivo (Sentry).");
    return true;
  } catch (err) {
    sentry = null;
    console.warn("[monitor] Sentry non avviato:", err.message);
    return false;
  }
}

/** Segnala un errore inatteso; `where` dice da quale parte dell'app arriva. */
export function reportError(err, where) {
  if (!sentry) return;
  sentry.withScope((scope) => {
    if (where) scope.setTag("parte", where);
    sentry.captureException(err);
  });
}
