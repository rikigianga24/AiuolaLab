# AiuolaLab

App web per progettare aiuole, che si usa sia dal browser sia dal telefono. Puoi installarla come app (PWA).

- **Disegno in scala reale**: segni gli angoli dell'aiuola e l'app calcola lati, superficie e perimetro in metri. Gli angoli si possono trascinare per cambiare la forma, e l'aiuola si può spostare.
- **Database piante**: cerchi le piante per nome, esposizione, acqua, pH del terreno, colore e periodo di fioritura. I dati vengono da [Perenual](https://perenual.com/docs/api), un database pubblico di circa 10.000 specie.
- **Consigli con l'IA**: indichi condizioni e gusti, Claude propone le piante, le quantità e la disposizione, e l'app le posiziona nell'aiuola.
- **Giardino o balcone/terrazzo**: due ambienti, ciascuno con il suo progetto. Sul terrazzo disegni il pavimento (cotto, gres, legno, cemento) con il parapetto (ringhiera, muretto, vetro) e metti le piante nei vasi.
- **Vasi**: vaso tondo o quadrato, fioriera, fioriera da ringhiera, vaso appeso; con misure, materiale e volume di terriccio. L'IA propone piante adatte al vaso (ricadenti per quelli appesi) e l'irrigazione tiene conto che i vasi si asciugano prima.
- **Materiali**: per ogni aiuola scegli la copertura (corteccia, ghiaia bianca, ciottoli, lapillo, terra nuda) e la bordura (pietra, mattoni, legno, acciaio corten).
- **Irrigazione a goccia**: dal rubinetto l'app calcola il percorso di tubo più corto per raggiungere tutte le piante (albero di copertura minimo). Dimensiona i gocciolatori sul fabbisogno di ogni pianta, compila la lista dei materiali e propone durata, frequenza e orario per stagione, in base al clima e al terreno.
- **Progetti**: vengono salvati su Postgres, oppure nel browser se il server non ha un database.

## Avvio in locale

Richiede Node.js 20 o superiore.

```bash
npm install
cp .env.example .env   # poi inserisci le tue chiavi
npm run dev            # frontend su http://localhost:5173, API su :3001
```

Tutte le chiavi sono facoltative: senza chiavi l'app funziona lo stesso, con un catalogo di piante di esempio, i progetti salvati nel browser e il consulente IA disattivato.

| Variabile | A cosa serve |
|---|---|
| `PERENUAL_API_KEY` | Database piante completo (chiave gratuita su perenual.com) |
| `DATABASE_URL` | Postgres per salvare i progetti e tenere in cache le schede delle piante (Supabase, Neon, Railway…) |
| `DATABASE_SSL` | `true` per i database in cloud |
| `ANTHROPIC_API_KEY` | Consulente IA (console.anthropic.com) |
| `SUGGEST_RATE_LIMIT` | Richieste massime all'IA per IP ogni ora (default 20) |

Lo schema del database (`server/schema.sql`) viene creato da solo all'avvio.

Dal telefono, sulla stessa rete Wi-Fi: avvia `npx vite --host` e apri l'indirizzo IP del computer indicato da Vite.

## Produzione

```bash
npm run build
npm start              # Express serve sia /api sia il frontend compilato
```

## Struttura

```
server/            API Express
  plants/          adattatore Perenual, normalizzazione dati, cache, catalogo demo
  ai/advisor.js    consulente IA (Claude, output JSON strutturato)
  routes/          /api/plants, /api/projects, /api/suggest
src/
  components/garden/   editor: canvas Konva, pannelli, consulente
  lib/             geometria in metri, disposizione automatica, archivio progetti
test/              test (npm test)
```

## Comandi

- `npm run dev`: frontend e API in sviluppo
- `npm test`: test unitari
- `npm run lint`: ESLint
- `npm run build`: build di produzione, con service worker PWA
