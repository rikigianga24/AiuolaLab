import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useElementSize } from "../../hooks/useElementSize";
import { useHistory } from "../../hooks/useHistory";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { autoLayout } from "../../lib/layout";
import { pointInPolygon, polygonArea, segmentsCross } from "../../lib/geometry";
import { newId } from "../../lib/ids";
import { plantColor, plantSpreadM } from "../../lib/labels";
import { toPlaced } from "../../lib/placed";
import { flowerHexes, getIconUrl, iconTypeFor } from "../../lib/plantIcons";
import { emptyProject, loadCurrent, saveCurrent } from "../../lib/projects";
import "../../styles/garden.css";
import ConfirmDialog from "../ConfirmDialog";
import GardenStage from "./GardenStage";
import SidePanel from "./SidePanel";

const SNAP_STEP = 0.05; // 5 cm

const HINTS_MOBILE = {
  select: "Un dito per spostarti · due dita per lo zoom",
  draw: "Tocca per i vertici · tocca il primo punto per chiudere",
  place: "Tocca dentro un'aiuola per piantare",
};

const HINTS = {
  select: "Trascina per spostarti · rotella o due dita per lo zoom · tocca un'aiuola per selezionarla",
  draw: "Tocca per aggiungere i vertici · tocca il primo punto (o «Chiudi») per completare l'aiuola",
  place: "Tocca dentro un'aiuola per piantare · «Fine» per smettere",
};

function isSelfIntersecting(points) {
  const n = points.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(i - j) <= 1 || (i === 0 && j === n - 1)) continue;
      if (segmentsCross(points[i], points[(i + 1) % n], points[j], points[(j + 1) % n])) return true;
    }
  }
  return false;
}

export default function GardenPage() {
  const history = useHistory(loadCurrent());
  const project = history.state;
  const { set: setProject, commit, cancel } = history;

  const [mode, setMode] = useState("select");
  const [draft, setDraft] = useState([]);
  const [placing, setPlacing] = useState(null);
  const [selection, setSelection] = useState(null);
  const [tab, setTab] = useState("piante");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showLabels, setShowLabels] = useState(true);

  const isMobile = useMediaQuery("(max-width: 900px)");
  const canvasRef = useRef(null);
  const stageApi = useRef(null);
  const size = useElementSize(canvasRef);

  const notify = useCallback((message, kind = "info") => {
    setToast({ message, kind, at: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  // Salvataggio automatico del progetto aperto nel browser.
  useEffect(() => {
    const t = setTimeout(() => saveCurrent(project), 400);
    return () => clearTimeout(t);
  }, [project]);

  const selectedBed = useMemo(
    () => project.beds.find((b) => b.id === selection?.bedId) ?? null,
    [project.beds, selection],
  );

  const updateBeds = useCallback(
    (fn, opts) => setProject((p) => ({ ...p, beds: fn(p.beds), updatedAt: new Date().toISOString() }), opts),
    [setProject],
  );

  const updateBed = useCallback(
    (bedId, fn, opts) => updateBeds((beds) => beds.map((b) => (b.id === bedId ? fn(b) : b)), opts),
    [updateBeds],
  );

  // ---- modalità ----

  const startDraw = () => {
    setMode("draw");
    setPlacing(null);
    setSelection(null);
    setDraft([]);
    if (isMobile) setSheetOpen(false);
  };

  const stopMode = useCallback(() => {
    setMode("select");
    setDraft([]);
    setPlacing(null);
  }, []);

  const startPlacing = (plant) => {
    setPlacing({
      plant,
      spreadM: plantSpreadM(plant),
      color: plantColor(plant),
      icon: { type: iconTypeFor(plant), colors: flowerHexes(plant) },
    });
    setMode("place");
    setDraft([]);
    if (isMobile) setSheetOpen(false);
    if (!project.beds.length) notify("Disegna prima un'aiuola, poi potrai piantare.", "warning");
  };

  // ---- disegno aiuola ----

  const addDraftPoint = (p) => {
    if (draft.length >= 2) {
      const last = draft.at(-1);
      for (let i = 0; i < draft.length - 2; i++) {
        if (segmentsCross(draft[i], draft[i + 1], last, p)) {
          notify("I lati dell'aiuola non possono incrociarsi.", "warning");
          return;
        }
      }
    }
    if (draft.length && Math.hypot(p.x - draft.at(-1).x, p.y - draft.at(-1).y) < 0.05) return;
    setDraft((d) => [...d, p]);
  };

  const closeDraft = () => {
    if (draft.length < 3) return notify("Servono almeno 3 vertici.", "warning");
    if (isSelfIntersecting(draft)) return notify("Chiudendo così i lati si incrocerebbero.", "warning");
    if (polygonArea(draft) < 0.05) return notify("L'aiuola è troppo piccola.", "warning");
    const bed = {
      id: newId(),
      name: `Aiuola ${project.beds.length + 1}`,
      points: draft,
      conditions: { sunlight: "full_sun" },
      viewedFrom: "all",
      plants: [],
    };
    updateBeds((beds) => [...beds, bed]);
    setDraft([]);
    setMode("select");
    setSelection({ bedId: bed.id, plantId: null });
    setTab("aiuola");
    if (isMobile) setSheetOpen(true);
    notify("Aiuola creata. Imposta esposizione e terreno, poi scegli le piante.");
  };

  // ---- piante ----

  const placePlant = (bedId, point) => {
    if (!placing) return;
    if (!bedId) return notify("Tocca dentro un'aiuola.", "warning");
    const placed = toPlaced(placing.plant, point);
    updateBed(bedId, (b) => ({ ...b, plants: [...(b.plants || []), placed] }));
  };

  const dragPlant = (bedId, plantId, pos) =>
    updateBed(
      bedId,
      (b) => ({ ...b, plants: b.plants.map((p) => (p.id === plantId ? { ...p, x: pos.x, y: pos.y } : p)) }),
      { transient: true },
    );

  const dropPlant = (bedId, plantId, pos) => {
    const bed = project.beds.find((b) => b.id === bedId);
    if (bed && pointInPolygon(pos, bed.points)) commit();
    else {
      cancel();
      notify("La pianta deve restare dentro l'aiuola.", "warning");
    }
  };

  // ---- vertici e spostamento aiuola ----

  const dragVertex = (bedId, index, pos) =>
    updateBed(bedId, (b) => ({ ...b, points: b.points.map((p, i) => (i === index ? pos : p)) }), {
      transient: true,
    });

  const dropVertex = (bedId) => {
    const bed = project.beds.find((b) => b.id === bedId);
    if (!bed || isSelfIntersecting(bed.points) || polygonArea(bed.points) < 0.05) {
      cancel();
      notify("Forma non valida: i lati si incrocerebbero.", "warning");
      return;
    }
    // Le piante rimaste fuori dalla nuova forma vengono rimosse.
    const outside = bed.plants.filter((p) => !pointInPolygon(p, bed.points)).length;
    if (outside) {
      updateBed(bedId, (b) => ({ ...b, plants: b.plants.filter((p) => pointInPolygon(p, b.points)) }));
      notify(`${outside} piante fuori dalla nuova forma sono state rimosse.`, "warning");
    } else commit();
  };

  const moveBed = (bedId, delta) =>
    updateBed(bedId, (b) => ({
      ...b,
      points: b.points.map((p) => ({ x: p.x + delta.x, y: p.y + delta.y })),
      plants: b.plants.map((p) => ({ ...p, x: p.x + delta.x, y: p.y + delta.y })),
    }));

  // ---- selezione ed eliminazione ----

  const handleSelect = (sel) => {
    setSelection(sel);
    if (sel?.bedId) setTab("aiuola");
  };

  const deleteBed = useCallback(
    (bedId) =>
      setConfirm({
        title: "Eliminare l'aiuola?",
        message: "Verranno eliminate anche tutte le piante al suo interno.",
        confirmLabel: "Elimina",
        onConfirm: () => {
          updateBeds((beds) => beds.filter((b) => b.id !== bedId));
          setSelection(null);
        },
      }),
    [updateBeds],
  );

  const deleteSelection = useCallback(() => {
    if (!selection) return;
    if (selection.plantId) {
      updateBed(selection.bedId, (b) => ({ ...b, plants: b.plants.filter((p) => p.id !== selection.plantId) }));
      setSelection({ bedId: selection.bedId, plantId: null });
    } else deleteBed(selection.bedId);
  }, [selection, updateBed, deleteBed]);

  const handleUndo = useCallback(() => {
    if (mode === "draw" && draft.length) setDraft((d) => d.slice(0, -1));
    else history.undo();
  }, [mode, draft.length, history]);

  // ---- consigli IA ----

  const applySuggestion = (bedId, proposal, { replace }) => {
    const bed = project.beds.find((b) => b.id === bedId);
    if (!bed) return;
    const groups = proposal.plants.map((p, i) => {
      const source = p.plant ?? {
        commonName: p.common_name,
        scientificName: p.scientific_name,
        flowerColors: [],
      };
      const spreadM = Math.min(3, Math.max(0.1, (p.spacing_cm || 40) / 100));
      const colorCodes = source.flowerColors?.length ? source.flowerColors : mapColorNames(p.flower_colors);
      const iconSource = { ...source, commonName: p.common_name, scientificName: p.scientific_name, flowerColors: colorCodes };
      return {
        key: String(i),
        layer: p.layer,
        quantity: p.quantity,
        spreadM,
        source,
        name: p.common_name || source.commonName,
        heightCm: p.height_cm,
        color: plantColor({ flowerColors: colorCodes }),
        icon: iconTypeFor(iconSource),
        colors: flowerHexes(iconSource),
      };
    });
    const others = replace ? [] : bed.plants;
    const blocked = others.map((p) => ({ x: p.x, y: p.y, r: p.spreadM / 2 }));
    const { placed, skipped } = autoLayout(bed.points, groups, { viewedFrom: bed.viewedFrom, blocked });
    const byKey = Object.fromEntries(groups.map((g) => [g.key, g]));
    const newPlants = placed.map(({ key, x, y }) => {
      const g = byKey[key];
      return toPlaced(g.source, { x, y }, {
        name: g.name,
        spreadM: g.spreadM,
        heightCm: g.heightCm,
        color: g.color,
        icon: g.icon,
        colors: g.colors,
      });
    });
    updateBed(bedId, (b) => ({ ...b, plants: [...others, ...newPlants], suggestion: proposal.title }));
    setSelection({ bedId, plantId: null });
    if (isMobile) setSheetOpen(false);
    notify(
      skipped
        ? `Piantati ${newPlants.length} esemplari, ${skipped} non entravano nello spazio.`
        : `Piantati ${newPlants.length} esemplari secondo il progetto.`,
      skipped ? "warning" : "success",
    );
  };

  // ---- progetti ----

  const openProject = (p) => {
    history.reset(p);
    setSelection(null);
    stopMode();
    setTimeout(() => stageApi.current?.fit(), 0);
  };

  const newProject = () =>
    setConfirm({
      title: "Nuovo progetto?",
      message: "Il progetto aperto resta salvato solo se l'hai salvato nell'archivio.",
      confirmLabel: "Nuovo progetto",
      onConfirm: () => openProject(emptyProject()),
    });

  const renameProject = (name) => setProject((p) => ({ ...p, name }));

  // ---- tastiera ----

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.("input, textarea, select")) return;
      const mod = e.ctrlKey || e.metaKey;
      if (e.key === "Escape") stopMode();
      else if (e.key === "Enter" && mode === "draw") closeDraft();
      else if ((e.key === "Delete" || e.key === "Backspace") && selection) deleteSelection();
      else if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (mod && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) {
        e.preventDefault();
        history.redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const canUndo = (mode === "draw" && draft.length > 0) || history.canUndo;

  return (
    <div className={`garden-app ${isMobile ? "is-mobile" : ""}`}>
      <div className="garden-canvas" ref={canvasRef}>
        {size.width > 0 && (
          <GardenStage
            ref={stageApi}
            width={size.width}
            height={size.height}
            beds={project.beds}
            draft={draft}
            mode={mode}
            placing={placing}
            selection={selection}
            snapStep={SNAP_STEP}
            showGrid={showGrid}
            showLabels={showLabels}
            onDraftPoint={addDraftPoint}
            onDraftClose={closeDraft}
            onSelect={handleSelect}
            onPlace={placePlant}
            onPlantDrag={dragPlant}
            onPlantDragEnd={dropPlant}
            onVertexDrag={dragVertex}
            onVertexDragEnd={dropVertex}
            onBedMove={moveBed}
          />
        )}

        <div className="garden-toolbar" role="toolbar" aria-label="Strumenti">
          {mode === "draw" ? (
            <>
              <button className="tool-btn is-primary" onClick={closeDraft} disabled={draft.length < 3}>
                <i className="fa-solid fa-check" /> <span>Chiudi aiuola</span>
              </button>
              <button className="tool-btn" onClick={stopMode}>
                <i className="fa-solid fa-xmark" /> <span>Annulla disegno</span>
              </button>
            </>
          ) : mode === "place" ? (
            <>
              <span className="tool-chip" title={placing?.plant.commonName}>
                {placing && <img src={getIconUrl(placing.icon.type, placing.icon.colors, 64, placing.plant.commonName)} alt="" width="26" height="26" />}
                {placing?.plant.commonName}
              </span>
              <button className="tool-btn is-primary" onClick={stopMode}>
                <i className="fa-solid fa-check" /> <span>Fine</span>
              </button>
            </>
          ) : (
            <button className="tool-btn is-primary" onClick={startDraw}>
              <i className="fa-solid fa-draw-polygon" /> <span>Disegna aiuola</span>
            </button>
          )}
          <span className="tool-sep" />
          <button className="tool-btn icon" onClick={handleUndo} disabled={!canUndo} title="Annulla (Ctrl+Z)" aria-label="Annulla">
            <i className="fa-solid fa-rotate-left" />
          </button>
          <button className="tool-btn icon" onClick={history.redo} disabled={!history.canRedo} title="Ripeti (Ctrl+Y)" aria-label="Ripeti">
            <i className="fa-solid fa-rotate-right" />
          </button>
          {selection && mode === "select" && (
            <button className="tool-btn icon is-danger" onClick={deleteSelection} title="Elimina selezione" aria-label="Elimina selezione">
              <i className="fa-solid fa-trash-can" />
            </button>
          )}
        </div>

        <div className="zoom-controls">
          <button className="tool-btn icon" onClick={() => stageApi.current?.zoomIn()} aria-label="Ingrandisci">
            <i className="fa-solid fa-plus" />
          </button>
          <button className="tool-btn icon" onClick={() => stageApi.current?.zoomOut()} aria-label="Riduci">
            <i className="fa-solid fa-minus" />
          </button>
          <button className="tool-btn icon" onClick={() => stageApi.current?.fit()} aria-label="Inquadra tutto" title="Inquadra tutto">
            <i className="fa-solid fa-expand" />
          </button>
          <button
            className={`tool-btn icon ${showGrid ? "is-on" : ""}`}
            onClick={() => setShowGrid((v) => !v)}
            aria-pressed={showGrid}
            aria-label="Griglia"
            title="Griglia di 1 m"
          >
            <i className="fa-solid fa-border-all" />
          </button>
          <button
            className={`tool-btn icon ${showLabels ? "is-on" : ""}`}
            onClick={() => setShowLabels((v) => !v)}
            aria-pressed={showLabels}
            aria-label="Nomi delle piante"
            title="Nomi delle piante"
          >
            <i className="fa-solid fa-tag" />
          </button>
        </div>

        {!(isMobile && sheetOpen) && <div className="garden-hint">{(isMobile ? HINTS_MOBILE : HINTS)[mode]}</div>}

        {toast && (
          <div key={toast.at} className={`garden-toast is-${toast.kind}`} role="status">
            {toast.message}
          </div>
        )}
      </div>

      <SidePanel
        isMobile={isMobile}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        tab={tab}
        onTabChange={setTab}
        project={project}
        selectedBed={selectedBed}
        selection={selection}
        onSelect={handleSelect}
        onPickPlant={startPlacing}
        onUpdateBed={(bedId, patch) => updateBed(bedId, (b) => ({ ...b, ...patch }))}
        onDeleteSelection={deleteSelection}
        onDeleteBed={deleteBed}
        onProjectSaved={(remoteId) => history.patchAll((p) => ({ ...p, remoteId }))}
        onRemovePlants={(bedId, plantIds) =>
          updateBed(bedId, (b) => ({ ...b, plants: b.plants.filter((p) => !plantIds.includes(p.id)) }))
        }
        onApplySuggestion={applySuggestion}
        onOpenProject={openProject}
        onNewProject={newProject}
        onRenameProject={renameProject}
        notify={notify}
      />

      {confirm && (
        <ConfirmDialog
          {...confirm}
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            confirm.onConfirm();
            setConfirm(null);
          }}
        />
      )}
    </div>
  );
}

const COLOR_NAME_MAP = [
  ["white", /bianc|white|crema/i],
  ["yellow", /giall|yellow|oro/i],
  ["orange", /aranc|orange/i],
  ["red", /ross|red|cremisi/i],
  ["pink", /rosa|pink|fucsia/i],
  ["purple", /viol|lilla|lavanda|porpora|purple/i],
  ["blue", /blu|azzurr|blue|celest/i],
];

function mapColorNames(names = []) {
  return names.flatMap((n) => COLOR_NAME_MAP.filter(([, re]) => re.test(n)).map(([code]) => code));
}
