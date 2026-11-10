import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { FERTILIZERS, MONTHS_SHORT, NUTRIENTS, npkText } from "../lib/fertilizers";
import { DISEASES, FEEDING_CALENDAR, FEEDING_RULES, LABEL_WORDS, MYTHS, PESTS, SYMPTOMS, TIPS } from "../lib/guide";
import { PageHero, SectionTitle } from "./decor";
import "../styles/pages.css";
import "../styles/guide.css";

const SECTIONS = [
  { id: "concimi", label: "NPK in parole semplici", icon: "fa-flask" },
  { id: "tipi", label: "Tipi di concime", icon: "fa-box-open" },
  { id: "quando", label: "Quando concimare", icon: "fa-calendar-days" },
  { id: "carenze", label: "Leggere le foglie", icon: "fa-leaf" },
  { id: "malattie", label: "Malattie", icon: "fa-virus" },
  { id: "parassiti", label: "Parassiti", icon: "fa-bug" },
  { id: "trucchi", label: "Trucchi", icon: "fa-lightbulb" },
  { id: "miti", label: "Falsi miti", icon: "fa-circle-question" },
];

// Colore di ogni concime nel calendario.
const FEED_COLORS = {
  universale: "#8a9a5b", organico: "#8c6a46", rose: "#c45b7a", azoto: "#4f7942", fosforo: "#c0643b", potassio: "#7b5ea7",
  fioritura: "#d9822b", acidofile: "#3f7f9c", agrumi: "#e0b22e", frutto: "#b8432f", foglia: "#5f9e4f", succulente: "#4fa39a",
  bulbi: "#a0688c", lentaCessione: "#6b7a8f", ferro: "#a65e2e", poco: "#c9c2b1",
};

function NpkBars({ npk }) {
  const max = 25;
  return (
    <div className="npk-bars" aria-label={`Azoto ${npk[0]}, fosforo ${npk[1]}, potassio ${npk[2]}`}>
      {["N", "P", "K"].map((k, i) => (
        <div key={k} className="npk-bar">
          <span className="npk-key" style={{ color: NUTRIENTS[k].color }}>
            {k}
          </span>
          <span className="npk-track">
            <span style={{ width: `${Math.min(100, (npk[i] / max) * 100)}%`, background: NUTRIENTS[k].color }} />
          </span>
          <span className="npk-val">{npk[i]}</span>
        </div>
      ))}
    </div>
  );
}

function FertilizerCard({ id, f }) {
  return (
    <article className="guide-card fert-card" id={`concime-${id}`}>
      <header>
        <span className="fert-dot" style={{ background: FEED_COLORS[id] }} />
        <h3>{f.label}</h3>
      </header>
      {f.npk.some(Boolean) ? <NpkBars npk={f.npk} /> : <p className="fert-npk-none">{f.extra ?? "nessun titolo NPK"}</p>}
      <p className="fert-meta">
        {npkText(f) && <strong>{npkText(f)}</strong>}
        {f.extra && f.npk.some(Boolean) && ` ${f.extra}`}
        {f.kind !== "—" && ` · ${f.kind} · ${f.form}`}
      </p>
      <p>{f.what}</p>
      <p className="fert-when">
        <i className="fa-solid fa-clock" /> {f.when}
      </p>
      {f.examples?.length > 0 && (
        <p className="fert-examples">
          <i className="fa-solid fa-bag-shopping" /> {f.examples.join(" · ")}
        </p>
      )}
      {f.caution && (
        <p className="guide-caution">
          <i className="fa-solid fa-triangle-exclamation" /> {f.caution}
        </p>
      )}
    </article>
  );
}

function FeedingCalendar() {
  const used = [...new Set(FEEDING_CALENDAR.flatMap((r) => Object.values(r.months)))];
  return (
    <>
      <div className="feed-cal-wrap">
        <table className="feed-cal">
          <thead>
            <tr>
              <th />
              {MONTHS_SHORT.map((m) => (
                <th key={m}>{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FEEDING_CALENDAR.map((row) => (
              <tr key={row.who}>
                <th>{row.who}</th>
                {MONTHS_SHORT.map((m, i) => {
                  const id = row.months[i + 1];
                  return (
                    <td key={m}>
                      {id && <span className="feed-cell" style={{ background: FEED_COLORS[id] }} title={`${MONTHS_SHORT[i]}: ${FERTILIZERS[id].label}`} />}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="feed-legend">
        {used.map((id) => (
          <li key={id}>
            <a href={`#concime-${id}`}>
              <span className="fert-dot" style={{ background: FEED_COLORS[id] }} /> {FERTILIZERS[id].label}
            </a>
          </li>
        ))}
      </ul>
      <p className="guide-note">
        Mesi indicativi per il Centro Italia: al Nord sposta tutto di 2-3 settimane più tardi, al Sud e sulle coste 2-3 settimane prima. Nel
        calendario dell'app i mesi si adattano già alla tua zona.
      </p>
    </>
  );
}

function Problem({ p, kind }) {
  return (
    <details className="guide-card problem">
      <summary>
        <i className={`fa-solid ${p.icon}`} />
        <span>
          <strong>{p.name}</strong>
          <small>{p.who}</small>
        </span>
      </summary>
      <dl>
        <dt>Quando</dt>
        <dd>{p.when}</dd>
        <dt>Come si riconosce</dt>
        <dd>{p.signs}</dd>
        {p.prevent && (
          <>
            <dt>Prevenzione</dt>
            <dd>{p.prevent}</dd>
          </>
        )}
        <dt>{kind === "pest" ? "Come difendersi" : "Cosa fare"}</dt>
        <dd>{p.cure}</dd>
        {p.tip && (
          <>
            <dt>Da sapere</dt>
            <dd>{p.tip}</dd>
          </>
        )}
      </dl>
    </details>
  );
}

export default function GuidePage() {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(hash.slice(1));
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash]);

  return (
    <div className="page guide-page">
      <PageHero
        script="quello che nessuno ti dice"
        title="Guida al giardino"
        lead="Concimi e NPK spiegati semplici, quando darli, come leggere le foglie, malattie e parassiti più comuni in Italia, trucchi e falsi miti."
      >
        <nav className="guide-toc" aria-label="Indice della guida">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`}>
              <i className={`fa-solid ${s.icon}`} /> {s.label}
            </a>
          ))}
        </nav>
      </PageHero>

      <section className="page-body">
        <div className="container guide-body">
          <section id="concimi" className="guide-section">
            <SectionTitle script="le tre lettere sul sacco" title="NPK in parole semplici" />
            <div className="nutrient-grid">
              {Object.entries(NUTRIENTS).map(([k, n]) => (
                <div key={k} className="guide-card nutrient" style={{ borderTopColor: n.color }}>
                  <span className="nutrient-letter" style={{ color: n.color }}>
                    {k}
                  </span>
                  <h3>{n.label}</h3>
                  <p>{n.role}</p>
                </div>
              ))}
            </div>
            <p className="guide-lead">
              Un modo facile per ricordarlo: <strong>N</strong> fa crescere quello che sta sopra (foglie), <strong>P</strong> quello che sta
              sotto (radici) e fa partire i fiori, <strong>K</strong> fa tutto il resto: fiori, frutti, sapore e resistenza a freddo, caldo e
              malattie. Un concime "per fioritura" ha quindi P e K più alti di N; uno "per siepi" ha N alto.
            </p>
            <h3 className="guide-h3">Come leggere l'etichetta</h3>
            <dl className="label-words">
              {LABEL_WORDS.map((w) => (
                <div key={w.word}>
                  <dt>{w.word}</dt>
                  <dd>{w.text}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section id="tipi" className="guide-section">
            <SectionTitle script="quale comprare" title="Tipi di concime" />
            <p className="guide-lead">I titoli NPK sono quelli tipici dei prodotti in commercio: l'etichetta del prodotto che compri può variare di poco.</p>
            <div className="fert-grid">
              {Object.entries(FERTILIZERS).map(([id, f]) => (
                <FertilizerCard key={id} id={id} f={f} />
              ))}
            </div>
          </section>

          <section id="quando" className="guide-section">
            <SectionTitle script="regole d'oro" title="Quando e come concimare" />
            <div className="rule-grid">
              {FEEDING_RULES.map((r) => (
                <div key={r.title} className="guide-card rule">
                  <i className={`fa-solid ${r.icon}`} />
                  <h3>{r.title}</h3>
                  <p>{r.text}</p>
                </div>
              ))}
            </div>
            <h3 className="guide-h3">Calendario della concimazione</h3>
            <FeedingCalendar />
          </section>

          <section id="carenze" className="guide-section">
            <SectionTitle script="la pianta ti parla" title="Leggere le foglie" />
            <p className="guide-lead">
              Prima regola: guarda <strong>quali</strong> foglie ingialliscono. Se sono quelle vecchie in basso manca un elemento che la pianta sposta
              verso i germogli (azoto, potassio, magnesio); se sono quelle giovani in cima manca un elemento che non riesce a spostare (ferro).
            </p>
            <div className="symptom-list">
              {SYMPTOMS.map((s) => (
                <div key={s.cause} className="guide-card symptom">
                  <span className={`symptom-tag tone-${s.tone === "!" ? "warn" : s.tone}`}>{s.tone}</span>
                  <div>
                    <p className="symptom-look">{s.look}</p>
                    <p>
                      <strong>{s.cause}.</strong> {s.fix}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section id="malattie" className="guide-section">
            <SectionTitle script="funghi e batteri" title="Malattie più comuni" />
            <p className="guide-lead">
              Quasi tutte le malattie fungine nascono da umidità ferma sulle foglie. Prevenire costa molto meno che curare: spazio tra le piante,
              acqua al piede e di mattina, foglie malate eliminate subito.
            </p>
            <div className="problem-list">
              {DISEASES.map((d) => (
                <Problem key={d.name} p={d} kind="disease" />
              ))}
            </div>
          </section>

          <section id="parassiti" className="guide-section">
            <SectionTitle script="insetti e compagnia" title="Parassiti" />
            <p className="guide-lead">
              Per l'uso hobbistico si possono comprare solo prodotti con la dicitura "per piante non professionali" (PFnPO). Leggi sempre
              l'etichetta, rispetta i giorni di carenza prima di raccogliere e non trattare in fioritura: le api ringraziano.
            </p>
            <div className="problem-list">
              {PESTS.map((p) => (
                <Problem key={p.name} p={p} kind="pest" />
              ))}
            </div>
          </section>

          <section id="trucchi" className="guide-section">
            <SectionTitle script="cose non scontate" title="Trucchi e consigli" />
            <div className="rule-grid">
              {TIPS.map((t) => (
                <div key={t.title} className="guide-card rule">
                  <i className={`fa-solid ${t.icon}`} />
                  <h3>{t.title}</h3>
                  <p>{t.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="miti" className="guide-section">
            <SectionTitle script="vero o falso?" title="Falsi miti" />
            <div className="myth-list">
              {MYTHS.map((m) => (
                <div key={m.myth} className="guide-card myth">
                  <p className="myth-q">
                    <i className="fa-solid fa-xmark" /> {m.myth}
                  </p>
                  <p className="myth-a">
                    <i className="fa-solid fa-check" /> {m.truth}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
