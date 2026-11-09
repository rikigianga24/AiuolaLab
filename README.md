# AiuolaLab

App web per progettare aiuole, balconi e orti, che si usa sia dal browser sia dal telefono. Puoi installarla come app (PWA).

- **Disegno in scala reale**: segni gli angoli dell'aiuola e l'app calcola lati, superficie e perimetro in metri. Gli angoli si possono trascinare per cambiare la forma, e l'aiuola si può spostare.
- **Tre ambienti**, ciascuno con il suo progetto:
  - **giardino**;
  - **balcone/terrazzo**: pavimento in cotto, gres, legno o cemento; parapetto a ringhiera, muretto o vetro; piante nei vasi;
  - **orto**: aiuole riempite a file con le distanze giuste per ogni ortaggio.
- **Catalogo piante**: quasi 1.000 schede in italiano (rose inglesi e antiche, perenni da cottage garden, annuali, bulbose, arbusti, rampicanti, graminacee, aromatiche e fiori da balcone). Si cerca per nome, tipo, esposizione, acqua, pH del terreno, colore e periodo di fioritura. Le schede sono in `server/plants/catalog/`, una riga per pianta: per aggiungerne una basta una riga nel file giusto (il formato è spiegato in `catalog/index.js`). In alternativa si può usare [Perenual](https://perenual.com/docs/api), a pagamento per uso commerciale.
- **Orto**: 47 ortaggi con calendario, distanze, consociazioni e circa 150 varietà italiane (San Marzano, Cuore di bue, Zolfino, Rossa di Tropea...).
- **Orto**: calendario di 30 ortaggi (semenzaio, semina, trapianto, raccolta). Le **consociazioni** sbagliate compaiono come linea rossa sul disegno, e la **rotazione** delle colture viene seguita negli anni.
- **Vasi**: vaso tondo o quadrato, fioriera, fioriera da ringhiera, vaso appeso; con misure, materiale e volume di terriccio.
- **Consigli con l'IA**: indichi condizioni e gusti, Claude propone le piante, le quantità e la disposizione, e l'app le posiziona nell'aiuola. Funziona anche per vasi e orto.
- **Irrigazione a goccia**:
  - percorso di tubo più corto dal rubinetto a tutte le piante;
  - gocciolatori calibrati sul fabbisogno di ogni pianta;
  - lista dei materiali;
  - programma con durata, frequenza e orario per stagione.
- **Calendario**: potature, concimazioni, difesa, semine e raccolte delle tue piante, con date adattate alla zona climatica. Le attività si segnano come fatte o si rimandano.
- **Meteo e avvisi**: previsioni [MET Norway](https://api.met.no/) e avvisi di gelo, caldo, pioggia, vento e siccità.
- **Account e notifiche**: login, notifiche push sul telefono, email con riepilogo settimanale e avvisi meteo importanti.
- **Privacy**: GDPR (consensi, export dei dati, cancellazione dell'account), banner cookie, informativa e cookie policy.

## Avvio in locale

Richiede Node.js 20.19 o superiore.

```bash
npm install
cp .env.example .env   # poi inserisci le tue chiavi
npm run dev            # frontend su http://localhost:5173, API su :3001
```

Tutte le chiavi sono facoltative: se ne manca una, la funzione corrispondente si spegne e il resto dell'app continua a funzionare. Il file `.env.example` spiega ogni voce.

## Configurazione passo passo

### 1. Database (account, progetti online, notifiche)

Con [Supabase](https://supabase.com), piano gratuito:

1. Crea un account e un nuovo progetto. Scegli una **regione europea** (es. Frankfurt): conta per il GDPR.
2. Annota la **password del database** che scegli alla creazione.
3. In *Project Settings → Database → Connection string* copia la stringa **URI**. Usa quella del *Session pooler* (porta 5432), che funziona anche da server senza IPv6.
4. Nel `.env` incolla quella stringa in `DATABASE_URL`, sostituendo il segnaposto della password con la tua, e imposta `DATABASE_SSL=true`.
5. Crea le tabelle in uno dei due modi:
   - **dal pannello di Supabase**: *SQL Editor → New query*, incolla tutto il contenuto di `server/schema.sql` e premi **Run**;
   - **in automatico**: avvia il server, che applica lo stesso file a ogni avvio.

   Il file si può eseguire più volte senza problemi e attiva la *Row Level Security* su tutte le tabelle, così l'API pubblica di Supabase non può leggerle. Il server si collega come proprietario delle tabelle e continua a funzionare normalmente.

Vanno bene anche Neon, Railway o un Postgres tuo: serve solo l'URL di connessione.

### 2. Email (riepilogo settimanale, avvisi meteo, conferma account, recupero password)

Con [Brevo](https://www.brevo.com), piano gratuito con un limite di email al giorno:

1. Crea l'account. In *Senders, Domains & Dedicated IPs* **verifica il mittente**: un indirizzo email o, meglio, il tuo dominio, aggiungendo i record DNS che ti indicano.
2. In *SMTP & API → SMTP* trovi server, porta, login e genera una **chiave SMTP**.
3. Nel `.env` compila:
   - `SMTP_HOST` e `SMTP_PORT` con server e porta indicati da Brevo (di solito porta 587);
   - `SMTP_USER` con il login SMTP;
   - `SMTP_PASS` con la chiave SMTP che hai generato;
   - `MAIL_FROM` con il mittente verificato, per esempio `AiuolaLab <noreply@tuodominio.it>`;
   - `APP_URL` con l'indirizzo pubblico del sito.

Senza SMTP gli account funzionano lo stesso: l'email non viene confermata e il recupero password non è disponibile.

### 3. Notifiche push sul telefono

1. Genera una volta le chiavi:
   ```bash
   npx web-push generate-vapid-keys
   ```
2. Copiale nel `.env` (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`) e imposta `VAPID_SUBJECT=mailto:tua@email.it`. **Non rigenerarle** dopo la pubblicazione, o i dispositivi già iscritti smettono di ricevere le notifiche.
3. Le notifiche funzionano solo nell'app **pubblicata e in HTTPS** (`npm run build` + `npm start`), non con `npm run dev`.
   - Su Android basta il browser.
   - Su iPhone (iOS 16.4 o successivo) bisogna prima aggiungere l'app alla schermata Home.
4. L'utente le attiva da *Account → Notifiche*.

### 4. Meteo

Non serve nessuna chiave: MET Norway è gratuito anche per uso commerciale, con licenza CC BY 4.0 (la fonte è citata nell'app). I loro termini chiedono un contatto, quindi imposta `WEATHER_CONTACT=tua@email.it`.

### Foto delle piante

Arrivano da [iNaturalist](https://www.inaturalist.org): nessuna chiave da configurare. Vengono mostrate solo foto con licenza CC0, CC BY o CC BY-SA, sempre con l'autore, e solo a chi accetta i contenuti esterni.

All'avvio il server cerca in sottofondo la foto principale di tutte le piante del catalogo e degli ortaggi, una richiesta al secondo come chiede iNaturalist. La prima volta servono circa 11 minuti. I link restano nel database per 60 giorni, il controllo si ripete ogni settimana e, se iNaturalist non risponde, il server riprova dopo un'ora. Per disattivarlo imposta `PHOTO_WARMUP=off`.

### 5. Pagine legali

Prima di pubblicare completa i dati del titolare in `src/lib/legal.js`: nome, indirizzo, email, fornitori di hosting, database ed email. Rileggi informativa e cookie policy (`/privacy`, `/cookie`) e falle verificare da un professionista se l'app diventa un'attività commerciale.

### 6. Altre chiavi

| Variabile | A cosa serve |
|---|---|
| `PLANT_PROVIDER` + `PERENUAL_API_KEY` | Facoltativo: `PLANT_PROVIDER=perenual` usa Perenual al posto del catalogo interno (uso commerciale solo con piano a pagamento) |
| `ANTHROPIC_API_KEY` | Consulente IA (console.anthropic.com) |
| `SUGGEST_RATE_LIMIT` | Richieste massime all'IA per IP ogni ora (default 20) |
| `NOTIFY_HOUR` | Ora predefinita delle notifiche (default 8, fuso Europe/Rome) |

## Produzione

```bash
npm run build
npm start              # Express serve sia /api sia il frontend compilato
```

- Serve **HTTPS**: è richiesto per le notifiche push e per i cookie di sessione sicuri. Render, Railway e Fly lo forniscono già.
- Le notifiche partono dal server stesso ogni 10 minuti, quindi tieni **una sola istanza** sempre accesa. Sui piani gratuiti che "dormono" le notifiche possono arrivare in ritardo.

## Test

```bash
npm test                                                   # test unitari
```

Con un Postgres di prova, anche i test di integrazione delle API (account, GDPR, notifiche):

```bash
TEST_DATABASE_URL=postgresql://postgres@localhost:5432/postgres npm test
```

## Struttura

```
server/
  app.js, index.js   app Express e avvio (con il pianificatore delle notifiche)
  auth.js            password, sessioni, protezione CSRF
  notify.js          email (SMTP) e notifiche push
  scheduler.js       promemoria del calendario e avvisi meteo
  routes/            auth, account (GDPR), progetti, piante, meteo, consulente IA
  plants/            catalogo interno (catalog/), adattatore Perenual, normalizzazione, cache
src/
  components/garden/ editor: canvas, catalogo piante e ortaggi, vasi, irrigazione
  components/        calendario, account, pagine legali, banner cookie
  lib/               geometria, icone, calendario di cura, orto, meteo, irrigazione
test/                test unitari e di integrazione
```
