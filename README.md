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
- **Account e notifiche**: login con email o con Google (`GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`, vedi `.env.example`), notifiche push sul telefono, email con riepilogo settimanale e avvisi meteo importanti.
- **Privacy**: GDPR (consensi, export dei dati, cancellazione dell'account), banner cookie, informativa e cookie policy.
