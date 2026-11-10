import { useEffect, useState } from "react";
import { searchPlants } from "../../lib/api";
import { SPEED_LABEL, overlapText } from "../../lib/forecast";
import { describeOrientation } from "../../lib/orientation";
import { planFeatures } from "../../lib/plans";
import { useSession } from "../../lib/session";

const YEAR_TABS = [
  { y: 0, label: "Oggi" },
  { y: 1, label: "1 anno" },
  { y: 3, label: "3 anni" },
  { y: 5, label: "5 anni" },
];
const RISK_CLASS = { basso: "is-low", medio: "is-mid", alto: "is-high" };
const cm = (m) => `${Math.round(m * 100)} cm`;
const pct = (v) => `${Math.round(v)}%`;

function Bar({ value, max = 100, kind = "cover" }) {
  const w = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <span className={`fc-bar is-${kind}`} aria-hidden="true">
      <span style={{ width: `${w}%` }} />
    </span>
  );
}

function Section({ title, icon, children, open = true }) {
  return (
    <details className="fc-section" open={open}>
      <summary>
        <i className={`fa-solid ${icon}`} /> {title}
      </summary>
      <div className="fc-body">{children}</div>
    </details>
  );
}

function List({ items, empty }) {
  if (!items.length) return <p className="fc-ok">{empty}</p>;
  return (
    <ul className="fc-list">
      {items.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </ul>
  );
}

function Score({ label, value, why, invert = false }) {
  // voti estetici: alto = bene; rischi: alto = male
  const good = invert ? 10 - value : value;
  const tone = good >= 7 ? "is-good" : good >= 4.5 ? "is-mid" : "is-bad";
  return (
    <div className={`fc-score ${tone}`}>
      <div className="fc-score-head">
        <span>{label}</span>
        <strong>{String(value).replace(".", ",")}</strong>
      </div>
      <Bar value={value} max={10} kind="score" />
      {why && <p className="fc-why">{why}</p>}
    </div>
  );
}

const partsText = (parts) =>
  parts
    .filter((p) => p.value < 0.85)
    .map((p) => p.text)
    .join("; ") || "copertura, altezze, fioriture, colori e forme ben bilanciati";

function Alternatives({ alt, onPick }) {
  const [items, setItems] = useState(null);
  useEffect(() => {
    let alive = true;
    const f = Object.fromEntries(Object.entries(alt.filters).filter(([, v]) => v));
    searchPlants({ ...f, page: 1 })
      .then((r) => alive && setItems(r.items.filter((p) => p.commonName !== alt.exclude).slice(0, 3)))
      .catch(() => alive && setItems([]));
    return () => {
      alive = false;
    };
  }, [alt]);
  return (
    <li>
      <strong>{alt.forName}</strong>: {alt.why}.
      {items == null ? (
        <span className="fc-muted"> Cerco alternative…</span>
      ) : items.length ? (
        <span className="fc-alts">
          {" "}
          Al suo posto:
          {items.map((p) => (
            <button key={p.id} type="button" className="fc-alt" onClick={() => onPick(p)}>
              <i className="fa-solid fa-plus" /> {p.commonName}
            </button>
          ))}
        </span>
      ) : (
        <span className="fc-muted"> Nessuna alternativa nel catalogo con queste condizioni.</span>
      )}
    </li>
  );
}

// Sezioni riservate al piano Premium (mostrate chiuse, con il lucchetto).
const LOCKED = [
  { title: "Situazione attuale", icon: "fa-clipboard-check", text: "distanze, copertura e compatibilità" },
  { title: "Previsione a 1, 3 e 5 anni", icon: "fa-tree", text: "sviluppo, sovraffollamento, radici e ombra" },
  { title: "Problemi futuri", icon: "fa-triangle-exclamation", text: "cosa potrebbe andare storto" },
  { title: "Suggerimenti migliorativi", icon: "fa-lightbulb", text: "specie da aumentare, ridurre e alternative" },
  { title: "Rischi di manutenzione e sovraffollamento", icon: "fa-gauge", text: "quanto lavoro ti chiederà" },
];

function PremiumTeaser() {
  return (
    <div className="fc-premium">
      <p className="fc-premium-head">
        <i className="fa-solid fa-lock" /> <strong>Valutazione completa con Premium</strong>
      </p>
      <ul>
        {LOCKED.map((l) => (
          <li key={l.title}>
            <i className={`fa-solid ${l.icon}`} /> <strong>{l.title}</strong>: {l.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ForecastPanel({ project, bed, analysis, year, onYear, onSelectBed, onStartViewer, onOpenOrientation, onPickPlant }) {
  const { user } = useSession();
  const full = planFeatures(user).fullForecast;
  const beds = project.beds.filter((b) => (b.plants ?? []).length);
  if (!bed) {
    return (
      <div className="forecast">
        <h3 className="gp-heading">Come crescerà la tua aiuola</h3>
        <p className="panel-note">Scegli l'aiuola da analizzare: calcolo come sarà tra 1, 3 e 5 anni, cosa rischia e cosa migliorare.</p>
        {beds.length ? (
          <div className="fc-bed-list">
            {beds.map((b) => (
              <button key={b.id} type="button" className="choice" onClick={() => onSelectBed(b.id)}>
                <i className="fa-solid fa-draw-polygon" /> {b.name} · {b.plants.length} piante
              </button>
            ))}
          </div>
        ) : (
          <p className="panel-note">Non ci sono ancora aiuole con piante.</p>
        )}
      </div>
    );
  }

  const setup = (
    <>
        <div className="fc-setup">
          <div className="fc-setup-row">
            <i className="fa-solid fa-eye" />
            <span>
              <strong>Da dove la guardi</strong>
              <small>{project.viewer ? "segnato sul disegno (puoi trascinarlo)" : "non indicato: considero l'aiuola vista da tutti i lati"}</small>
            </span>
            <button type="button" className="button is-small" onClick={onStartViewer}>
              {project.viewer ? "Sposta" : "Segna"}
            </button>
          </div>
          <div className="fc-setup-row">
            <i className="fa-solid fa-sun" />
            <span>
              <strong>Esposizione</strong>
              <small>{project.northDeg != null ? describeOrientation(project.northDeg) : "non indicata: considero il nord in alto nel disegno"}</small>
            </span>
            <button type="button" className="button is-small" onClick={onOpenOrientation}>
              {project.northDeg != null ? "Cambia" : "Indica"}
            </button>
          </div>
        </div>

        <div className="fc-years" role="tablist" aria-label="Anno da vedere sul disegno">
          {YEAR_TABS.map((t) => (
            <button key={t.y} type="button" role="tab" aria-selected={year === t.y} className={year === t.y ? "is-active" : ""} onClick={() => onYear(t.y)}>
              {t.label}
            </button>
          ))}
        </div>
        <p className="fc-legend">
          Sul disegno le piante hanno la misura prevista.{" "}
          {year > 0 && (
            <>
              <span className="fc-dot is-risk" /> a rischio <span className="fc-dot is-dominant" /> dominante <span className="fc-dot is-dead" /> da sostituire
            </>
          )}
        </p>
    </>
  );
  const a = analysis;
  if (!full) {
    return (
      <div className="forecast">
        <h3 className="gp-heading">Come crescerà «{bed.name}»</h3>
        {setup}
        {!a?.ok ? (
          <p className="panel-note">{a?.reason ?? "Analisi non disponibile."}</p>
        ) : (
          <>
            <Section title="Voto estetico" icon="fa-star">
              <Score label="Voto estetico attuale" value={a.scores.aestheticNow} why={partsText(a.scores.why.aestheticNow)} />
              <Score label="Voto estetico a 3 anni" value={a.scores.aesthetic3} why={partsText(a.scores.why.aesthetic3)} />
              <Score label="Voto estetico a 5 anni" value={a.scores.aesthetic5} why={partsText(a.scores.why.aesthetic5)} />
            </Section>
            <PremiumTeaser />
          </>
        )}
      </div>
    );
  }
  return (
    <div className="forecast">
      <h3 className="gp-heading">Come crescerà «{bed.name}»</h3>

      {setup}
      {!a?.ok ? (
        <p className="panel-note">{a?.reason ?? "Analisi non disponibile."}</p>
      ) : (
        <>
          <Section title="Situazione attuale" icon="fa-clipboard-check">
            <p>
              <span className="fc-k">Copertura del terreno</span> appena piantata {pct(a.current.plantingCoverage)}, a piante adulte come disegnate {pct(a.current.designCoverage)}
              {a.current.designDensity > 115 ? ` (chiome sovrapposte: ${pct(a.current.designDensity)})` : ""}.
            </p>
            <Bar value={a.current.designCoverage} />
            <p>
              <span className="fc-k">Equilibrio estetico</span> {a.current.aesthetic.parts.map((p) => p.text).join("; ")}.
            </p>
            <p className="fc-k">Distanze</p>
            <List
              items={[
                ...a.current.tooClose.map((t) => `${t.a.name} e ${t.b.name} a ${cm(t.d)}: troppo vicine, meglio almeno ${cm(t.ideal)}.`),
                ...a.current.tooFar.map((t) => `${t.p.name}: ${cm(t.gap)} di terreno libero attorno, resterà un vuoto.`),
              ]}
              empty="Distanze giuste tra le piante."
            />
            <p className="fc-k">Compatibilità</p>
            <List items={a.current.compat} empty="Esposizione, acqua, terreno e clima adatti a tutte le piante." />
          </Section>

          <Section title="Previsione a 1 anno" icon="fa-seedling">
            <YearHead y={a.years[1]} />
            <p className="fc-k">Sviluppo previsto</p>
            <ul className="fc-list">
              {a.development.map((d) => (
                <li key={d.name}>
                  <strong>{d.name}</strong>
                  {d.count > 1 ? ` (${d.count})` : ""}: da {cm(d.sizes[0].spread)} a {cm(d.sizes[1].spread)} di larghezza, alta {cm(d.sizes[1].height)} · {SPEED_LABEL[d.profile.speed]}
                  {d.profile.habit === "annuale" ? ", da riseminare ogni anno" : `, adulta in ${d.profile.matureYears} ${d.profile.matureYears === 1 ? "anno" : "anni"}`}.
                </li>
              ))}
            </ul>
            <p className="fc-k">Problemi possibili</p>
            <List items={yearProblems(a.years[1])} empty="Nessun problema nel primo anno." />
          </Section>

          <Section title="Previsione a 3 anni" icon="fa-tree">
            <YearHead y={a.years[3]} occupied />
            <p className="fc-k">Sovraffollamento</p>
            <List items={a.years[3].overlaps.map((o) => `${cap(overlapText(o))}${o.severe ? " (forte)" : ""}.`)} empty="Le chiome si toccano senza soffocarsi." />
            <p className="fc-k">Competizione radicale</p>
            <List
              items={a.years[3].roots.map((r) => (r.a.name === r.b.name ? `Due ${r.a.name} vicine si contendono acqua e spazio.` : `${r.strong.name} (${r.reason}) toglie acqua e spazio a ${r.weak.name}.`))}
              empty="Nessuna competizione importante tra le radici."
            />
            <p className="fc-k">Ombreggiamento</p>
            <List items={a.years[3].shade.map((s) => `${s.tall.name} (${cm(s.tallH)}) fa ombra ${s.side} a ${s.small.name} (${cm(s.smallH)}), che vuole il sole.`)} empty="Nessuna pianta toglie il sole alle altre." />
            <p className="fc-k">Irrigazione</p>
            <List items={a.current.compat.filter((t) => /acqua/.test(t))} empty="Le piante hanno bisogni d'acqua simili: un'unica irrigazione va bene." />
            <p className="fc-k">Manutenzione</p>
            <List items={a.maintenance[3]} empty="Poche cure: pulizia di fine stagione." />
          </Section>

          <Section title="Previsione a 5 anni" icon="fa-mountain-sun">
            <YearHead y={a.years[5]} occupied />
            <p>
              <span className="fc-k">Maturità</span>{" "}
              {maturityText(a)}
            </p>
            <p className="fc-k">Specie dominanti</p>
            <List items={uniqueNames(a.years[5].dominant).map((n) => `${n}: si allarga a spese delle vicine.`)} empty="Nessuna specie prende il sopravvento." />
            <p className="fc-k">A rischio soffocamento</p>
            <List items={uniqueNames(a.years[5].atRisk).map((n) => `${n}: coperta o ombreggiata dalle vicine.`)} empty="Nessuna pianta a rischio." />
            <p className="fc-k">Divisione, trapianto o rimozione</p>
            <List items={[...a.maintenance[5].filter((t) => /dividere|sostituire|radici|diradare/.test(t)), ...uniqueNames(a.years[5].atRisk).map((n) => `${n}: trapiantala in un punto più libero.`)]} empty="Nessun intervento importante." />
          </Section>

          <Section title="Problemi futuri" icon="fa-triangle-exclamation">
            <List items={a.problems} empty="Non sono previsti problemi." />
          </Section>

          <Section title="Suggerimenti migliorativi" icon="fa-lightbulb">
            <p className="fc-k">Specie da aumentare</p>
            <List items={a.suggestions.increase.map((s) => `${s.name}: aggiungine ${s.add} (${s.why}).`)} empty="Nessuna: la copertura è sufficiente." />
            <p className="fc-k">Specie da ridurre</p>
            <List items={a.suggestions.reduce.map((s) => (s.from ? `${s.name}: da ${s.from} a ${s.to} esemplari (${s.why}).` : `${s.name}: ${s.why}.`))} empty="Nessuna." />
            <p className="fc-k">Alternative più adatte</p>
            {a.suggestions.alternatives.length ? (
              <ul className="fc-list">
                {a.suggestions.alternatives.map((alt) => (
                  <Alternatives key={alt.forName} alt={alt} onPick={onPickPlant} />
                ))}
              </ul>
            ) : (
              <p className="fc-ok">Le specie scelte sono adatte all'aiuola.</p>
            )}
          </Section>

          <Section title="Valutazione finale" icon="fa-star">
            <Score label="Voto estetico attuale" value={a.scores.aestheticNow} why={partsText(a.scores.why.aestheticNow)} />
            <Score label="Voto estetico a 3 anni" value={a.scores.aesthetic3} why={partsText(a.scores.why.aesthetic3)} />
            <Score label="Voto estetico a 5 anni" value={a.scores.aesthetic5} why={partsText(a.scores.why.aesthetic5)} />
            <Score label="Rischio manutenzione" value={a.scores.maintenance} why={a.scores.why.maintenance.join(", ")} invert />
            <Score label="Rischio sovraffollamento" value={a.scores.overcrowding} why={a.scores.why.overcrowding} invert />
            <p className="fc-note">
              Calcoli basati su misure adulte, velocità di crescita e radici di ogni specie{!project.viewer || project.northDeg == null ? "; per una valutazione più precisa segna da dove guardi e l'esposizione" : ""}.
            </p>
          </Section>
        </>
      )}
    </div>
  );
}

function YearHead({ y, occupied = false }) {
  return (
    <div className="fc-yearhead">
      <div>
        <span className="fc-k">{occupied ? "Spazio occupato" : "Copertura stimata"}</span> <strong>{pct(occupied ? Math.max(y.coverage, y.density) : y.coverage)}</strong>
        {occupied && y.density > 100 && <small> (le chiome sovrapposte valgono il {pct(y.density)} della superficie)</small>}
        <Bar value={occupied ? Math.min(150, y.density) : y.coverage} max={occupied ? 150 : 100} kind={y.density > 120 ? "over" : "cover"} />
      </div>
      <span className={`fc-risk ${RISK_CLASS[y.risk]}`}>rischio {y.risk}</span>
    </div>
  );
}

function yearProblems(y) {
  return [
    ...y.overlaps.filter((o) => o.severe).map((o) => `${cap(overlapText(o))} già al primo anno.`),
    ...y.shade.map((s) => `${s.tall.name} fa ombra a ${s.small.name}.`),
    ...(y.coverage < 50 ? [`Terreno ancora molto scoperto (${pct(100 - y.coverage)}): pacciama bene per le erbacce.`] : []),
  ];
}

const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);

function uniqueNames(list) {
  return [...new Set(list.map((p) => p.name))];
}

function maturityText(a) {
  const adult = a.development.filter((d) => d.profile.habit === "annuale" || d.profile.matureYears <= 5).length;
  const spreading = a.development.filter((d) => d.profile.habit === "si allarga" || d.profile.roots === "invasive").map((d) => d.name);
  return `${adult} specie su ${a.development.length} sono adulte${spreading.length ? `; ${spreading.join(", ")} ${spreading.length === 1 ? "continua" : "continuano"} ad allargarsi` : ""}. L'aiuola ha la sua forma definitiva.`;
}
