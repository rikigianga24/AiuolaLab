import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { searchPlants } from "../lib/api";
import { GARDEN_STYLES, MAINTENANCE_LABEL, STYLE_BY_ID } from "../lib/gardenStyles";
import { COST_LABEL, guideFor } from "../lib/styleGuide";
import { STYLES_HERO, hasStylePhoto } from "../lib/stylePhotos";
import { PageHero, SectionTitle } from "./decor";
import StyleScene, { StyleImage } from "./styles/StyleScene";
import "../styles/pages.css";
import "../styles/gardenStyles.css";

// Mini questionario: quattro domande semplici, punteggio per ogni stile.
const QUESTIONS = [
  {
    id: "size",
    q: "Quanto spazio hai?",
    options: {
      balcone: { label: "Balcone o terrazzo", icon: "fa-building", size: "balcone" },
      piccolo: { label: "Giardino piccolo", icon: "fa-house", size: "piccolo" },
      grande: { label: "Giardino grande", icon: "fa-tree", size: "grande" },
    },
  },
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
      const opt = q.options[a];
      // lo spazio esclude gli stili che non ci stanno (es. alla francese sul balcone)
      if (opt.size) for (const s of GARDEN_STYLES) score[s.id] += guideFor(s.id)?.sizes.includes(opt.size) ? 1 : -10;
      else for (const [id, pts] of Object.entries(opt.styles)) score[id] += pts;
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
              <Link key={s.id} to={`/stili/${s.id}`} className={`quiz-pick ${i === 0 ? "is-best" : ""}`}>
                {i === 0 && <span className="quiz-best">il più adatto</span>}
                <strong>{s.name}</strong>
                <small>{s.tagline}</small>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const AI_NOTE = "Le foto sono immagini illustrative create con l'intelligenza artificiale, non giardini reali.";

// Elenco di tutti gli stili: apertura con foto, questionario e schede.
export default function StylesPage() {
  const { hash } = useLocation();
  const navigate = useNavigate();
  // i vecchi link /stili#cottage portano alla pagina dello stile
  useEffect(() => {
    const id = hash.slice(1);
    if (STYLE_BY_ID[id]) navigate(`/stili/${id}`, { replace: true });
  }, [hash, navigate]);

  const anyPhoto = GARDEN_STYLES.some((s) => hasStylePhoto(s.id));
  return (
    <div className="page styles-page">
      <PageHero
        image={STYLES_HERO}
        script="per chi parte da zero"
        title="Stili di giardino"
        lead="Cottage, all'italiana, giapponese, mediterraneo… Ogni stile ha la sua storia, le sue piante e il suo modo di stare insieme. Scopri quale ti somiglia, anche se hai solo un balcone."
      />

      <section className="page-body">
        <div className="container">
          <Quiz />

          <SectionTitle script="tutti gli stili" title="Sfoglia e confronta" />
          <div className="style-grid">
            {GARDEN_STYLES.map((s) => {
              const g = guideFor(s.id);
              return (
                <Link key={s.id} to={`/stili/${s.id}`} className="style-card">
                  <StyleImage style={s} sizes="(max-width: 600px) 100vw, (max-width: 1100px) 50vw, 300px" />
                  <div className="style-card-body">
                    <h3>{s.name}</h3>
                    <p>{s.tagline}</p>
                    <div className="style-card-tags">
                      <span className={`style-maint is-${s.maintenance.replace(" ", "-")}`}>{MAINTENANCE_LABEL[s.maintenance]}</span>
                      {g?.sizes.includes("balcone") && (
                        <span className="style-balcony-tag">
                          <i className="fa-solid fa-building" /> anche sul balcone
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          {anyPhoto && <p className="style-ai-note">{AI_NOTE}</p>}
        </div>
      </section>
    </div>
  );
}

function usePlantCount(styleId) {
  const [result, setResult] = useState({ id: null, count: null });
  useEffect(() => {
    let alive = true;
    searchPlants({ style: styleId, page: 1 })
      .then((r) => alive && setResult({ id: styleId, count: r.total }))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [styleId]);
  return result.id === styleId ? result.count : null;
}

const SIZE_LABEL = { balcone: "balcone", piccolo: "giardino piccolo", grande: "giardino grande" };

const SEASONS = [
  ["primavera", "Primavera", "fa-seedling"],
  ["estate", "Estate", "fa-sun"],
  ["autunno", "Autunno", "fa-leaf"],
  ["inverno", "Inverno", "fa-snowflake"],
];

const plantLink = (p) => `/piante?q=${encodeURIComponent(p.replace(/\s*\(.*\)/, "").split(" ")[0])}`;

// Pagina di un singolo stile: /stili/<id>
export function StylePage() {
  const { id } = useParams();
  const s = STYLE_BY_ID[id];
  const count = usePlantCount(id);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);
  if (!s) return <Navigate to="/stili" replace />;

  const g = guideFor(s.id);
  const i = GARDEN_STYLES.indexOf(s);
  const prev = GARDEN_STYLES[(i - 1 + GARDEN_STYLES.length) % GARDEN_STYLES.length];
  const next = GARDEN_STYLES[(i + 1) % GARDEN_STYLES.length];
  const photo = hasStylePhoto(s.id);
  const maintClass = `style-maint is-${s.maintenance.replace(" ", "-")}`;

  return (
    <div className="page style-page">
      <header className={`style-hero ${photo ? "has-photo" : ""}`}>
        {photo && <StyleImage style={s} width={1536} height={1024} sizes="100vw" eager />}
        <div className="style-hero-inner">
          <nav className="style-crumbs" aria-label="Percorso">
            <Link to="/stili">
              <i className="fa-solid fa-arrow-left" /> Tutti gli stili
            </Link>
          </nav>
          <p className="script">{s.short.toLowerCase()}</p>
          <h1>{s.name}</h1>
          <p className="style-hero-lead">{s.tagline}</p>
        </div>
      </header>

      <section className="page-body">
        <div className="container style-page-body">
          <div className="style-facts" aria-label="In breve">
            <div className="style-fact">
              <i className="fa-solid fa-scissors" />
              <strong>Manutenzione</strong>
              <span className={maintClass}>{s.maintenance}</span>
            </div>
            {g && (
              <>
                <div className="style-fact">
                  <i className="fa-solid fa-euro-sign" />
                  <strong>Costo</strong>
                  <span className="style-cost" aria-label={COST_LABEL[g.cost.level]}>
                    {"€".repeat(g.cost.level)}
                    <span className="is-off">{"€".repeat(3 - g.cost.level)}</span>
                  </span>
                </div>
                <div className="style-fact">
                  <i className="fa-solid fa-ruler-combined" />
                  <strong>Spazio</strong>
                  <span>{g.sizes.map((z) => SIZE_LABEL[z]).join(" · ")}</span>
                </div>
              </>
            )}
          </div>

          <div className="style-columns">
            <div className="style-detail-text">
              <h2>Cos'è</h2>
              <p>{s.what}</p>
              <h2>Da dove viene</h2>
              <p>{s.origin}</p>
              <h2>Come si riconosce</h2>
              <ul className="style-list">
                {s.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <h2>Dove si usa</h2>
              <ul className="style-chips">
                {s.where.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
              <h2>Piante tipiche</h2>
              <div className="style-plants">
                {s.plants.map((p) => (
                  <Link key={p} to={plantLink(p)}>
                    {p}
                  </Link>
                ))}
              </div>

              {g && (
                <>
                  <h2>In pratica</h2>
                  <dl className="style-practical">
                    <div>
                      <dt>
                        <i className="fa-solid fa-euro-sign" /> Quanto costa
                      </dt>
                      <dd>{g.cost.text}</dd>
                    </div>
                    <div>
                      <dt>
                        <i className="fa-solid fa-ruler-combined" /> Quanto spazio serve
                      </dt>
                      <dd>{g.space}</dd>
                    </div>
                    <div>
                      <dt>
                        <i className="fa-solid fa-circle-check" /> Ideale se
                      </dt>
                      <dd>{s.ideal}</dd>
                    </div>
                  </dl>
                  <p className="style-mistake">
                    <i className="fa-solid fa-triangle-exclamation" /> <strong>L'errore più comune:</strong> {g.mistake}
                  </p>

                  <h2>Durante l'anno</h2>
                  <div className="style-seasons">
                    {SEASONS.map(([k, label, icon]) => (
                      <div key={k} className={`style-season is-${k}`}>
                        <strong>
                          <i className={`fa-solid ${icon}`} /> {label}
                        </strong>
                        <p>{g.seasons[k]}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <aside className="style-side">
              {g && (
                <div className="style-balcony card-country">
                  <p className="script">non hai un giardino?</p>
                  <h2>
                    <i className="fa-solid fa-building" /> Sul balcone
                  </h2>
                  <p>{g.balcony.text}</p>
                  <div className="style-plants">
                    {g.balcony.plants.map((p) => (
                      <Link key={p} to={plantLink(p)}>
                        {p}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="style-project">
                <h2>Nel tuo progetto</h2>
                <p>Così appare questo stile visto dall'alto, come lo disegni su AiuolaLab.</p>
                <StyleScene style={s} width={420} height={260} />
                <div className="style-palette" aria-label="Colori tipici">
                  {s.palette.map((c) => (
                    <span key={c} style={{ background: c }} />
                  ))}
                  <small>colori tipici</small>
                </div>
                <div className="style-actions">
                  <Link to={`/piante?stile=${s.id}`} className="btn-country is-primary is-small">
                    <i className="fa-solid fa-seedling" /> {count != null ? `Vedi le ${count} piante adatte` : "Vedi le piante adatte"}
                  </Link>
                  <Link to={`/gardencanvas?stile=${s.id}`} className="btn-country is-light is-small">
                    <i className="fa-solid fa-trowel" /> Progetta in questo stile
                  </Link>
                </div>
              </div>
            </aside>
          </div>

          <nav className="style-pager" aria-label="Altri stili">
            <Link to={`/stili/${prev.id}`}>
              <i className="fa-solid fa-arrow-left" />
              <span>
                <small>precedente</small>
                {prev.name}
              </span>
            </Link>
            <Link to={`/stili/${next.id}`} className="is-next">
              <span>
                <small>successivo</small>
                {next.name}
              </span>
              <i className="fa-solid fa-arrow-right" />
            </Link>
          </nav>
          {photo && <p className="style-ai-note">{AI_NOTE}</p>}
        </div>
      </section>
    </div>
  );
}
