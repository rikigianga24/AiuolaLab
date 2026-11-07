import { Link } from "react-router-dom";
import "@fontsource/playfair-display/400.css";
import "@fontsource/playfair-display/700.css";
import "@fontsource/playfair-display/400-italic.css";
import "@fontsource/caveat/600.css";
import { getIconUrl } from "../lib/plantIcons";
import background from "../styles/hp-background.png";
import "../styles/home.css";

// Rametto disegnato a linea, per le decorazioni.
function Sprig({ className = "", flip = false }) {
  return (
    <svg className={`sprig ${className}`} viewBox="0 0 120 60" aria-hidden="true" style={flip ? { transform: "scaleX(-1)" } : undefined}>
      <path d="M4 50 C 30 44, 60 34, 116 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {[
        [22, 46, -30],
        [40, 40, -35],
        [58, 33, -40],
        [76, 26, -45],
        [94, 19, -50],
      ].map(([x, y, a], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${a})`}>
          <path d="M0 0 C 4 -10, 14 -12, 18 -8 C 12 -4, 6 0, 0 0 Z" fill="currentColor" opacity="0.85" />
          <path d="M0 0 C 4 10, 14 12, 18 8 C 12 4, 6 0, 0 0 Z" fill="currentColor" opacity="0.6" />
        </g>
      ))}
      <circle cx="116" cy="10" r="4" fill="#c0643b" />
    </svg>
  );
}

// Bordo ondulato tra le sezioni.
function Wave({ color, flip = false }) {
  return (
    <svg className={`wave ${flip ? "is-flipped" : ""}`} viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 30 C 160 60, 320 0, 480 30 S 800 60, 960 30 S 1280 0, 1440 30 V60 H0 Z" fill={color} />
    </svg>
  );
}

const FEATURES = [
  { icon: "fa-pen-ruler", title: "Disegni in scala", text: "Segna gli angoli dell'aiuola: lati, superficie e perimetro sono in metri veri." },
  { icon: "fa-seedling", title: "Scegli le piante giuste", text: "Per sole, acqua, terreno e colori, con le avvertenze per animali e bambini." },
  { icon: "fa-wand-magic-sparkles", title: "Consigli su misura", text: "Racconta i tuoi gusti: l'intelligenza artificiale ti propone l'aiuola e la dispone." },
  { icon: "fa-droplet", title: "Acqua senza sprechi", text: "Impianto a goccia calcolato dal rubinetto, con materiali e orari migliori." },
  { icon: "fa-calendar-days", title: "Un calendario che ricorda", text: "Potature, concimi, semine e raccolte al momento giusto per la tua zona." },
  { icon: "fa-cloud-sun-rain", title: "Occhio al meteo", text: "Avvisi di gelo, caldo, vento e pioggia, per proteggere quello che hai piantato." },
];

const PLACES = [
  {
    key: "garden",
    title: "Il giardino",
    text: "Aiuole fiorite con bordure in pietra, mattoni o legno, pacciamatura e piante che si danno il cambio tutto l'anno.",
    icons: [["rose", ["#e88fb4"], "Rosa"], ["spike", ["#9b6fc4"], "Lavanda"], ["daisy", ["#f2c94c"], "rudbeckia"]],
  },
  {
    key: "balcony",
    title: "Il balcone",
    text: "Vasi, fioriere da ringhiera e cesti appesi: anche pochi metri in città possono diventare un piccolo giardino.",
    icons: [["flower", ["#d64545"], "Geranio"], ["groundcover", ["#5b8fd9"], "Lobelia"], ["cluster", ["#5b8fd9", "#e88fb4"], "Ortensia"]],
  },
  {
    key: "vegetable",
    title: "L'orto",
    text: "File ordinate con le distanze giuste, piante amiche vicine e la rotazione delle colture ricordata anno dopo anno.",
    icons: [["fruiting", ["#d64545"], "Pomodoro"], ["leafy", [], "Lattuga"], ["squash", ["#f2c94c"], "Zucchina"]],
  },
];

const SEASONS = [
  { name: "Primavera", icon: "fa-seedling", items: ["Potatura delle rose", "Semina dei pomodori", "Prima concimazione"] },
  { name: "Estate", icon: "fa-sun", items: ["Irrigazione all'alba", "Fiori appassiti via", "Raccolta in orto"] },
  { name: "Autunno", icon: "fa-leaf", items: ["Bulbi per la primavera", "Taglio delle perenni", "Fine stagione dell'orto"] },
  { name: "Inverno", icon: "fa-snowflake", items: ["Protezione dal gelo", "Vasi al riparo", "Si progetta l'anno nuovo"] },
];

export default function Home() {
  return (
    <div className="home">
      {/* ---------- Apertura ---------- */}
      <section className="home-hero" style={{ backgroundImage: `url(${background})` }}>
        <div className="home-hero-inner">
          <p className="script">dall'agriturismo al tuo balcone</p>
          <h1>
            Il tuo giardino,
            <br />
            <em>progettato con cura</em>
          </h1>
          <p className="lead">
            Disegna aiuole, balconi e orti in scala reale, scegli le piante adatte e ricevi i consigli giusti, stagione dopo stagione.
          </p>
          <div className="home-cta">
            <Link to="/gardencanvas" className="btn-country is-primary">
              <i className="fa-solid fa-trowel" /> Inizia a progettare
            </Link>
            <Link to="/calendario" className="btn-country is-light">
              <i className="fa-solid fa-calendar-days" /> Il calendario
            </Link>
          </div>
          <p className="hero-note">Gratis, senza registrazione · funziona anche dal telefono</p>
        </div>
        <Wave color="#f7f1e3" />
      </section>

      {/* ---------- Cosa puoi fare ---------- */}
      <section className="home-section paper">
        <div className="container">
          <div className="section-title">
            <Sprig />
            <div>
              <p className="script">tutto quello che serve</p>
              <h2>Dal primo disegno al primo fiore</h2>
            </div>
            <Sprig flip />
          </div>
          <div className="feature-grid">
            {FEATURES.map((f) => (
              <article key={f.title} className="feature-card">
                <span className="feature-badge">
                  <i className={`fa-solid ${f.icon}`} />
                </span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Tre ambienti ---------- */}
      <section className="home-section sage">
        <Wave color="#f7f1e3" flip />
        <div className="container">
          <div className="section-title is-light">
            <div>
              <p className="script">dove vuoi coltivare?</p>
              <h2>Giardino, balcone o orto</h2>
            </div>
          </div>
          <div className="places">
            {PLACES.map((p) => (
              <article key={p.key} className="place-card">
                <div className={`place-scene scene-${p.key}`}>
                  {p.icons.map(([type, colors, name], i) => (
                    <img key={name} src={getIconUrl(type, colors, 160, name)} alt="" className={`scene-plant p${i}`} />
                  ))}
                </div>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </article>
            ))}
          </div>
          <p className="has-text-centered mt-5">
            <Link to="/gardencanvas" className="btn-country is-cream">
              Scegli il tuo spazio <i className="fa-solid fa-arrow-right" />
            </Link>
          </p>
        </div>
        <Wave color="#f7f1e3" />
      </section>

      {/* ---------- Le stagioni ---------- */}
      <section className="home-section paper">
        <div className="container">
          <div className="section-title">
            <Sprig />
            <div>
              <p className="script">ogni cosa a suo tempo</p>
              <h2>Il calendario del tuo verde</h2>
            </div>
            <Sprig flip />
          </div>
          <div className="seasons">
            {SEASONS.map((s) => (
              <div key={s.name} className="season">
                <h3>
                  <i className={`fa-solid ${s.icon}`} /> {s.name}
                </h3>
                <ul>
                  {s.items.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="season-note">
            Le date si adattano a Nord, Centro e Sud. Con l'account ricevi i promemoria sul telefono o via email.
          </p>
        </div>
      </section>

      {/* ---------- Chi c'è dietro ---------- */}
      <section className="home-section story">
        <div className="container">
          <blockquote>
            <p>
              «AiuolaLab è nato tra i fiori del mio agriturismo, ad Arezzo, e dai consigli di tanti vivaisti. Volevo uno strumento
              semplice per progettare il verde come si fa in campagna: con pazienza, con cura e al momento giusto.»
            </p>
            <footer>
              <span className="script">Riccardo Giangani</span>
              <Link to="/aboutme">La mia storia</Link>
            </footer>
          </blockquote>
        </div>
      </section>

      {/* ---------- Invito finale ---------- */}
      <section className="home-final">
        <div className="gingham" aria-hidden="true" />
        <div className="container final-inner">
          <h2>Pronto a mettere le mani nella terra?</h2>
          <p>Il primo progetto richiede due minuti. Il resto lo fa la natura.</p>
          <Link to="/gardencanvas" className="btn-country is-primary">
            <i className="fa-solid fa-seedling" /> Progetta adesso
          </Link>
        </div>
      </section>
    </div>
  );
}
