import { useState } from "react";
import { Link } from "react-router-dom";
import { CATEGORIES, setConsent, useConsent } from "../lib/consent";

export default function CookieBanner() {
  const consent = useConsent();
  const [custom, setCustom] = useState(false);
  const [external, setExternal] = useState(false);
  if (consent) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-modal="false" aria-labelledby="cookie-title">
      <div className="cookie-inner">
        <h2 id="cookie-title">Privacy e cookie</h2>
        <p>
          Usiamo solo cookie tecnici, necessari per l'accesso e per salvare i tuoi progetti. Nessun cookie di profilazione o
          pubblicità. Puoi scegliere se mostrare le foto delle piante, che arrivano da un servizio esterno. Dettagli nella{" "}
          <Link to="/cookie">cookie policy</Link> e nell'<Link to="/privacy">informativa privacy</Link>.
        </p>
        {custom && (
          <div className="cookie-choices">
            {Object.entries(CATEGORIES).map(([k, c]) => (
              <label key={k} className="cookie-choice">
                <input
                  type="checkbox"
                  checked={c.locked ? true : external}
                  disabled={c.locked}
                  onChange={(e) => setExternal(e.target.checked)}
                />
                <span>
                  <strong>{c.label}</strong>
                  <small>{c.description}</small>
                </span>
              </label>
            ))}
          </div>
        )}
        <div className="cookie-actions">
          {/* Le due scelte principali hanno lo stesso peso visivo, come chiede il Garante */}
          <button className="button is-small" onClick={() => setConsent({ external: false })}>
            Solo necessari
          </button>
          {custom ? (
            <button className="button is-small" onClick={() => setConsent({ external })}>
              Salva le scelte
            </button>
          ) : (
            <button className="button is-small is-light" onClick={() => setCustom(true)}>
              Personalizza
            </button>
          )}
          <button className="button is-small" onClick={() => setConsent({ external: true })}>
            Accetta tutto
          </button>
        </div>
      </div>
    </div>
  );
}
