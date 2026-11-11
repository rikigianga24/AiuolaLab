// Piani dell'app (gratis / premium). Modulo condiviso: lo usano sia il
// server (quote del consulente IA) sia l'interfaccia (cosa mostrare).
// Per cambiare cosa include un piano basta modificare questa tabella.

export const PLANS = {
  free: {
    label: "Gratis",
    // proposte del consulente IA: `count` ogni `hours` ore
    ai: { count: 1, hours: 48 },
    // valutazione completa nel pannello «Previsione» (altrimenti solo i voti estetici)
    fullForecast: false,
  },
  premium: {
    label: "Premium",
    ai: { count: 3, hours: 24 },
    fullForecast: true,
  },
};

// Prezzi dell'abbonamento Premium, IVA inclusa, in centesimi di euro.
// Sono quelli mostrati nella pagina /prezzi: devono coincidere con i prezzi
// creati su Paddle (all'avvio il server li confronta e avvisa se sono diversi).
export const PRICES = {
  month: { cents: 399, label: "mese" },
  year: { cents: 3000, label: "anno" },
};

/** «3,99 €» a partire dai centesimi. */
export const formatEuro = (cents) =>
  `${(cents / 100).toLocaleString("it-IT", { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })} €`;

/** Risparmio dell'annuale rispetto a 12 mensilità, in percentuale intera. */
export const yearlySaving = () => Math.round((1 - PRICES.year.cents / (PRICES.month.cents * 12)) * 100);

export const planOf =(user) => (user && PLANS[user.plan] ? user.plan : "free");
export const planFeatures = (user) => PLANS[planOf(user)];

// Descrizione breve della quota, es. «1 proposta ogni 2 giorni».
export function quotaLabel(ai) {
  const n = `${ai.count} ${ai.count === 1 ? "proposta" : "proposte"}`;
  if (ai.hours === 24) return `${n} al giorno`;
  if (ai.hours % 24 === 0) return `${n} ogni ${ai.hours / 24} giorni`;
  return `${n} ogni ${ai.hours} ore`;
}

// Stato della quota a partire dagli orari delle proposte già fatte.
// `times`: date (o timestamp) delle richieste; contano solo quelle nella finestra.
export function quotaStatus(times, ai, now = Date.now()) {
  const windowMs = ai.hours * 3600 * 1000;
  const recent = times
    .map((t) => new Date(t).getTime())
    .filter((t) => t > now - windowMs)
    .sort((a, b) => a - b);
  const remaining = Math.max(0, ai.count - recent.length);
  // quando si libera il primo posto: la più vecchia esce dalla finestra
  const nextAt = remaining > 0 ? null : new Date(recent[recent.length - ai.count] + windowMs).toISOString();
  return { used: recent.length, remaining, nextAt };
}
