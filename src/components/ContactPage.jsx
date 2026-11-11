import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { sendContact } from "../lib/api";
import { LEGAL } from "../lib/legal";
import { useSession } from "../lib/session";
import { PageHero } from "./decor";
import "../styles/pages.css";

const TOPICS = [
  ["aiuto", "Aiuto sull'uso dell'app"],
  ["problema", "Segnalazione di un problema"],
  ["idea", "Idea o suggerimento"],
  ["account", "Account e dati personali"],
  ["altro", "Altro"],
];

const FAQ = [
  {
    q: "Come cancello il mio account?",
    a: (
      <>
        Nella pagina <Link to="/account">Account</Link> trovi il pulsante «Cancella account»: elimina subito l'account, tutti i
        progetti e le notifiche. Dalla stessa pagina puoi anche scaricare una copia di tutti i tuoi dati.
      </>
    ),
  },
  {
    q: "Ho dimenticato la password",
    a: (
      <>
        Vai su <Link to="/accedi">Accedi</Link> e premi «Password dimenticata?»: ti mandiamo per email un link valido 2 ore. Se non
        arriva, controlla anche nella posta indesiderata.
      </>
    ),
  },
  {
    q: "Le notifiche non arrivano sull'iPhone",
    a: (
      <>
        Su iPhone e iPad le notifiche funzionano solo se aggiungi AiuolaLab alla schermata Home: in Safari premi il pulsante
        Condividi, poi «Aggiungi alla schermata Home», apri l'app da lì e attiva le notifiche dall'
        <Link to="/account">Account</Link>.
      </>
    ),
  },
  {
    q: "I miei progetti sono al sicuro?",
    a: (
      <>
        Senza account restano nel browser di questo dispositivo: se cancelli i dati del browser si perdono. Con un account vengono
        salvati anche sul nostro server e li ritrovi su ogni dispositivo.
      </>
    ),
  },
];

function ContactForm() {
  const { user, features } = useSession();
  const { state } = useLocation();
  const [form, setForm] = useState({ email: null, topic: state?.topic ?? "aiuto", message: "", website: "" });
  const [status, setStatus] = useState({ busy: false, error: null, sent: false });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  // finché non la cambia, proponiamo l'email dell'account (che arriva dopo il caricamento)
  const email = form.email ?? user?.email ?? "";

  if (!features.contact) {
    return (
      <p>
        Scrivici a <strong>{LEGAL.email}</strong>: rispondiamo di solito entro due giorni lavorativi.
      </p>
    );
  }

  if (status.sent) {
    return (
      <div className="notification is-success is-light">
        <strong>Messaggio inviato, grazie!</strong> Ti rispondiamo all'indirizzo {email}, di solito entro due giorni lavorativi.
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setStatus({ busy: true, error: null, sent: false });
    try {
      await sendContact({ ...form, email, page: state?.from });
      setStatus({ busy: false, error: null, sent: true });
    } catch (err) {
      setStatus({ busy: false, error: err.message || "Invio non riuscito, riprova tra poco.", sent: false });
    }
  };

  return (
    <form className="contact-form" onSubmit={submit}>
      <div className="field">
        <label className="label" htmlFor="contact-email">
          La tua email
        </label>
        <div className="control has-icons-left">
          <input
            id="contact-email"
            className="input"
            type="email"
            autoComplete="email"
            placeholder="nome@esempio.it"
            required
            maxLength={200}
            value={email}
            onChange={(e) => set("email", e.target.value)}
          />
          <span className="icon is-left">
            <i className="fa-solid fa-envelope" />
          </span>
        </div>
        <p className="help">Serve solo per risponderti.</p>
      </div>
      <div className="field">
        <label className="label" htmlFor="contact-topic">
          Argomento
        </label>
        <div className="control">
          <div className="select is-fullwidth">
            <select id="contact-topic" value={form.topic} onChange={(e) => set("topic", e.target.value)}>
              {TOPICS.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="field">
        <label className="label" htmlFor="contact-message">
          Messaggio
        </label>
        <div className="control">
          <textarea
            id="contact-message"
            className="textarea"
            rows={6}
            required
            minLength={10}
            maxLength={5000}
            placeholder={form.topic === "problema" ? "Cosa stavi facendo, cosa ti aspettavi e cosa è successo invece? Dicci anche telefono o computer e browser." : "Scrivi qui il tuo messaggio"}
            value={form.message}
            onChange={(e) => set("message", e.target.value)}
          />
        </div>
      </div>
      {/* campo trappola per i programmi di spam: le persone non lo vedono */}
      <div className="contact-trap" aria-hidden="true">
        <label htmlFor="contact-website">Sito web</label>
        <input id="contact-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set("website", e.target.value)} />
      </div>
      <p className="help contact-privacy">
        Usiamo i dati del messaggio solo per risponderti, come spiegato nell'<Link to="/privacy">informativa privacy</Link>.
      </p>
      {status.error && <div className="notification is-danger is-light">{status.error}</div>}
      <button className={`btn-country is-primary ${status.busy ? "is-busy" : ""}`} type="submit" disabled={status.busy}>
        {status.busy ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-paper-plane" />} Invia il messaggio
      </button>
    </form>
  );
}

export default function ContactPage() {
  return (
    <div className="page legal-page">
      <PageHero compact script="siamo qui" title="Contatti e aiuto" lead="Domande, problemi o idee per migliorare AiuolaLab: scrivici." />
      <section className="page-body">
        <div className="container content card-country legal-card">
          <h2>Domande frequenti</h2>
          {FAQ.map((f) => (
            <details key={f.q} className="contact-faq">
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}

          <h2>Scrivici</h2>
          <ContactForm />

          <h2>Privacy e dati personali</h2>
          <p>
            Per esercitare i tuoi diritti sui dati personali (accesso, correzione, cancellazione...) puoi usare il modulo qui sopra con
            l'argomento «Account e dati personali» oppure scrivere a {LEGAL.email}. Tutti i dettagli sono nell'
            <Link to="/privacy">informativa privacy</Link>.
          </p>
        </div>
      </section>
    </div>
  );
}
