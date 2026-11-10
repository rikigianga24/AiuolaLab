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
import { computeIrrigation } from "../../lib/irrigation";
import { useSession } from "../../lib/session";
import { ENVIRONMENTS, syncProject, emptyProject, lastEnvironment, loadCurrent, saveCurrent, saveLastEnvironment } from "../../lib/projects";
import { POT_TYPES, createPot, isFloor, isPot } from "../../lib/containers";
import { CROP_BY_ID, cropAsPlant } from "../../lib/crops";
import { fillRows } from "../../lib/rows";
import "../../styles/garden.css";
import ConfirmDialog from "../ConfirmDialog";
import GardenStage from "./GardenStage";
import SidePanel from "./SidePanel";
import Tour from "./Tour";
import { Compass, OrientationDialog } from "./Orientation";
import { analyzeBed } from "../../lib/forecast";
import StylePicker from "../StylePicker";
import { tourDone } from "../../lib/tour";
import { useConsent } from "../../lib/consent";

const SNAP_STEP = 0.05; // 5 cm

const HINTS_MOBILE = {
  select: "Un dito per spostarti · due dita per lo zoom",
  draw: "Tocca per i vertici · tocca il primo punto per chiudere",
  place: "Tocca dentro un'aiuola per piantare",
  faucet: "Tocca dove si trova il rubinetto",
  pot: "Tocca dove mettere il vaso",
  viewer: "Tocca il punto da cui guardi l'aiuola",
};

const HINTS = {
  select: "Trascina per spostarti · rotella o due dita per lo zoom · tocca un'aiuola per selezionarla",
  draw: "Tocca per aggiungere i vertici · tocca il primo punto (o «Chiudi») per completare l'aiuola",
  place: "Tocca dentro un'aiuola per piantare · «Fine» per smettere",
  faucet: "Tocca il punto del disegno dove si trova il rubinetto",
  pot: "Tocca il punto dove mettere il vaso (sul terrazzo o in giardino)",
  viewer: "Tocca il punto da cui guardi di solito l'aiuola: la finestra, la terrazza, il vialetto...",
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
  const history = useHistory(loadCurrent(lastEnvironment()));
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
  const [styleOpen, setStyleOpen] = useState(false);
  const [showIrrigation, setShowIrrigation] = useState(true);
  const [placingPot, setPlacingPot] = useState(null);
  const [tourOpen, setTourOpen] = useState(() => !tourDone());
  const consent = useConsent();
  const [potMenu, setPotMenu] = useState(false);
  const environment = project.type ?? "garden";
  const balcony = environment === "balcony";

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

  // Salvataggio automatico del progetto aperto nel browser e, con l'account,
  // anche sul server.
  const { user, settings } = useSession();
  const { patchAll } = history;
  useEffect(() => {
    const t = setTimeout(() => saveCurrent(project), 400);
    return () => clearTimeout(t);
  }, [project]);
  useEffect(() => {
    // si sincronizza con l'account oppure se il progetto è condiviso con un link
    // (così chi ha il link vede sempre l'ultima versione)
    if (!(user || project.shareToken) || (!project.beds.length && !project.remoteId)) return;
    const t = setTimeout(() => {
      syncProject(project)
        .then((saved) => {
          if (saved.remoteId && saved.remoteId !== project.remoteId) patchAll((p) => ({ ...p, remoteId: saved.remoteId }));
        })
        .catch(() => {});
    }, 2500);
    return () => clearTimeout(t);
  }, [project, user, patchAll]);

  const irrigation = useMemo(() => computeIrrigation(project), [project]);

  const placeFaucet = (p) => {
    setProject((pr) => ({ ...pr, faucet: p }));
    setMode("select");
    setShowIrrigation(true);
    setTab("irrigazione");
    notify("Rubinetto posizionato: impianto calcolato.", "success");
  };

  // ---- previsione di crescita ----
  const [forecastYear, setForecastYear] = useState(3);
  const [orientOpen, setOrientOpen] = useState(false);
  const placeViewer = (p) => {
    setProject((pr) => ({ ...pr, viewer: p }));
    setMode("select");
    setTab("crescita");
    if (isMobile) setSheetOpen(true);
    notify("Punto di vista segnato: puoi trascinarlo quando vuoi.", "success");
  };
  const startViewer = () => {
    setMode("viewer");
    setDraft([]);
    setPlacing(null);
    if (isMobile) setSheetOpen(false);
  };

  const startFaucet = () => {
    setMode("faucet");
    setDraft([]);
    setPlacing(null);
    setSelection(null);
    if (isMobile) setSheetOpen(false);
  };

  const selectedBed = useMemo(
    () => project.beds.find((b) => b.id === selection?.bedId) ?? null,
    [project.beds, selection],
  );

  const forecast = useMemo(
    () => (tab === "crescita" && selectedBed && !isFloor(selectedBed) ? analyzeBed(selectedBed, { viewer: project.viewer ?? null, northDeg: project.northDeg ?? null, climate: settings.climate }) : null),
    [tab, selectedBed, project.viewer, project.northDeg, settings.climate],
  );
  const growthMarks = useMemo(() => {
    const y = forecast?.ok && forecastYear > 0 ? forecast.years[forecastYear] : null;
    if (!y) return null;
    const marks = {};
    for (const p of y.dominant) marks[p.id] = "dominant";
    for (const p of y.atRisk) marks[p.id] = "risk";
    return marks;
  }, [forecast, forecastYear]);

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
    setPlacingPot(null);
    setPotMenu(false);
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
    if (polygonArea(draft) < 0.05) return notify(balcony ? "Il terrazzo è troppo piccolo." : "L'aiuola è troppo piccola.", "warning");
    const veg = environment === "vegetable";
    const bed = veg
      ? {
          id: newId(),
          kind: "veg",
          name: `Orto ${project.beds.filter((b) => b.kind === "veg").length + 1}`,
          points: draft,
          conditions: { sunlight: "full_sun", texture: "loamy" },
          viewedFrom: "all",
          surface: "soil",
          edging: "wood",
          plants: [],
          history: [],
        }
      : balcony
      ? {
          id: newId(),
          kind: "floor",
          name: `Terrazzo ${project.beds.filter(isFloor).length + 1}`,
          points: draft,
          floor: "cotto",
          railing: "metal",
          conditions: { sunlight: "full_sun" },
          plants: [],
        }
      : {
          id: newId(),
          name: `Aiuola ${project.beds.length + 1}`,
          points: draft,
          conditions: { sunlight: "full_sun" },
          viewedFrom: "all",
          surface: "bark",
          edging: "stone",
          plants: [],
        };
    updateBeds((beds) => [...beds, bed]);
    setDraft([]);
    setMode("select");
    setSelection({ bedId: bed.id, plantId: null });
    setTab("aiuola");
    if (isMobile) setSheetOpen(true);
    notify(
      veg
        ? "Aiuola dell'orto creata. Scegli un ortaggio e usa «Riempi a file»."
        : balcony
          ? "Terrazzo creato. Ora aggiungi i vasi con «Aggiungi vaso»."
          : "Aiuola creata. Imposta esposizione e terreno, poi scegli le piante.",
    );
    if (veg) setTab("piante");
  };

  // ---- orto ----

  const fillBedRows = (bedId, crop, variety = null) => {
    const bed = project.beds.find((b) => b.id === bedId);
    if (!bed) return;
    const occupied = (bed.plants ?? []).map((p) => ({ x: p.x, y: p.y, r: p.spreadM / 2 }));
    const spots = fillRows(bed.points, crop.spacing, { occupied, margin: bed.kind === "pot" ? 0.03 : undefined });
    if (!spots.length) return notify("Non c'è più spazio libero in questa aiuola.", "warning");
    const asPlant = cropAsPlant(crop, variety);
    const spreadM = Math.min(crop.spacing.row, crop.spacing.plant) / 100;
    const plants = spots.map((s) => toPlaced(asPlant, s, { spreadM, row: s.row }));
    updateBed(bedId, (b) => ({ ...b, plants: [...(b.plants ?? []), ...plants] }));
    setSelection({ bedId, plantId: null });
    if (isMobile) setSheetOpen(false);
    const rows = new Set(spots.map((s) => s.row)).size;
    notify(`${asPlant.commonName}: ${plants.length} piante su ${rows} ${rows === 1 ? "fila" : "file"}.`, "success");
  };

  const endSeason = (bedId, clear) => {
    const year = new Date().getFullYear();
    updateBed(bedId, (b) => {
      const families = [...new Set((b.plants ?? []).map((p) => CROP_BY_ID[p.cropId]?.family).filter(Boolean))];
      const history = [...(b.history ?? []).filter((h) => h.year !== year), { year, families }];
      return { ...b, history, plants: clear ? [] : b.plants };
    });
    notify("Stagione registrata: l'anno prossimo ti avviserò se ripianti la stessa famiglia.", "success");
  };

  // ---- vasi ----

  const startPot = (type) => {
    setPotMenu(false);
    setPlacingPot(type);
    setMode("pot");
    setDraft([]);
    setPlacing(null);
    setSelection(null);
    if (isMobile) setSheetOpen(false);
  };

  const placePot = (point) => {
    const count = project.beds.filter(isPot).length + 1;
    // sul terrazzo il vaso prende l'esposizione del pavimento sotto
    const floor = project.beds.find((b) => isFloor(b) && pointInPolygon(point, b.points));
    const pot = createPot(placingPot, point, { id: newId(), name: `${POT_TYPES[placingPot].label} ${count}` });
    if (floor?.conditions?.sunlight) pot.conditions = { ...pot.conditions, sunlight: floor.conditions.sunlight };
    updateBeds((beds) => [...beds, pot]);
    setMode("select");
    setPlacingPot(null);
    setSelection({ bedId: pot.id, plantId: null });
    setTab("aiuola");
    if (isMobile) setSheetOpen(true);
    notify("Vaso aggiunto: scegli le piante dal catalogo o chiedi un consiglio all'IA.");
  };

  // ---- piante ----

  const placePlant = (bedId, point) => {
    if (!placing) return;
    if (!bedId) return notify(balcony ? "Tocca dentro un vaso." : "Tocca dentro un'aiuola o un vaso.", "warning");
    if (isFloor(project.beds.find((b) => b.id === bedId))) {
      return notify("Sul terrazzo le piante vanno nei vasi: aggiungi un vaso.", "warning");
    }
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
    // nella scheda Crescita si resta lì: toccare un'aiuola la analizza
    if (sel?.bedId && tab !== "crescita") setTab("aiuola");
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
    const { placed, skipped } = autoLayout(bed.points, groups, {
      viewedFrom: bed.viewedFrom,
      blocked,
      container: isPot(bed),
    });
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

  // Cambio ambiente: ogni ambiente ha il suo progetto aperto, niente si perde.
  const switchEnvironment = (type) => {
    if (type === environment) return;
    saveCurrent(project);
    saveLastEnvironment(type);
    openProject(loadCurrent(type));
    setTab(type === "balcony" ? "aiuola" : "piante");
  };

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
      onConfirm: () => openProject(emptyProject(environment)),
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
    <div className={`garden-app ${isMobile ? "is-mobile" : ""} ${isMobile && sheetOpen ? "sheet-open" : ""}`}>
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
            irrigation={showIrrigation ? irrigation : null}
            faucet={project.faucet}
            onPlaceFaucet={placeFaucet}
            environment={environment}
            placingPot={placingPot}
            onPlacePot={placePot}
            onFaucetMove={(p) => setProject((pr) => ({ ...pr, faucet: p }))}
            viewer={project.viewer}
            onPlaceViewer={placeViewer}
            onViewerMove={(p) => setProject((pr) => ({ ...pr, viewer: p }))}
            growthYear={tab === "crescita" ? forecastYear : null}
            growthMarks={growthMarks}
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
                <i className="fa-solid fa-check" /> <span>{balcony ? "Chiudi terrazzo" : "Chiudi aiuola"}</span>
              </button>
              <button className="tool-btn" onClick={stopMode}>
                <i className="fa-solid fa-xmark" /> <span>Annulla disegno</span>
              </button>
            </>
          ) : mode === "pot" ? (
            <>
              <span className="tool-chip">
                <i className="fa-solid fa-bucket" /> {POT_TYPES[placingPot]?.label}
              </span>
              <button className="tool-btn" onClick={stopMode}>
                <i className="fa-solid fa-xmark" /> <span>Annulla</span>
              </button>
            </>
          ) : mode === "viewer" ? (
            <>
              <span className="tool-chip">
                <i className="fa-solid fa-eye" /> Da dove guardi l'aiuola?
              </span>
              <button className="tool-btn" onClick={stopMode}>
                <i className="fa-solid fa-xmark" /> <span>Annulla</span>
              </button>
            </>
          ) : mode === "faucet" ? (
            <>
              <span className="tool-chip">
                <i className="fa-solid fa-faucet-drip" /> Posiziona il rubinetto
              </span>
              <button className="tool-btn" onClick={stopMode}>
                <i className="fa-solid fa-xmark" /> <span>Annulla</span>
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
            <>
              <button className="tool-btn is-primary" onClick={startDraw}>
                <i className="fa-solid fa-draw-polygon" /> <span>{balcony ? "Disegna terrazzo" : "Disegna aiuola"}</span>
              </button>
              <span className="pot-menu-wrap">
                <button className="tool-btn" onClick={() => setPotMenu((v) => !v)} aria-expanded={potMenu}>
                  <i className="fa-solid fa-bucket" /> <span>Aggiungi vaso</span>
                </button>
                {potMenu && (
                  <div className="pot-menu" role="menu">
                    {Object.entries(POT_TYPES).map(([k, v]) => (
                      <button key={k} role="menuitem" onClick={() => startPot(k)}>
                        <span className={`pot-glyph ${v.shape} ${k}`} />
                        <span>
                          {v.label}
                          <small>
                            {v.shape === "round" ? `Ø ${v.w * 100} cm` : `${v.w * 100} × ${v.d * 100} cm`}
                          </small>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </span>
            </>
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
          <button className="tool-btn icon zoom-step" onClick={() => stageApi.current?.zoomIn()} aria-label="Ingrandisci">
            <i className="fa-solid fa-plus" />
          </button>
          <button className="tool-btn icon zoom-step" onClick={() => stageApi.current?.zoomOut()} aria-label="Riduci">
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
          <div className="style-menu-wrap">
            <button
              className={`tool-btn icon ${styleOpen ? "is-on" : ""}`}
              onClick={() => setStyleOpen((v) => !v)}
              aria-expanded={styleOpen}
              aria-label="Stile del disegno"
              title="Stile del disegno"
            >
              <i className="fa-solid fa-palette" />
            </button>
            {styleOpen && (
              <div className="style-pop">
                <p className="style-pop-title">Stile del disegno</p>
                <StylePicker onChange={() => setStyleOpen(false)} />
              </div>
            )}
          </div>
          <button className="tool-btn icon" onClick={() => setTourOpen(true)} aria-label="Guida" title="Guida">
            <i className="fa-solid fa-question" />
          </button>
          {project.faucet && (
            <button
              className={`tool-btn icon ${showIrrigation ? "is-on" : ""}`}
              onClick={() => setShowIrrigation((v) => !v)}
              aria-pressed={showIrrigation}
              aria-label="Impianto di irrigazione"
              title="Impianto di irrigazione"
            >
              <i className="fa-solid fa-droplet" />
            </button>
          )}
        </div>

        {(project.northDeg != null || tab === "crescita") && (
          <div className="compass-wrap">
            <Compass northDeg={project.northDeg ?? null} onClick={() => setOrientOpen(true)} size={isMobile ? 52 : 64} />
          </div>
        )}

        {!(isMobile && sheetOpen) && <div className="garden-hint">{(isMobile ? HINTS_MOBILE : HINTS)[mode]}</div>}

        {toast && (
          <div key={toast.at} className={`garden-toast is-${toast.kind}`} role="status">
            {toast.message}
          </div>
        )}
      </div>

      <SidePanel
        isMobile={isMobile}
        environment={environment}
        onEnvironmentChange={switchEnvironment}
        onFillRows={fillBedRows}
        onEndSeason={endSeason}
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
        onReplaceBed={(next) =>
          updateBed(next.id, () => ({
            ...next,
            // le piante rimaste fuori dal vaso ridimensionato vengono tolte
            plants: next.plants.filter((p) => pointInPolygon(p, next.points)),
          }))
        }
        onDeleteSelection={deleteSelection}
        onDeleteBed={deleteBed}
        irrigation={irrigation}
        mode={mode}
        onStartFaucet={startFaucet}
        onRemoveFaucet={() => setProject((pr) => ({ ...pr, faucet: null }))}
        onIrrigationSettings={(patch) => setProject((pr) => ({ ...pr, irrigation: { ...pr.irrigation, ...patch } }))}
        showIrrigation={showIrrigation}
        onToggleIrrigation={setShowIrrigation}
        onProjectSaved={(remoteId) => history.patchAll((p) => ({ ...p, remoteId }))}
        onProjectShared={(shared) => history.patchAll((p) => ({ ...p, remoteId: shared.remoteId, shareToken: shared.shareToken }))}
        onRemovePlants={(bedId, plantIds) =>
          updateBed(bedId, (b) => ({ ...b, plants: b.plants.filter((p) => !plantIds.includes(p.id)) }))
        }
        onApplySuggestion={applySuggestion}
        onOpenProject={openProject}
        onNewProject={newProject}
        onRenameProject={renameProject}
        onBudgetSettings={(patch) => setProject((pr) => ({ ...pr, budget: { ...pr.budget, ...patch } }))}
        notify={notify}
        forecast={forecast}
        forecastYear={forecastYear}
        onForecastYear={setForecastYear}
        onStartViewer={startViewer}
        onOpenOrientation={() => setOrientOpen(true)}
        onSelectForecastBed={(bedId) => setSelection({ bedId, plantId: null })}
      />

      {orientOpen && (
        <OrientationDialog northDeg={project.northDeg ?? null} onSave={(deg) => setProject((pr) => ({ ...pr, northDeg: deg }))} onClose={() => setOrientOpen(false)} />
      )}

      {/* la guida parte dopo la scelta sui cookie, per non sovrapporsi al banner */}
      <Tour open={tourOpen && Boolean(consent)} onClose={() => setTourOpen(false)} />

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
