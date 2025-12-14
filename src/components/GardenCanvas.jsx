import React, { useRef, useState, useEffect } from "react";
import { Stage, Layer, Line, Circle, Text, Rect } from "react-konva";

export default function GardenCanvas() {
  const stageRef = useRef(null);

  const [size, setSize] = useState({ width: 0, height: 0 });

  // lista di aiuole completate
  const [beds, setBeds] = useState([]);

  // aiuola in costruzione
  const [currentBed, setCurrentBed] = useState({ points: [], segments: [], isClosed: false });

  // preview linea
  const [preview, setPreview] = useState(null);

  // pan/zoom
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [isDraggingStage, setIsDraggingStage] = useState(false);
  const [lastDragPos, setLastDragPos] = useState(null);

  // undo/redo
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);

  const AUTO_CLOSE_DISTANCE = 15;
  const MIN_SCALE = 0.5;
  const MAX_SCALE = 3;

  useEffect(() => {
    const resize = () => {
      setSize({ width: window.innerWidth - 40, height: window.innerHeight - 100 });
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const distance = (a, b) =>
    Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2).toFixed(1);

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
      // chiudi aiuola
      const last = currentBed.points[currentBed.points.length - 1];
      const segment = { x1: last.x, y1: last.y, x2: currentBed.points[0].x, y2: currentBed.points[0].y, distance: distance(last, currentBed.points[0]) };
      const newBed = { ...currentBed, segments: [...currentBed.segments, segment], isClosed: true };
      setBeds((b) => [...b, newBed]);
      setCurrentBed({ points: [], segments: [], isClosed: false });
      saveHistory([...beds, newBed], { points: [], segments: [], isClosed: false });
      setPreview(null);
      return;
    }

    // aggiungi punto
    const last = currentBed.points[currentBed.points.length - 1];
    const segment = { x1: last.x, y1: last.y, x2: scaledPos.x, y2: scaledPos.y, distance: distance(last, scaledPos) };
    const newBed = { ...currentBed, points: [...currentBed.points, scaledPos], segments: [...currentBed.segments, segment] };
    setCurrentBed(newBed);
    saveHistory(beds, newBed);
  };

  const handleMove = () => {
    if (currentBed.isClosed || currentBed.points.length === 0) return;
    const pos = stageRef.current.getPointerPosition();
    const scaledPos = { x: (pos.x - stagePos.x) / stageScale, y: (pos.y - stagePos.y) / stageScale };
    setPreview(scaledPos);
  };

  const reset = () => {
    setBeds([]);
    setCurrentBed({ points: [], segments: [], isClosed: false });
    setHistory([]);
    setFuture([]);
    setPreview(null);
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
    <section className="section" style={{ minHeight: "100vh", background: "#e4f0d9" }}>
      <div className="mb-3">
        <button className="button is-small is-danger mr-2" onClick={reset}>Reset</button>
        <button className="button is-small is-warning mr-2" onClick={undo}>Undo</button>
        <button className="button is-small is-success" onClick={redo}>Redo</button>
      </div>

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
      >
        <Layer>
          {/* SFONDO */}
          <Rect x={0} y={0} width={size.width} height={size.height} fill="#d4edc4" />

          {/* AIUOLE COMPLETATE */}
          {beds.map((bed, i) => (
            <React.Fragment key={i}>
              {/* Riempimento */}
              {bed.isClosed && <Line points={bed.points.flatMap(p => [p.x, p.y])} closed fill="#b7d3a8" />}
              {/* Ombra */}
              {bed.segments.map((s, j) => <Line key={`shadow-${i}-${j}`} points={[s.x1+4,s.y1+4,s.x2+4,s.y2+4]} stroke="rgba(0,0,0,0.25)" strokeWidth={6} lineCap="square" lineJoin="miter" />)}
              {/* Bordi */}
              {bed.segments.map((s, j) => (
                <React.Fragment key={j}>
                  <Line points={[s.x1, s.y1, s.x2, s.y2]} stroke="#6F4E37" strokeWidth={6} lineCap="square" lineJoin="miter" />
                  <Text x={(s.x1+s.x2)/2} y={(s.y1+s.y2)/2-16} text={`${s.distance} m`} fill="#3b3b3b" fontSize={14} />
                </React.Fragment>
              ))}
              {/* Giunture */}
              {bed.points.map((p, j) => <Circle key={j} x={p.x} y={p.y} radius={6} fill="#6F4E37" stroke="#e8efe4" strokeWidth={1} />)}
            </React.Fragment>
          ))}

          {/* AIUOLA IN COSTRUZIONE */}
          {currentBed.points.length > 0 && currentBed.segments.map((s, i) => (
            <React.Fragment key={`cur-${i}`}>
              <Line points={[s.x1, s.y1, s.x2, s.y2]} stroke="#6F4E37" strokeWidth={6} lineCap="square" lineJoin="miter" />
              <Text x={(s.x1+s.x2)/2} y={(s.y1+s.y2)/2-16} text={`${s.distance} m`} fill="#3b3b3b" fontSize={14} />
            </React.Fragment>
          ))}

          {currentBed.points.map((p, i) => <Circle key={`curc-${i}`} x={p.x} y={p.y} radius={6} fill="#44533a" stroke="#e8efe4" strokeWidth={1} />)}

          {/* Preview */}
          {preview && currentBed.points.length > 0 && (
            <Line points={[currentBed.points[currentBed.points.length-1].x, currentBed.points[currentBed.points.length-1].y, preview.x, preview.y]} stroke="#6b7a57" strokeWidth={2} dash={[6,4]} />
          )}

          {/* Auto-close indicator */}
          {preview && checkAutoClose(preview) && (
            <Circle x={currentBed.points[0].x} y={currentBed.points[0].y} radius={8} fill="rgba(255,0,0,0.5)" />
          )}
        </Layer>
      </Stage>
    </section>
  );
}
