import React, { useRef, useState, useEffect } from "react";
import { Stage, Layer, Line, Circle, Text, Rect } from "react-konva";
import "../styles/GardenCanvas.css";

export default function GardenCanvas() {
  const stageRef = useRef(null);

  const [size, setSize] = useState({ width: 0, height: 0 });
  const [beds, setBeds] = useState([]);
  const [currentBed, setCurrentBed] = useState({ points: [], segments: [], isClosed: false });
  const [preview, setPreview] = useState(null);

  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [isDraggingStage, setIsDraggingStage] = useState(false);
  const [lastDragPos, setLastDragPos] = useState(null);

  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);

  const [menuItems, setMenuItems] = useState([
    { id: 1, name: "Pianta A" },
    { id: 2, name: "Pianta B" },
    { id: 3, name: "Pianta C" },
  ]);
  const [search, setSearch] = useState("");
  const [draggingPlant, setDraggingPlant] = useState(null);
  const [buildingBed, setBuildingBed] = useState(false); // Nuovo stato modalità aiuola

  const AUTO_CLOSE_DISTANCE = 15;
  const MIN_SCALE = 0.5;
  const MAX_SCALE = 3;

  // Aggiungi uno stato per il toast
const [showConfirm, setShowConfirm] = useState(false);

// Funzione per mostrare il toast
const confirmClear = () => setShowConfirm(true);
const cancelClear = () => setShowConfirm(false);
const proceedClear = () => { reset(); setShowConfirm(false); };

  useEffect(() => {
    const resize = () =>
      setSize({ width: window.innerWidth - 280, height: window.innerHeight - 40 });
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const distance = (a, b) => Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2).toFixed(1);

  const checkAutoClose = (pos) => {
    if (currentBed.points.length < 3) return false;
    const first = currentBed.points[0];
    return distance(first, pos) < AUTO_CLOSE_DISTANCE;
  };

  const saveHistory = (bedsState, current) => {
    setHistory((h) => [...h, { beds: bedsState, currentBed: current }]);
    setFuture([]);
  };

  const handleClick = () => {
    if (!buildingBed) return; // click ignorati se non in modalità costruzione
    if (isDraggingStage) return;
    const pos = stageRef.current.getPointerPosition();
    const scaledPos = { x: (pos.x - stagePos.x) / stageScale, y: (pos.y - stagePos.y) / stageScale };

    if (currentBed.isClosed) return;

    if (currentBed.points.length === 0) {
      setCurrentBed({ points: [scaledPos], segments: [], isClosed: false });
      saveHistory(beds, { points: [scaledPos], segments: [], isClosed: false });
      return;
    }

    if (checkAutoClose(scaledPos)) {
      const last = currentBed.points[currentBed.points.length - 1];
      const segment = { x1: last.x, y1: last.y, x2: currentBed.points[0].x, y2: currentBed.points[0].y, distance: distance(last, currentBed.points[0]) };
      const newBed = { ...currentBed, segments: [...currentBed.segments, segment], isClosed: true };
      setBeds((b) => [...b, newBed]);
      setCurrentBed({ points: [], segments: [], isClosed: false });
      saveHistory([...beds, newBed], { points: [], segments: [], isClosed: false });
      setPreview(null);
      setBuildingBed(false); // disattiva costruzione aiuola
      return;
    }

    const last = currentBed.points[currentBed.points.length - 1];
    const segment = { x1: last.x, y1: last.y, x2: scaledPos.x, y2: scaledPos.y, distance: distance(last, scaledPos) };
    const newBed = { ...currentBed, points: [...currentBed.points, scaledPos], segments: [...currentBed.segments, segment] };
    setCurrentBed(newBed);
    saveHistory(beds, newBed);
  };

  const handleMove = (e) => {
    const pos = stageRef.current.getPointerPosition();
    const scaledPos = { x: (pos.x - stagePos.x) / stageScale, y: (pos.y - stagePos.y) / stageScale };
    if (draggingPlant) {
      setPreview({ ...scaledPos, plant: draggingPlant });
    } else if (currentBed.points.length > 0 && buildingBed) {
      setPreview(scaledPos);
    }
  };

  const handleDropPlant = (pos) => {
    const scaledPos = { x: (pos.x - stagePos.x)/stageScale, y: (pos.y - stagePos.y)/stageScale };
    const insideAnyBed = beds.find(bed => {
      if (!bed.isClosed) return false;
      let inside = false;
      for (let i=0,j=bed.points.length-1;i<bed.points.length;j=i++) {
        const xi = bed.points[i].x, yi = bed.points[i].y;
        const xj = bed.points[j].x, yj = bed.points[j].y;
        const intersect = ((yi>scaledPos.y)!==(yj>scaledPos.y)) && (scaledPos.x < (xj-xi)*(scaledPos.y-yi)/(yj-yi)+xi);
        if (intersect) inside = !inside;
      }
      return inside;
    });
    if (!insideAnyBed) return;
    setBeds(prev => {
      const newBeds = [...prev];
      const bedIndex = prev.indexOf(insideAnyBed);
      if (!newBeds[bedIndex].elements) newBeds[bedIndex].elements = [];
      newBeds[bedIndex].elements.push({ ...draggingPlant, x: scaledPos.x, y: scaledPos.y, id: Date.now() });
      return newBeds;
    });
  };

  const reset = () => {
    setBeds([]);
    setCurrentBed({ points: [], segments: [], isClosed: false });
    setHistory([]);
    setFuture([]);
    setPreview(null);
    setDraggingPlant(null);
    setBuildingBed(false);
  };

  const undo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setFuture((f) => [last, ...f]);
    const prev = history[history.length - 2] || { beds: [], currentBed: { points: [], segments: [], isClosed: false } };
    setBeds(prev.beds);
    setCurrentBed(prev.currentBed);
    setHistory(history.slice(0, history.length - 1));
  };

  const redo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setBeds(next.beds);
    setCurrentBed(next.currentBed);
    setHistory((h) => [...h, next]);
    setFuture(future.slice(1));
  };

  const handleWheel = (e) => {
    e.evt.preventDefault();
    const scaleBy = 1.05;
    const oldScale = stageScale;
    const pointer = stageRef.current.getPointerPosition();
    const mousePointTo = { x: (pointer.x - stagePos.x) / oldScale, y: (pointer.y - stagePos.y) / oldScale };
    let newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
    setStageScale(newScale);
    setStagePos({ x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale });
  };

  const handleStageDragStart = (e) => { setIsDraggingStage(true); setLastDragPos({ x: e.evt.clientX, y: e.evt.clientY }); };
  const handleStageDragEnd = () => { setIsDraggingStage(false); setLastDragPos(null); };
  const handleStageDragMove = (e) => {
    if (!isDraggingStage) return;
    const dx = e.evt.clientX - lastDragPos.x;
    const dy = e.evt.clientY - lastDragPos.y;
    setStagePos((pos) => ({ x: pos.x + dx, y: pos.y + dy }));
    setLastDragPos({ x: e.evt.clientX, y: e.evt.clientY });
  };

  return (
    <section className="garden-page">
      <div className="garden-canvas-wrapper" style={{ display: "flex" }}>

        {/* TOOLBAR */}
        <div className="garden-toolbar top" style={{ position: "absolute", zIndex: 10, top: 10, left: 10 }}>
          <button className="garden-btn danger" onClick={confirmClear}><i className="fa-solid fa-trash-can"></i> Clear All</button>
          <button className="garden-btn secondary" onClick={undo}><i className="fa-solid fa-rotate-left"></i> Undo</button>
          <button className="garden-btn" onClick={redo}><i className="fa-solid fa-rotate-right"></i> Redo</button>
          <button className="garden-btn" onClick={() => setBuildingBed(!buildingBed)}><i class="fa-solid fa-trowel"></i>
            {buildingBed ? " Finisci aiuola" : " Costruisci aiuola"}
          </button>
        </div>

        {/* TOAST DI CONFERMA */}
{showConfirm && (
  <div style={{
    position: "fixed",
    bottom: "20px",
    right: "20px",
    background: "#fff",
    padding: "15px 20px",
    borderRadius: "10px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
    zIndex: 100,
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    minWidth: "200px"
  }}>
    <div style={{ fontWeight: 500 }}>Sei sicuro di voler cancellare tutto?</div>
    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
      <button onClick={cancelClear} style={{ padding: "5px 10px", borderRadius: "6px", border: "1px solid #ccc" }}>Annulla</button>
      <button onClick={proceedClear} style={{ padding: "5px 10px", borderRadius: "6px", background: "#e53935", color: "#fff", border: "none" }}>Conferma</button>
    </div>
  </div>
)}

        {/* STAGE */}
        <Stage
          width={size.width}
          height={size.height}
          ref={stageRef}
          scaleX={stageScale}
          scaleY={stageScale}
          x={stagePos.x}
          y={stagePos.y}
          onClick={handleClick}
          onMouseMove={handleMove}
          onWheel={handleWheel}
          draggable
          onDragStart={handleStageDragStart}
          onDragMove={handleStageDragMove}
          onDragEnd={handleStageDragEnd}
          onMouseUp={(e) => {
            if(draggingPlant) {
              handleDropPlant(stageRef.current.getPointerPosition());
              setDraggingPlant(null);
              setPreview(null);
            }
          }}
        >
          <Layer>
            {/* SFONDO VERDE CHIARO ESTESO */}
            <Rect x={-1000} y={-1000} width={3000} height={3000} fill="#dfead3" />

            {/* AIUOLE */}
            {beds.map((bed, i) => (
              <React.Fragment key={i}>
                {bed.isClosed && <Line points={bed.points.flatMap(p => [p.x, p.y])} closed fill="#b7d3a8" />}
                {bed.segments.map((s,j) => <Line key={`shadow-${i}-${j}`} points={[s.x1+4,s.y1+4,s.x2+4,s.y2+4]} stroke="rgba(0,0,0,0.25)" strokeWidth={6} />)}
                {bed.segments.map((s,j) => (
                  <React.Fragment key={j}>
                    <Line points={[s.x1,s.y1,s.x2,s.y2]} stroke="#6F4E37" strokeWidth={6} />
                    <Text x={(s.x1+s.x2)/2} y={(s.y1+s.y2)/2-16} text={`${s.distance} m`} fill="#3b3b3b" fontSize={14} />
                  </React.Fragment>
                ))}
                {bed.points.map((p,j) => <Circle key={j} x={p.x} y={p.y} radius={6} fill="#6F4E37" stroke="#e8efe4" strokeWidth={1} />)}
                {bed.elements && bed.elements.map((el,k) => <Text key={k} x={el.x} y={el.y} text={el.name} fontSize={18} />)}
              </React.Fragment>
            ))}

            {/* AIUOLA IN COSTRUZIONE */}
            {currentBed.segments.map((s,i) => (
              <React.Fragment key={i}>
                <Line points={[s.x1,s.y1,s.x2,s.y2]} stroke="#6F4E37" strokeWidth={6} />
                <Text x={(s.x1+s.x2)/2} y={(s.y1+s.y2)/2-16} text={`${s.distance} m`} fill="#3b3b3b" fontSize={14} />
              </React.Fragment>
            ))}
            {currentBed.points.map((p,i) => <Circle key={i} x={p.x} y={p.y} radius={6} fill="#44533a" stroke="#e8efe4" strokeWidth={1} />)}

            {/* PREVIEW PIANTA DURANTE DRAG */}
            {preview && preview.plant && <Text x={preview.x} y={preview.y} text={preview.plant.name} fontSize={18} opacity={0.6} />}
            {preview && !preview.plant && currentBed.points.length>0 && <Line points={[currentBed.points.at(-1).x,currentBed.points.at(-1).y,preview.x,preview.y]} stroke="#6b7a57" strokeWidth={2} dash={[6,4]} />}
            {preview && checkAutoClose(preview) && <Circle x={currentBed.points[0].x} y={currentBed.points[0].y} radius={8} fill="rgba(255,0,0,0.5)" />}
          </Layer>
        </Stage>

        {/* BOX PIANTE FISSA A DX */}
{/* BOX PIANTE FISSA A DX */}
<div
  style={{
    width: "240px",
    marginLeft: "20px",
    background: "linear-gradient(to bottom, #fefcf2, #f4f2e6)",
    borderRadius: "12px",
    padding: "15px",
    boxShadow: "0px 8px 20px rgba(0,0,0,0.15)",
    height: "calc(100vh - 40px)",
    overflowY: "auto",
    pointerEvents: buildingBed ? "none" : "auto",
    opacity: buildingBed ? 0.5 : 1,
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    transition: "all 0.3s ease"
  }}
>
  <input
    type="text"
    placeholder="Cerca pianta..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    style={{
      width: "100%",
      marginBottom: "12px",
      padding: "8px",
      borderRadius: "8px",
      border: "1px solid #ccc",
      outline: "none",
      fontSize: "14px",
      boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)",
      transition: "all 0.2s ease"
    }}
    disabled={buildingBed}
  />
  {menuItems.filter(item => item.name.toLowerCase().includes(search.toLowerCase())).map(item => (
    <div
      key={item.id}
      className="menu-item"
      style={{
        padding: "10px",
        marginBottom: "8px",
        background: "#e8f5e9",
        borderRadius: "8px",
        cursor: buildingBed ? "not-allowed" : "grab",
        opacity: buildingBed ? 0.5 : 1,
        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
        fontWeight: 500,
        fontSize: "15px",
        transition: "all 0.2s ease",
        userSelect: "none"
      }}
      onMouseDown={() => !buildingBed && setDraggingPlant(item)}
      onMouseEnter={e => !buildingBed && (e.currentTarget.style.background = "#d0e8c8")}
      onMouseLeave={e => !buildingBed && (e.currentTarget.style.background = "#e8f5e9")}
    >
      {item.name}
    </div>
  ))}
</div>

      </div>
    </section>
  );
}
