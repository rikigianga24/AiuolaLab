import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDebounced } from "../../hooks/useDebounced";
import { getHealth, getPlant, searchPlants } from "../../lib/api";
import { COLORS, CYCLE, SEASONS, SOIL_PH, SUNLIGHT, WATERING } from "../../lib/labels";
import { flowerHexes, getIconUrl, iconTypeFor } from "../../lib/plantIcons";
import PlantFacts from "./PlantFacts";
import { plantInfo } from "../../lib/plantInfo";
import { useSession } from "../../lib/session";
import { favPlant, useFavorites } from "../../lib/favorites";
import { matchesLocal } from "../../lib/plantFilters";
import FavButton from "../plants/FavButton";
import PlantGallery from "../plants/PlantGallery";

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
  const { settings } = useSession();
  const favs = useFavorites();
  const [params] = useSearchParams();
  // con delle preferite si parte da quelle (o se si arriva da "Progetta con queste")
  const [onlyFav, setOnlyFav] = useState(() => params.get("preferiti") === "1" || favs.plants.length > 0);
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
  const showingFav = onlyFav && favs.plants.length > 0;
  const visible = (showingFav ? favs.plants.filter((p) => matchesLocal(p, filters)) : state.items).filter((p) => !petSafe || isSafe(p));

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

      <div className="fav-switch" role="group" aria-label="Quali piante mostrare">
        <button type="button" className={showingFav ? "is-active" : ""} onClick={() => setOnlyFav(true)} disabled={!favs.plants.length}>
          <i className="fa-solid fa-heart" /> Preferite <span className="tab-count">{favs.plants.length}</span>
        </button>
        <button type="button" className={!showingFav ? "is-active" : ""} onClick={() => setOnlyFav(false)}>
          <i className="fa-solid fa-book-open" /> Tutto il catalogo
        </button>
      </div>
      {!favs.plants.length && (
        <p className="fav-hint">
          <i className="fa-regular fa-heart" /> Non hai ancora piante preferite. <Link to="/piante">Sfoglia le piante con le foto</Link> e tocca il cuore su
          quelle che ti piacciono: le ritrovi qui.
        </p>
      )}

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

      {source === "demo" && !showingFav && (
        <p className="panel-note">
          <i className="fa-solid fa-circle-info" /> Catalogo di esempio: configura <code>PERENUAL_API_KEY</code> sul server per usare il database completo.
        </p>
      )}

      {state.error && <p className="panel-error">{state.error}</p>}

      <ul className="plant-list">
        {visible.map((plant) => {
          const full = details[plant.id] ?? plant;
          const open = openId === plant.id;
          return (
            <li key={plant.id} className={`plant-item ${open ? "is-open" : ""}`}>
              <div className="plant-row-wrap">
                <button className="plant-row" onClick={() => toggle(plant)} aria-expanded={open}>
                  <img className="plant-icon" src={getIconUrl(iconTypeFor(plant), flowerHexes(plant), 96, plant.commonName)} alt="" />
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
                <FavButton size="small" active={favs.isFav(String(plant.id))} onToggle={() => favs.toggle(favPlant(full))} name={plant.commonName} />
              </div>
              {open && (
                <div className="plant-detail">
                  <PlantGallery name={full.scientificName} fallbackImage={full.image?.regular} compact />
                  <PlantFacts plant={full} />
                  <button className="button is-primary is-small is-fullwidth" onClick={() => onPickPlant(full)}>
                    <i className="fa-solid fa-hand-point-up" />
                    &nbsp; Pianta nell'aiuola
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {!showingFav && loading && <p className="panel-note">Caricamento…</p>}
      {(showingFav || !loading) && !visible.length && !state.error && (
        <p className="panel-note">{showingFav ? "Nessuna preferita con questi filtri." : "Nessuna pianta trovata."}</p>
      )}
      {!showingFav && !loading && page < state.lastPage && (
        <button className="button is-small is-fullwidth is-light" onClick={() => setPage((p) => p + 1)}>
          Mostra altre
        </button>
      )}
    </div>
  );
}
