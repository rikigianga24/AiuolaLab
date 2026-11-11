// Toglie dai link i dati che non devono uscire verso servizi esterni
// (registro degli errori, statistiche): i parametri come ?verifica= e
// ?reset= e i codici dei progetti condivisi, che danno accesso ai dati.
// Modulo condiviso: lo usano sia il browser sia il server.

export function scrubUrl(url) {
  if (typeof url !== "string") return url;
  return url
    .replace(/[?#].*$/, "")
    .replace(/\/condiviso\/[^/]+/, "/condiviso/[codice]")
    .replace(/\/shared\/[^/]+/, "/shared/[codice]");
}

/** Ripulisce un evento di Sentry prima dell'invio. */
export function scrubEvent(event) {
  if (event.request) {
    event.request = { method: event.request.method, url: scrubUrl(event.request.url) };
  }
  if (event.user) event.user = event.user.id ? { id: event.user.id } : undefined;
  for (const b of event.breadcrumbs ?? []) {
    for (const k of ["url", "from", "to"]) if (b.data?.[k]) b.data[k] = scrubUrl(b.data[k]);
  }
  return event;
}
