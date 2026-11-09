import { useEffect, useState } from "react";

import { describeOrientation, norm, sunriseFromNorth, ORIENT_DIRS as DIRS } from "../../lib/orientation";

// Bussola sul disegno: Nord, Est (alba), Sud (mezzogiorno), Ovest (tramonto).
export function Compass({ northDeg, onClick, size = 64 }) {
  const n = northDeg ?? 0;
  const pt = (deg, r) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return [32 + Math.cos(a) * r, 32 + Math.sin(a) * r];
  };
  const [nx, ny] = pt(n, 22), [sx, sy] = pt(n + 180, 22);
  const sun = (deg, r) => {
    const [x, y] = pt(deg, r);
    return <circle cx={x} cy={y} r="4" fill="#f2b632" stroke="#c98a1c" strokeWidth="1" />;
  };
  return (
    <button type="button" className={`compass ${northDeg == null ? "is-unset" : ""}`} onClick={onClick} title="Orientamento: dove sorge il sole" aria-label={`Orientamento: ${describeOrientation(northDeg)}. Tocca per cambiarlo`}>
      <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
        <circle cx="32" cy="32" r="30" fill="#fffdf7" stroke="#8b7a62" strokeWidth="2" />
        {[0, 90, 180, 270].map((d) => {
          const [x, y] = pt(n + d, 28);
          const [x2, y2] = pt(n + d, 24);
          return <line key={d} x1={x} y1={y} x2={x2} y2={y2} stroke="#8b7a62" strokeWidth="2" />;
        })}
        {/* ago: rosso verso Nord */}
        <polygon points={`${nx},${ny} ${pt(n + 90, 5).join(",")} ${sx},${sy} ${pt(n - 90, 5).join(",")}`} fill="#d8d0c0" />
        <polygon points={`${nx},${ny} ${pt(n + 90, 5).join(",")} 32,32 ${pt(n - 90, 5).join(",")}`} fill="#c0392b" />
        {sun(n + 90, 18)}
        {sun(n + 180, 13)}
        {(() => {
          const [lx, ly] = pt(n, 13);
          return (
            <text x={lx} y={ly + 3.5} textAnchor="middle" fontSize="10" fontWeight="700" fill="#3a3226">
              N
            </text>
          );
        })()}
      </svg>
      {northDeg == null && <span className="compass-q">?</span>}
    </button>
  );
}

export function OrientationDialog({ northDeg, onSave, onClose }) {
  const [north, setNorth] = useState(northDeg ?? 0);
  const sunrise = sunriseFromNorth(north);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="orient-backdrop" onClick={onClose}>
      <div className="orient-dialog" role="dialog" aria-modal="true" aria-labelledby="orient-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="orient-title">Dove sorge il sole?</h2>
        <p className="orient-help">
          Guardando il tuo disegno, da che parte vedi il sole <strong>la mattina</strong>? Serve per capire quali piante faranno ombra alle altre.
        </p>
        <div className="orient-dial">
          <div className="orient-map" style={{ "--north": `${north}deg` }}>
            <span className="orient-map-label">il tuo disegno</span>
            <span className="orient-n" style={{ transform: `rotate(${north}deg) translateY(-84px) rotate(${-north}deg)` }}>N</span>
            <span className="orient-s" style={{ transform: `rotate(${north + 180}deg) translateY(-84px) rotate(${-north - 180}deg)` }}>
              <i className="fa-solid fa-sun" /> mezzogiorno
            </span>
            <span className="orient-w" style={{ transform: `rotate(${north + 270}deg) translateY(-84px) rotate(${-north - 270}deg)` }}>
              tramonto
            </span>
          </div>
          {DIRS.map((d) => (
            <button
              key={d.deg}
              type="button"
              className={`orient-dir ${Math.abs(((sunrise - d.deg + 540) % 360) - 180) < 1 ? "is-active" : ""}`}
              style={{ transform: `rotate(${d.deg}deg) translateY(-112px) rotate(${-d.deg}deg)` }}
              onClick={() => setNorth(norm(d.deg - 90))}
              aria-label={`Il sole sorge ${d.label}`}
              title={`Il sole sorge ${d.label}`}
            >
              <i className="fa-solid fa-sun" />
            </button>
          ))}
        </div>
        <label className="orient-fine">
          <span>Regola di precisione</span>
          <input type="range" min="0" max="359" value={sunrise} onChange={(e) => setNorth(norm(Number(e.target.value) - 90))} />
        </label>
        <p className="orient-summary">{describeOrientation(north)}.</p>
        <div className="orient-actions">
          <button type="button" className="button is-small" onClick={onClose}>
            Annulla
          </button>
          <button
            type="button"
            className="button is-small is-primary"
            onClick={() => {
              onSave(north);
              onClose();
            }}
          >
            Fatto
          </button>
        </div>
      </div>
    </div>
  );
}
