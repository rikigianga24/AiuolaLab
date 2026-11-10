// Progetto condiviso con un link: si guarda ma non si modifica.
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useElementSize } from "../hooks/useElementSize";
import { getSharedProject } from "../lib/api";
import { isFloor, isPot } from "../lib/containers";
import { polygonArea } from "../lib/geometry";
import { applyPageMeta } from "../lib/pageMeta";
import { getIconUrl } from "../lib/plantIcons";
import { ENVIRONMENTS } from "../lib/projects";
import { sharedMeta } from "../lib/seo";
import GardenStage from "./garden/GardenStage";
import "../styles/garden.css";
import "../styles/pages.css";

const noop = () => {};
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }) : "");

// Piante del progetto raggruppate per nome, con la quantità.
function plantSummary(beds) {
  const byName = new Map();
  for (const bed of beds) {
    for (const p of bed.plants ?? []) {
      const key = p.name ?? "Pianta";
      const cur = byName.get(key) ?? { name: key, scientificName: p.scientificName, icon: p.icon, colors: p.colors, count: 0 };
      cur.count += 1;
      byName.set(key, cur);
    }
  }
  return [...byName.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "it"));
}

function SharedCanvas({ project, onSelect, selection }) {
  const ref = useRef(null);
  const size = useElementSize(ref);
  const stage = useRef(null);
  return (
    <div className="shared-canvas" ref={ref}>
      {size.width > 0 && (
        <GardenStage
          ref={stage}
          width={size.width}
          height={size.height}
          beds={project.beds}
          draft={[]}
          mode="view"
          placing={null}
          selection={selection}
          snapStep={0.1}
          showGrid={false}
          showLabels
          environment={project.type}
          irrigation={null}
          faucet={project.faucet}
          onSelect={onSelect}
          onDraftPoint={noop}
          onDraftClose={noop}
          onPlace={noop}
          onPlantDrag={noop}
          onPlantDragEnd={noop}
          onVertexDrag={noop}
          onVertexDragEnd={noop}
          onBedMove={noop}
          onPlaceFaucet={noop}
          onFaucetMove={noop}
          onPlacePot={noop}
          onPlaceViewer={noop}
          onViewerMove={noop}
        />
      )}
      <button type="button" className="tool-btn icon shared-fit" onClick={() => stage.current?.fit()} aria-label="Inquadra tutto" title="Inquadra tutto">
        <i className="fa-solid fa-expand" />
      </button>
    </div>
  );
}

export default function SharedPage() {
  const { token } = useParams();
  const [state, setState] = useState({ loading: true, error: null, project: null });
  const [selection, setSelection] = useState(null);

  useEffect(() => {
    let alive = true;
    getSharedProject(token)
      .then((r) => {
        if (!alive) return;
        setState({ loading: false, error: null, project: { ...r.data, name: r.name, updatedAt: r.updatedAt } });
        applyPageMeta(sharedMeta(r.name));
      })
      .catch((err) => alive && setState({ loading: false, error: err.status === 404 ? "notfound" : err.message, project: null }));
    return () => {
      alive = false;
    };
  }, [token]);

  const project = state.project;
  const plants = useMemo(() => (project ? plantSummary(project.beds) : []), [project]);
  const stats = useMemo(() => {
    if (!project) return null;
    const beds = project.beds.filter((b) => !isFloor(b));
    const area = beds.filter((b) => !isPot(b)).reduce((sum, b) => sum + polygonArea(b.points ?? []), 0);
    return { beds: beds.filter((b) => !isPot(b)).length, pots: beds.filter(isPot).length, area, plants: plants.reduce((s, p) => s + p.count, 0) };
  }, [project, plants]);

  const selected = useMemo(() => {
    if (!project || !selection?.plantId) return null;
    const bed = project.beds.find((b) => b.id === selection.bedId);
    return bed?.plants?.find((p) => p.id === selection.plantId) ?? null;
  }, [project, selection]);

  if (state.loading) {
    return (
      <div className="page shared-page">
        <p className="shared-status">
          <i className="fa-solid fa-seedling fa-bounce" /> Carico il progetto…
        </p>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="page shared-page">
        <div className="container shared-empty card-country">
          <p className="script">peccato…</p>
          <h1>{state.error === "notfound" ? "Questo link non funziona più" : "Non riesco ad aprire il progetto"}</h1>
          <p>{state.error === "notfound" ? "Chi l'ha condiviso potrebbe aver smesso di condividerlo, oppure il link è incompleto." : state.error}</p>
          <Link to="/gardencanvas" className="btn-country is-primary">
            <i className="fa-solid fa-trowel" /> Progetta il tuo, è gratis
          </Link>
        </div>
      </div>
    );
  }

  const env = ENVIRONMENTS[project.type] ?? ENVIRONMENTS.garden;
  return (
    <div className="page shared-page">
      <div className="container">
        <header className="shared-head">
          <p className="script">
            <i className={`fa-solid ${env.icon}`} /> {(env.short ?? env.label).toLowerCase()} condiviso con te
          </p>
          <h1>{project.name}</h1>
          <p className="shared-meta">
            {stats.beds > 0 && <span>{stats.beds === 1 ? "1 aiuola" : `${stats.beds} aiuole`}</span>}
            {stats.pots > 0 && <span>{stats.pots === 1 ? "1 vaso" : `${stats.pots} vasi`}</span>}
            {stats.area > 0 && <span>{stats.area.toLocaleString("it-IT", { maximumFractionDigits: 1 })} m²</span>}
            <span>{stats.plants === 1 ? "1 pianta" : `${stats.plants} piante`}</span>
            {project.updatedAt && <span>aggiornato il {fmtDate(project.updatedAt)}</span>}
          </p>
        </header>

        <div className="shared-layout">
          <div className="shared-stage-wrap">
            <SharedCanvas project={project} selection={selection} onSelect={setSelection} />
            <p className="shared-hint">
              {selected ? (
                <>
                  <strong>{selected.name}</strong>
                  {selected.scientificName && selected.scientificName !== selected.name && <em> · {selected.scientificName}</em>}
                </>
              ) : (
                "Tocca una pianta per vedere il nome. Puoi spostare e ingrandire il disegno."
              )}
            </p>
          </div>

          <aside className="shared-side">
            <h2>Le piante</h2>
            {plants.length ? (
              <ul className="shared-plants">
                {plants.map((p) => (
                  <li key={p.name}>
                    {p.icon && <img src={getIconUrl(p.icon, p.colors ?? [], 64, p.name)} alt="" width="36" height="36" />}
                    <span>
                      <strong>{p.name}</strong>
                      {p.scientificName && p.scientificName !== p.name && <em>{p.scientificName}</em>}
                    </span>
                    <span className="shared-count">×{p.count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="panel-note">Ancora nessuna pianta.</p>
            )}

            <div className="shared-cta card-country">
              <p className="script">ti piace?</p>
              <h2>Progetta il tuo</h2>
              <p>Con AiuolaLab disegni il tuo giardino, balcone o orto in scala reale e scegli le piante adatte. Gratis.</p>
              <Link to="/gardencanvas" className="btn-country is-primary">
                <i className="fa-solid fa-trowel" /> Inizia ora
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
