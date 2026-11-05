// Riepilogo giornaliero e avvisi a partire dalle previsioni MET Norway
// (Locationforecast 2.0, formato "compact").

const TZ = "Europe/Rome";

const dayKey = (iso) =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));

const hourOf = (iso) => Number(new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", hour12: false }).format(new Date(iso)));

/** timeseries -> [{ date, tMin, tMax, rain, windMax, symbol }] */
export function dailySummary(timeseries = []) {
  const days = new Map();
  for (const step of timeseries) {
    const key = dayKey(step.time);
    const d = days.get(key) ?? { date: key, tMin: Infinity, tMax: -Infinity, rain: 0, windMax: 0, symbol: null, symbolHour: 99 };
    const inst = step.data?.instant?.details ?? {};
    if (Number.isFinite(inst.air_temperature)) {
      d.tMin = Math.min(d.tMin, inst.air_temperature);
      d.tMax = Math.max(d.tMax, inst.air_temperature);
    }
    if (Number.isFinite(inst.wind_speed)) d.windMax = Math.max(d.windMax, inst.wind_speed);
    // pioggia: passi orari quando ci sono, altrimenti blocchi da 6 ore
    const p1 = step.data?.next_1_hours?.details?.precipitation_amount;
    const p6 = step.data?.next_6_hours?.details?.precipitation_amount;
    if (Number.isFinite(p1)) d.rain += p1;
    else if (Number.isFinite(p6)) d.rain += p6;
    const sym = step.data?.next_1_hours?.summary?.symbol_code ?? step.data?.next_6_hours?.summary?.symbol_code;
    const h = hourOf(step.time);
    if (sym && Math.abs(h - 13) < Math.abs(d.symbolHour - 13)) {
      d.symbol = sym;
      d.symbolHour = h;
    }
    days.set(key, d);
  }
  return [...days.values()]
    .filter((d) => Number.isFinite(d.tMin))
    .map((d) => ({ date: d.date, tMin: d.tMin, tMax: d.tMax, rain: Math.round(d.rain * 10) / 10, windMax: d.windMax, symbol: d.symbol }));
}

const fmtDay = (date) =>
  new Date(`${date}T12:00:00`).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });

/**
 * Avvisi utili per chi cura piante. `context` può dire se ci sono vasi
 * (appesi), orto o impianto di irrigazione.
 */
export function weatherAlerts(days, context = {}) {
  const alerts = [];
  const next = days.slice(0, 7);
  for (const d of next) {
    if (d.tMin <= 1) {
      const severe = d.tMin <= -3;
      alerts.push({
        id: `frost-${d.date}`,
        type: "frost",
        severity: severe ? "high" : "medium",
        date: d.date,
        title: severe ? `Gelo intenso ${fmtDay(d.date)} (${Math.round(d.tMin)} °C)` : `Rischio gelata ${fmtDay(d.date)} (${Math.round(d.tMin)} °C)`,
        detail:
          "Copri con tessuto non tessuto le piante delicate" +
          (context.pots ? ", avvicina i vasi al muro e sollevali da terra" : "") +
          (context.vegetable ? ", proteggi le colture dell'orto" : "") +
          ". Non irrigare la sera prima.",
      });
    }
    if (d.tMax >= 32) {
      const severe = d.tMax >= 36;
      alerts.push({
        id: `heat-${d.date}`,
        type: "heat",
        severity: severe ? "high" : "medium",
        date: d.date,
        title: `${severe ? "Caldo intenso" : "Caldo"} ${fmtDay(d.date)} (${Math.round(d.tMax)} °C)`,
        detail:
          "Irriga all'alba, mai nelle ore calde" +
          (context.pots ? "; i vasi piccoli e appesi possono richiedere un secondo ciclo la sera" : "") +
          "; ombreggia le piante appena trapiantate.",
      });
    }
    if (d.rain >= 15) {
      alerts.push({
        id: `rain-${d.date}`,
        type: "rain",
        severity: d.rain >= 40 ? "high" : "medium",
        date: d.date,
        title: `Pioggia abbondante ${fmtDay(d.date)} (${Math.round(d.rain)} mm)`,
        detail: "Sospendi l'irrigazione e controlla che i vasi abbiano il foro di drenaggio libero.",
      });
    } else if (d.rain >= 5 && context.irrigation) {
      alerts.push({
        id: `skip-${d.date}`,
        type: "skip",
        severity: "low",
        date: d.date,
        title: `Pioggia ${fmtDay(d.date)} (${Math.round(d.rain)} mm): puoi saltare l'irrigazione`,
        detail: "Con più di 5 mm di pioggia l'impianto a goccia può restare spento per quel giorno.",
      });
    }
    if (d.windMax >= 10) {
      alerts.push({
        id: `wind-${d.date}`,
        type: "wind",
        severity: d.windMax >= 15 ? "high" : "medium",
        date: d.date,
        title: `Vento forte ${fmtDay(d.date)} (${Math.round(d.windMax * 3.6)} km/h)`,
        detail:
          "Controlla tutori e legature" +
          (context.pots ? ", fissa o porta al riparo i vasi appesi e quelli leggeri" : "") +
          ".",
      });
    }
  }
  const dry = next.slice(0, 5);
  if (dry.length >= 5 && dry.every((d) => d.rain < 1) && dry.some((d) => d.tMax >= 28)) {
    alerts.push({
      id: `dry-${dry[0].date}`,
      type: "dry",
      severity: "low",
      date: dry[0].date,
      title: "Niente pioggia e caldo nei prossimi giorni",
      detail: "Controlla l'umidità del terreno: le piante giovani e i vasi avranno bisogno di acqua regolare.",
    });
  }
  return alerts;
}

// Etichetta e icona (Font Awesome) per i simboli MET Norway.
export function symbolInfo(code = "") {
  const c = code.replace(/_(day|night|polartwilight)$/, "");
  if (/thunder/.test(c)) return { label: "Temporale", icon: "fa-cloud-bolt" };
  if (/snow|sleet/.test(c)) return { label: "Neve", icon: "fa-snowflake" };
  if (/heavyrain/.test(c)) return { label: "Pioggia forte", icon: "fa-cloud-showers-heavy" };
  if (/rain/.test(c)) return { label: "Pioggia", icon: "fa-cloud-rain" };
  if (/fog/.test(c)) return { label: "Nebbia", icon: "fa-smog" };
  if (/cloudy/.test(c) && /partly/.test(c)) return { label: "Poco nuvoloso", icon: "fa-cloud-sun" };
  if (/cloudy/.test(c)) return { label: "Nuvoloso", icon: "fa-cloud" };
  if (/fair/.test(c)) return { label: "Sereno o poco nuvoloso", icon: "fa-cloud-sun" };
  if (/clearsky/.test(c)) return { label: "Sereno", icon: "fa-sun" };
  return { label: "—", icon: "fa-cloud-sun" };
}
