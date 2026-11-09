import { useState } from "react";
import { CROPS, CROP_BY_ID, FAMILIES, MONTHS, cropActions, cropAsPlant } from "../../lib/crops";
import { getIconUrl, iconTypeFor } from "../../lib/plantIcons";
import { isFloor } from "../../lib/containers";
import PlantSafety from "./PlantSafety";

const ACTION_STYLE = {
  semenzaio: { label: "Semenzaio", color: "#b9a24a" },
  semina: { label: "Semina", color: "#4f7942" },
  trapianto: { label: "Trapianto", color: "#7a6a3a" },
  raccolta: { label: "Raccolta", color: "#c47a2c" },
};
const FIELDS = [
  ["indoor", "semenzaio"],
  ["direct", "semina"],
  ["transplant", "trapianto"],
  ["harvest", "raccolta"],
];

function YearStrip({ crop }) {
  return (
    <div className="year-strip" aria-label="Calendario dell'ortaggio">
      {FIELDS.map(([field, key]) => (
        <div key={field} className="ys-row">
          <span className="ys-label">{ACTION_STYLE[key].label}</span>
          {MONTHS.map((m, i) => (
            <span
              key={m}
              className="ys-cell"
              title={`${ACTION_STYLE[key].label}: ${m}`}
              style={crop[field]?.includes(i + 1) ? { background: ACTION_STYLE[key].color } : undefined}
            />
          ))}
        </div>
      ))}
      <div className="ys-row ys-months">
        <span className="ys-label" />
        {MONTHS.map((m) => (
          <span key={m} className="ys-month">
            {m[0].toUpperCase()}
          </span>
        ))}
      </div>
    </div>
  );
}

const names = (ids) => ids.map((id) => CROP_BY_ID[id]?.name.toLowerCase() ?? id).join(", ");

export default function CropCatalog({ selectedBed, onPickPlant, onFillRows }) {
  const month = new Date().getMonth() + 1;
  const [q, setQ] = useState("");
  const [onlyNow, setOnlyNow] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [varietyOf, setVarietyOf] = useState({});

  const needle = q.trim().toLowerCase();
  const matches = (c) =>
    !needle ||
    c.name.toLowerCase().includes(needle) ||
    c.scientificName.toLowerCase().includes(needle) ||
    c.varieties.some((v) => v.name.toLowerCase().includes(needle));
  const list = CROPS.filter(matches).filter(
    (c) => !onlyNow || cropActions(c, month).some((a) => a !== "raccolta"),
  );
  const canFill = selectedBed && !isFloor(selectedBed);

  return (
    <div className="catalog crop-catalog">
      <div className="catalog-search">
        <span className="icon-input">
          <i className="fa-solid fa-magnifying-glass" />
          <input type="search" placeholder="Cerca un ortaggio o una varietà" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cerca ortaggio" />
        </span>
      </div>
      <label className="checkbox-row">
        <input type="checkbox" checked={onlyNow} onChange={(e) => setOnlyNow(e.target.checked)} /> Solo quelli da seminare o trapiantare a{" "}
        {new Date().toLocaleDateString("it-IT", { month: "long" })}
      </label>
      {!canFill && <p className="panel-note">Seleziona un'aiuola dell'orto per riempirla a file con un ortaggio.</p>}

      <ul className="plant-list">
        {list.map((crop) => {
          const open = openId === crop.id;
          const now = cropActions(crop, month);
          const variety = crop.varieties.find((v) => v.name === varietyOf[crop.id]) ?? null;
          return (
            <li key={crop.id} className={`plant-item ${open ? "is-open" : ""}`}>
              <button className="plant-row" onClick={() => setOpenId(open ? null : crop.id)} aria-expanded={open}>
                <img className="plant-icon" src={getIconUrl(iconTypeFor({ cropId: crop.id }), crop.colors, 96, crop.name)} alt="" />
                <span className="plant-names">
                  <strong>{crop.name}</strong>
                  <em>{FAMILIES[crop.family]}</em>
                </span>
                <span className="crop-badges">
                  {now.map((a) => (
                    <span key={a} className="crop-badge" style={{ background: ACTION_STYLE[a].color }}>
                      {ACTION_STYLE[a].label}
                    </span>
                  ))}
                </span>
              </button>
              {open && (
                <div className="plant-detail">
                  {crop.varieties.length > 0 && (
                    <label className="mini-select variety-select">
                      <span>Varietà</span>
                      <select value={variety?.name ?? ""} onChange={(e) => setVarietyOf((m) => ({ ...m, [crop.id]: e.target.value }))}>
                        <option value="">Qualsiasi ({crop.varieties.length} varietà)</option>
                        {crop.varieties.map((v) => (
                          <option key={v.name} value={v.name}>
                            {v.name}
                          </option>
                        ))}
                      </select>
                      {variety && <small className="variety-note">{variety.note}</small>}
                    </label>
                  )}
                  <YearStrip crop={crop} />
                  <dl className="plant-facts">
                    <dt>Distanze</dt>
                    <dd>
                      {crop.spacing.row} cm tra le file · {crop.spacing.plant} cm sulla fila
                    </dd>
                    <dt>Raccolta</dt>
                    <dd>dopo circa {crop.days} giorni</dd>
                    <dt>Piante amiche</dt>
                    <dd>{names(crop.good) || "—"}</dd>
                    <dt>Da tenere lontane</dt>
                    <dd>{names(crop.bad) || "—"}</dd>
                    {crop.notes && (
                      <>
                        <dt>Nota</dt>
                        <dd>{crop.notes}</dd>
                      </>
                    )}
                  </dl>
                  <PlantSafety plant={cropAsPlant(crop)} />
                  <div className="button-stack">
                    <button className="button is-primary is-small" disabled={!canFill} onClick={() => onFillRows(selectedBed.id, crop, variety)}>
                      <i className="fa-solid fa-grip-lines" />&nbsp; {canFill ? `Riempi a file «${selectedBed.name}»` : "Riempi a file (seleziona un'aiuola)"}
                    </button>
                    <button className="button is-small is-light" onClick={() => onPickPlant(cropAsPlant(crop, variety))}>
                      <i className="fa-solid fa-hand-point-up" />&nbsp; Pianta a mano
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {!list.length && <p className="panel-note">Nessun ortaggio {onlyNow ? "da seminare questo mese" : "trovato"}.</p>}
    </div>
  );
}
