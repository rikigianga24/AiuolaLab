import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getIconUrl } from "../lib/plantIcons";
import { Sprig, Wave } from "./decor";
import background from "../styles/hp-background.webp";
import "../styles/home.css";

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

const FAVORITE_IDEAS = [
  { label: "Rosa", q: "rosa", icon: ["rose", ["#e88fb4"]] },
  { label: "Lavanda", q: "lavanda", icon: ["spike", ["#9b6fc4"]] },
  { label: "Ortensia", q: "ortensia", icon: ["cluster", ["#5b8fd9", "#e88fb4"]] },
  { label: "Geranio", q: "geranio", icon: ["flower", ["#d64545"]] },
  { label: "Margherita", q: "rudbeckia", icon: ["daisy", ["#f2c94c"]] },
  { label: "Pomodoro", q: "pomodoro", tab: "orto", icon: ["fruiting", ["#d64545"]] },
];

const STEPS = [
  { icon: "fa-heart", title: "Scegli le piante", text: "Sfoglia le schede con le foto e tocca il cuore su quelle che ti piacciono." },
  { icon: "fa-pen-ruler", title: "Disegna lo spazio", text: "Aiuola, balcone o orto: le tue preferite sono già pronte nel catalogo." },
  { icon: "fa-bell", title: "Prenditene cura", text: "Calendario, promemoria e avvisi meteo per tutto l'anno." },
];

function FavoriteQuestion() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const go = (query, tab) => navigate(`/piante?${new URLSearchParams({ ...(tab ? { tab } : {}), ...(query ? { q: query } : {}) })}`);
  return (
    <section className="home-section paper fav-question">
      <div className="container">
        <div className="fq-card">
          <p className="script">cominciamo da qui</p>
          <h2>Qual è la tua pianta preferita?</h2>
          <p className="fq-lead">Prima scegli le piante che ti piacciono, poi disegni lo spazio: AiuolaLab te le fa trovare già pronte.</p>
          <form
            className="fq-form"
            onSubmit={(e) => {
              e.preventDefault();
              go(q.trim());
            }}
          >
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Scrivi una pianta: rosa, lavanda, gelsomino…" aria-label="La tua pianta preferita" />
            <button type="submit" className="btn-country is-primary is-small">
              Cerca
            </button>
          </form>
          <div className="fq-ideas">
            {FAVORITE_IDEAS.map((idea) => (
              <button key={idea.label} type="button" onClick={() => go(idea.q, idea.tab)}>
                <img src={getIconUrl(idea.icon[0], idea.icon[1], 96, idea.label)} alt="" />
                {idea.label}
              </button>
            ))}
          </div>
          <p className="fq-browse">
            Non sai ancora? <Link to="/piante">Sfoglia tutte le piante</Link> oppure <Link to="/stili">scopri gli stili di giardino</Link>
          </p>
        </div>
        <ol className="fq-steps">
          {STEPS.map((st, i) => (
            <li key={st.title}>
              <span className="fq-num">{i + 1}</span>
              <span className="badge-round">
                <i className={`fa-solid ${st.icon}`} />
              </span>
              <div>
                <h3>{st.title}</h3>
                <p>{st.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

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
            <Link to="/piante" className="btn-country is-primary">
              <i className="fa-solid fa-heart" /> Scegli le tue piante
            </Link>
            <Link to="/gardencanvas" className="btn-country is-light">
              <i className="fa-solid fa-trowel" /> Progetta subito
            </Link>
          </div>
          <p className="hero-note">Gratis, senza registrazione · funziona anche dal telefono</p>
        </div>
        <Wave color="#f7f1e3" />
      </section>

      {/* ---------- La pianta preferita ---------- */}
      <FavoriteQuestion />

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
