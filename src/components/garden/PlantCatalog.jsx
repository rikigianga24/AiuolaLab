import { useEffect, useState } from "react";
import { useDebounced } from "../../hooks/useDebounced";
import { getHealth, getPlant, searchPlants } from "../../lib/api";
import { COLORS, CYCLE, SEASONS, SOIL_PH, SUNLIGHT, WATERING } from "../../lib/labels";
import { flowerHexes, getIconUrl, iconTypeFor } from "../../lib/plantIcons";
import PlantFacts from "./PlantFacts";
import { useConsent } from "../../lib/consent";
import { plantInfo } from "../../lib/plantInfo";
import { useSession } from "../../lib/session";

const EMPTY = { q: "", sunlight: "", watering: "", ph: "", color: "", season: "" };

function Select({ label, value, onChange, options }) {
  return (
    <label className="mini-select">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Tutte</option>
        {Object.entries(options).map(([k, v]) => (
          <option key={k} value={k}>
            {typeof v === "string" ? v : v.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function PlantCatalog({ selectedBed, onPickPlant }) {
  const [filters, setFilters] = useState(EMPTY);
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ key: null, items: [], error: null, lastPage: 1 });
  const [openId, setOpenId] = useState(null);
  const [details, setDetails] = useState({});
  const [source, setSource] = useState(null);
  const q = useDebounced(filters.q);
  const consent = useConsent();
  const { settings } = useSession();
  const [petSafe, setPetSafe] = useState(false);
  const myPets = settings.pets?.length ? settings.pets : ["dog", "cat"];
  const isSafe = (p) => !plantInfo(p).tox?.to.some((t) => myPets.includes(t));

  useEffect(() => {
    getHealth().then((h) => setSource(h.plantSource));
  }, []);

  const query = { ...filters, q };
  const queryKey = JSON.stringify(query);

  const requestKey = `${queryKey}#${page}`;
  const loading = state.key !== requestKey;

  useEffect(() => {
    const ctrl = new AbortController();
    searchPlants({ ...JSON.parse(queryKey), page }, ctrl.signal)
      .then((res) =>
        setState((s) => ({
          key: `${queryKey}#${page}`,
          items: page === 1 ? res.items : [...s.items, ...res.items],
          error: null,
          lastPage: res.lastPage,
        })),
      )
      .catch((err) => {
        if (err.name !== "AbortError") setState((s) => ({ ...s, key: `${queryKey}#${page}`, error: err.message }));
      });
    return () => ctrl.abort();
  }, [queryKey, page]);

  const update = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const applyBedConditions = () => {
    const c = selectedBed?.conditions ?? {};
    setFilters((f) => ({ ...f, sunlight: c.sunlight ?? "", watering: c.watering ?? "", ph: c.ph ?? "" }));
    setPage(1);
  };

  const toggle = async (plant) => {
    const id = openId === plant.id ? null : plant.id;
    setOpenId(id);
    if (id && !plant.detailsLoaded && !details[id]) {
      try {
        const full = await getPlant(id);
        setDetails((d) => ({ ...d, [id]: full }));
      } catch {
        /* restano i dati base */
      }
    }
  };

  const activeFilters = Object.entries(filters).filter(([k, v]) => k !== "q" && v).length;

  return (
    <div className="catalog">
      <div className="catalog-search">
        <span className="icon-input">
          <i className="fa-solid fa-magnifying-glass" />
          <input
            type="search"
            placeholder="Cerca per nome (es. lavanda, salvia...)"
            value={filters.q}
            onChange={(e) => update("q", e.target.value)}
            aria-label="Cerca pianta"
          />
        </span>
      </div>

      <details className="catalog-filters" open={activeFilters > 0 || undefined}>
        <summary>
          <i className="fa-solid fa-sliders" /> Filtri {activeFilters > 0 && <span className="badge">{activeFilters}</span>}
        </summary>
        <div className="filters-grid">
          <Select label="Esposizione" value={filters.sunlight} onChange={(v) => update("sunlight", v)} options={SUNLIGHT} />
          <Select label="Acqua" value={filters.watering} onChange={(v) => update("watering", v)} options={WATERING} />
          <Select label="pH terreno" value={filters.ph} onChange={(v) => update("ph", v)} options={SOIL_PH} />
          <Select label="Colore fiore" value={filters.color} onChange={(v) => update("color", v)} options={COLORS} />
          <Select label="Fioritura" value={filters.season} onChange={(v) => update("season", v)} options={SEASONS} />
        </div>
        <label className="checkbox-row">
          <input type="checkbox" checked={petSafe} onChange={(e) => setPetSafe(e.target.checked)} /> Solo piante non tossiche per{" "}
          {myPets.map((t) => ({ dog: "cani", cat: "gatti", horse: "cavalli", farm: "animali da cortile", people: "bambini" })[t]).join(", ")}
        </label>
        <div className="filters-actions">
          {selectedBed && (
            <button className="link-btn" onClick={applyBedConditions}>
              <i className="fa-solid fa-wand-sparkles" /> Usa le condizioni di «{selectedBed.name}»
            </button>
          )}
          {activeFilters > 0 && (
            <button className="link-btn" onClick={() => setFilters((f) => ({ ...EMPTY, q: f.q }))}>
              Azzera filtri
            </button>
          )}
        </div>
      </details>

      {source === "demo" && (
        <p className="panel-note">
          <i className="fa-solid fa-circle-info" /> Catalogo di esempio: configura <code>PERENUAL_API_KEY</code> sul server
          per usare il database completo.
        </p>
      )}

      {state.error && <p className="panel-error">{state.error}</p>}

      <ul className="plant-list">
        {state.items.filter((p) => !petSafe || isSafe(p)).map((plant) => {
          const full = details[plant.id] ?? plant;
          const open = openId === plant.id;
          return (
            <li key={plant.id} className={`plant-item ${open ? "is-open" : ""}`}>
              <button className="plant-row" onClick={() => toggle(plant)} aria-expanded={open}>
                <img
                  className="plant-icon"
                  src={getIconUrl(iconTypeFor(plant), flowerHexes(plant), 96, plant.commonName)}
                  alt=""
                />
                <span className="plant-names">
                  <strong>{plant.commonName}</strong>
                  <em>{plant.scientificName}</em>
                </span>
                <span className="plant-icons">
                  {plant.sunlight?.map((s) => (
                    <i key={s} className={`fa-solid ${SUNLIGHT[s].icon}`} title={SUNLIGHT[s].label} />
                  ))}
                  {plant.cycle && CYCLE[plant.cycle] && <small>{CYCLE[plant.cycle]}</small>}
                </span>
              </button>
              {open && (
                <div className="plant-detail">
                  {full.image?.regular && consent?.external && <img className="plant-photo" src={full.image.regular} alt={full.commonName} loading="lazy" />}
                  <PlantFacts plant={full} />
                  <button className="button is-primary is-small is-fullwidth" onClick={() => onPickPlant(full)}>
                    <i className="fa-solid fa-hand-point-up" />&nbsp; Pianta nell'aiuola
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {loading && <p className="panel-note">Caricamento…</p>}
      {!loading && !state.items.length && !state.error && <p className="panel-note">Nessuna pianta trovata.</p>}
      {!loading && page < state.lastPage && (
        <button className="button is-small is-fullwidth is-light" onClick={() => setPage((p) => p + 1)}>
          Mostra altre
        </button>
      )}
    </div>
  );
}
