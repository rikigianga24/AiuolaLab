// Pagina /prezzi: piani Gratis e Premium a confronto e abbonamento con Paddle.
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { billingApi } from "../lib/api";
import { closeCheckout, openCheckout } from "../lib/paddle";
import { PLANS, PRICES, formatEuro, quotaLabel, yearlySaving } from "../lib/plans";
import { useSession } from "../lib/session";
import { PageHero } from "./decor";
import "../styles/pages.css";
import "../styles/pricing.css";

// Confronto dei piani. `true` = incluso; un testo = incluso con quel limite.
const ROWS = [
  { group: "Progettare" },
  { label: "Disegno in scala di aiuole, balconi e orti", free: true, premium: true },
  { label: "Catalogo di quasi 1000 piante con schede di cura", free: true, premium: true },
  { label: "Stili di giardino con piante abbinate", free: true, premium: true },
  { label: "Impianto a goccia e stima dei costi", free: true, premium: true },
  { label: "Progetti salvati online e condivisione con un link", free: true, premium: true },
  { group: "Curare" },
  { label: "Calendario delle cure per la tua zona", free: true, premium: true },
  { label: "Promemoria e avvisi meteo sul telefono e via email", free: true, premium: true },
  { group: "Consigli e previsioni" },
  { label: "Consulente IA che propone le piante per un'aiuola", free: quotaLabel(PLANS.free.ai), premium: quotaLabel(PLANS.premium.ai) },
  { label: "Voti estetici del progetto (colori, fioriture, altezze)", free: true, premium: true },
  { label: "Previsione di crescita a 1, 3 e 5 anni", free: false, premium: true },
  { label: "Problemi futuri: sovraffollamento, radici e ombra", free: false, premium: true },
  { label: "Suggerimenti migliorativi e rischi di manutenzione", free: false, premium: true },
  { label: "Sostieni un progetto indipendente", free: false, premium: true },
];

function Cell({ value }) {
  if (value === true) return <i className="fa-solid fa-check pr-yes" aria-label="Incluso" />;
  if (!value) return <i className="fa-solid fa-minus pr-no" aria-label="Non incluso" />;
  return <span className="pr-text">{value}</span>;
}

const dateLabel = (iso) => new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });

const FAQ = [
  {
    q: "Come si disdice?",
    a: (
      <>
        Quando vuoi, dalla pagina <Link to="/account">Account</Link> con «Disdici il rinnovo». Premium resta attivo fino alla fine del periodo già pagato,
        poi torni al piano Gratis. Non ci sono penali né costi nascosti.
      </>
    ),
  },
  {
    q: "E se ci ripenso subito?",
    a: (
      <>
        Entro 14 giorni dall'inizio dell'abbonamento puoi recedere dalla pagina Account con «Recedi e chiedi il rimborso»: l'abbonamento termina subito
        e ti rimborsiamo tutto, senza dover spiegare il motivo.
      </>
    ),
  },
  {
    q: "Chi gestisce il pagamento?",
    a: (
      <>
        Paddle, una società specializzata nei pagamenti online, che vende l'abbonamento come rivenditore autorizzato: incassa, applica l'IVA e ti manda la
        ricevuta. Puoi pagare con carta di credito o di debito e con gli altri metodi proposti nel modulo di pagamento (per esempio PayPal). I dati della carta li vede solo Paddle, mai AiuolaLab.
      </>
    ),
  },
  {
    q: "Si rinnova da solo?",
    a: (
      <>
        Sì, ogni mese o ogni anno secondo il piano scelto, allo stesso prezzo. Se un giorno il prezzo dovesse cambiare ti avviseremo via email almeno 30
        giorni prima, e potrai disdire prima che si applichi.
      </>
    ),
  },
  {
    q: "Cosa succede ai miei progetti se torno al piano Gratis?",
    a: <>Niente: progetti, calendario e impostazioni restano tutti. Tornano solo i limiti del piano Gratis per il consulente IA e la previsione di crescita.</>,
  },
];

// Pulsante e stato dell'abbonamento nella scheda Premium.
function PremiumAction({ interval }) {
  const { user, loading, features, refresh } = useSession();
  const [billing, setBilling] = useState(null);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const polling = useRef(null);

  useEffect(() => {
    if (!user) return;
    billingApi
      .get()
      .then(setBilling)
      .catch(() => {});
  }, [user]);
  useEffect(() => () => clearTimeout(polling.current), []);

  // dopo il pagamento Paddle avvisa il server: si aspetta che Premium risulti attivo
  const waitForPremium = (tries = 0) => {
    billingApi
      .get()
      .then((b) => {
        if (b.plan === "premium") {
          setBilling(b);
          setMsg({ kind: "success", text: "Benvenuto in Premium! 🌿 È già tutto attivo: ricevuta e conferma arrivano via email da Paddle." });
          setBusy(false);
          refresh();
        } else if (tries < 20) {
          polling.current = setTimeout(() => waitForPremium(tries + 1), 2000);
        } else {
          setMsg({ kind: "info", text: "Pagamento ricevuto. L'attivazione sta richiedendo qualche minuto: ricarica la pagina tra poco." });
          setBusy(false);
        }
      })
      .catch(() => {
        if (tries < 20) polling.current = setTimeout(() => waitForPremium(tries + 1), 3000);
      });
  };

  const subscribe = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const { transactionId, email } = await billingApi.checkout(interval);
      await openCheckout(features.billing, {
        transactionId,
        email,
        onCompleted: () => {
          setMsg({ kind: "info", text: "Pagamento riuscito, sto attivando Premium…" });
          setTimeout(closeCheckout, 2500);
          waitForPremium();
        },
        onClosed: () => setBusy(false),
      });
    } catch (err) {
      setMsg({ kind: "danger", text: err.message });
      setBusy(false);
    }
  };

  if (loading) return <p className="panel-note">Caricamento…</p>;
  if (!features.billing) {
    return (
      <>
        <button className="btn-country is-primary pr-cta" disabled>
          Presto disponibile
        </button>
        <p className="panel-note">Gli abbonamenti non sono ancora attivi: torna a trovarci tra poco.</p>
      </>
    );
  }
  if (!user) {
    return (
      <>
        <Link className="btn-country is-primary pr-cta" to="/registrati" state={{ from: "/prezzi" }}>
          Crea un account e abbonati
        </Link>
        <p className="panel-note">
          Hai già un account?{" "}
          <Link to="/accedi" state={{ from: "/prezzi" }}>
            Accedi
          </Link>
          . Premium è legato al tuo account, così vale su ogni dispositivo.
        </p>
      </>
    );
  }
  if (user.plan === "premium" || billing?.plan === "premium") {
    const sub = billing?.subscription;
    return (
      <>
        <p className="pr-active">
          <i className="fa-solid fa-circle-check" /> {sub?.active ? "Sei già Premium" : "Il tuo account è già Premium"}
        </p>
        {sub?.active && (
          <p className="panel-note">
            {sub.cancelAt ? `Attivo fino al ${dateLabel(sub.cancelAt)}.` : sub.currentPeriodEnd ? `Prossimo rinnovo il ${dateLabel(sub.currentPeriodEnd)}.` : null}{" "}
            Gestisci l'abbonamento dalla pagina <Link to="/account">Account</Link>.
          </p>
        )}
        {msg && <div className={`notification is-${msg.kind} is-light mt-2`}>{msg.text}</div>}
      </>
    );
  }
  const price = PRICES[interval];
  return (
    <>
      <label className="checkbox consent-row pr-consent">
        <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} /> Accetto le{" "}
        <Link to="/termini#abbonamento" target="_blank">
          condizioni dell'abbonamento
        </Link>
        : si rinnova ogni {price.label} a {formatEuro(price.cents)} finché non lo disdico.
      </label>
      <button className={`btn-country is-primary pr-cta ${busy ? "is-loading" : ""}`} onClick={subscribe} disabled={!accepted || busy}>
        {busy ? "Un momento…" : `Abbonati a ${formatEuro(price.cents)} / ${price.label}`}
      </button>
      {msg && <div className={`notification is-${msg.kind} is-light mt-2`}>{msg.text}</div>}
    </>
  );
}

export default function PricingPage() {
  const [interval, setPeriod] = useState("year");
  const saving = yearlySaving();
  const perMonth = Math.round(PRICES.year.cents / 12);

  return (
    <div className="page pricing-page">
      <PageHero
        compact
        script="coltiva di più"
        title="Prezzi"
        lead="AiuolaLab è gratis per progettare e curare il tuo verde. Con Premium hai più consigli dall'IA e la previsione completa di come crescerà."
      />
      <section className="page-body">
        <div className="container">
          <div className="pr-toggle" role="radiogroup" aria-label="Durata dell'abbonamento">
            <button role="radio" aria-checked={interval === "month"} className={interval === "month" ? "is-active" : ""} onClick={() => setPeriod("month")}>
              Mensile
            </button>
            <button role="radio" aria-checked={interval === "year"} className={interval === "year" ? "is-active" : ""} onClick={() => setPeriod("year")}>
              Annuale <span className="pr-save">−{saving}%</span>
            </button>
          </div>

          <div className="pr-plans">
            <div className="card-country pr-plan">
              <h2 className="card-title">Gratis</h2>
              <p className="pr-price">
                0 € <small>per sempre</small>
              </p>
              <p className="pr-sub">Tutto per progettare e curare giardini, balconi e orti.</p>
              <ul className="pr-list">
                <li>Disegno in scala, catalogo e stili</li>
                <li>Irrigazione, costi e calendario delle cure</li>
                <li>Promemoria e avvisi meteo</li>
                <li>Consulente IA: {quotaLabel(PLANS.free.ai)}</li>
              </ul>
              <Link className="btn-country is-light pr-cta" to="/gardencanvas">
                Inizia a progettare
              </Link>
            </div>

            <div className="card-country pr-plan is-premium">
              <span className="pr-badge">Premium</span>
              <h2 className="card-title">Premium</h2>
              {interval === "month" ? (
                <p className="pr-price">
                  {formatEuro(PRICES.month.cents)} <small>al mese</small>
                </p>
              ) : (
                <p className="pr-price">
                  {formatEuro(PRICES.year.cents)} <small>all'anno</small>
                  <span className="pr-equiv">
                    cioè {formatEuro(perMonth)} al mese, risparmi il {saving}%
                  </span>
                </p>
              )}
              <p className="pr-sub">Per chi vuole un consiglio in più e sapere come sarà il giardino tra qualche anno.</p>
              <ul className="pr-list">
                <li>Tutto quello che c'è nel piano Gratis</li>
                <li>Consulente IA: {quotaLabel(PLANS.premium.ai)}</li>
                <li>Previsione di crescita completa a 1, 3 e 5 anni</li>
                <li>Problemi futuri e suggerimenti migliorativi</li>
              </ul>
              <PremiumAction interval={interval} />
            </div>
          </div>

          <p className="pr-legal">
            Prezzi IVA inclusa. Rinnovo automatico, disdici quando vuoi. Recesso entro 14 giorni con rimborso completo. Pagamento gestito da Paddle.com,
            rivenditore autorizzato e venditore dell'abbonamento. Condizioni complete nei <Link to="/termini#abbonamento">Termini</Link>.
          </p>

          <h2 className="pr-title">Cosa cambia tra i piani</h2>
          <div className="table-container card-country pr-table-wrap">
            <table className="table is-fullwidth pr-table">
              <thead>
                <tr>
                  <th scope="col">
                    <span className="is-sr-only">Funzione</span>
                  </th>
                  <th scope="col">Gratis</th>
                  <th scope="col">Premium</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) =>
                  r.group ? (
                    <tr key={r.group} className="pr-group">
                      <th colSpan={3} scope="colgroup">
                        {r.group}
                      </th>
                    </tr>
                  ) : (
                    <tr key={r.label}>
                      <th scope="row">{r.label}</th>
                      <td>
                        <Cell value={r.free} />
                      </td>
                      <td>
                        <Cell value={r.premium} />
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>

          <h2 className="pr-title">Domande frequenti</h2>
          <div className="pr-faq">
            {FAQ.map((f) => (
              <details key={f.q} className="contact-faq">
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
