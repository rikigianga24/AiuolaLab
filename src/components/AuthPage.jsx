import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "../lib/api";
import { getIconUrl } from "../lib/plantIcons";
import { useSession } from "../lib/session";
import "../styles/pages.css";

const BENEFITS = [
  { icon: "fa-cloud-arrow-up", title: "Progetti al sicuro", text: "Aiuole, balconi e orti salvati online, su telefono e computer." },
  { icon: "fa-bell", title: "Promemoria", text: "Potature, concimi e semine via notifica o email, al momento giusto." },
  { icon: "fa-cloud-sun-rain", title: "Avvisi meteo", text: "Gelo, caldo e nubifragi in arrivo dove si trova il tuo giardino." },
  { icon: "fa-paw", title: "Piante sicure", text: "Indica i tuoi animali: ti segnaliamo le piante pericolose." },
];

const TEXTS = {
  login: { script: "bentornato!", title: "Accedi al tuo giardino", button: "Accedi" },
  register: { script: "benvenuto!", title: "Crea il tuo account", button: "Crea account" },
  forgot: { script: "succede a tutti", title: "Password dimenticata", button: "Invia il link" },
  reset: { script: "quasi fatto", title: "Scegli una nuova password", button: "Salva la nuova password" },
};

function Notice({ kind = "info", children }) {
  return <div className={`notification is-${kind} is-light`}>{children}</div>;
}

function AuthForm({ initialMode }) {
  const { login, register, features } = useSession();
  const [params] = useSearchParams();
  const resetToken = params.get("reset");
  const [mode, setMode] = useState(resetToken ? "reset" : initialMode);
  const [form, setForm] = useState({ email: "", password: "", privacy: false, marketing: false });
  const [showPw, setShowPw] = useState(false);
  const [status, setStatus] = useState({ busy: false, error: null, info: null });
  const navigate = useNavigate();
  const location = useLocation();
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const t = TEXTS[mode];

  const submit = async (e) => {
    e.preventDefault();
    setStatus({ busy: true, error: null, info: null });
    try {
      if (mode === "login") {
        await login(form.email, form.password);
        navigate(location.state?.from ?? "/calendario");
        return;
      }
      if (mode === "register") {
        await register({ email: form.email, password: form.password, privacy: form.privacy, marketing: form.marketing });
        navigate("/account", { state: { welcome: features.mail ? "mail" : "ok" } });
        return;
      }
      if (mode === "forgot") {
        await authApi.forgot(form.email);
        setStatus({ busy: false, error: null, info: "Se l'indirizzo è registrato riceverai un'email con il link (valido 2 ore)." });
        return;
      }
      await authApi.reset(resetToken, form.password);
      window.location.replace("/account");
    } catch (err) {
      setStatus({ busy: false, error: err.message, info: null });
    }
  };

  return (
    <div className="card-country auth-card">
      {(mode === "login" || mode === "register") && (
        <div className="auth-switch" role="tablist">
          <Link to="/accedi" replace role="tab" aria-selected={mode === "login"} className={mode === "login" ? "is-active" : ""}>
            Accedi
          </Link>
          <Link to="/registrati" replace role="tab" aria-selected={mode === "register"} className={mode === "register" ? "is-active" : ""}>
            Registrati
          </Link>
        </div>
      )}
      <p className="script">{t.script}</p>
      <h1 className="auth-title">{t.title}</h1>
      {mode === "register" && <p className="auth-lead">Gratis, bastano un'email e una password.</p>}
      {mode === "forgot" && <p className="auth-lead">Inserisci la tua email: ti mandiamo un link per sceglierne una nuova.</p>}

      {!features.accounts ? (
        <Notice kind="warning">
          Gli account non sono ancora attivi su questo server. Puoi comunque usare l'app: i progetti restano salvati in questo browser.
        </Notice>
      ) : (
        <form onSubmit={submit}>
          {mode !== "reset" && (
            <div className="field">
              <label className="label" htmlFor="email">
                Email
              </label>
              <div className="control has-icons-left">
                <input
                  id="email"
                  className="input"
                  type="email"
                  autoComplete="email"
                  placeholder="nome@esempio.it"
                  required
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
                <span className="icon is-left">
                  <i className="fa-solid fa-envelope" />
                </span>
              </div>
            </div>
          )}
          {mode !== "forgot" && (
            <div className="field">
              <label className="label" htmlFor="password">
                {mode === "reset" ? "Nuova password" : "Password"}
              </label>
              <div className="control has-icons-left pw-control">
                <input
                  id="password"
                  className="input"
                  type={showPw ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  minLength={mode === "login" ? undefined : 10}
                  required
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                />
                <span className="icon is-left">
                  <i className="fa-solid fa-key" />
                </span>
                <button type="button" className="pw-toggle" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Nascondi password" : "Mostra password"}>
                  <i className={`fa-solid ${showPw ? "fa-eye-slash" : "fa-eye"}`} />
                </button>
              </div>
              {mode !== "login" && <p className="help">Almeno 10 caratteri.</p>}
            </div>
          )}
          {mode === "login" && features.mail && (
            <p className="auth-forgot">
              <button type="button" className="link-btn" onClick={() => setMode("forgot")}>
                Password dimenticata?
              </button>
            </p>
          )}
          {mode === "register" && (
            <div className="auth-consents">
              <label className="checkbox consent-row">
                <input type="checkbox" required checked={form.privacy} onChange={(e) => set("privacy", e.target.checked)} /> Ho letto l'
                <Link to="/privacy" target="_blank">
                  informativa privacy
                </Link>{" "}
                e ho almeno 14 anni (obbligatorio)
              </label>
              <label className="checkbox consent-row">
                <input type="checkbox" checked={form.marketing} onChange={(e) => set("marketing", e.target.checked)} /> Voglio ricevere offerte e
                novità su prodotti per il giardino (facoltativo, revocabile)
              </label>
            </div>
          )}
          {status.error && <Notice kind="danger">{status.error}</Notice>}
          {status.info && <Notice kind="success">{status.info}</Notice>}
          <button className={`btn-country is-primary auth-submit ${status.busy ? "is-busy" : ""}`} type="submit" disabled={status.busy}>
            {status.busy ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-seedling" />} {t.button}
          </button>
        </form>
      )}

      <p className="auth-foot">
        {mode === "login" && (
          <>
            Non hai un account? <Link to="/registrati">Registrati gratis</Link>
          </>
        )}
        {mode === "register" && (
          <>
            Hai già un account? <Link to="/accedi">Accedi</Link>
          </>
        )}
        {(mode === "forgot" || mode === "reset") && (
          <button type="button" className="link-btn" onClick={() => setMode("login")}>
            <i className="fa-solid fa-arrow-left" /> Torna all'accesso
          </button>
        )}
      </p>
    </div>
  );
}

export default function AuthPage({ mode }) {
  const { user, loading } = useSession();
  const { search } = useLocation();
  if (!loading && user) return <Navigate to="/account" replace />;

  return (
    <div className="page auth-page">
      <div className="auth-layout">
        <aside className="auth-aside">
          <div className="auth-aside-inner">
            <p className="script">il tuo angolo verde</p>
            <h2>Con un account il giardino ti ricorda cosa fare</h2>
            <ul className="auth-benefits">
              {BENEFITS.map((b) => (
                <li key={b.title}>
                  <span className="badge-round">
                    <i className={`fa-solid ${b.icon}`} />
                  </span>
                  <span>
                    <strong>{b.title}</strong>
                    {b.text}
                  </span>
                </li>
              ))}
            </ul>
            <p className="auth-aside-note">
              <i className="fa-solid fa-shield-halved" /> I tuoi dati restano tuoi: puoi scaricarli o cancellare l'account quando vuoi.
            </p>
          </div>
          <div className="auth-plants" aria-hidden="true">
            <img src={getIconUrl("spike", ["#9b6fc4"], 160, "Lavanda")} alt="" />
            <img src={getIconUrl("rose", ["#e88fb4"], 160, "Rosa")} alt="" />
            <img src={getIconUrl("daisy", ["#f2c94c"], 160, "Margherita")} alt="" />
          </div>
        </aside>
        <div className="auth-main">
          <AuthForm key={mode + search} initialMode={mode} />
          <p className="auth-guest">
            Vuoi solo provare? <Link to="/gardencanvas">Usa l'app senza account</Link>: i progetti restano in questo browser.
          </p>
        </div>
      </div>
    </div>
  );
}
