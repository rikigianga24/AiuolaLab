import { useMemo, useState } from "react";
import { MULCHES, PRICE_TIERS, SOIL_BAG, formatEur, projectBudget } from "../../lib/budget";

const SOIL_LAYERS = [0, 5, 10, 20, 30];
const plural = (n, unit) => (n === 1 ? unit.replace(/i$/, "o") : unit);

// Budget stimato: piante per fascia di prezzo, sacchi di terriccio e di
// pacciamatura calcolati dai volumi delle aiuole e dei vasi.
export default function BudgetPanel({ project, onSettings }) {
  const [showDetail, setShowDetail] = useState(false);
  const budget = useMemo(() => projectBudget(project), [project]);
  const { totals, soil, mulch, plants } = budget;
  const hasPots = project.beds.some((b) => b.kind === "pot");
  const hasBeds = project.beds.some((b) => b.kind !== "pot" && b.kind !== "floor");

  return (
    <div className="budget-panel">
      <h3 className="gp-heading">Budget stimato progetto</h3>
      <table className="budget-table">
        <tbody>
          <tr>
            <th>Piante</th>
            <td>{formatEur(totals.plants)}</td>
          </tr>
          <tr>
            <th>Terriccio</th>
            <td>{formatEur(totals.soil)}</td>
          </tr>
          <tr>
            <th>Pacciamatura</th>
            <td>{formatEur(totals.mulch)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <th>Totale stimato</th>
            <td>{formatEur(totals.all)}</td>
          </tr>
        </tfoot>
      </table>

      {hasBeds && (
        <div className="gp-field">
          <span className="gp-label">Terriccio da aggiungere nelle aiuole</span>
          <div className="choice-row">
            {SOIL_LAYERS.map((cm) => (
              <button
                key={cm}
                type="button"
                className={`choice ${soil.layerCm === cm ? "is-active" : ""}`}
                onClick={() => onSettings({ soilCm: cm })}
                aria-pressed={soil.layerCm === cm}
              >
                {cm ? `${cm} cm` : "Nessuno"}
              </button>
            ))}
          </div>
        </div>
      )}

      <button className="button is-small is-light is-fullwidth" onClick={() => setShowDetail((v) => !v)} aria-expanded={showDetail}>
        <i className={`fa-solid ${showDetail ? "fa-chevron-up" : "fa-list"}`} />
        &nbsp; {showDetail ? "Nascondi i dettagli" : "Mostra i dettagli del calcolo"}
      </button>

      {showDetail && (
        <div className="budget-detail">
          <h4>Piante</h4>
          {plants.length ? (
            <ul>
              {plants.map((p) => (
                <li key={p.key}>
                  <span className="grow">
                    {p.name} <span className="price-badge">{PRICE_TIERS[p.tier].short}</span>
                  </span>
                  <span>
                    {p.count} × {PRICE_TIERS[p.tier].eur} € = <strong>{formatEur(p.eur)}</strong>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="panel-note">Ancora nessuna pianta.</p>
          )}

          <h4>Terriccio</h4>
          {soil.litres ? (
            <p className="panel-note">
              {soil.litres} L in tutto
              {hasBeds ? ` (strato di ${soil.layerCm} cm nelle aiuole` : ""}
              {hasBeds && hasPots ? ", vasi pieni)" : hasBeds ? ")" : hasPots ? " per riempire i vasi" : ""}: {soil.bags}{" "}
              {plural(soil.bags, "sacchi")} da {SOIL_BAG.bagL} L × {SOIL_BAG.eur} € = <strong>{formatEur(soil.eur)}</strong>
            </p>
          ) : (
            <p className="panel-note">Nessun terriccio da comprare.</p>
          )}

          <h4>Pacciamatura</h4>
          {mulch.length ? (
            <ul>
              {mulch.map((m) => {
                const def = MULCHES[m.kind];
                return (
                  <li key={m.kind}>
                    <span className="grow">
                      {m.label}
                      <small>
                        {def.rollM2
                          ? `${m.m2.toLocaleString("it-IT")} m² con il 15% di sovrapposizione · ${m.note}`
                          : `${m.litres} L, strato di ${def.layerCm} cm · ${m.note ?? `sacchi da ${def.bagL} L`}`}
                      </small>
                    </span>
                    <span>
                      {m.qty} {plural(m.qty, m.unit)} × {def.eur} € = <strong>{formatEur(m.eur)}</strong>
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="panel-note">Nessuna pacciamatura: scegli la copertura di ogni aiuola nella scheda Aiuola.</p>
          )}

          <p className="panel-note">
            Prezzi indicativi da garden center: {Object.values(PRICE_TIERS).map((t) => `${t.short} ${t.label.toLowerCase()} ${t.range}`).join(" · ")}.
          </p>
        </div>
      )}
    </div>
  );
}
