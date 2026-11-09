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
