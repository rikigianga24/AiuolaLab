import { Link } from "react-router-dom";

export default function Home() {
  return (
    <section
      className="hero is-fullheight"
      style={{
        backgroundImage: "url('')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="hero-body">
        <div className="container has-text-centered">
          <h1 className="title is-1 has-text-white">Progettiamo</h1>
          <p className="subtitle is-4 has-text-white">
            Aiuole belle, funzionali e pensate per durare nel tempo
          </p>

          <div className="mt-6">
            <Link to="/gardencanvas" className="button is-large is-primary">
              Apri GardenCanvas
            </Link>
          </div>
        </div>
      </div>

      <div className="hero-foot">
        <div className="container has-text-centered pb-5">
          <p className="has-text-white">
            Progetto AiuolaLab · progettazione intuitiva di spazi verdi
          </p>
        </div>
      </div>
    </section>
  );
}
