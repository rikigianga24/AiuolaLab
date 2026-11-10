import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useSearchParams } from "react-router-dom";
import { accountApi, authApi } from "../lib/api";
import { CLIMATES } from "../lib/irrigation";
import { currentSubscription, disablePush, enablePush, pushSupported } from "../lib/push";
import { useSession } from "../lib/session";
import LocationPicker from "./LocationPicker";
import { PETS } from "../lib/plantInfo";
import { PageHero } from "./decor";
import StylePicker from "./StylePicker";
import "../styles/pages.css";

function Notice({ kind = "info", children }) {
  return <div className={`notification is-${kind} is-light`}>{children}</div>;
}

// iPhone/iPad: le notifiche arrivano solo se l'app è aggiunta alla schermata Home
const isIOS = () => typeof navigator !== "undefined" && (/iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
const isStandalone = () =>
  typeof window !== "undefined" && (window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true);

function IosGuide() {
  return (
    <div className="push-guide">
      <p>
        <strong>Su iPhone le notifiche arrivano solo dall'app sulla schermata Home.</strong> Bastano tre tocchi:
      </p>
      <ol>
        <li>
          Tocca <i className="fa-solid fa-arrow-up-from-bracket" /> <strong>Condividi</strong> nella barra di Safari
        </li>
        <li>
          Scegli <strong>Aggiungi alla schermata Home</strong> <i className="fa-regular fa-square-plus" />
        </li>
        <li>Apri AiuolaLab dall'icona nuova, entra nell'account e torna qui</li>
      </ol>
    </div>
  );
}

function PushSetup() {
  const { features, settings, updateSettings } = useSession();
  const [active, setActive] = useState(false);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const n = settings.notify;

  useEffect(() => {
    currentSubscription().then((s) => setActive(Boolean(s)));
  }, []);

  if (!features.push) return <p className="panel-note">Notifiche sul telefono non ancora attive sul server.</p>;
  if (isIOS() && !isStandalone()) return <IosGuide />;
  if (!pushSupported()) return <p className="panel-note">Questo browser non supporta le notifiche. Prova con Chrome, Edge, Firefox o Safari aggiornati.</p>;
  if (typeof Notification !== "undefined" && Notification.permission === "denied") {
    return (
      <div className="push-guide">
        <p>
          <strong>Le notifiche sono bloccate per questo sito.</strong>
        </p>
        <p>
          Sbloccale dalle impostazioni: su Android tieni premuta l'icona di AiuolaLab → <em>Info app</em> → <em>Notifiche</em>; sul computer tocca il lucchetto
          accanto all'indirizzo → <em>Notifiche</em> → <em>Consenti</em>. Poi ricarica la pagina.
        </p>
      </div>
    );
  }

  const run = async (fn) => {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
    } catch (err) {
      setMsg({ kind: "danger", text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const toggle = () =>
    run(async () => {
      if (active) {
        await disablePush();
        setActive(false);
        updateSettings({ notify: { push: false } });
      } else {
        await enablePush(features.vapidPublicKey);
        setActive(true);
        updateSettings({ notify: { push: true } });
        setMsg({ kind: "success", text: "Fatto! Ti scriveremo al massimo una volta al giorno, solo quando serve 🌱" });
      }
    });

  const test = () =>
    run(async () => {
      const r = await accountApi.testNotification(false);
      setMsg(
        r.pushes
          ? { kind: "success", text: "Inviata! Dovrebbe arrivare tra pochi secondi." }
          : { kind: "warning", text: "Nessun dispositivo raggiunto: disattiva e riattiva le notifiche qui sopra." },
      );
    });

  const on = active && n.push;
  return (
    <div className="push-setup">
      <div className="buttons">
        <button className={`button is-small ${active ? "is-light" : "is-primary"} ${busy ? "is-loading" : ""}`} onClick={toggle} disabled={busy}>
          <i className={`fa-solid ${active ? "fa-bell-slash" : "fa-bell"}`} />
          &nbsp; {active ? "Disattiva su questo dispositivo" : "Attiva le notifiche su questo dispositivo"}
        </button>
        {on && (
          <button className="button is-small is-light" onClick={test} disabled={busy}>
            <i className="fa-solid fa-paper-plane" />
            &nbsp; Mandami una notifica di prova
          </button>
        )}
      </div>
      {on && (
        <div className="push-kinds">
          <label className="checkbox consent-row">
            <input type="checkbox" checked={n.pushTasks !== false} onChange={(e) => updateSettings({ notify: { pushTasks: e.target.checked } })} /> 🌹 Promemoria dei
            lavori (potature, concimi, semine…) con i pulsanti <em>Fatto</em> e <em>Tra una settimana</em>
          </label>
          <label className="checkbox consent-row">
            <input type="checkbox" checked={n.pushWeather !== false} onChange={(e) => updateSettings({ notify: { pushWeather: e.target.checked } })} /> ❄️ Avvisi
            meteo importanti (gelo, caldo intenso, nubifragi)
          </label>
          <label className="checkbox consent-row">
            <input type="checkbox" checked={n.pushStreak !== false} onChange={(e) => updateSettings({ notify: { pushStreak: e.target.checked } })} /> 🔥 La tua
            serie: il lunedì, quante settimane di fila hai curato il giardino
          </label>
        </div>
      )}
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
    </div>
  );
}

export function PetsChooser() {
  const { settings, updateSettings } = useSession();
  const pets = settings.pets ?? [];
  const toggle = (k) => updateSettings({ pets: pets.includes(k) ? pets.filter((p) => p !== k) : [...pets, k] });
  return (
    <div className="mt-4">
      <span className="gp-label">In giardino ci sono anche</span>
      <div className="choice-row">
        {Object.entries(PETS).map(([k, v]) => (
          <button key={k} type="button" className={`choice ${pets.includes(k) ? "is-active" : ""}`} onClick={() => toggle(k)} aria-pressed={pets.includes(k)}>
            {v}
          </button>
        ))}
      </div>
      <p className="panel-note">Le piante pericolose per loro vengono evidenziate e l'IA le evita.</p>
    </div>
  );
}

function AccountSettings() {
  const { user, settings, updateSettings, logout, refresh, features } = useSession();
  const [marketing, setMarketing] = useState(user.marketingConsent);
  const [deleting, setDeleting] = useState(false);
  const [password, setPassword] = useState("");
  const noPassword = !user.hasPassword;
  const [msg, setMsg] = useState(null);
  const n = settings.notify;

  const remove = async () => {
    try {
      await accountApi.remove(noPassword ? undefined : password, noPassword ? password : undefined);
      window.location.replace("/");
    } catch (err) {
      setMsg({ kind: "danger", text: err.message });
    }
  };

  return (
    <div className="account-grid">
      <div className="card-country">
        <h2 className="card-title">Il tuo account</h2>
        <p>
          <strong>{user.email}</strong>{" "}
          {user.google && (
            <span className="tag is-info is-light">
              <i className="fa-brands fa-google" />&nbsp;Google
            </span>
          )}{" "}
          {user.emailVerified ? (
            <span className="tag is-success is-light">verificata</span>
          ) : (
            <span className="tag is-warning is-light">da confermare</span>
          )}
        </p>
        {!user.emailVerified && features.mail && (
          <p className="mt-2">
            Senza conferma non possiamo inviarti email.{" "}
            <a onClick={() => authApi.resendVerification().then(() => setMsg({ kind: "success", text: "Email di conferma inviata." }))}>Invia di nuovo</a>
          </p>
        )}
        <div className="buttons mt-4">
          <Link className="button is-small is-primary" to="/calendario">
            <i className="fa-solid fa-calendar-days" />&nbsp; Il mio calendario
          </Link>
          <button className="button is-small" onClick={() => logout().then(refresh)}>
            Esci
          </button>
        </div>
      </div>

      <div className="card-country">
        <h2 className="card-title">Notifiche</h2>
        <p className="panel-note">Sul telefono, come le app che usi ogni giorno: al massimo una al giorno, all'ora che scegli tu.</p>
        <PushSetup />
        <div className="mt-3">
          <label className="checkbox consent-row">
            <input type="checkbox" checked={n.emailWeekly} disabled={!features.mail} onChange={(e) => updateSettings({ notify: { emailWeekly: e.target.checked } })} /> Riepilogo via
            email ogni lunedì con le cose da fare
          </label>
          <label className="checkbox consent-row">
            <input type="checkbox" checked={n.emailWeather} disabled={!features.mail} onChange={(e) => updateSettings({ notify: { emailWeather: e.target.checked } })} /> Email per avvisi
            meteo importanti (gelo, caldo intenso, nubifragi)
          </label>
          {!features.mail && <p className="panel-note">Email non configurate sul server.</p>}
          <label className="mini-select mt-2" style={{ maxWidth: 220 }}>
            <span>Ora delle notifiche</span>
            <select value={n.hour} onChange={(e) => updateSettings({ notify: { hour: Number(e.target.value) } })}>
              {Array.from({ length: 17 }, (_, i) => i + 5).map((h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="card-country">
        <h2 className="card-title">Zona e meteo</h2>
        <label className="mini-select" style={{ maxWidth: 260 }}>
          <span>Zona climatica (sposta le date del calendario)</span>
          <select value={settings.climate} onChange={(e) => updateSettings({ climate: e.target.value })}>
            {Object.entries(CLIMATES).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-3">
          <LocationPicker value={settings.location} onChange={(location) => updateSettings({ location })} />
        </div>
        <PetsChooser />
      </div>

      <div className="card-country">
        <h2 className="card-title">Stile del disegno</h2>
        <p className="panel-note">Come vengono disegnate piante, prato e bordure nei tuoi progetti.</p>
        <StylePicker />
      </div>

      <div className="card-country">
        <h2 className="card-title">Privacy e dati</h2>
        <label className="checkbox consent-row">
          <input
            type="checkbox"
            checked={marketing}
            onChange={(e) => {
              setMarketing(e.target.checked);
              accountApi.setMarketing(e.target.checked);
            }}
          />{" "}
          Ricevere offerte e novità (facoltativo)
        </label>
        <div className="buttons mt-3">
          <a className="button is-small" href="/api/account/export" download>
            <i className="fa-solid fa-download" />&nbsp; Scarica i miei dati
          </a>
          <Link className="button is-small is-light" to="/privacy">
            Informativa privacy
          </Link>
        </div>
        {!deleting ? (
          <button className="button is-small is-danger is-light mt-2" onClick={() => setDeleting(true)}>
            Cancella account
          </button>
        ) : (
          <div className="delete-box mt-2">
            <p>
              Verranno cancellati definitivamente l'account e tutti i progetti salvati online.{" "}
              {noPassword ? "Scrivi ELIMINA per confermare." : "Inserisci la password per confermare."}
            </p>
            <input
              className="input is-small"
              type={noPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={noPassword ? "off" : "current-password"}
              placeholder={noPassword ? "ELIMINA" : undefined}
            />
            <div className="buttons mt-2">
              <button className="button is-small" onClick={() => setDeleting(false)}>
                Annulla
              </button>
              <button className="button is-small is-danger" onClick={remove} disabled={!password}>
                Cancella definitivamente
              </button>
            </div>
          </div>
        )}
        {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      </div>
    </div>
  );
}

export default function AccountPage() {
  const { user, loading, refresh } = useSession();
  const [params, setParams] = useSearchParams();
  const { search, state } = useLocation();
  const [verifyMsg, setVerifyMsg] = useState(null);
  const verifyToken = params.get("verifica");

  useEffect(() => {
    if (!verifyToken) return;
    authApi
      .verify(verifyToken)
      .then(() => {
        setVerifyMsg({ kind: "success", text: "Email confermata, grazie!" });
        refresh();
      })
      .catch((err) => setVerifyMsg({ kind: "danger", text: err.message }))
      .finally(() => setParams({}, { replace: true }));
  }, [verifyToken, refresh, setParams]);

  // senza account si va alla pagina di accesso (anche per il link di reset)
  if (!loading && !user && !verifyToken && !verifyMsg) return <Navigate to={`/accedi${search}`} replace state={{ from: "/account" }} />;

  const welcome = state?.welcome ?? (params.get("benvenuto") ? "ok" : null);
  return (
    <div className="page account-page">
      <PageHero compact script={user ? "il tuo angolo verde" : "account"} title={user ? "Il tuo account" : "Account"} lead={user ? "Notifiche, zona, animali di casa e privacy: tutto in un posto." : null} />
      <section className="page-body">
        <div className="container">
          {welcome && (
            <Notice kind="success">
              Account creato, benvenuto! {welcome === "mail" && "Ti abbiamo inviato un'email per confermare l'indirizzo."}
            </Notice>
          )}
          {verifyMsg && <Notice kind={verifyMsg.kind}>{verifyMsg.text}</Notice>}
          {loading ? (
            <p>Caricamento…</p>
          ) : user ? (
            <AccountSettings />
          ) : (
            <Link to="/accedi" className="btn-country is-primary">
              Accedi
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
