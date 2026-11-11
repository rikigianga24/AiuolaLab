import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getPlant, searchPlants } from "../lib/api";
import { useConsent } from "../lib/consent";
import { CROPS, CROP_BY_ID, FAMILIES, cropAsPlant, monthsLabel } from "../lib/crops";
import { GARDEN_STYLES, STYLE_BY_ID } from "../lib/gardenStyles";
import { favCrop, favPlant, useFavorites } from "../lib/favorites";
import { COLORS, SEASONS, SUNLIGHT, WATERING, floweringLabel, hardinessInfo } from "../lib/labels";
import { useInView, usePlantPhotos } from "../lib/photos";
import { flowerHexes, getIconUrl, iconTypeFor } from "../lib/plantIcons";
import { useDebounced } from "../hooks/useDebounced";
import PlantFacts from "./garden/PlantFacts";
import PlantSafety from "./garden/PlantSafety";
import { PageHero } from "./decor";
import FavButton from "./plants/FavButton";
import PlantGallery, { PhotoConsent } from "./plants/PlantGallery";
import "../styles/pages.css";
import "../styles/discover.css";

const TABS = [
  { id: "piante", label: "Fiori e piante", icon: "fa-seedling" },
  { id: "orto", label: "Ortaggi", icon: "fa-carrot" },
  { id: "preferiti", label: "Le mie preferite", icon: "fa-heart" },
];

const QUICK_COLORS = ["white", "yellow", "orange", "red", "pink", "purple", "blue"];

// Elemento uniforme per piante del catalogo e ortaggi.
const fromPlant = (plant) => ({
  key: String(plant.id),
  kind: "plant",
  name: plant.commonName,
  sci: plant.scientificName,
  icon: getIconUrl(iconTypeFor(plant), flowerHexes(plant), 160, plant.commonName),
  plant,
  fav: favPlant(plant),
});

const fromCrop = (crop) => ({
  key: `crop:${crop.id}`,
  kind: "crop",
  name: crop.name,
  sci: crop.scientificName,
  icon: getIconUrl(iconTypeFor({ cropId: crop.id }), crop.colors, 160, crop.name),
  plant: cropAsPlant(crop),
  crop,
  fav: favCrop(crop),
});

function CardPhoto({ item }) {
  const consent = useConsent();
  const [ref, inView] = useInView();
  const { data } = usePlantPhotos(item.sci, { enabled: Boolean(consent?.external) && inView });
  // per una varietà senza foto proprie meglio il disegno (col colore giusto)
  // di una foto generica del genere: una rosa rossa non è una rosa qualsiasi
  const photo = data?.variety && data.match !== "variety" ? null : data?.photos?.[0];
  return (
    <div className="dc-photo" ref={ref}>
      <img className="dc-icon" src={item.icon} alt="" />
      {photo && <img className="dc-real" src={photo.medium} alt={item.name} loading="lazy" />}
      {photo && <span className="dc-credit">© {photo.attribution.replace(/^©\s*/, "")}</span>}
    </div>
  );
}

function Chips({ item }) {
  const p = item.plant;
  const cold = hardinessInfo(p.hardiness);
  const sow = item.crop ? [...(item.crop.direct ?? []), ...(item.crop.transplant ?? [])] : [];
  return (
    <ul className="dc-chips">
      {p.sunlight?.map((s) => (
        <li key={s}>
          <i className={`fa-solid ${SUNLIGHT[s].icon}`} /> {SUNLIGHT[s].label}
        </li>
      ))}
      {p.watering && (
        <li>
          <i className="fa-solid fa-droplet" /> {WATERING[p.watering].label}
        </li>
      )}
      {cold && (
        <li className={`cold-${cold.level.key}`}>
          <i className="fa-solid fa-snowflake" /> {cold.text}
        </li>
      )}
      {item.crop && sow.length > 0 && (
        <li>
          <i className="fa-solid fa-seedling" /> In campo: {monthsLabel([...new Set(sow)])}
        </li>
      )}
      {item.crop && (
        <li>
          <i className="fa-solid fa-basket-shopping" /> Raccolta dopo ~{item.crop.days} giorni
        </li>
      )}
    </ul>
  );
}

function PlantCard({ item, fav, onToggleFav, onOpen }) {
  const p = item.plant;
  return (
    <article className={`discover-card ${fav ? "is-fav" : ""}`}>
      <button type="button" className="dc-open" onClick={onOpen} aria-label={`Apri la scheda di ${item.name}`}>
        <CardPhoto item={item} />
      </button>
      <FavButton active={fav} onToggle={onToggleFav} name={item.name} />
      <div className="dc-body">
        <h3>
          <button type="button" onClick={onOpen}>
            {item.name}
          </button>
        </h3>
        <p className="dc-sci">{item.sci}</p>
        <Chips item={item} />
        {p.flowerColors?.length > 0 && (
          <p className="dc-flowers">
            {p.flowerColors.map((c) => (
              <span key={c} className="dot" style={{ background: COLORS[c]?.hex }} title={COLORS[c]?.label} />
            ))}
            <span>
              {p.floweringMonths?.length
                ? `Fiorisce ${floweringLabel(p.floweringMonths, { short: true })}`
                : `Fiorisce in ${p.floweringSeasons?.map((s) => SEASONS[s]?.toLowerCase()).join(", ") || "—"}`}
            </span>
          </p>
        )}
        {item.crop && <p className="dc-flowers">{FAMILIES[item.crop.family]}</p>}
      </div>
    </article>
  );
}

function PlantSheet({ item, fav, onToggleFav, onClose }) {
  const [full, setFull] = useState(null);
  const plant = full ?? item.plant;

  useEffect(() => {
    if (item.kind !== "plant" || item.plant.detailsLoaded) return;
    let alive = true;
    getPlant(item.plant.id)
      .then((p) => alive && setFull(p))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [item]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.classList.add("no-scroll");
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.classList.remove("no-scroll");
    };
  }, [onClose]);

  const crop = item.crop;
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet card-country" role="dialog" aria-modal="true" aria-labelledby="sheet-title" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="sheet-close" onClick={onClose} aria-label="Chiudi">
          <i className="fa-solid fa-xmark" />
        </button>
        <PlantGallery name={item.sci} fallbackImage={plant.image?.regular} icon={item.icon} />
        <div className="sheet-head">
          <div>
            <h2 id="sheet-title">{item.name}</h2>
            <p className="dc-sci">{item.sci}</p>
          </div>
          <FavButton active={fav} onToggle={onToggleFav} name={item.name} withLabel />
        </div>
        {crop ? (
          <dl className="plant-facts">
            <dt>Famiglia</dt>
            <dd>{FAMILIES[crop.family]}</dd>
            <dt>Semenzaio</dt>
            <dd>{monthsLabel(crop.indoor)}</dd>
            <dt>Semina</dt>
            <dd>{monthsLabel(crop.direct)}</dd>
            <dt>Trapianto</dt>
            <dd>{monthsLabel(crop.transplant)}</dd>
            <dt>Raccolta</dt>
            <dd>
              {monthsLabel(crop.harvest)} · dopo circa {crop.days} giorni
            </dd>
            <dt>Distanze</dt>
            <dd>
              {crop.spacing.row} cm tra le file · {crop.spacing.plant} cm sulla fila
            </dd>
            <dt>Piante amiche</dt>
            <dd>{crop.good.map((id) => CROP_BY_ID[id]?.name.toLowerCase() ?? id).join(", ") || "—"}</dd>
            {crop.notes && (
              <>
                <dt>Consiglio</dt>
                <dd>{crop.notes}</dd>
              </>
            )}
            <dd className="facts-wide">
              <PlantSafety plant={plant} />
            </dd>
          </dl>
        ) : (
          <PlantFacts plant={plant} />
        )}
      </div>
    </div>
  );
}

// Segnaposto in fondo all'elenco: quando entra nello schermo chiede altre
// piante (c'è anche il pulsante "Mostra altre" come riserva).
function useSentinel(onVisible) {
  const ref = useRef(null);
  const callback = useRef(onVisible);
  useEffect(() => {
    callback.current = onVisible;
  });
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && callback.current(), { rootMargin: "400px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

export default function DiscoverPage() {
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === params.get("tab")) ? params.get("tab") : "piante";
  const [q, setQ] = useState(params.get("q") ?? "");
  const [sunlight, setSunlight] = useState("");
  const [style, setStyle] = useState(STYLE_BY_ID[params.get("stile")] ? params.get("stile") : "");
  const [color, setColor] = useState("");
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ key: null, items: [], lastPage: 1, error: null });
  const [open, setOpen] = useState(null);
  const closeSheet = useCallback(() => setOpen(null), []);
  const debouncedQ = useDebounced(q);
  const consent = useConsent();
  const favs = useFavorites();

  const setTab = (id) => {
    const next = new URLSearchParams(params);
    next.set("tab", id);
    setParams(next, { replace: true });
  };

  // catalogo piante (paginato dal server)
  const queryKey = JSON.stringify({ q: debouncedQ, sunlight, color, style });
  const requestKey = `${queryKey}#${page}`;
  useEffect(() => {
    if (tab !== "piante") return;
    const ctrl = new AbortController();
    searchPlants({ ...JSON.parse(queryKey), page }, ctrl.signal)
      .then((res) =>
        setState((s) => ({ key: `${queryKey}#${page}`, items: page === 1 ? res.items : [...s.items, ...res.items], lastPage: res.lastPage, error: null })),
      )
      .catch((err) => err.name !== "AbortError" && setState((s) => ({ ...s, key: `${queryKey}#${page}`, error: err.message })));
    return () => ctrl.abort();
  }, [tab, queryKey, page]);
  const loading = tab === "piante" && state.key !== requestKey;

  const items = useMemo(() => {
    const needle = debouncedQ.trim().toLowerCase();
    const match = (it) => !needle || `${it.name} ${it.sci}`.toLowerCase().includes(needle);
    if (tab === "orto") return CROPS.map(fromCrop).filter(match);
    if (tab === "preferiti")
      return favs.list
        .map((f) => (f.kind === "crop" ? (CROP_BY_ID[f.cropId] ? fromCrop(CROP_BY_ID[f.cropId]) : null) : f.plant ? fromPlant(f.plant) : null))
        .filter(Boolean)
        .filter(match);
    return state.items.map(fromPlant);
  }, [tab, debouncedQ, favs.list, state.items]);

  const canLoadMore = tab === "piante" && !loading && page < state.lastPage;
  const moreRef = useSentinel(() => canLoadMore && setPage((p) => p + 1));

  const resetPage = (fn) => (v) => {
    fn(v);
    setPage(1);
  };

  return (
    <div className="page discover-page">
      <PageHero
        compact
        script="prima di progettare"
        title="Scopri le piante"
        lead="Scorri le schede, guarda le foto e tocca il cuore su quelle che ti piacciono. Poi le ritrovi pronte quando disegni la tua aiuola."
      >
        <div className="discover-search">
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          <input
            type="search"
            value={q}
            onChange={(e) => resetPage(setQ)(e.target.value)}
            placeholder="Cerca: rosa, lavanda, pomodoro…"
            aria-label="Cerca una pianta"
          />
        </div>
      </PageHero>

      <section className="page-body">
        <div className="container">
          <div className="discover-tabs" role="tablist">
            {TABS.map((t) => (
              <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={tab === t.id ? "is-active" : ""} onClick={() => setTab(t.id)}>
                <i className={`fa-solid ${t.icon}`} /> {t.label}
                {t.id === "preferiti" && favs.count > 0 && <span className="tab-count">{favs.count}</span>}
              </button>
            ))}
          </div>

          {tab === "piante" && (
            <div className="discover-filters">
              <label className="style-select">
                <i className="fa-solid fa-book-open" aria-hidden="true" />
                <select value={style} onChange={(e) => resetPage(setStyle)(e.target.value)} aria-label="Stile di giardino">
                  <option value="">Tutti gli stili di giardino</option>
                  {GARDEN_STYLES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="choice-row" role="group" aria-label="Esposizione">
                {Object.entries(SUNLIGHT).map(([k, v]) => (
                  <button key={k} type="button" className={`choice ${sunlight === k ? "is-active" : ""}`} onClick={() => resetPage(setSunlight)(sunlight === k ? "" : k)}>
                    <i className={`fa-solid ${v.icon}`} /> {v.label}
                  </button>
                ))}
              </div>
              <div className="color-filter" role="group" aria-label="Colore dei fiori">
                {QUICK_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={color === c ? "is-active" : ""}
                    style={{ background: COLORS[c].hex }}
                    onClick={() => resetPage(setColor)(color === c ? "" : c)}
                    aria-pressed={color === c}
                    title={COLORS[c].label}
                    aria-label={`Fiori ${COLORS[c].label.toLowerCase()}`}
                  />
                ))}
              </div>
            </div>
          )}

          {!consent?.external && tab !== "preferiti" && <PhotoConsent compact />}

          {state.error && tab === "piante" && <p className="panel-error">{state.error}</p>}

          {tab === "preferiti" && !favs.count ? (
            <div className="card-country empty-state">
              <i className="fa-regular fa-heart" />
              <p>Non hai ancora scelto nessuna pianta. Scorri «Fiori e piante» o «Ortaggi» e tocca il cuore su quelle che ti piacciono.</p>
            </div>
          ) : (
            <div className="discover-grid">
              {items.map((item) => (
                <PlantCard
                  key={item.key}
                  item={item}
                  fav={favs.isFav(item.key)}
                  onToggleFav={() => favs.toggle(item.fav)}
                  onOpen={() => setOpen(item)}
                />
              ))}
            </div>
          )}

          {loading && <p className="discover-status">Carico le piante…</p>}
          {!loading && !items.length && tab !== "preferiti" && <p className="discover-status">Nessuna pianta trovata con questi filtri.</p>}
          <div ref={moreRef} className="discover-more">
            {canLoadMore && (
              <button type="button" className="btn-country is-light is-small" onClick={() => setPage((p) => p + 1)}>
                Mostra altre piante
              </button>
            )}
          </div>
        </div>
      </section>

      {favs.count > 0 && (
        <div className="fav-bar" role="status">
          <span>
            <i className="fa-solid fa-heart" /> {favs.count === 1 ? "1 pianta scelta" : `${favs.count} piante scelte`}
          </span>
          <Link to="/gardencanvas?preferiti=1" className="btn-country is-primary is-small">
            Progetta con queste <i className="fa-solid fa-arrow-right" />
          </Link>
        </div>
      )}

      {open && <PlantSheet key={open.key} item={open} fav={favs.isFav(open.key)} onToggleFav={() => favs.toggle(open.fav)} onClose={closeSheet} />}
    </div>
  );
}
