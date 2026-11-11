import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { reopenConsent } from "../lib/consent";
import { LEGAL } from "../lib/legal";
import { PLANS, PRICES, formatEuro, quotaLabel } from "../lib/plans";
import { PageHero } from "./decor";
import "../styles/pages.css";

function LegalLayout({ title, children }) {
  // link a una sezione (es. /termini#abbonamento): ci si sposta lì
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
  }, [hash]);
  return (
    <div className="page legal-page">
      <PageHero compact script="trasparenza" title={title} lead={`Ultimo aggiornamento: ${LEGAL.updated}`} />
      <section className="page-body">
        <div className="container content card-country legal-card">{children}</div>
      </section>
    </div>
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
        <li><strong>Account</strong>: indirizzo email, password (conservata solo in forma cifrata con algoritmo non reversibile), data e versione dell'informativa accettata, eventuale consenso a comunicazioni promozionali. Se accedi con Google riceviamo da Google solo il tuo indirizzo email (verificato) e un identificativo anonimo dell'account: nessuna password, foto o contatto.</li>
        <li><strong>Contenuti</strong>: progetti, piante, impostazioni dell'irrigazione, attività del calendario segnate come fatte.</li>
        <li><strong>Località</strong> (facoltativa): comune o coordinate che scegli per le previsioni meteo.</li>
        <li><strong>Notifiche</strong>: se le attivi, l'indirizzo tecnico del dispositivo fornito dal browser per le notifiche push e l'elenco delle notifiche già inviate.</li>
        <li><strong>Dati tecnici</strong>: indirizzo IP e informazioni sulle richieste, usati per la sicurezza (per esempio per limitare i tentativi di accesso) e conservati per il tempo strettamente necessario.</li>
        <li><strong>Errori dell'app</strong>: quando qualcosa si rompe registriamo una descrizione tecnica dell'errore, la pagina in cui è successo (senza parametri né codici di condivisione), il tipo di browser e di sistema operativo. Non registriamo il tuo indirizzo IP, la tua email né il contenuto dei progetti.</li>
        <li><strong>Statistiche di visita</strong>: pagine visitate, sito da cui arrivi, tipo di dispositivo e di browser, paese. Sono statistiche aggregate e anonime, raccolte senza cookie e senza salvare nulla sul tuo dispositivo; se nel browser hai attivato «Do Not Track» non vengono raccolte.</li>
        <li><strong>Abbonamento Premium</strong>: se ti abboni, il piano scelto (mensile o annuale), le date di inizio, rinnovo, disdetta ed eventuale recesso, e i codici di cliente e di abbonamento assegnati da Paddle. Nome, indirizzo di fatturazione e dati di pagamento li raccoglie direttamente Paddle: noi non vediamo i dati della carta.</li>
        <li><strong>Messaggi</strong>: se ci scrivi dalla pagina <Link to="/contatti">Contatti</Link>, la tua email, l'argomento e il testo del messaggio.</li>
      </ul>

      <h2>Perché e su quale base</h2>
      <ul>
        <li>Fornirti il servizio (account, progetti, calendario, meteo, notifiche richieste) e l'abbonamento Premium, compresi disdetta, recesso e rimborsi: esecuzione del contratto, art. 6.1.b GDPR.</li>
        <li>Sicurezza e prevenzione degli abusi: legittimo interesse, art. 6.1.f GDPR.</li>
        <li>Correggere gli errori e capire quali parti dell'app sono usate, per migliorarla: legittimo interesse, art. 6.1.f GDPR. Puoi opporti scrivendoci.</li>
        <li>Rispondere ai tuoi messaggi: esecuzione di misure richieste da te, art. 6.1.b GDPR.</li>
        <li>Comunicazioni promozionali e offerte: solo con il tuo consenso, art. 6.1.a GDPR, revocabile in ogni momento dall'account.</li>
        <li>Mostrare le foto delle piante da un servizio esterno: solo con il tuo consenso (vedi la <Link to="/cookie">cookie policy</Link>).</li>
      </ul>

      <h2>A chi li comunichiamo</h2>
      <p>I dati non vengono venduti. Li trattano per nostro conto, come responsabili del trattamento, solo i fornitori necessari:</p>
      <ul>
        <li>hosting dell'applicazione: {LEGAL.hosting};</li>
        <li>database: {LEGAL.database};</li>
        <li>invio delle email: {LEGAL.mailProvider};</li>
        <li>dominio e indirizzo {LEGAL.email}: {LEGAL.domain}, che inoltra i messaggi che ci scrivi alla nostra casella su {LEGAL.mailbox};</li>
        <li>consulente IA: Google (servizio Gemini, Stati Uniti), che riceve solo i dati dell'aiuola e le preferenze che scrivi, non la tua email né il tuo nome. Con il servizio gratuito di Google questi testi possono essere usati da Google per migliorare i suoi prodotti: non scrivere dati personali nel campo «Altre richieste»;</li>
        <li>notifiche push: il servizio di notifiche del tuo browser (per esempio Google, Apple o Mozilla), che riceve il testo della notifica;</li>
        <li>registro degli errori: Sentry (Functional Software Inc., Stati Uniti, con dati conservati nell'Unione Europea), che riceve solo le informazioni tecniche sugli errori descritte sopra;</li>
        <li>statistiche di visita: Umami (Umami Software Inc., Stati Uniti), che riceve solo i dati anonimi descritti sopra.</li>
      </ul>
      <p>
        <strong>Pagamenti.</strong> Se ti abboni a Premium, il pagamento è gestito da Paddle.com Market Limited (Regno Unito), che
        vende l'abbonamento come rivenditore e tratta i dati del pagamento come <strong>titolare autonomo</strong>, secondo la propria
        informativa privacy (paddle.com/legal/privacy) e gli obblighi fiscali a cui è soggetta. Da noi Paddle riceve solo il codice
        del tuo account e la tua email, per collegare il pagamento all'account e precompilare il modulo; da Paddle riceviamo lo stato
        dell'abbonamento, non i dati della carta.
      </p>
      <p>
        Le previsioni meteo (MET Norway), la ricerca dei comuni (OpenStreetMap), il database delle piante (Perenual) e la ricerca delle
        foto delle piante (iNaturalist, Wikidata e Wikimedia Commons) sono
        interrogati dal nostro server: questi servizi non ricevono il tuo indirizzo IP né dati del tuo account, ma solo le
        coordinate approssimate o il testo della ricerca.
      </p>
      <h2>Trasferimento dei dati negli Stati Uniti</h2>
      <p>
        Alcuni dei fornitori indicati sopra sono società con sede negli <strong>Stati Uniti</strong>, o che fanno parte di gruppi
        statunitensi. I tuoi dati possono quindi essere trasferiti negli USA, o essere accessibili da lì, anche quando i server si
        trovano nell'Unione Europea. In particolare:
      </p>
      <ul>
        <li>Google (consulente IA Gemini e, se lo usi, accesso con Google): riceve i dati dell'aiuola e le preferenze che scrivi, oppure la tua email e un identificativo dell'account;</li>
        <li>Render (hosting) e Supabase (database), società statunitensi: i dati sono conservati a Francoforte (Germania), ma possono essere accessibili dagli USA;</li>
        <li>Google (Gmail), dove riceviamo i messaggi che ci scrivi: vede il tuo indirizzo email e il testo del messaggio;</li>
        <li>i servizi di notifica dei browser (Google, Apple, Mozilla): ricevono il testo delle notifiche e l'indirizzo tecnico del dispositivo;</li>
        <li>Sentry e Umami: ricevono le informazioni tecniche sugli errori e le statistiche anonime di visita;</li>
        <li>Paddle (pagamenti, solo se ti abboni): ha sede nel Regno Unito e può usare fornitori negli Stati Uniti per i dati del pagamento;</li>
        <li>iNaturalist, Wikimedia Commons e Flickr (SmugMug Inc.), solo se acconsenti a vedere le foto delle piante: vedono l'indirizzo IP del tuo dispositivo.</li>
      </ul>
      <p>
        Questi trasferimenti avvengono solo con le garanzie previste dal GDPR (capo V):
      </p>
      <ul>
        <li>per il Regno Unito (Paddle), sulla base della decisione di adeguatezza della Commissione europea per il Regno Unito o, in mancanza, delle clausole contrattuali standard;</li>
        <li>per i fornitori aderenti al <strong>EU-U.S. Data Privacy Framework</strong>, sulla base della decisione di adeguatezza della Commissione europea del 10 luglio 2023 (art. 45 GDPR);</li>
        <li>negli altri casi, sulla base delle <strong>clausole contrattuali standard</strong> approvate dalla Commissione europea (art. 46 GDPR), con le eventuali misure aggiuntive (per esempio la cifratura delle connessioni);</li>
        <li>per i contenuti esterni che carichi solo su tua richiesta (le foto delle piante), anche sul tuo consenso esplicito (art. 49.1.a GDPR).</li>
      </ul>
      <p>
        Negli Stati Uniti le autorità pubbliche possono, in alcuni casi previsti dalla legge, chiedere l'accesso ai dati, e la tutela
        può essere diversa da quella europea. Riduciamo al minimo i dati inviati: per esempio, al consulente IA non mandiamo né il tuo
        nome né la tua email. Puoi chiedere informazioni sulle garanzie adottate, o una copia, scrivendo a {LEGAL.email}.
      </p>

      <h2>Per quanto tempo</h2>
      <ul>
        <li>Account e progetti: finché non cancelli l'account.</li>
        <li>Dati dell'abbonamento: finché non cancelli l'account. Paddle conserva i dati dei pagamenti e le ricevute per il tempo previsto dalle leggi fiscali.</li>
        <li>Sessioni di accesso: 30 giorni.</li>
        <li>Registro delle notifiche inviate: 13 mesi.</li>
        <li>Registro degli errori: 90 giorni.</li>
        <li>Messaggi inviati dalla pagina Contatti: il tempo necessario a rispondere e a gestire eventuali seguiti, al massimo 24 mesi.</li>
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
        legge non richiedono il consenso, e chiede il permesso per un unico contenuto esterno. Il modulo di pagamento di Paddle
        viene caricato solo quando decidi di abbonarti.
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
              <td>Modulo di pagamento Paddle</td>
              <td>Cookie e memoria del browser di Paddle (cdn.paddle.com)</td>
              <td>
                Solo se premi «Abbonati» nella pagina Prezzi: completare il pagamento in sicurezza e prevenire le frodi. Paddle tratta
                questi dati come titolare autonomo, secondo la propria informativa
              </td>
              <td>Decisa da Paddle, legata al pagamento</td>
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

      <h2>Statistiche di visita (senza cookie)</h2>
      <p>
        Per sapere quali pagine sono più usate contiamo le visite con Umami, un servizio di statistiche che non usa cookie, non
        salva nulla sul tuo dispositivo e non ti riconosce da una visita all'altra: vediamo solo numeri complessivi (pagine,
        provenienza, tipo di dispositivo, paese). Per questo non serve il consenso. Se nel browser hai attivato «Do Not Track» le
        tue visite non vengono contate. Allo stesso modo, il registro degli errori (Sentry) non usa cookie né memoria del browser.
      </p>

      <h2>Contenuti esterni (solo con consenso)</h2>
      <p>
        Le foto delle piante sono ospitate da iNaturalist e da Wikimedia Commons (archivi di foto con licenza libera, gestiti da
        organizzazioni statunitensi senza scopo di lucro), da Flickr (SmugMug Inc., Stati Uniti) per alcune varietà, di cui
        usiamo solo foto con licenza libera scelte una per una, e, per alcune schede del catalogo, da Perenual. Per mostrarle il tuo browser si collega ai
        loro server, che possono così vedere il tuo indirizzo IP. Senza consenso le foto non vengono caricate e al loro posto vedi le
        nostre illustrazioni. Sotto ogni foto sono indicati autore e licenza.
      </p>

      <p>
        <button className="button is-small is-primary" onClick={reopenConsent}>
          Modifica le preferenze
        </button>
      </p>
    </LegalLayout>
  );
}

export function TermsPage() {
  return (
    <LegalLayout title="Termini di utilizzo">
      <p>
        Questi termini regolano l'uso di AiuolaLab, il sito e l'app per progettare giardini, balconi e orti. Usando il servizio o
        creando un account li accetti. Sono scritti nel modo più semplice possibile: se qualcosa non è chiaro, scrivici.
      </p>
      <p>
        Nessuna parte di questi termini limita i diritti che la legge ti riconosce come consumatore, in particolare quelli
        previsti dal Codice del Consumo (D.Lgs. 206/2005) e dalle norme dell'Unione Europea.
      </p>

      <h2>1. Chi fornisce il servizio</h2>
      <p>
        AiuolaLab è fornito da {LEGAL.owner}, {LEGAL.address}
        {LEGAL.vat && `, P. IVA ${LEGAL.vat}`}, email {LEGAL.email} (di seguito «noi»).
      </p>

      <h2>2. Il servizio</h2>
      <ul>
        <li>
          AiuolaLab ti permette di disegnare aiuole, balconi e orti in scala, consultare un catalogo di piante, ricevere proposte
          dal consulente basato sull'intelligenza artificiale, calcolare un impianto di irrigazione, una stima dei costi, un
          calendario delle cure e ricevere avvisi meteo e promemoria.
        </li>
        <li>
          Il servizio di base è <strong>gratuito</strong>. Il piano <strong>Premium</strong>, a pagamento, offre funzioni in più
          (più proposte del consulente IA e la previsione di crescita completa) alle condizioni del punto 3.
        </li>
        <li>
          Possiamo migliorare, modificare o togliere singole funzioni. Se una modifica riduce in modo importante ciò che usi, te
          lo comunicheremo con un preavviso ragionevole.
        </li>
      </ul>


      <h2 id="abbonamento">3. Abbonamento Premium</h2>
      <ul>
        <li>
          <strong>Cosa comprende.</strong> Le funzioni descritte nella pagina <Link to="/prezzi">Prezzi</Link> al momento
          dell'acquisto: oggi il consulente IA con {quotaLabel(PLANS.premium.ai)} (invece di {quotaLabel(PLANS.free.ai)}) e la
          previsione di crescita completa. Tutte le altre funzioni restano incluse come nel piano Gratis.
        </li>
        <li>
          <strong>Chi vende e incassa.</strong> L'abbonamento è venduto da Paddle.com Market Limited (Regno Unito), che agisce come
          rivenditore autorizzato (<em>merchant of record</em>): gestisce il pagamento, applica l'IVA, ti manda la ricevuta e si
          occupa dei rimborsi. All'acquisto si applicano anche le condizioni di Paddle per gli acquirenti, che vedi nel modulo di
          pagamento. Noi forniamo il servizio Premium e rispondiamo del suo funzionamento. I dati della tua carta li vede solo Paddle.
        </li>
        <li>
          <strong>Prezzo.</strong> {formatEuro(PRICES.month.cents)} al mese oppure {formatEuro(PRICES.year.cents)} all'anno,{" "}
          <strong>IVA inclusa</strong>. Il prezzo finale ti viene mostrato nel modulo di pagamento prima della conferma. L'abbonamento
          inizia quando il pagamento va a buon fine.
        </li>
        <li>
          <strong>Rinnovo automatico.</strong> Alla fine di ogni mese o anno l'abbonamento si rinnova per lo stesso periodo, allo
          stesso prezzo e con addebito sullo stesso metodo di pagamento, finché non lo disdici.
        </li>
        <li>
          <strong>Disdetta.</strong> Puoi disdire in qualsiasi momento, senza penali, dalla pagina <Link to="/account">Account</Link>{" "}
          («Disdici il rinnovo»), dal portale di Paddle indicato nelle ricevute o scrivendoci. La disdetta vale dalla fine del periodo
          già pagato: fino ad allora Premium resta attivo e non ti addebitiamo più nulla. Salvo il recesso qui sotto, il periodo in
          corso non viene rimborsato in parte.
        </li>
        <li>
          <strong>Diritto di recesso (14 giorni).</strong> Entro 14 giorni dalla sottoscrizione puoi recedere dal contratto senza
          dare spiegazioni, con il pulsante «Recedi e chiedi il rimborso» nella pagina Account oppure inviando a {LEGAL.email} una
          dichiarazione esplicita, per esempio: «Con la presente notifico il recesso dal mio contratto per l'abbonamento Premium di
          AiuolaLab sottoscritto il [data], account [email], [nome e cognome], [data della richiesta]». L'abbonamento termina subito
          e ti rimborsiamo <strong>l'intero importo</strong>, anche se hai già usato Premium, entro 14 giorni dalla richiesta e con
          lo stesso metodo di pagamento, senza costi. Ti confermiamo il recesso via email.
        </li>
        <li>
          <strong>Pagamento non riuscito.</strong> Se un rinnovo non va a buon fine, Paddle riprova per alcuni giorni e ti avvisa. In
          questo periodo Premium resta attivo; se il pagamento non riesce, l'abbonamento termina e l'account torna al piano Gratis.
        </li>
        <li>
          <strong>Modifiche di prezzo e di contenuto.</strong> Un nuovo prezzo ti sarà comunicato via email almeno 30 giorni prima del
          rinnovo da cui si applica, e potrai disdire prima di quella data; il periodo già pagato non cambia. Se riduciamo in modo
          importante le funzioni Premium ti avvisiamo prima e puoi recedere con il rimborso della parte di periodo non goduta.
        </li>
        <li>
          <strong>Fine dell'abbonamento.</strong> Tornando al piano Gratis non perdi progetti, calendario o impostazioni. Se cancelli
          l'account, l'abbonamento viene disdetto subito e il periodo restante non viene rimborsato (nei primi 14 giorni puoi prima
          recedere con il rimborso completo). Se chiudiamo il servizio o il tuo account senza che tu abbia violato questi termini, ti
          rimborsiamo la parte di periodo non goduta.
        </li>
      </ul>

      <h2>4. Account</h2>
      <ul>
        <li>Puoi usare gran parte del servizio anche senza account: in questo caso i progetti restano soprattutto nel tuo browser.</li>
        <li>
          Per creare un account devi avere almeno 14 anni. Se hai meno di 18 anni puoi usare AiuolaLab solo con il consenso di chi
          esercita su di te la responsabilità genitoriale.
        </li>
        <li>
          Devi indicare un indirizzo email tuo e valido e custodire la password. L'account è personale: avvisaci subito se pensi
          che qualcuno lo stia usando senza il tuo permesso.
        </li>
        <li>
          Puoi cancellare l'account in qualsiasi momento dalla pagina Account: verranno cancellati anche tutti i progetti salvati
          online e disdetto l'eventuale abbonamento Premium (vedi il punto 3).
        </li>
      </ul>

      <h2>5. Cosa non è consentito</h2>
      <p>Usando AiuolaLab ti impegni a non:</p>
      <ul>
        <li>violare la legge o i diritti di altre persone, compresi i diritti d'autore e la privacy;</li>
        <li>inserire nei progetti, nei nomi o nei testi contenuti offensivi, discriminatori, violenti, illegali o dati personali di altre persone;</li>
        <li>tentare di accedere ad account o dati altrui, aggirare le misure di sicurezza o i limiti di utilizzo (per esempio le quote del consulente IA);</li>
        <li>usare programmi automatici per scaricare in massa il catalogo o altri contenuti, o sovraccaricare il servizio;</li>
        <li>rivendere il servizio o presentarlo come tuo.</li>
      </ul>

      <h2>6. I tuoi contenuti e i progetti condivisi</h2>
      <ul>
        <li>
          I progetti e i testi che crei restano <strong>tuoi</strong>. Ci autorizzi a conservarli, elaborarli e mostrarli solo
          per quanto serve a fornirti il servizio (per esempio per sincronizzarli tra i tuoi dispositivi, generare il calendario o
          mostrarli a chi apre un tuo link di condivisione). L'autorizzazione è gratuita, non esclusiva e termina quando cancelli
          i contenuti o l'account.
        </li>
        <li>
          Se condividi un progetto con un link, <strong>chiunque abbia il link</strong> può vederlo, senza poterlo modificare. Sei
          tu a decidere a chi mandarlo e sei responsabile di ciò che condividi: non mettere nel nome o nel progetto dati personali
          tuoi o di altri. Puoi disattivare il link in qualsiasi momento con «Smetti di condividere».
        </li>
        <li>I progetti condivisi non vengono pubblicati da noi né indicizzati dai motori di ricerca.</li>
      </ul>

      <h2>7. Segnalare contenuti illeciti</h2>
      <p>
        Se trovi su AiuolaLab un contenuto che ritieni illecito (per esempio in un progetto condiviso), scrivi a {LEGAL.email},
        in italiano o in inglese, indicando il link, il motivo per cui il contenuto è illecito e, se vuoi, il tuo nome e la tua
        email. Esamineremo la segnalazione in modo tempestivo e imparziale e ti risponderemo. Se rimuoviamo un contenuto o
        disattiviamo un link, lo comunichiamo alla persona interessata spiegando il motivo, come previsto dal Regolamento UE
        2022/2065 sui servizi digitali (Digital Services Act). Lo stesso indirizzo è il punto di contatto per le autorità.
      </p>

      <h2>8. Informazioni sulle piante, intelligenza artificiale e sicurezza</h2>
      <ul>
        <li>
          Schede delle piante, consigli di cura, calendario, previsioni di crescita, impianto di irrigazione e stime dei costi
          sono <strong>indicazioni generali</strong>: dipendono dal clima, dal terreno e da molti fattori che non possiamo
          conoscere. Non sostituiscono il parere di un vivaista, agronomo, idraulico o altro professionista. Prezzi e quantità
          sono stime e possono essere diversi da quelli reali.
        </li>
        <li>
          Le proposte del consulente sono <strong>generate da un sistema di intelligenza artificiale</strong> (Google Gemini) e
          possono contenere errori o imprecisioni: valutale sempre con buon senso prima di comprare o piantare. Alcune immagini del
          sito (per esempio le foto degli stili di giardino) sono illustrazioni create con l'intelligenza artificiale e non
          ritraggono giardini reali.
        </li>
        <li>
          Le avvertenze sulla <strong>tossicità</strong> per persone e animali sono un aiuto, non un elenco completo. In caso di
          ingestione di una pianta, o di sintomi, rivolgiti subito al medico, al veterinario o a un centro antiveleni.
        </li>
        <li>
          Le previsioni e gli avvisi meteo arrivano da servizi esterni e possono essere imprecisi o arrivare in ritardo: non
          basarti solo su di essi per proteggere piante, persone o cose.
        </li>
        <li>
          Prima di realizzare un progetto verifica le regole che si applicano a te: distanze dal confine per alberi e siepi
          (articoli 892 e seguenti del Codice civile), regolamenti condominiali e comunali, carico massimo di balconi e terrazzi,
          divieti sulle specie esotiche invasive (Regolamento UE 1143/2014). Su questi aspetti la responsabilità delle scelte
          resta tua.
        </li>
      </ul>

      <h2>9. Disponibilità del servizio e copie dei dati</h2>
      <ul>
        <li>
          Facciamo il possibile perché AiuolaLab funzioni sempre, ma non possiamo garantire che sia disponibile senza
          interruzioni o errori: possono esserci manutenzioni, guasti o rallentamenti, anche dei fornitori esterni.
        </li>
        <li>
          I progetti salvati solo nel browser possono andare persi se cancelli i dati del browser o cambi dispositivo. Ti
          consigliamo di creare un account e di scaricare ogni tanto i tuoi dati dalla pagina Account.
        </li>
      </ul>

      <h2>10. Limiti di responsabilità</h2>
      <ul>
        <li>
          Rispondiamo dei danni causati dal servizio nei casi e nei limiti previsti dalla legge. In nessun caso escludiamo o
          limitiamo la nostra responsabilità per dolo o colpa grave, per danni alla persona o in altri casi in cui la legge non lo
          consente (articolo 1229 del Codice civile e Codice del Consumo).
        </li>
        <li>
          Fuori da questi casi non rispondiamo dei danni dovuti a: uso del servizio in
          modo diverso da quanto indicato in questi termini; scelte fatte affidandosi alle sole indicazioni generali del punto 8
          senza le verifiche lì suggerite; interruzioni dovute a cause che non dipendono da noi (per esempio guasti dei fornitori
          o della rete); contenuti inseriti o condivisi dagli utenti.
        </li>
      </ul>

      <h2>11. Proprietà intellettuale</h2>
      <p>
        Il nome AiuolaLab, il software, i testi, le illustrazioni e la grafica appartengono a {LEGAL.owner} o ai rispettivi
        titolari e sono protetti dalla legge sul diritto d'autore. Puoi usarli solo all'interno del servizio, per uso personale.
        Le foto delle piante provengono da archivi con licenza libera: sotto ogni foto sono indicati autore e licenza.
      </p>

      <h2>12. Sospensione e chiusura</h2>
      <ul>
        <li>
          Se violi questi termini in modo grave o ripetuto possiamo sospendere o chiudere il tuo account o disattivare i tuoi link
          di condivisione. Salvo urgenze (per esempio un attacco in corso o un contenuto illecito), ti avvisiamo prima spiegando il
          motivo e puoi rispondere scrivendo a {LEGAL.email}.
        </li>
        <li>
          Se decidessimo di chiudere AiuolaLab ti avviseremo via email almeno 30 giorni prima, così potrai scaricare i tuoi dati.
          Gli abbonamenti Premium in corso vengono disdetti e la parte di periodo non goduta ti viene rimborsata.
        </li>
      </ul>

      <h2>13. Modifiche ai termini</h2>
      <p>
        Possiamo aggiornare questi termini, per esempio per nuove funzioni o cambi di legge. Le modifiche importanti ti saranno
        comunicate via email o con un avviso nell'app almeno 15 giorni prima che si applichino. Se non le accetti puoi cancellare
        l'account prima di quella data; se continui a usare il servizio dopo, le modifiche si intendono accettate. Le modifiche
        non valgono per il passato.
      </p>

      <h2>14. Legge applicabile e controversie</h2>
      <ul>
        <li>Questi termini sono regolati dalla legge italiana. Se sei un consumatore residente in un altro Paese dell'Unione Europea, restano valide le tutele inderogabili della legge del tuo Paese.</li>
        <li>
          Per qualsiasi problema scrivici prima a {LEGAL.email}: cercheremo una soluzione insieme. Puoi anche ricorrere a un
          organismo di risoluzione alternativa delle controversie (per esempio una mediazione).
        </li>
        <li>
          Se sei un consumatore, per le controversie è competente il giudice del luogo in cui risiedi o hai il domicilio
          (articolo 66-bis del Codice del Consumo). Negli altri casi è competente il foro del luogo in cui ha sede il fornitore.
        </li>
      </ul>

      <h2>15. Contatti e altri documenti</h2>
      <p>
        Per domande su questi termini scrivi a {LEGAL.email}. Come trattiamo i tuoi dati è spiegato nell'
        <Link to="/privacy">informativa privacy</Link>; gli strumenti tecnici usati dal sito nella <Link to="/cookie">cookie policy</Link>.
      </p>
    </LegalLayout>
  );
}
