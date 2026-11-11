// Registro degli errori (Sentry) e statistiche di visita (Umami) nel
// browser. Si accendono solo se il server li ha configurati (/api/health):
// senza configurazione non si scarica né si carica nulla.
// Nessuno dei due usa cookie o salva dati sul dispositivo.
import { getHealth } from "./api.js";
import { scrubEvent, scrubUrl } from "./scrub.js";

let started = false;

export function startObservability() {
  if (started || typeof window === "undefined") return;
  started = true;
  getHealth().then((health) => {
    if (health.sentryDsn) startErrorReporting(health).catch(() => {});
    if (health.analytics?.websiteId) startAnalytics(health.analytics);
  });
}

async function startErrorReporting({ sentryDsn, sentryEnvironment }) {
  // pacchetto separato: chi non lo usa non lo scarica
  const { init } = await import("./sentryClient.js");
  init({
    dsn: sentryDsn,
    environment: sentryEnvironment,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    // niente "sessioni" (salverebbero dati nel browser) né registrazioni
    integrations: (defaults) => defaults.filter((i) => i.name !== "BrowserSession"),
    // errori dovuti a estensioni o a connessioni cadute: non sono nostri bug
    ignoreErrors: ["ResizeObserver loop", "Failed to fetch", "NetworkError", "Load failed", "AbortError"],
    denyUrls: [/^chrome-extension:\/\//, /^moz-extension:\/\//, /^safari-extension:\/\//],
    beforeSend: scrubEvent,
    beforeBreadcrumb: (b) => (b.category === "console" || b.category === "ui.input" ? null : b),
  });
}

function startAnalytics({ websiteId, scriptUrl }) {
  // Umami chiama questa funzione prima di ogni invio: togliamo dai link i
  // codici dei progetti condivisi e i parametri (link di conferma e reset).
  window.aiuolaBeforeSend = (type, payload) => {
    if (payload) {
      if (payload.url) payload.url = scrubUrl(payload.url);
      if (payload.referrer) payload.referrer = scrubUrl(payload.referrer);
    }
    return payload;
  };
  const s = document.createElement("script");
  s.defer = true;
  s.src = scriptUrl;
  s.dataset.websiteId = websiteId;
  s.dataset.excludeSearch = "true";
  s.dataset.excludeHash = "true";
  s.dataset.doNotTrack = "true";
  s.dataset.beforeSend = "aiuolaBeforeSend";
  document.head.appendChild(s);
}
