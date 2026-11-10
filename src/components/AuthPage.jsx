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

const GOOGLE_ERRORS = {
  google: "Accesso con Google non riuscito. Riprova.",
  "google-annullato": "Accesso con Google annullato.",
  "google-email": "Il tuo account Google non ha un'email verificata.",
  "google-off": "L'accesso con Google non è attivo su questo server.",
  "google-nuovo": "Non hai ancora un account: accetta i termini e l'informativa privacy qui sotto e continua con Google per crearlo.",
};

// Logo "G" di Google, nei colori ufficiali.
function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function GoogleButton({ mode, privacy, marketing, next }) {
  const needsConsent = mode === "register" && !privacy;
  const qs = new URLSearchParams({ next: next ?? "/calendario" });
  if (mode === "register") {
    qs.set("privacy", "1");
    if (marketing) qs.set("marketing", "1");
  }
  return (
    <>
      <a
        className={`google-btn ${needsConsent ? "is-disabled" : ""}`}
        href={needsConsent ? undefined : `/api/auth/google?${qs}`}
        aria-disabled={needsConsent}
        title={needsConsent ? "Accetta prima i termini e l'informativa privacy" : undefined}
      >
        <GoogleLogo /> {mode === "register" ? "Registrati con Google" : "Continua con Google"}
      </a>
      {needsConsent && <p className="help has-text-centered">Spunta la casella dei termini e della privacy qui sopra per registrarti con Google.</p>}
      <div className="auth-or">
        <span>oppure con email</span>
      </div>
    </>
  );
}

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
  const googleError = GOOGLE_ERRORS[params.get("errore")];
  const showGoogle = features.google && (mode === "login" || mode === "register");

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
      {mode === "register" && (
        <p className="auth-lead">{features.google ? "Gratis: con Google in un clic, oppure con email e password." : "Gratis, bastano un'email e una password."}</p>
      )}
      {mode === "forgot" && <p className="auth-lead">Inserisci la tua email: ti mandiamo un link per sceglierne una nuova.</p>}

      {!features.accounts ? (
        <Notice kind="warning">
          Gli account non sono ancora attivi su questo server. Puoi comunque usare l'app: i progetti restano salvati in questo browser.
        </Notice>
      ) : (
        <form onSubmit={submit}>
          {googleError && <Notice kind={params.get("errore") === "google-nuovo" ? "info" : "warning"}>{googleError}</Notice>}
          {showGoogle && mode === "login" && <GoogleButton mode="login" next={location.state?.from} />}
          {mode === "register" && (
            <div className="auth-consents">
              <label className="checkbox consent-row">
                <input type="checkbox" required checked={form.privacy} onChange={(e) => set("privacy", e.target.checked)} /> Accetto i{" "}
                <Link to="/termini" target="_blank">
                  termini di utilizzo
                </Link>
                , ho letto l'
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
          {showGoogle && mode === "register" && (
            <GoogleButton mode="register" privacy={form.privacy} marketing={form.marketing} />
          )}
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
