import { useMemo } from "react";
import { bloomSummary, coverageByMonth, monthsInRange, peakMonths, periodLabel } from "../../lib/bloom";
import { MONTH_NAMES, MONTH_SHORT, floweringLabel } from "../../lib/labels";
import { Blossom } from "./PlanSymbols";

// Periodi rapidi: [etichetta, mese iniziale, mese finale]
const PRESETS = [
  ["Primavera", 3, 5],
  ["Estate", 6, 8],
  ["Autunno", 9, 11],
  ["Inverno", 12, 2],
];

// Un mese per volta; con «Intervallo di mesi» il 1° clic è l'inizio e il 2° la fine
// (anche a cavallo d'anno: novembre → febbraio).
function pickBloomMonth(bloom, onChange, m) {
  if (!bloom.range) return onChange({ on: true, from: m, to: m, picking: false });
  if (bloom.on && bloom.picking && bloom.from !== m) return onChange({ to: m, picking: false });
  onChange({ on: true, from: m, to: m, picking: true });
}

/** I 12 mesi cliccabili più i periodi rapidi: usato dal pannello e dalla stampa. */
export function MonthPicker({ bloom, onChange }) {
  const selected = monthsInRange(bloom.from, bloom.to);
  const pickMonth = (m) => pickBloomMonth(bloom, onChange, m);
  return (
    <>
      <label className="bloom-range">
        <input type="checkbox" checked={Boolean(bloom.range)} onChange={(e) => onChange({ range: e.target.checked, picking: false })} /> Intervallo di mesi
        {bloom.range && bloom.picking && <em> · scegli il mese finale</em>}
      </label>
      <div className="month-grid" role="group" aria-label="Mesi dell'anno">
        {MONTH_SHORT.map((label, i) => {
          const m = i + 1;
          const on = bloom.on && selected.includes(m);
          return (
            <button
              key={m}
              type="button"
              className={`month-btn ${on ? "is-on" : ""} ${on && m === bloom.from ? "is-start" : ""} ${on && m === bloom.to ? "is-end" : ""}`}
              aria-pressed={on}
              aria-label={MONTH_NAMES[i]}
              onClick={() => pickMonth(m)}
            >
              {label}
            </button>
          );
        })}
      </div>
      <div className="month-presets">
        {PRESETS.map(([label, from, to]) => (
          <button key={label} type="button" className="chip-btn" onClick={() => onChange({ on: true, from, to, picking: false })}>
            {label}
          </button>
        ))}
        <button
          type="button"
          className="chip-btn"
          onClick={() => {
            const m = new Date().getMonth() + 1;
            onChange({ on: true, from: m, to: m, picking: true });
          }}
        >
          Questo mese
        </button>
      </div>
    </>
  );
}

/**
 * Tab "Fioritura": scelta del mese (o dell'intervallo) con i 12 mesi,
 * riepilogo e distribuzione annuale. La selezione vive in GardenPage.
 */
export default function BloomPanel({ project, bloom, onChange, monthsOf, loading }) {
  const selected = useMemo(() => monthsInRange(bloom.from, bloom.to), [bloom.from, bloom.to]);
  const summary = useMemo(() => bloomSummary(project.beds, selected, monthsOf), [project.beds, selected, monthsOf]);
  const coverage = useMemo(() => coverageByMonth(project.beds, monthsOf), [project.beds, monthsOf]);
  const peaks = peakMonths(coverage);
  const maxPlants = Math.max(1, ...coverage.map((c) => c.plants));
  const hasPlants = project.beds.some((b) => b.plants?.length);

  const pickMonth = (m) => pickBloomMonth(bloom, onChange, m);

  return (
    <div className="bloom-panel">
      <div className="bloom-head">
        <p className="bloom-title">
          <Blossom size={20} /> Calendario di fioritura
        </p>
        <label className="bloom-switch">
          <input type="checkbox" checked={bloom.on} onChange={(e) => onChange({ on: e.target.checked })} />
          <span>Mostra sull'aiuola</span>
        </label>
      </div>
      <p className="bloom-help">Scegli un mese. Per un periodo, per esempio novembre–febbraio, attiva «Intervallo di mesi» e tocca il primo e l'ultimo mese.</p>

      <MonthPicker bloom={bloom} onChange={onChange} />

      {!hasPlants ? (
        <p className="bloom-empty">Aggiungi qualche pianta all'aiuola: qui vedrai quali fioriscono nel periodo scelto.</p>
      ) : (
        <>
          <section className="bloom-summary" aria-live="polite">
            <h4>{bloom.on ? `In fiore a ${periodLabel(bloom)}` : "Riepilogo del periodo"}</h4>
            <div className="bloom-stats">
              <div>
                <strong>{summary.varieties}</strong>
                <span>{summary.varieties === 1 ? "varietà" : "varietà"} in fioritura</span>
              </div>
              <div>
                <strong>{summary.plants}</strong>
                <span>{summary.plants === 1 ? "pianta" : "piante"} in fioritura</span>
              </div>
            </div>
            {summary.list.length > 0 ? (
              <ul className="bloom-list">
                {summary.list.map((g) => (
                  <li key={g.key}>
                    <span className="bloom-list-name">
                      {g.name}
                      {g.variety && <em> «{g.variety}»</em>}
                    </span>
                    <span className="bloom-list-count">× {g.count}</span>
                    <small>{floweringLabel(g.months, { short: true })}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="bloom-empty">Nessuna pianta dell'aiuola è in fiore in questo periodo.</p>
            )}
            {summary.unknown > 0 && (
              <p className="bloom-unknown">
                <i className="fa-solid fa-circle-info" /> Fioritura non specificata per {summary.unknown} {summary.unknown === 1 ? "pianta" : "piante"}
                {loading ? " (sto leggendo le schede…)" : ""}: non compaiono tra quelle in fiore.
              </p>
            )}
          </section>

          <section className="bloom-year">
            <h4>Fioriture durante l'anno</h4>
            <div className="bloom-bars" role="img" aria-label="Numero di piante in fiore per ogni mese">
              {coverage.map((c, i) => {
                const m = c.month;
                return (
                  <button
                    key={m}
                    type="button"
                    className={`bloom-bar ${bloom.on && selected.includes(m) ? "is-sel" : ""} ${peaks.includes(m) ? "is-peak" : ""}`}
                    onClick={() => pickMonth(m)}
                    title={`${MONTH_NAMES[i]}: ${c.plants} piante, ${c.varieties} varietà`}
                  >
                    <span className="bloom-bar-num">{c.plants || ""}</span>
                    <span className="bloom-bar-fill" style={{ height: `${(c.plants / maxPlants) * 100}%` }} />
                    <span className="bloom-bar-label">{MONTH_SHORT[i][0]}</span>
                  </button>
                );
              })}
            </div>
            {peaks.length > 0 && (
              <p className="bloom-peak">
                Più fiori: <strong>{peaks.map((m) => MONTH_NAMES[m - 1]).join(", ")}</strong> ({coverage[peaks[0] - 1].plants} piante).
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
