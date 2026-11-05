import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { accountApi, authApi } from "../lib/api";
import { CLIMATES } from "../lib/irrigation";
import { currentSubscription, disablePush, enablePush, pushSupported } from "../lib/push";
import { useSession } from "../lib/session";
import LocationPicker from "./LocationPicker";

function Notice({ kind = "info", children }) {
  return <div className={`notification is-${kind} is-light`}>{children}</div>;
}

function AuthForms() {
  const { login, register, features } = useSession();
  const [params] = useSearchParams();
  const resetToken = params.get("reset");
  const [mode, setMode] = useState(resetToken ? "reset" : "login");
  const [form, setForm] = useState({ email: "", password: "", privacy: false, marketing: false });
  const [status, setStatus] = useState({ busy: false, error: null, info: null });
  const navigate = useNavigate();
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setStatus({ busy: true, error: null, info: null });
    try {
      if (mode === "login") {
        await login(form.email, form.password);
        navigate("/calendario");
      } else if (mode === "register") {
        await register({ email: form.email, password: form.password, privacy: form.privacy, marketing: form.marketing });
        setStatus({ busy: false, error: null, info: features.mail ? "Account creato! Ti abbiamo inviato un'email per confermare l'indirizzo." : "Account creato!" });
        return;
      } else if (mode === "forgot") {
        await authApi.forgot(form.email);
        setStatus({ busy: false, error: null, info: "Se l'indirizzo è registrato riceverai un'email con il link (valido 2 ore)." });
        return;
      } else if (mode === "reset") {
        await authApi.reset(resetToken, form.password);
        window.location.replace("/account");
        return;
      }
      setStatus({ busy: false, error: null, info: null });
    } catch (err) {
      setStatus({ busy: false, error: err.message, info: null });
    }
  };

  if (!features.accounts) {
    return (
      <Notice kind="warning">
        Gli account non sono attivi: il server non ha un database. Puoi comunque usare l'app, i progetti restano in questo browser.
      </Notice>
    );
  }

  return (
    <div className="box auth-box">
      {mode !== "reset" && (
        <div className="tabs is-centered is-fullwidth">
          <ul>
            <li className={mode === "login" ? "is-active" : ""}>
              <a onClick={() => setMode("login")}>Accedi</a>
            </li>
            <li className={mode === "register" ? "is-active" : ""}>
              <a onClick={() => setMode("register")}>Registrati</a>
            </li>
          </ul>
        </div>
      )}
      <form onSubmit={submit}>
        {mode !== "reset" && (
          <div className="field">
            <label className="label" htmlFor="email">Email</label>
            <input id="email" className="input" type="email" autoComplete="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
        )}
        {mode !== "forgot" && (
          <div className="field">
            <label className="label" htmlFor="password">{mode === "reset" ? "Nuova password" : "Password"}</label>
            <input
              id="password"
              className="input"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={mode === "login" ? undefined : 10}
              required
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
            />
            {mode !== "login" && <p className="help">Almeno 10 caratteri.</p>}
          </div>
        )}
        {mode === "register" && (
          <>
            <label className="checkbox consent-row">
              <input type="checkbox" required checked={form.privacy} onChange={(e) => set("privacy", e.target.checked)} /> Ho letto l'
              <Link to="/privacy" target="_blank">informativa privacy</Link> e ho almeno 14 anni (obbligatorio)
            </label>
            <label className="checkbox consent-row">
              <input type="checkbox" checked={form.marketing} onChange={(e) => set("marketing", e.target.checked)} /> Voglio ricevere
              offerte e novità su prodotti per il giardino (facoltativo, revocabile)
            </label>
          </>
        )}
        {status.error && <Notice kind="danger">{status.error}</Notice>}
        {status.info && <Notice kind="success">{status.info}</Notice>}
        <button className={`button is-primary is-fullwidth mt-3 ${status.busy ? "is-loading" : ""}`} type="submit">
          {{ login: "Accedi", register: "Crea account", forgot: "Invia il link", reset: "Salva la nuova password" }[mode]}
        </button>
      </form>
      {mode === "login" && features.mail && (
        <p className="has-text-centered mt-3">
          <a onClick={() => setMode("forgot")}>Password dimenticata?</a>
        </p>
      )}
      {mode === "forgot" && (
        <p className="has-text-centered mt-3">
          <a onClick={() => setMode("login")}>Torna all'accesso</a>
        </p>
      )}
    </div>
  );
}

function PushToggle() {
  const { features, settings, updateSettings } = useSession();
  const [active, setActive] = useState(false);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    currentSubscription().then((s) => setActive(Boolean(s)));
  }, []);

  if (!features.push) return <p className="panel-note">Notifiche push non configurate sul server.</p>;
  if (!pushSupported()) return <p className="panel-note">Questo browser non supporta le notifiche push. Su iPhone aggiungi l'app alla schermata Home e aprila da lì.</p>;

  const toggle = async () => {
    setBusy(true);
    setMsg(null);
    try {
      if (active) {
        await disablePush();
        setActive(false);
        updateSettings({ notify: { push: false } });
      } else {
        await enablePush(features.vapidPublicKey);
        setActive(true);
        updateSettings({ notify: { push: true } });
      }
    } catch (err) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="push-toggle">
      <button className={`button is-small ${active ? "is-light" : "is-primary"} ${busy ? "is-loading" : ""}`} onClick={toggle}>
        <i className="fa-solid fa-bell" />
        &nbsp; {active ? "Disattiva su questo dispositivo" : "Attiva le notifiche su questo dispositivo"}
      </button>
      {active && settings.notify.push && (
        <button className="button is-small is-light" onClick={() => accountApi.testNotification(false).then((r) => setMsg(r.pushes ? "Notifica di prova inviata." : "Nessun dispositivo raggiunto."))}>
          Prova
        </button>
      )}
      {msg && <p className="panel-note">{msg}</p>}
    </div>
  );
}

function AccountSettings() {
  const { user, settings, updateSettings, logout, refresh, features } = useSession();
  const [marketing, setMarketing] = useState(user.marketingConsent);
  const [deleting, setDeleting] = useState(false);
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState(null);
  const n = settings.notify;

  const remove = async () => {
    try {
      await accountApi.remove(password);
      window.location.replace("/");
    } catch (err) {
      setMsg({ kind: "danger", text: err.message });
    }
  };

  return (
    <div className="account-grid">
      <div className="box">
        <h2 className="title is-5">Il tuo account</h2>
        <p>
          <strong>{user.email}</strong>{" "}
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

      <div className="box">
        <h2 className="title is-5">Notifiche</h2>
        <PushToggle />
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

      <div className="box">
        <h2 className="title is-5">Zona e meteo</h2>
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
      </div>

      <div className="box">
        <h2 className="title is-5">Privacy e dati</h2>
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
            <p>Verranno cancellati definitivamente l'account e tutti i progetti salvati online. Inserisci la password per confermare.</p>
            <input className="input is-small" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
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

  return (
    <section className="section account-page">
      <div className="container">
        <h1 className="title is-3">{user ? "Account" : "Accedi ad AiuolaLab"}</h1>
        {!user && <p className="subtitle is-6">Con l'account i progetti sono salvati online e ricevi promemoria e avvisi meteo.</p>}
        {verifyMsg && <Notice kind={verifyMsg.kind}>{verifyMsg.text}</Notice>}
        {loading ? <p>Caricamento…</p> : user ? <AccountSettings /> : <AuthForms />}
      </div>
    </section>
  );
}
