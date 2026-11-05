import { Link } from "react-router-dom";
import background from "../styles/hp-background.png";

const FEATURES = [
  { icon: "fa-draw-polygon", title: "Disegna in metri", text: "Segna gli angoli dell'aiuola: lati e superficie sono calcolati in automatico." },
  { icon: "fa-seedling", title: "Migliaia di piante", text: "Cerca per esposizione, acqua, pH del terreno, colore e periodo di fioritura." },
  { icon: "fa-wand-magic-sparkles", title: "Consigli con l'IA", text: "Indica gusti e condizioni: ricevi un progetto con piante, quantità e disposizione." },
];

export default function Home() {
  return (
    <>
      <section className="hero is-fullheight home-hero" style={{ backgroundImage: `url(${background})` }}>
        <div className="hero-body">
          <div className="container has-text-centered">
            <h1 className="title is-1 has-text-white">Progettiamo</h1>
            <p className="subtitle is-4 has-text-white">Aiuole belle, funzionali e pensate per durare nel tempo</p>
            <Link to="/gardencanvas" className="button is-large is-primary mt-5">
              <i className="fa-solid fa-pen-ruler" />&nbsp; Inizia a progettare
            </Link>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="columns">
            {FEATURES.map((f) => (
              <div className="column" key={f.title}>
                <div className="box has-text-centered" style={{ height: "100%" }}>
                  <span className="icon is-large has-text-primary">
                    <i className={`fa-solid ${f.icon} fa-2x`} />
                  </span>
                  <h2 className="title is-5 mt-3">{f.title}</h2>
                  <p>{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
