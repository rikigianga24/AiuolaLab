import { CLIMATES, DRIPPER_FLOWS, TEXTURE_LABEL } from "../../lib/irrigation";

const fmtM = (m) => `${m.toFixed(1).replace(".", ",")} m`;
const every = (d) => (d === 1 ? "ogni giorno" : `ogni ${d} giorni`);

export default function IrrigationPanel({ project, irrigation, mode, onStartFaucet, onRemoveFaucet, onSettings, showOnCanvas, onToggleCanvas }) {
  const s = irrigation.settings;
  const hasPlants = project.beds.some((b) => b.plants?.length);

  return (
    <div className="irrigation-panel">
      <p className="panel-note">
        Impianto a <strong>goccia a goccia</strong>: l'app calcola il percorso di tubo più corto dal rubinetto a tutte le piante, quanti
        gocciolatori mettere e per quanto tempo irrigare.
      </p>

      <div className="button-stack horizontal">
        <button className={`button is-small ${mode === "faucet" ? "is-warning" : "is-primary"}`} onClick={onStartFaucet}>
          <i className="fa-solid fa-faucet-drip" />
          &nbsp; {mode === "faucet" ? "Tocca il punto sul disegno…" : project.faucet ? "Sposta rubinetto" : "Posiziona rubinetto"}
        </button>
        {project.faucet && (
          <button className="button is-small is-light" onClick={onRemoveFaucet}>
            Rimuovi
          </button>
        )}
      </div>

      <div className="field-grid mt-3">
        <label className="mini-select">
          <span>Zona climatica</span>
          <select value={s.climate} onChange={(e) => onSettings({ climate: e.target.value })}>
            {Object.entries(CLIMATES).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
        <label className="mini-select">
          <span>Gocciolatori</span>
          <select value={s.dripperFlow} onChange={(e) => onSettings({ dripperFlow: Number(e.target.value) })}>
            {DRIPPER_FLOWS.map((f) => (
              <option key={f} value={f}>
                {f} l/h
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="checkbox-row">
        <input type="checkbox" checked={showOnCanvas} onChange={(e) => onToggleCanvas(e.target.checked)} /> Mostra l'impianto sul disegno
      </label>

      {!project.faucet && <p className="panel-note">Posiziona il rubinetto per calcolare l'impianto.</p>}
      {project.faucet && !hasPlants && <p className="panel-note">Aggiungi delle piante alle aiuole per calcolare l'impianto.</p>}

      {irrigation.ready && (
        <>
          <div className="stats-row">
            <div>
              <strong>{fmtM(irrigation.totals.supplyM)}</strong>
              <span>tubo di adduzione</span>
            </div>
            <div>
              <strong>{fmtM(irrigation.totals.dripM)}</strong>
              <span>ala gocciolante</span>
            </div>
            <div>
              <strong>{Math.round(irrigation.totals.flowLph)} l/h</strong>
              <span>{irrigation.totals.drippers} gocciolatori</span>
            </div>
          </div>
          <div className="legend-row">
            <span>
              <i className="legend-line supply" /> adduzione
            </span>
            <span>
              <i className="legend-line drip" /> ala gocciolante
            </span>
            <span>
              <i className="legend-dot" /> gocciolatore
            </span>
          </div>

          {irrigation.warnings.map((w, i) => (
            <p key={i} className="panel-warning">
              <i className="fa-solid fa-triangle-exclamation" /> {w}
            </p>
          ))}

          <h3 className="gp-heading">Programma consigliato</h3>
          {irrigation.zones.map((z) => (
            <div key={z.bedId} className="zone-card">
              <div className="zone-head">
                <strong>{z.name}</strong>
                <small>
                  terreno {TEXTURE_LABEL[z.texture] ?? z.texture} · {z.drippers} gocciolatori · {Math.round(z.flowLph)} l/h
                </small>
              </div>
              <table className="schedule">
                <thead>
                  <tr>
                    <th>Stagione</th>
                    <th>Durata</th>
                    <th>Quando</th>
                    <th>Partenza</th>
                  </tr>
                </thead>
                <tbody>
                  {z.seasons.map((se) => (
                    <tr key={se.key}>
                      <td>{se.label}</td>
                      <td>
                        {se.cycles > 1 ? `2 × ${se.perCycle}` : se.minutes} min
                      </td>
                      <td>{every(se.interval)}</td>
                      <td>
                        {se.start}
                        {se.secondStart && <small> e {se.secondStart}</small>}
                      </td>
                    </tr>
                  ))}
                  <tr className="muted-row">
                    <td>Inverno</td>
                    <td colSpan={3}>spento, solo in caso di siccità prolungata</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}

          <div className="tips-box">
            <strong>
              <i className="fa-solid fa-clock" /> Orario migliore: all'alba
            </strong>
            <p>
              Irriga in modo da finire entro le 7–8 del mattino: evapora meno acqua, il terreno è fresco e le foglie si asciugano
              presto, riducendo le malattie fungine. Evita le ore calde. Di sera va bene solo come secondo ciclo nei terreni sabbiosi in
              piena estate.
            </p>
            <p>
              Sospendi dopo una pioggia di oltre 10 mm (o usa un sensore pioggia) e, nei primi 2–3 mesi dopo la messa a dimora, aumenta i
              tempi del 30–50% finché le radici non si sono sviluppate.
            </p>
          </div>

          <h3 className="gp-heading">Materiali</h3>
          <table className="materials">
            <tbody>
              {irrigation.materials.map((m) => (
                <tr key={m.item}>
                  <td>
                    {m.item}
                    {m.note && <small> ({m.note})</small>}
                  </td>
                  <td className="qty">
                    {m.qty} {m.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="panel-note">Le lunghezze includono il 10% di scorta per curve e tagli.</p>
        </>
      )}
    </div>
  );
}
