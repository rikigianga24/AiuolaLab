import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { searchPlants } from "../lib/api";
import { GARDEN_STYLES, MAINTENANCE_LABEL } from "../lib/gardenStyles";
import { PageHero, SectionTitle } from "./decor";
import StyleScene from "./styles/StyleScene";
import "../styles/pages.css";
import "../styles/gardenStyles.css";

// Mini questionario: tre domande semplici, punteggio per ogni stile.
const QUESTIONS = [
  {
    id: "sun",
    q: "Quanto sole prende lo spazio?",
    options: {
      sole: { label: "Tanto sole", icon: "fa-sun", styles: { mediterraneo: 2, naturalistico: 2, roccioso: 2, cottage: 1, impollinatori: 2, moderno: 1, italiano: 1, francese: 1, geometrico: 1 } },
      meta: { label: "Mezza giornata", icon: "fa-cloud-sun", styles: { cottage: 2, giapponese: 2, ombra: 1, moderno: 1, impollinatori: 1, naturalistico: 1 } },
      ombra: { label: "Poco o niente", icon: "fa-cloud", styles: { ombra: 3, giapponese: 2 } },
    },
  },
  {
    id: "time",
    q: "Quanto tempo vuoi dedicargli?",
    options: {
      poco: { label: "Pochissimo", icon: "fa-mug-hot", styles: { mediterraneo: 2, naturalistico: 2, roccioso: 2, moderno: 2, impollinatori: 1, ombra: 1 } },
      medio: { label: "Un po' ogni settimana", icon: "fa-calendar-week", styles: { cottage: 2, giapponese: 2, ombra: 1, impollinatori: 1 } },
      tanto: { label: "Mi piace curarlo", icon: "fa-scissors", styles: { italiano: 2, francese: 2, geometrico: 2, cottage: 1 } },
    },
  },
  {
    id: "mood",
    q: "Che effetto ti piace?",
    options: {
      romantico: { label: "Romantico e fiorito", icon: "fa-heart", styles: { cottage: 3, impollinatori: 1 } },
      ordinato: { label: "Ordinato ed elegante", icon: "fa-border-all", styles: { italiano: 3, francese: 2, geometrico: 2, moderno: 1 } },
      naturale: { label: "Selvatico e naturale", icon: "fa-leaf", styles: { naturalistico: 3, mediterraneo: 2, roccioso: 1, ombra: 1, impollinatori: 2 } },
      essenziale: { label: "Essenziale e calmo", icon: "fa-spa", styles: { giapponese: 3, moderno: 3 } },
    },
  },
];

function Quiz() {
  const [answers, setAnswers] = useState({});
  const done = Object.keys(answers).length === QUESTIONS.length;
  const ranking = useMemo(() => {
    const score = Object.fromEntries(GARDEN_STYLES.map((s) => [s.id, 0]));
    for (const q of QUESTIONS) {
      const a = answers[q.id];
      if (!a) continue;
      for (const [id, pts] of Object.entries(q.options[a].styles)) score[id] += pts;
    }
    return GARDEN_STYLES.map((s) => ({ s, pts: score[s.id] }))
      .sort((a, b) => b.pts - a.pts)
      .slice(0, 3);
  }, [answers]);

  return (
    <div className="card-country style-quiz">
      <p className="script">non sai da dove partire?</p>
      <h2>Quale fa per te?</h2>
      {QUESTIONS.map((q) => (
        <div key={q.id} className="quiz-q">
          <p className="quiz-label">{q.q}</p>
          <div className="choice-row">
            {Object.entries(q.options).map(([k, o]) => (
              <button key={k} type="button" className={`choice ${answers[q.id] === k ? "is-active" : ""}`} onClick={() => setAnswers((a) => ({ ...a, [q.id]: k }))} aria-pressed={answers[q.id] === k}>
                <i className={`fa-solid ${o.icon}`} /> {o.label}
              </button>
            ))}
          </div>
        </div>
      ))}
      {done && (
        <div className="quiz-result" role="status">
          <p className="quiz-label">Per te:</p>
          <div className="quiz-picks">
            {ranking.map(({ s }, i) => (
              <a key={s.id} href={`#${s.id}`} className={`quiz-pick ${i === 0 ? "is-best" : ""}`}>
                {i === 0 && <span className="quiz-best">il più adatto</span>}
                <strong>{s.name}</strong>
                <small>{s.tagline}</small>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StyleDetail({ s, count }) {
  return (
    <article id={s.id} className="style-detail">
      <div className="style-detail-visual">
        <StyleScene style={s} width={420} height={260} />
        <div className="style-palette" aria-label="Colori tipici">
          {s.palette.map((c) => (
            <span key={c} style={{ background: c }} />
          ))}
          <small>colori tipici</small>
        </div>
      </div>
      <div className="style-detail-text">
        <p className="script">{s.short.toLowerCase()}</p>
        <h2>{s.name}</h2>
        <p className="style-tagline">{s.tagline}</p>
        <h3>Cos'è</h3>
        <p>{s.what}</p>
        <h3>Da dove viene</h3>
        <p>{s.origin}</p>
        <h3>Dove si usa</h3>
        <ul className="style-chips">
          {s.where.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
        <h3>Come si riconosce</h3>
        <ul className="style-list">
          {s.features.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        <h3>Piante tipiche</h3>
        <div className="style-plants">
          {s.plants.map((p) => (
            <Link key={p} to={`/piante?q=${encodeURIComponent(p.replace(/\s*\(.*\)/, "").split(" ")[0])}`}>
              {p}
            </Link>
          ))}
        </div>
        <p className="style-ideal">
          <i className="fa-solid fa-circle-check" /> <strong>Ideale se:</strong> {s.ideal}
        </p>
        <p className={`style-maint is-${s.maintenance.replace(" ", "-")}`}>
          <i className="fa-solid fa-scissors" /> {MAINTENANCE_LABEL[s.maintenance]}
        </p>
        <div className="style-actions">
          <Link to={`/piante?stile=${s.id}`} className="btn-country is-primary is-small">
            <i className="fa-solid fa-seedling" /> {count != null ? `Vedi le ${count} piante adatte` : "Vedi le piante adatte"}
          </Link>
          <Link to={`/gardencanvas?stile=${s.id}`} className="btn-country is-light is-small">
            <i className="fa-solid fa-trowel" /> Progetta in questo stile
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function StylesPage() {
  const [counts, setCounts] = useState({});
  useEffect(() => {
    let alive = true;
    Promise.all(GARDEN_STYLES.map((s) => searchPlants({ style: s.id, page: 1 }).then((r) => [s.id, r.total]).catch(() => [s.id, null]))).then(
      (list) => alive && setCounts(Object.fromEntries(list)),
    );
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="page styles-page">
      <PageHero
        script="per chi parte da zero"
        title="Stili di giardino"
        lead="Cottage, all'italiana, giapponese, mediterraneo… Ogni stile ha la sua storia, le sue piante e il suo modo di stare insieme. Scopri quale ti somiglia: poi le piante del catalogo le filtri proprio così."
      />

      <section className="page-body">
        <div className="container">
          <Quiz />

          <SectionTitle script="tutti gli stili" title="Sfoglia e confronta" />
          <div className="style-grid">
            {GARDEN_STYLES.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="style-card">
                <StyleScene style={s} />
                <div className="style-card-body">
                  <h3>{s.name}</h3>
                  <p>{s.tagline}</p>
                  <span className={`style-maint is-${s.maintenance.replace(" ", "-")}`}>{MAINTENANCE_LABEL[s.maintenance]}</span>
                </div>
              </a>
            ))}
          </div>

          <div className="style-details">
            {GARDEN_STYLES.map((s) => (
              <StyleDetail key={s.id} s={s} count={counts[s.id]} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
