import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { weatherApi } from "../lib/api";
import { TASK_KINDS, addDaysISO, generateTasks, taskStatus, todayISO } from "../lib/care";
import { CLIMATES } from "../lib/irrigation";
import { loadCurrent } from "../lib/projects";
import { useSession } from "../lib/session";
import { symbolInfo } from "../lib/weather";
import LocationPicker from "./LocationPicker";
import "../styles/calendar.css";

const ENVS = { all: "Tutto", garden: "Giardino", balcony: "Balcone", vegetable: "Orto" };
const VIEWS = { now: "Da fare ora", next: "Prossime settimane", year: "Tutto l'anno" };
const MONTHS = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

const fmt = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString("it-IT", { day: "numeric", month: "short" });

function Weather({ location, context }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const key = location ? `${location.lat},${location.lon},${JSON.stringify(context)}` : null;

  useEffect(() => {
    if (!key) return;
    let alive = true;
    weatherApi
      .forecast(location, context)
      .then((d) => alive && (setData(d), setError(null)))
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (error) return <p className="panel-error">Meteo non disponibile: {error}</p>;
  if (!data) return <p className="panel-note">Caricamento del meteo…</p>;
  return (
    <>
      <div className="forecast-row">
        {data.days.slice(0, 7).map((d) => {
          const s = symbolInfo(d.symbol ?? "");
          return (
            <div key={d.date} className="forecast-day" title={s.label}>
              <span className="fd-name">{new Date(`${d.date}T12:00:00`).toLocaleDateString("it-IT", { weekday: "short" })}</span>
              <i className={`fa-solid ${s.icon}`} />
              <span className="fd-temp">
                <strong>{Math.round(d.tMax)}°</strong> {Math.round(d.tMin)}°
              </span>
              <span className="fd-rain">{d.rain >= 0.5 ? `${Math.round(d.rain)} mm` : " "}</span>
            </div>
          );
        })}
      </div>
      {data.alerts.length > 0 ? (
        <ul className="alert-list">
          {data.alerts.map((a) => (
            <li key={a.id} className={`alert-item sev-${a.severity}`}>
              <strong>{a.title}</strong>
              <span>{a.detail}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="panel-note">Nessun avviso per le tue piante nei prossimi giorni.</p>
      )}
      <p className="attribution">{data.attribution}</p>
    </>
  );
}

function TaskCard({ task, status, onDone, onSnooze, onUndo }) {
  const kind = TASK_KINDS[task.kind] ?? TASK_KINDS.cura;
  const [open, setOpen] = useState(false);
  return (
    <li className={`task-card status-${status}`}>
      <span className="task-icon" style={{ background: kind.color }}>
        <i className={`fa-solid ${kind.icon}`} />
      </span>
      <div className="task-body">
        <button className="task-title" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {task.title}
        </button>
        <span className="task-meta">
          {task.where}
          {task.plants?.length > 0 && ` · ${task.plants.join(", ")}`}
        </span>
        <span className="task-dates">
          {status === "now" ? `entro il ${fmt(task.end)}` : `dal ${fmt(task.start)} al ${fmt(task.end)}`}
        </span>
        {open && (
          <div className="task-detail">
            <p>{task.detail}</p>
            {task.product && (
              <p className="task-product">
                <i className="fa-solid fa-bag-shopping" /> Ti serve: {task.product}
              </p>
            )}
          </div>
        )}
      </div>
      <div className="task-actions">
        {status === "done" || status === "snoozed" ? (
          <button className="button is-small is-light" onClick={onUndo}>
            Annulla
          </button>
        ) : (
          <>
            <button className="button is-small is-success is-light" onClick={onDone} title="Fatto">
              <i className="fa-solid fa-check" />
            </button>
            <button className="button is-small is-light" onClick={onSnooze} title="Rimanda di una settimana">
              <i className="fa-solid fa-clock-rotate-left" />
            </button>
          </>
        )}
      </div>
    </li>
  );
}

export default function CalendarPage() {
  const { user, features, settings, updateSettings } = useSession();
  const [view, setView] = useState("now");
  const [env, setEnv] = useState("all");
  const today = todayISO();
  const year = Number(today.slice(0, 4));

  const projects = useMemo(() => ["garden", "balcony", "vegetable"].map((t) => loadCurrent(t)), []);
  const tasks = useMemo(
    () => generateTasks(projects, { climate: settings.climate, years: [year, year + 1] }),
    [projects, settings.climate, year],
  );
  const context = useMemo(
    () => ({
      pots: projects.some((p) => p.beds.some((b) => b.kind === "pot")),
      vegetable: projects.some((p) => p.type === "vegetable" && p.beds.length),
      irrigation: projects.some((p) => p.faucet),
    }),
    [projects],
  );

  const state = settings.taskState ?? {};
  const setState = (id, value) => updateSettings({ taskState: { [id]: value } });

  const visible = tasks
    .filter((t) => env === "all" || t.env === env)
    .map((t) => ({ task: t, status: taskStatus(t, state, today) }))
    .filter(({ task, status }) => {
      if (view === "now") return status === "now" || (status === "done" && state[task.id]?.done === today);
      if (view === "next") return status === "upcoming" && task.start <= addDaysISO(today, 60);
      return task.start.slice(0, 4) === String(year);
    });

  const upcoming = tasks
    .filter((t) => env === "all" || t.env === env)
    .map((t) => ({ task: t, status: taskStatus(t, state, today) }))
    .filter(({ status }) => status === "upcoming")
    .slice(0, 5);

  const byMonth = view === "year" ? MONTHS.map((m, i) => [m, visible.filter((v) => Number(v.task.start.slice(5, 7)) === i + 1)]) : null;
  const hasPlants = projects.some((p) => p.beds.some((b) => b.plants?.length));

  const card = ({ task, status }) => (
    <TaskCard
      key={task.id}
      task={task}
      status={status}
      onDone={() => setState(task.id, { done: today })}
      onSnooze={() => setState(task.id, { snoozedUntil: addDaysISO(today, 7) })}
      onUndo={() => setState(task.id, {})}
    />
  );

  return (
    <section className="section calendar-page">
      <div className="container">
        <div className="calendar-head">
          <div>
            <h1 className="title is-3">Il mio calendario</h1>
            <p className="subtitle is-6">
              Cosa fare per le piante dei tuoi progetti · {CLIMATES[settings.climate]?.label ?? "Centro Italia"}{" "}
              <select className="inline-select" value={settings.climate} onChange={(e) => updateSettings({ climate: e.target.value })} aria-label="Zona climatica">
                {Object.entries(CLIMATES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </p>
          </div>
          {!user && features.accounts && (
            <Link to="/account" className="button is-primary is-small">
              <i className="fa-solid fa-bell" />&nbsp; Ricevi i promemoria
            </Link>
          )}
          {user && (
            <Link to="/account" className="button is-small is-light">
              <i className="fa-solid fa-bell" />&nbsp; Notifiche
            </Link>
          )}
        </div>

        <div className="columns">
          <div className="column is-8">
            <div className="calendar-toolbar">
              <div className="tabs is-toggle is-small">
                <ul>
                  {Object.entries(VIEWS).map(([k, v]) => (
                    <li key={k} className={view === k ? "is-active" : ""}>
                      <a onClick={() => setView(k)}>{v}</a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="choice-row">
                {Object.entries(ENVS).map(([k, v]) => (
                  <button key={k} className={`choice ${env === k ? "is-active" : ""}`} onClick={() => setEnv(k)}>
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {!hasPlants ? (
              <div className="box empty-state">
                <i className="fa-solid fa-seedling" />
                <p>
                  Il calendario si riempie con le piante dei tuoi progetti. <Link to="/gardencanvas">Progetta un'aiuola, un balcone o un orto</Link>.
                </p>
              </div>
            ) : view === "year" ? (
              byMonth.map(([m, items]) =>
                items.length ? (
                  <div key={m} className="month-block">
                    <h2 className="month-title">{m}</h2>
                    <ul className="task-list">{items.map(card)}</ul>
                  </div>
                ) : null,
              )
            ) : visible.length ? (
              <ul className="task-list">{visible.map(card)}</ul>
            ) : view === "now" && upcoming.length ? (
              <>
                <p className="panel-note">Niente di urgente in questo periodo. Ecco le prossime attività:</p>
                <ul className="task-list">{upcoming.map(card)}</ul>
              </>
            ) : (
              <p className="panel-note">{view === "now" ? "Niente da fare in questo periodo: goditi il giardino!" : "Nessuna attività in programma."}</p>
            )}
          </div>

          <div className="column is-4">
            <div className="box weather-box">
              <h2 className="title is-6">
                <i className="fa-solid fa-cloud-sun" /> Meteo e avvisi
              </h2>
              {settings.location ? (
                <>
                  <p className="location-current">
                    <i className="fa-solid fa-location-dot" /> {settings.location.name}{" "}
                    <button className="link-btn" onClick={() => updateSettings({ location: null })}>
                      cambia
                    </button>
                  </p>
                  <Weather location={settings.location} context={context} />
                </>
              ) : (
                <>
                  <p className="panel-note">Scegli dove si trova il tuo giardino per ricevere avvisi di gelo, caldo, pioggia e vento.</p>
                  <LocationPicker value={null} onChange={(location) => updateSettings({ location })} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
