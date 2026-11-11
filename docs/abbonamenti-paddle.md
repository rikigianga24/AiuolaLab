# Abbonamenti Premium con Paddle: come attivarli

Questa guida spiega come accendere gli abbonamenti, passo per passo, senza installare niente: servono solo il pannello di Paddle e quello di Render.

Finché le impostazioni non sono complete, il sito funziona come prima. La pagina **/prezzi** mostra i piani con il pulsante «Presto disponibile».

## Prima di iniziare

1. **Commercialista.** Chiedi conferma su partita IVA e regime fiscale. Paddle vende l'abbonamento al posto tuo e ti versa il netto, ma quei soldi vanno dichiarati.
2. **Dati legali.** Completa i dati in `src/lib/legal.js`: nome o ragione sociale, indirizzo, email ed eventuale partita IVA.
   - Paddle controlla il sito prima di attivare i pagamenti veri.
   - Vuole vedere la pagina prezzi, i termini e la privacy con dati veri.
3. **Render.** Con il piano gratuito il server si addormenta. Gli avvisi di Paddle arrivano comunque, perché Paddle riprova più volte, ma per chi paga conviene il piano Starter.

## 1. Prova con l'ambiente di prova (sandbox)

L'ambiente di prova è identico a quello vero, ma i pagamenti sono finti.

1. Crea un account su **sandbox-vendors.paddle.com**.
2. **Catalog → Products → New product.**
   - Nome: «AiuolaLab Premium».
   - Categoria fiscale: software / servizi digitali (*Standard digital goods* o *SaaS*).
3. Nel prodotto aggiungi **due prezzi**:
   - **3,99 EUR**, ricorrente **ogni mese**;
   - **30 EUR**, ricorrente **ogni anno**.

   Per tutti e due scegli l'**IVA inclusa nel prezzo** (*tax included*): chi compra deve pagare esattamente il prezzo mostrato. Copia i due codici dei prezzi, quelli che iniziano con `pri_`.
4. **Checkout → Checkout settings.** Come *Default payment link* metti l'indirizzo della pagina prezzi, per esempio `https://tuosito.it/prezzi`.
5. **Developer tools → Authentication:**
   - crea una **API key** e copiala (si vede una volta sola). Dalle i permessi:
     - lettura e scrittura su transazioni, abbonamenti, clienti, rettifiche (*adjustments*) e portale clienti (*customer portal sessions*);
     - sola lettura sui prezzi;
   - crea un **Client-side token** e copialo.
6. **Developer tools → Notifications → New destination:**
   - URL: `https://tuosito.it/api/billing/webhook`
   - Eventi da spuntare:
     - tutti quelli che iniziano con `subscription.` (created, updated, activated, canceled, past_due, paused, resumed, trialing);
     - `transaction.completed`.
   - Salva e copia la **Secret key** della destinazione.
7. Su **Render**, apri il servizio, vai in **Environment** e aggiungi queste variabili:

   | Nome | Valore |
   |---|---|
   | `PADDLE_API_KEY` | la API key |
   | `PADDLE_CLIENT_TOKEN` | il client-side token |
   | `PADDLE_WEBHOOK_SECRET` | la secret key della destinazione |
   | `PADDLE_PRICE_MONTHLY` | il codice `pri_` del prezzo mensile |
   | `PADDLE_PRICE_YEARLY` | il codice `pri_` del prezzo annuale |

   Non aggiungere ancora `PADDLE_ENV`: senza, il sito usa l'ambiente di prova.
8. Dopo il riavvio, nei **Logs** di Render deve comparire `[pagamenti] Paddle attivo (ambiente: prova)`.
   - Se compare un avviso «Prezzo Paddle da controllare», il messaggio dice cosa non torna (prezzo, valuta, IVA o durata).
9. **Prova un acquisto** dalla pagina /prezzi con un account di prova:
   - carta di prova `4242 4242 4242 4242`, una scadenza futura qualsiasi e CVC `100`;
   - entro pochi secondi la pagina dice «Benvenuto in Premium»;
   - nell'Account compare la scheda Abbonamento.
10. Prova anche, dalla pagina Account:
    - «Disdici il rinnovo» e poi «Riattiva il rinnovo»;
    - «Pagamento e ricevute», che apre il portale di Paddle;
    - «Recedi e chiedi il rimborso». Nell'ambiente di prova Paddle approva i rimborsi da solo ogni 10 minuti circa.

## 2. Passare ai pagamenti veri

1. Su **vendors.paddle.com** (l'account vero) completa la verifica che chiede Paddle:
   - dati dell'attività e documento d'identità;
   - controllo del sito e approvazione del dominio.
2. Rifai i passi 2-6 sull'account vero: prodotto, due prezzi, link di pagamento, chiavi e destinazione degli avvisi. I codici sono diversi da quelli di prova.
3. Su Render sostituisci le cinque variabili con i valori veri e aggiungi `PADDLE_ENV` = `production`.
4. Nei log deve comparire `[pagamenti] Paddle attivo (ambiente: pagamenti veri)`.

## Gestione di tutti i giorni

- **Ricevute, IVA e rimborsi** li gestisce Paddle: li vedi nel suo pannello, alla voce *Transactions*.
- **Recesso entro 14 giorni.** Il sito disdice e chiede il rimborso a Paddle in automatico. All'indirizzo `SUPPORT_EMAIL` arriva un'email per ogni recesso.
  - Se l'email dice «DA RIMBORSARE A MANO», apri la transazione su Paddle e fai il rimborso da lì.
- **Regalare Premium** a qualcuno: in Supabase, tabella `users`, metti `premium` nella colonna `plan`. Non serve un abbonamento.
- **Non modificare a mano la tabella `subscriptions`**: la aggiorna Paddle con i suoi avvisi.
- **Cambiare prezzo:**
  1. crea i nuovi prezzi su Paddle;
  2. aggiorna `PRICES` in `src/lib/plans.js` e le due variabili `PADDLE_PRICE_*` su Render;
  3. avvisa via email chi è già abbonato almeno 30 giorni prima: lo promettono i Termini, al punto 3.

  Chi è già abbonato resta al vecchio prezzo finché non lo cambi tu sul suo abbonamento da Paddle.
