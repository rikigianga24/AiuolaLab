import GardenCanvas from "./components/GardenCanvas.jsx";
import React from "react";
import "bulma/css/bulma.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

export default function App() {
  return (
    <div style={{ backgroundColor: "#FFF8DC", minHeight: "100vh", width: "100%" }}>
      {/* NAVBAR */}
      <nav className="navbar" style={{ backgroundColor: "#8A9A5B" }}>
        <div className="navbar-brand">
          <a className="navbar-item has-text-white has-text-weight-bold">
            <i className="fas fa-seedling mr-2"></i>AiuolaLab
          </a>
        </div>
      </nav>

      {/* HERO FULLSCREEN */}
      <section className="hero is-fullheight" style={{ backgroundColor: "#F3E5AB" }}>
        <div className="hero-body">
          <div className="container is-fluid has-text-centered">
            <h1 className="title" style={{ color: "#5A6B3A" }}>
              Progetta la tua aiuola perfetta
            </h1>
            <p className="subtitle" style={{ color: "#6B7A40" }}>
              Disegna, posiziona piante e rispetta spazi, esposizione e irrigazione
            </p>
            <button
              className="button is-medium"
              style={{ backgroundColor: "#8A9A5B", color: "white" }}
            >
              <i className="fas fa-drafting-compass mr-2"></i>Inizia ora
            </button>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section">
        <div className="container is-fluid">
          <div className="columns">
            <Feature icon="fa-vector-square" title="Disegno libero" text="Crea aiuole con forme libere e curve." />
            <Feature icon="fa-leaf" title="Database piante" text="Caratteristiche, dimensioni e fioritura." />
            <Feature icon="fa-ruler-combined" title="Controlli automatici" text="Niente sovrapposizioni o errori." />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section has-text-centered" style={{ backgroundColor: "#F3E5AB" }}>
        <div className="container is-fluid">
          <h2 className="title is-4">Uno strumento semplice, fatto bene</h2>
          <p className="mb-4">Perfetto per appassionati e piccoli giardini</p>
          <button
            className="button is-large"
            style={{ backgroundColor: "#8A9A5B", color: "white" }}
          >
            <i className="fas fa-play mr-2"></i>Prova il canvas
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer" style={{ backgroundColor: "#8A9A5B" }}>
        <div className="content has-text-centered has-text-white">
          <p><strong>AiuolaLab</strong> © 2025</p>
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon, title, text }) {
  return (
    <div className="column has-text-centered">
      <i className={`fas ${icon} fa-3x mb-3`} style={{ color: "#8A9A5B" }}></i>
      <h3 className="title is-5">{title}</h3>
      <p>{text}</p>
    </div>
  );
}
