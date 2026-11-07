import { Link } from "react-router-dom";
import { reopenConsent } from "../lib/consent";
import { LEGAL } from "../lib/legal";

function LegalLayout({ title, children }) {
  return (
    <section className="section legal-page">
      <div className="container content">
        <h1 className="title is-3">{title}</h1>
        <p className="has-text-grey">Ultimo aggiornamento: {LEGAL.updated}</p>
        {children}
      </div>
    </section>
  );
}

export function PrivacyPage() {
  return (
    <LegalLayout title="Informativa privacy">
      <p>
        Questa informativa spiega quali dati personali tratta AiuolaLab, perché e con quali diritti per te, ai sensi del
        Regolamento UE 2016/679 (GDPR) e del Codice privacy italiano.
      </p>

      <h2>Titolare del trattamento</h2>
      <p>
        {LEGAL.owner}, {LEGAL.address}
        {LEGAL.vat && `, P. IVA ${LEGAL.vat}`}. Contatto per la privacy: {LEGAL.email}.
      </p>

      <h2>Quali dati trattiamo</h2>
      <ul>
        <li><strong>Senza account</strong>: i progetti restano nella memoria del tuo browser. Se il server ha un archivio, i progetti salvati sono legati a un codice anonimo del dispositivo.</li>
        <li><strong>Account</strong>: indirizzo email, password (conservata solo in forma cifrata con algoritmo non reversibile), data e versione dell'informativa accettata, eventuale consenso a comunicazioni promozionali.</li>
        <li><strong>Contenuti</strong>: progetti, piante, impostazioni dell'irrigazione, attività del calendario segnate come fatte.</li>
        <li><strong>Località</strong> (facoltativa): comune o coordinate che scegli per le previsioni meteo.</li>
        <li><strong>Notifiche</strong>: se le attivi, l'indirizzo tecnico del dispositivo fornito dal browser per le notifiche push e l'elenco delle notifiche già inviate.</li>
        <li><strong>Dati tecnici</strong>: indirizzo IP e informazioni sulle richieste, usati per la sicurezza (per esempio per limitare i tentativi di accesso) e conservati per il tempo strettamente necessario.</li>
      </ul>

      <h2>Perché e su quale base</h2>
      <ul>
        <li>Fornirti il servizio (account, progetti, calendario, meteo, notifiche richieste): esecuzione del contratto, art. 6.1.b GDPR.</li>
        <li>Sicurezza e prevenzione degli abusi: legittimo interesse, art. 6.1.f GDPR.</li>
        <li>Comunicazioni promozionali e offerte: solo con il tuo consenso, art. 6.1.a GDPR, revocabile in ogni momento dall'account.</li>
        <li>Mostrare le foto delle piante da un servizio esterno: solo con il tuo consenso (vedi la <Link to="/cookie">cookie policy</Link>).</li>
      </ul>

      <h2>A chi li comunichiamo</h2>
      <p>I dati non vengono venduti. Li trattano per nostro conto, come responsabili del trattamento, solo i fornitori necessari:</p>
      <ul>
        <li>hosting dell'applicazione: {LEGAL.hosting};</li>
        <li>database: {LEGAL.database};</li>
        <li>invio delle email: {LEGAL.mailProvider};</li>
        <li>consulente IA: Anthropic (Stati Uniti), che riceve solo i dati dell'aiuola e le preferenze che scrivi, non la tua email;</li>
        <li>notifiche push: il servizio di notifiche del tuo browser (per esempio Google, Apple o Mozilla), che riceve il testo della notifica.</li>
      </ul>
      <p>
        Le previsioni meteo (MET Norway), la ricerca dei comuni (OpenStreetMap) e il database delle piante (Perenual) sono
        interrogati dal nostro server: questi servizi non ricevono il tuo indirizzo IP né dati del tuo account, ma solo le
        coordinate approssimate o il testo della ricerca.
      </p>
      <p>
        Per i fornitori fuori dall'Unione Europea il trasferimento avviene con le garanzie previste dal GDPR (decisione di
        adeguatezza UE-USA o clausole contrattuali standard).
      </p>

      <h2>Per quanto tempo</h2>
      <ul>
        <li>Account e progetti: finché non cancelli l'account.</li>
        <li>Sessioni di accesso: 30 giorni.</li>
        <li>Registro delle notifiche inviate: 13 mesi.</li>
        <li>Link di conferma e di recupero password: da 2 a 72 ore.</li>
      </ul>

      <h2>I tuoi diritti</h2>
      <p>
        Puoi chiedere accesso, rettifica, cancellazione, limitazione, portabilità e opporti al trattamento. Dalla pagina{" "}
        <Link to="/account">Account</Link> puoi farlo in autonomia: scaricare tutti i tuoi dati, cambiare i consensi e cancellare
        l'account con tutti i progetti. Per altre richieste scrivi a {LEGAL.email}. Hai anche il diritto di proporre reclamo al
        Garante per la protezione dei dati personali (www.garanteprivacy.it).
      </p>

      <h2>Minori</h2>
      <p>Per creare un account devi avere almeno 14 anni.</p>
    </LegalLayout>
  );
}

export function CookiePage() {
  return (
    <LegalLayout title="Cookie policy">
      <p>
        AiuolaLab non usa cookie di profilazione, pubblicità o statistiche di terze parti. Usa solo strumenti tecnici, che per
        legge non richiedono il consenso, e chiede il permesso per un unico contenuto esterno.
      </p>

      <h2>Strumenti tecnici (sempre attivi)</h2>
      <div className="table-container">
        <table className="table is-fullwidth is-striped">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Tipo</th>
              <th>A cosa serve</th>
              <th>Durata</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>al_session</code></td>
              <td>Cookie tecnico di prima parte</td>
              <td>Mantiene l'accesso al tuo account</td>
              <td>30 giorni o fino all'uscita</td>
            </tr>
            <tr>
              <td><code>aiuolalab.*</code></td>
              <td>Memoria locale del browser</td>
              <td>Progetti aperti, impostazioni, scelte su questo banner, codice anonimo del dispositivo</td>
              <td>Finché non li cancelli dal browser</td>
            </tr>
            <tr>
              <td>Cache dell'app</td>
              <td>Service worker</td>
              <td>Far funzionare l'app installata anche con connessione scarsa</td>
              <td>Fino al prossimo aggiornamento</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Contenuti esterni (solo con consenso)</h2>
      <p>
        Le foto delle piante del catalogo sono ospitate da Perenual. Per mostrarle il tuo browser si collega ai loro server, che
        possono così vedere il tuo indirizzo IP. Senza consenso le foto non vengono caricate e al loro posto vedi le nostre icone.
      </p>

      <p>
        <button className="button is-small is-primary" onClick={reopenConsent}>
          Modifica le preferenze
        </button>
      </p>
    </LegalLayout>
  );
}
