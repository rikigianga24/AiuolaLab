import { Link } from "react-router-dom";
import { getIconUrl } from "../lib/plantIcons";
import { PageHero, SectionTitle } from "./decor";
import "../styles/pages.css";

const HIGHLIGHTS = [
  { icon: "fa-location-dot", label: "Arezzo, Toscana" },
  { icon: "fa-house-chimney", label: "Titolare di un agriturismo" },
  { icon: "fa-seedling", label: "Studi di botanica" },
  { icon: "fa-code", label: "Sviluppatore software" },
];

const PROJECT = [
  {
    icon: "fa-circle-question",
    title: "Perché",
    text: "Chi vuole un bel giardino spesso non sa da dove partire: quali piante scegliere, quante, dove metterle e come curarle. AiuolaLab nasce per rispondere a queste domande in modo semplice.",
  },
  {
    icon: "fa-trowel",
    title: "Cosa fa",
    text: "Disegno in scala reale, catalogo di piante, consigli con l'intelligenza artificiale, irrigazione a goccia, orto e un calendario che ti ricorda cosa fare, stagione dopo stagione.",
  },
  {
    icon: "fa-route",
    title: "Dove va",
    text: "Collaborazioni con vivai e professionisti del verde, preventivi dei materiali e strumenti sempre più precisi, costruiti ascoltando chi il giardino lo vive davvero.",
  },
];

const MISTAKES = [
  { icon: "fa-paw", label: "cinghiali" },
  { icon: "fa-tree", label: "caprioli" },
  { icon: "fa-moon", label: "tassi" },
  { icon: "fa-virus", label: "malattie" },
  { icon: "fa-flask", label: "troppo concime" },
  { icon: "fa-faucet-drip", label: "irrigazione montata male" },
];

const DONE = [
  { icon: "fa-fish", text: "Una vecchia fontana rimessa a nuovo, piena di piante e di pesci" },
  { icon: "fa-draw-polygon", text: "Quattro aiuole costruite da zero" },
  { icon: "fa-apple-whole", text: "Alberi da frutto piantati per gli anni a venire" },
  { icon: "fa-leaf", text: "Un giardino rimesso in sesto, angolo dopo angolo" },
];

function Story() {
  return (
    <section className="page-body story-section">
      <div className="container">
        <SectionTitle script="dal 2022" title="La mia storia" />
        <ol className="story">
          <li>
            <span className="story-dot">2022</span>
            <div>
              <h3>Dallo schermo alla terra</h3>
              <p>
                Per anni le mie giornate sono state fatte di schermi, righe di codice e problemi da risolvere al computer. Nel 2022 ho
                cominciato a passare sempre più tempo fuori, e mi sono accorto di una cosa che non mi aspettavo: un'aiuola è più complessa di
                qualsiasi programma abbia mai scritto. Terreno, sole, acqua, animali, stagioni: tutto dipende da tutto, e nessuno ti dà il
                manuale.
              </p>
              <p>
                In quel periodo la vita mi ha messo davanti a momenti difficili, di quelli che ti costringono a fermarti e a chiederti cosa
                conta davvero. Per me la risposta era lì fuori, con le mani nella terra.
              </p>
            </div>
          </li>
          <li>
            <span className="story-dot">
              <i className="fa-solid fa-person-digging" />
            </span>
            <div>
              <h3>Le prime aiuole (e i primi disastri)</h3>
              <p>
                Ho cominciato da solo, sapendo quasi niente. Le regole me le inventavo: questa pianta qui perché è bella, quella là perché
                c'era posto. Le piantine appena comprate sembravano così piccole che le mettevo una attaccata all'altra; un anno dopo si
                stavano soffocando a vicenda.
              </p>
              <p>E da lì, un errore dopo l'altro:</p>
              <ul className="story-chips">
                {MISTAKES.map((m) => (
                  <li key={m.label}>
                    <i className={`fa-solid ${m.icon}`} /> {m.label}
                  </li>
                ))}
                <li>…e mille altre cose</li>
              </ul>
              <p>
                Ogni volta guardavo il danno, cercavo di capire cosa fosse andato storto e ci riprovavo. Mi sono messo a segnare tutto su un
                quaderno: cosa avevo piantato, dove, e com'era finita.
              </p>
            </div>
          </li>
          <li>
            <span className="story-dot">
              <i className="fa-solid fa-hand-fist" />
            </span>
            <div>
              <h3>Testardo</h3>
              <p>
                Ci sono state mattine in cui ho trovato un'aiuola rivoltata dai cinghiali dopo settimane di lavoro. La voglia di lasciar
                perdere c'era, eccome. Ma sono testardo, e alla fine non perdo io. Stagione dopo stagione le piante hanno cominciato a
                rispondere, e io a capirle un po' di più.
              </p>
            </div>
          </li>
          <li>
            <span className="story-dot">
              <i className="fa-solid fa-house-chimney" />
            </span>
            <div>
              <h3>L'agriturismo</h3>
              <p>
                Poi è arrivata l'idea dell'agriturismo, e con lei la sfida più grande: occuparmi io di tutto l'esterno. Lì ho messo in pratica
                ogni lezione imparata sbagliando:
              </p>
              <ul className="story-done">
                {DONE.map((d) => (
                  <li key={d.text}>
                    <i className={`fa-solid ${d.icon}`} /> {d.text}
                  </li>
                ))}
              </ul>
              <p className="story-after">
                Vedere qualcuno fermarsi davanti alla fontana a guardare i pesci tra le piante mi ripaga di tutte quelle perse per strada.
              </p>
            </div>
          </li>
          <li>
            <span className="story-dot">oggi</span>
            <div>
              <h3>Contento, ma ancora a scuola</h3>
              <p>
                Oggi sono contento di quello che ho costruito, ma ho ancora tanto da imparare. I vivaisti con cui mi confronto mi hanno
                spiegato moltissimo su come funzionano le cose, però non ho i loro anni di esperienza: loro le piante le accarezzano da 10 o 15
                anni, e certe cose si imparano solo col tempo.
              </p>
            </div>
          </li>
        </ol>

        <div className="card-country story-message">
          <p className="script">se hai paura di sbagliare</p>
          <h3>Sbaglierai. Ed è normale.</h3>
          <p>
            Ogni giardiniere che conosco ha alle spalle un piccolo cimitero di piante, me compreso. Non serve avere il pollice verde: serve
            conoscere prima gli errori più comuni, così da non doverli scoprire tutti sulla propria pelle.
          </p>
          <p>
            È per questo che ho creato AiuolaLab: per metterti in mano quello che io ho imparato a mie spese. Le distanze giuste tra le
            piante, quanta acqua dare, quale concime e quando, da quali animali difenderti. Così puoi saltare qualche disastro e arrivare
            prima alla parte bella.
          </p>
          <Link to="/gardencanvas" className="btn-country is-primary">
            <i className="fa-solid fa-seedling" /> Inizia la tua prima aiuola
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function AboutMe() {
  return (
    <div className="page">
      <PageHero
        script="la storia"
        title="Chi c'è dietro AiuolaLab"
        lead="Un progetto nato tra i fiori di un agriturismo e le righe di codice."
      />

      <section className="page-body">
        <div className="container">
          <div className="about-grid">
            <div className="about-text">
              <p className="eyebrow">Il creatore</p>
              <h2 className="about-name">Riccardo Giangani</h2>
              <p className="script about-sub">24 anni, Arezzo</p>
              <p>
                Vivo in mezzo al verde: ho un agriturismo, dove aiuole, vasi e orto fanno parte della vita di tutti i giorni. È lì che è
                nata la passione per i fiori e per tutto ciò che serve a farli crescere bene.
              </p>
              <p>
                Negli anni ho approfondito botanica e coltivazione con studi personali, e ho avuto la fortuna di confrontarmi spesso con
                tanti vivaisti: da loro ho imparato i trucchi del mestiere che nessun manuale racconta.
              </p>
              <p>
                Di professione faccio lo sviluppatore. AiuolaLab è il punto d'incontro tra queste due anime: uno strumento pratico per
                progettare giardini, balconi e orti, che mette insieme l'esperienza sul campo e la tecnologia.
              </p>
            </div>

            <aside className="card-country about-card">
              <div className="about-avatar" aria-hidden="true">
                <img src={getIconUrl("rose", ["#e88fb4"], 160, "Rosa")} alt="" />
                <span>RG</span>
              </div>
              <ul className="about-highlights">
                {HIGHLIGHTS.map((h) => (
                  <li key={h.label}>
                    <span className="hl-icon">
                      <i className={`fa-solid ${h.icon}`} />
                    </span>
                    {h.label}
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </div>
      </section>

      <Story />

      <section className="page-band">
        <div className="container">
          <SectionTitle script="il progetto" title="Perché, cosa e dove" />
          <div className="three-cards">
            {PROJECT.map((p) => (
              <article key={p.title} className="card-country">
                <span className="badge-round">
                  <i className={`fa-solid ${p.icon}`} />
                </span>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </article>
            ))}
          </div>
          <p className="has-text-centered mt-5">
            <Link to="/gardencanvas" className="btn-country is-primary">
              <i className="fa-solid fa-trowel" /> Prova AiuolaLab
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
