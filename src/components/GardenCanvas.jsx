import React, { useState, useRef, useEffect } from "react";
import { Stage, Layer, Line, Circle, Text } from "react-konva";

export default function GardenCanvas() {
  const stageRef = useRef(null);
  const stageWrapperRef = useRef(null);

  /* ================== STATO AIUOLA ================== */
  const [points, setPoints] = useState([]);
  const [segments, setSegments] = useState([]);
  const [isDrawing, setIsDrawing] = useState(true);
  const [currentPos, setCurrentPos] = useState(null);

  /* ================== STATO PIANTE ================== */
  const [plants, setPlants] = useState([]);
  const plantCatalog = [
    { id: "lavanda", name: "Lavanda", radius: 22 },
    { id: "rosa", name: "Rosa", radius: 20 },
    { id: "salvia", name: "Salvia", radius: 18 },
    { id: "ortensia", name: "Ortensia", radius: 24 },
  ];

  /* ================== UI ================== */
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  /* ================== UTILS ================== */
  const getDistance = (x1, y1, x2, y2) =>
    Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2).toFixed(1);

  const isInsidePolygon = (x, y) => {
    if (points.length < 6) return false;
    let inside = false;
    for (let i = 0, j = points.length / 2 - 1; i < points.length / 2; j = i++) {
      const xi = points[i * 2], yi = points[i * 2 + 1];
      const xj = points[j * 2], yj = points[j * 2 + 1];
      const intersect =
        yi > y !== yj > y &&
        x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const canPlacePlant = (x, y, radius, excludeId = null) => {
    if (!isInsidePolygon(x, y)) return false;
    for (const p of plants) {
      if (excludeId && p.id === excludeId) continue;
      const dx = p.x - x;
      const dy = p.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < p.radius + radius + 6) return false;
    }
    return true;
  };

  /* ================== DISEGNO AIUOLA ================== */
  const handleMouseDown = () => {
    if (!isDrawing) return;
    const pos = stageRef.current.getPointerPosition();

    if (points.length > 0) {
      const px = points[points.length - 2];
      const py = points[points.length - 1];
      const dist = getDistance(px, py, pos.x, pos.y);
      setSegments((s) => [...s, { x1: px, y1: py, x2: pos.x, y2: pos.y, distance: dist }]);
    }

    setPoints((p) => [...p, pos.x, pos.y]);
  };

  const handleMouseMove = () => {
    if (!isDrawing || points.length === 0) return;
    setCurrentPos(stageRef.current.getPointerPosition());
  };

  const closePolygon = () => {
    if (points.length < 6) return;
    setIsDrawing(false);
    setCurrentPos(null);

    const x1 = points[points.length - 2];
    const y1 = points[points.length - 1];
    const x2 = points[0];
    const y2 = points[1];
    const dist = getDistance(x1, y1, x2, y2);
    setSegments((s) => [...s, { x1, y1, x2, y2, distance: dist }]);
  };

  /* ================== DRAG DAL MENU ================== */
  const handleDragStart = (e, plant) => {
    e.dataTransfer.setData("plant", JSON.stringify(plant));
  };

  useEffect(() => {
    const el = stageWrapperRef.current;
    if (!el) return;

    const onDragOver = (e) => e.preventDefault();

    const onDrop = (e) => {
      e.preventDefault();

      if (points.length < 6) {
        showToast("Disegna e chiudi prima l'aiuola");
        return;
      }

      const data = JSON.parse(e.dataTransfer.getData("plant"));
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (!canPlacePlant(x, y, data.radius)) {
        showToast("Posizione non valida");
        return;
      }

      setPlants((p) => [...p, { ...data, x, y, id: Date.now() }]);
    };

    el.addEventListener("dragover", onDragOver);
    el.addEventListener("drop", onDrop);

    return () => {
      el.removeEventListener("dragover", onDragOver);
      el.removeEventListener("drop", onDrop);
    };
  }, [points, plants]);

  /* ================== DRAG INTERNO ================== */
  const handlePlantDragMove = (e, plant) => {
    const x = e.target.x();
    const y = e.target.y();

    if (!canPlacePlant(x, y, plant.radius, plant.id)) {
      e.target.position({ x: plant.x, y: plant.y });
      return;
    }

    setPlants((p) => p.map((pl) => (pl.id === plant.id ? { ...pl, x, y } : pl)));
  };

  /* ================== LINEA TEMP ================== */
  let tempLine = null;
  let tempText = null;
  if (isDrawing && currentPos && points.length > 0) {
    const x1 = points[points.length - 2];
    const y1 = points[points.length - 1];
    const x2 = currentPos.x;
    const y2 = currentPos.y;
    const dist = getDistance(x1, y1, x2, y2);

    tempLine = <Line points={[x1, y1, x2, y2]} stroke="#b8c4a2" strokeWidth={3} />;
    tempText = <Text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 16} text={`${dist} m`} fill="#6b705c" />;
  }

  /* ================== RENDER ================== */
  return (
    <section className="section" style={{ background: "linear-gradient(180deg,#f7f9f3,#eef2e6)", minHeight: "100vh" }}>
      <div className="container is-fluid">
        <div className="columns is-gapless is-vcentered">

          {/* SIDEBAR */}
          <aside className="column is-3">
            <div className="box" style={{ backgroundColor: "#ffffffcc", borderRadius: 16 }}>
              <h1 className="title is-5" style={{ color: "#6b705c" }}>GardenCanvas</h1>
              <p className="is-size-7 mb-3" style={{ color: "#7d8471" }}>
                Trascina le piante e disegna la tua aiuola
              </p>

              <input
                className="input is-small mb-3"
                placeholder="Cerca pianta"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              {plantCatalog
                .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
                .map((p) => (
                  <div
                    key={p.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, p)}
                    className="box is-clickable is-shadowless"
                    style={{ background: "#f1f5ec", borderRadius: 12 }}
                  >
                    🌱 {p.name}
                  </div>
                ))}

              <button
                className="button is-fullwidth is-small mt-4"
                style={{ backgroundColor: "#b7c4a0", color: "#fff" }}
                onClick={closePolygon}
                disabled={!isDrawing}
              >
                Chiudi aiuola
              </button>
            </div>
          </aside>

          {/* CANVAS */}
          <div className="column is-9" ref={stageWrapperRef} style={{ position: "relative" }}>
            {toast && (
              <div className="notification" style={{ position: "absolute", top: 20, right: 20, backgroundColor: "#fefae0", color: "#6b705c", borderRadius: 12, zIndex: 10 }}>
                {toast}
              </div>
            )}

            <div className="box" style={{ backgroundColor: "#ffffffcc", borderRadius: 20 }}>
              <Stage
                width={900}
                height={600}
                ref={stageRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                style={{ background: "#fafbf7", borderRadius: 16 }}
              >
                <Layer>
                  {segments.map((s, i) => (
                    <React.Fragment key={i}>
                      <Line points={[s.x1, s.y1, s.x2, s.y2]} stroke="#6b705c" strokeWidth={3} />
                      <Text x={(s.x1 + s.x2) / 2} y={(s.y1 + s.y2) / 2 - 16} text={`${s.distance} m`} fill="#6b705c" />
                    </React.Fragment>
                  ))}

                  {tempLine}
                  {tempText}

                  {plants.map((p) => (
                    <Circle
                      key={p.id}
                      x={p.x}
                      y={p.y}
                      radius={p.radius}
                      fill="#a5b68d"
                      stroke="#6b705c"
                      strokeWidth={2}
                      draggable
                      onDragMove={(e) => handlePlantDragMove(e, p)}
                    />
                  ))}
                </Layer>
              </Stage>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
