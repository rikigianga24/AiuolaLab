// Testi delle notifiche "stile Duolingo": brevi, simpatici, con un'emoji
// adatta e frasi che cambiano da un giorno all'altro. Al massimo una
// notifica al giorno, che riunisce promemoria, meteo e serie.

const KIND_EMOJI = {
  potatura: "✂️",
  concimazione: "🌱",
  trattamento: "🛡️",
  semina: "🌱",
  trapianto: "🪴",
  raccolta: "🧺",
  cura: "🤲",
  irrigazione: "💧",
};

const PLANT_EMOJI = [
  [/ros[ae]\b/i, "🌹"],
  [/tulip/i, "🌷"],
  [/lavand/i, "💜"],
  [/girasol/i, "🌻"],
  [/pomodor/i, "🍅"],
  [/zucc/i, "🎃"],
  [/fragol/i, "🍓"],
  [/peperon/i, "🫑"],
  [/melanzan/i, "🍆"],
  [/carot/i, "🥕"],
  [/insalat|lattug/i, "🥬"],
  [/patat/i, "🥔"],
  [/cipoll|agli/i, "🧅"],
  [/ortensi/i, "💠"],
  [/bulb|narcis|giacint|croc/i, "🌷"],
];

const ALERT_EMOJI = [
  [/gel|freddo|brina/i, "❄️"],
  [/cald|afa|scott/i, "☀️"],
  [/vento|raffic/i, "💨"],
  [/pioggi|temporal|grandin|nubifrag/i, "🌧️"],
  [/secc|siccit/i, "🏜️"],
];

export function taskEmoji(task) {
  const text = `${task.title} ${(task.plants ?? []).join(" ")}`;
  for (const [re, e] of PLANT_EMOJI) if (re.test(text)) return e;
  return KIND_EMOJI[task.kind] ?? "🌿";
}

export function alertEmoji(alert) {
  for (const [re, e] of ALERT_EMOJI) if (re.test(`${alert.title} ${alert.id ?? ""}`)) return e;
  return "⚠️";
}

// Scelta stabile ma diversa ogni giorno (e per ogni utente).
function pick(list, seed) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return list[h % list.length];
}

const lower = (t) => t.charAt(0).toLowerCase() + t.slice(1);
const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

const ONE_BODY = [
  "Oggi è il momento giusto: {where}.",
  "Le tue piante ti aspettano: {where}. Bastano pochi minuti.",
  "Psst… {what} entro il {end}. {where}.",
  "Piccolo lavoro, grande giardino: {where}.",
];
const MANY_TITLE = ["🌿 {n} cose da fare in giardino", "🪴 Il giardino ti chiama: {n} lavoretti", "☀️ Buongiorno! Oggi {n} piccoli lavori", "🌱 {n} attività per le tue piante"];
const STREAK = ["🔥 {k} settimane di fila che curi il giardino: continua così!", "🔥 Serie di {k} settimane! Le tue piante ringraziano.", "🔥 {k} settimane senza saltarne una: che pollice verde!"];
const STREAK_ONLY_TITLE = ["🔥 {k} settimane di fila!", "🔥 Serie di {k} settimane"];
const STREAK_ONLY_BODY = ["Questa settimana non c'è niente di urgente: goditi il giardino 🌼", "Niente lavori in vista: un giro tra le aiuole e un caffè ☕"];

const fmtDay = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("it-IT", { day: "numeric", month: "long", timeZone: "UTC" });

/**
 * Notifica del giorno, oppure null se non c'è niente da dire.
 * @param tasks   attività aperte non ancora notificate
 * @param alert   avviso meteo più importante (o null)
 * @param streak  settimane di fila con attività fatte (solo il lunedì)
 * @param seed    per variare le frasi (es. data + utente)
 */
export function dailyMessage({ tasks = [], alert = null, streak = 0, seed = "" }) {
  const streakLine = streak >= 2 ? fill(pick(STREAK, `${seed}s`), { k: streak }) : null;
  const n = tasks.length;

  if (alert) {
    const extra = n ? `\nE oggi ${n === 1 ? `c'è anche: ${lower(tasks[0].title)}` : `ci sono ${n} cose da fare`}.` : "";
    return {
      title: `${alertEmoji(alert)} ${alert.title}`,
      body: `${alert.detail}${extra}${streakLine ? `\n${streakLine}` : ""}`,
      tag: `daily-${seed}`,
      url: "/calendario",
      badge: n,
    };
  }
  if (n === 1) {
    const t = tasks[0];
    return {
      title: `${taskEmoji(t)} ${t.title}`,
      body: `${fill(pick(ONE_BODY, seed), { where: t.where, what: lower(t.title), end: fmtDay(t.end) })}${streakLine ? `\n${streakLine}` : ""}`,
      tag: `daily-${seed}`,
      url: `/calendario?attivita=${encodeURIComponent(t.id)}`,
      taskId: t.id,
      actions: [
        { action: "done", title: "✅ Fatto" },
        { action: "snooze", title: "⏰ Tra una settimana" },
      ],
      badge: 1,
    };
  }
  if (n > 1) {
    const list = tasks.slice(0, 3).map((t) => `${taskEmoji(t)} ${t.title}`);
    if (n > 3) list.push(`…e altre ${n - 3}`);
    return {
      title: fill(pick(MANY_TITLE, seed), { n }),
      body: `${list.join("\n")}${streakLine ? `\n${streakLine}` : ""}`,
      tag: `daily-${seed}`,
      url: "/calendario",
      badge: n,
    };
  }
  if (streakLine) {
    return { title: fill(pick(STREAK_ONLY_TITLE, seed), { k: streak }), body: pick(STREAK_ONLY_BODY, seed), tag: `daily-${seed}`, url: "/calendario", badge: 0 };
  }
  return null;
}

// ---- serie: settimane consecutive con almeno un'attività segnata fatta ----

function weekKey(iso) {
  const d = new Date(`${iso}T00:00:00Z`);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day); // lunedì
  return d.toISOString().slice(0, 10);
}

export function streakWeeks(taskState = {}, today) {
  const weeks = new Set(Object.values(taskState).map((s) => s?.done).filter(Boolean).map(weekKey));
  // si conta da questa settimana (se ha già qualcosa) o dalla precedente
  let cursor = weekKey(today);
  const prev = (k) => {
    const d = new Date(`${k}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 7);
    return d.toISOString().slice(0, 10);
  };
  if (!weeks.has(cursor)) cursor = prev(cursor);
  let n = 0;
  while (weeks.has(cursor)) {
    n++;
    cursor = prev(cursor);
  }
  return n;
}

/** Notifica di prova, per vedere com'è fatta. */
export function testMessage() {
  return {
    title: "🌹 Prova: è ora di potare le rose",
    body: "Così arriveranno i promemoria di AiuolaLab. Prova i pulsanti qui sotto!",
    tag: "test",
    url: "/calendario",
    actions: [
      { action: "done", title: "✅ Fatto" },
      { action: "snooze", title: "⏰ Tra una settimana" },
    ],
    badge: 1,
  };
}
