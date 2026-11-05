import { useState } from "react";
import { weatherApi } from "../lib/api";

// Scelta della località per il meteo: posizione del dispositivo o ricerca del comune.
export default function LocationPicker({ value, onChange }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const useDevice = () => {
    if (!navigator.geolocation) return setError("Il browser non fornisce la posizione.");
    setBusy(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(false);
        // bastano 2 decimali (circa 1 km): non serve la posizione esatta
        onChange({ lat: Number(pos.coords.latitude.toFixed(2)), lon: Number(pos.coords.longitude.toFixed(2)), name: "La mia posizione" });
      },
      () => {
        setBusy(false);
        setError("Posizione non disponibile: cerca il comune.");
      },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  };

  const search = async (e) => {
    e.preventDefault();
    if (query.trim().length < 2) return;
    setBusy(true);
    setError(null);
    try {
      const r = await weatherApi.geocode(query.trim());
      setResults(r.items);
      if (!r.items.length) setError("Nessun comune trovato.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="location-picker">
      {value && (
        <p className="location-current">
          <i className="fa-solid fa-location-dot" /> {value.name}{" "}
          <button className="link-btn" onClick={() => onChange(null)}>
            rimuovi
          </button>
        </p>
      )}
      <form className="location-form" onSubmit={search}>
        <input className="input is-small" placeholder="Cerca il comune (es. Bologna)" value={query} onChange={(e) => setQuery(e.target.value)} />
        <button className={`button is-small ${busy ? "is-loading" : ""}`} type="submit">
          Cerca
        </button>
        <button className="button is-small is-light" type="button" onClick={useDevice} title="Usa la posizione del dispositivo">
          <i className="fa-solid fa-location-crosshairs" />
        </button>
      </form>
      {results.length > 0 && (
        <ul className="location-results">
          {results.map((r) => (
            <li key={`${r.lat},${r.lon}`}>
              <button
                onClick={() => {
                  onChange({ lat: Number(r.lat.toFixed(2)), lon: Number(r.lon.toFixed(2)), name: r.name });
                  setResults([]);
                  setQuery("");
                }}
              >
                {r.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="panel-error">{error}</p>}
      <p className="panel-note">Ricerca comuni © OpenStreetMap contributors.</p>
    </div>
  );
}
