// Pianificatore delle notifiche: ogni 10 minuti controlla gli utenti che
// all'ora scelta (fuso Europe/Rome) devono ricevere promemoria e avvisi.
import { addDaysISO, generateTasks, taskStatus } from "../src/lib/care.js";
import { weatherAlerts } from "../src/lib/weather.js";
import { config } from "./config.js";
import { hasDatabase, query } from "./db.js";
import { emailLayout, mailEnabled, pushEnabled, sendMail, sendPush } from "./notify.js";
import { userSettings } from "./routes/account.js";
import { getForecast } from "./routes/weather.js";
import { dailyMessage, streakWeeks } from "./pushMessages.js";

const TZ = "Europe/Rome";
const parts = (d = new Date()) =>
  Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", weekday: "short", hour12: false })
      .formatToParts(d)
      .map((p) => [p.type, p.value]),
  );

async function alreadySent(userId, key) {
  const { rowCount } = await query("INSERT INTO notification_log (user_id, key) VALUES ($1, $2) ON CONFLICT DO NOTHING", [userId, key]);
  return rowCount === 0;
}

const isoWeek = (isoDate) => {
  const d = new Date(`${isoDate}T00:00:00Z`);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  return `${d.getUTCFullYear()}-W${String(1 + Math.round((d - firstThursday) / 604800000)).padStart(2, "0")}`;
};

export async function runForUser(user, now = new Date()) {
  const settings = userSettings(user);
  const p = parts(now);
  const today = `${p.year}-${p.month}-${p.day}`;
  const { rows } = await query("SELECT data FROM projects WHERE owner_key = $1", [`user:${user.id}`]);
  const projects = rows.map((r) => r.data).filter((d) => Array.isArray(d?.beds));
  const year = Number(p.year);
  const tasks = generateTasks(projects, { climate: settings.climate, years: [year, year + 1] });
  const state = settings.taskState ?? {};
  const open = tasks.filter((t) => ["now", "upcoming"].includes(taskStatus(t, state, today)));
  const startingToday = open.filter((t) => t.start <= today && t.end >= today);
  const thisWeek = open.filter((t) => t.start <= addDaysISO(today, 6) && t.end >= today);

  let alerts = [];
  if (settings.location) {
    try {
      const fc = await getForecast(settings.location.lat, settings.location.lon);
      const ctx = {
        pots: projects.some((pr) => pr.beds.some((b) => b.kind === "pot")),
        vegetable: projects.some((pr) => pr.type === "vegetable"),
        irrigation: projects.some((pr) => pr.faucet),
      };
      alerts = weatherAlerts(fc.days.slice(0, 3), ctx);
    } catch (err) {
      console.warn("[scheduler] meteo non disponibile:", err.message);
    }
  }

  // --- notifica push del giorno: al massimo una, che riunisce promemoria,
  //     avviso meteo e serie (il lunedì). I tipi si spengono dall'account.
  let pushed = null;
  const n = settings.notify;
  if (n.push && pushEnabled() && !(await alreadySent(user.id, `daily:${today}`))) {
    const nowTasks = n.pushTasks === false ? [] : open.filter((t) => t.start <= today && t.end >= today);
    const fresh = [];
    for (const t of nowTasks) if (!(await alreadySent(user.id, `task:${t.id}`))) fresh.push(t);
    let alert = null;
    if (n.pushWeather !== false) {
      const order = { high: 0, medium: 1 };
      for (const a of alerts.filter((x) => x.severity !== "low").sort((x, y) => order[x.severity] - order[y.severity])) {
        if (!(await alreadySent(user.id, `alert:${a.id}`))) {
          alert = a;
          break;
        }
      }
    }
    const streak = n.pushStreak !== false && p.weekday === "Mon" ? streakWeeks(state, today) : 0;
    const msg = dailyMessage({ tasks: fresh, alert, streak, seed: `${today}:${user.id}` });
    if (msg) {
      await sendPush(user.id, { ...msg, urgent: alert?.severity === "high" });
      pushed = msg.title;
    } else {
      // niente da dire oggi: si libera la giornata per un eventuale avviso più tardi
      await query("DELETE FROM notification_log WHERE user_id = $1 AND key = $2", [user.id, `daily:${today}`]);
    }
  }

  const verified = Boolean(user.email_verified_at) && mailEnabled();

  // --- email per avvisi meteo importanti
  if (verified && settings.notify.emailWeather) {
    const severe = [];
    for (const a of alerts.filter((a) => a.severity === "high")) if (!(await alreadySent(user.id, `mail-alert:${a.id}`))) severe.push(a);
    if (severe.length) {
      await sendMail(
        user.email,
        `Avviso meteo: ${severe[0].title}`,
        emailLayout({
          title: "Avviso meteo per le tue piante",
          intro: settings.location?.name ? `Previsioni per ${settings.location.name}.` : undefined,
          sections: [{ title: "Cosa fare", items: severe.map((a) => ({ title: a.title, detail: a.detail })) }],
          cta: { label: "Apri il calendario", url: `${config.appUrl}/calendario` },
          footer: "Dati meteo: MET Norway (CC BY 4.0).",
        }),
      );
    }
  }

  // --- riepilogo settimanale (lunedì)
  if (verified && settings.notify.emailWeekly && p.weekday === "Mon" && (thisWeek.length || alerts.length)) {
    if (!(await alreadySent(user.id, `week:${isoWeek(today)}`))) {
      await sendMail(
        user.email,
        `Questa settimana in giardino: ${thisWeek.length} attività`,
        emailLayout({
          title: "Il tuo giardino questa settimana",
          sections: [
            thisWeek.length && { title: "Da fare", items: thisWeek.slice(0, 15).map((t) => ({ title: t.title, detail: `${t.where} — ${t.detail}` })) },
            alerts.length && { title: "Meteo", items: alerts.map((a) => ({ title: a.title, detail: a.detail })) },
          ].filter(Boolean),
          cta: { label: "Apri il calendario", url: `${config.appUrl}/calendario` },
        }),
      );
    }
  }
  return { tasksToday: startingToday.length, week: thisWeek.length, alerts: alerts.length, pushed };
}

export async function runScheduler(now = new Date()) {
  if (!hasDatabase()) return;
  const hour = Number(parts(now).hour);
  const { rows } = await query(
    `SELECT * FROM users
     WHERE COALESCE((settings->'notify'->>'hour')::int, $1) = $2
       AND (COALESCE((settings->'notify'->>'push')::boolean, false)
            OR COALESCE((settings->'notify'->>'emailWeekly')::boolean, true)
            OR COALESCE((settings->'notify'->>'emailWeather')::boolean, true))`,
    [config.notifyHour, hour],
  );
  for (const user of rows) {
    try {
      await runForUser(user, now);
    } catch (err) {
      console.warn(`[scheduler] utente ${user.id}:`, err.message);
    }
  }
}

export function startScheduler() {
  if (!config.schedulerEnabled) return;
  const tick = () => runScheduler().catch((err) => console.warn("[scheduler]", err.message));
  setTimeout(tick, 15_000);
  setInterval(tick, 10 * 60 * 1000).unref();
  console.log("[scheduler] Notifiche programmate attive.");
}
