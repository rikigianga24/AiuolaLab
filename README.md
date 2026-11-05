# AiuolaLab

App web per progettare aiuole, balconi e orti, che si usa sia dal browser sia dal telefono. Puoi installarla come app (PWA).

- **Disegno in scala reale**: segni gli angoli dell'aiuola e l'app calcola lati, superficie e perimetro in metri. Gli angoli si possono trascinare per cambiare la forma, e l'aiuola si può spostare.
- **Tre ambienti**, ciascuno con il suo progetto:
  - **giardino**;
  - **balcone/terrazzo**: pavimento in cotto, gres, legno o cemento; parapetto a ringhiera, muretto o vetro; piante nei vasi;
  - **orto**: aiuole riempite a file con le distanze giuste per ogni ortaggio.
- **Database piante**: cerchi le piante per nome, esposizione, acqua, pH del terreno, colore e periodo di fioritura. I dati vengono da [Perenual](https://perenual.com/docs/api), un database pubblico di circa 10.000 specie.
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
4. Nel `.env`:
   ```
   DATABASE_URL=postgresql://postgres.xxxx:LA_TUA_PASSWORD@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
   DATABASE_SSL=true
   ```
5. Avvia il server: le tabelle (`server/schema.sql`) vengono create da sole.

Vanno bene anche Neon, Railway o un Postgres tuo: serve solo l'URL di connessione.

### 2. Email (riepilogo settimanale, avvisi meteo, conferma account, recupero password)

Con [Brevo](https://www.brevo.com), piano gratuito con un limite di email al giorno:

1. Crea l'account. In *Senders, Domains & Dedicated IPs* **verifica il mittente**: un indirizzo email o, meglio, il tuo dominio, aggiungendo i record DNS che ti indicano.
2. In *SMTP & API → SMTP* trovi server, porta, login e genera una **chiave SMTP**.
3. Nel `.env`:
   ```
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   SMTP_USER=il-login-smtp@smtp-brevo.com
   SMTP_PASS=la-chiave-smtp
   MAIL_FROM="AiuolaLab <noreply@tuodominio.it>"
   APP_URL=https://il-tuo-sito.it
   ```

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

### 5. Pagine legali

Prima di pubblicare completa i dati del titolare in `src/lib/legal.js`: nome, indirizzo, email, fornitori di hosting, database ed email. Rileggi informativa e cookie policy (`/privacy`, `/cookie`) e falle verificare da un professionista se l'app diventa un'attività commerciale.

### 6. Altre chiavi

| Variabile | A cosa serve |
|---|---|
| `PERENUAL_API_KEY` | Database piante completo (chiave su perenual.com; per uso commerciale verifica il piano) |
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
  plants/            adattatore Perenual, normalizzazione dati, cache
src/
  components/garden/ editor: canvas, catalogo piante e ortaggi, vasi, irrigazione
  components/        calendario, account, pagine legali, banner cookie
  lib/               geometria, icone, calendario di cura, orto, meteo, irrigazione
test/                test unitari e di integrazione
```
