import React, { useState, useRef } from "react";
import { Stage, Layer, Line, Circle, Text } from "react-konva";

export default function GardenCanvas() {
  const stageRef = useRef();
  const [points, setPoints] = useState([]);
  const [isDrawing, setIsDrawing] = useState(true);
  const [currentPos, setCurrentPos] = useState(null);
  const [segments, setSegments] = useState([]);
  const [plants, setPlants] = useState([
    { id: 1, x: 300, y: 200, radius: 25, name: "Lavanda" },
    { id: 2, x: 400, y: 300, radius: 20, name: "Rosa" },
  ]);

  const getDistance = (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2).toFixed(1);

  const handleMouseDown = (e) => {
    if (!isDrawing) return;
    const pos = stageRef.current.getPointerPosition();

    if (points.length > 0) {
      const prevX = points[points.length - 2];
      const prevY = points[points.length - 1];
      const dist = getDistance(prevX, prevY, pos.x, pos.y);
      setSegments((prev) => [...prev, { x1: prevX, y1: prevY, x2: pos.x, y2: pos.y, distance: dist }]);
    }

    setPoints((prev) => [...prev, pos.x, pos.y]);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || points.length === 0) return;
    const pos = stageRef.current.getPointerPosition();
    setCurrentPos(pos);
  };

  const closePolygon = () => {
    setIsDrawing(false);
    setCurrentPos(null);

    if (points.length >= 4) {
      const x1 = points[points.length - 2];
      const y1 = points[points.length - 1];
      const x2 = points[0];
      const y2 = points[1];
      const dist = getDistance(x1, y1, x2, y2);
      setSegments((prev) => [...prev, { x1, y1, x2, y2, distance: dist }]);
    }
  };

  const isInsidePolygon = (x, y) => {
    if (points.length < 6) return false;
    let inside = false;
    for (let i = 0, j = points.length / 2 - 1; i < points.length / 2; j = i++) {
      const xi = points[i * 2], yi = points[i * 2 + 1];
      const xj = points[j * 2], yj = points[j * 2 + 1];
      const intersect = ((yi > y) !== (yj > y)) &&
        (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const handleDragMove = (e, id) => {
    const x = e.target.x();
    const y = e.target.y();
    if (!isInsidePolygon(x, y)) {
      e.target.position({ x: plants.find(p => p.id === id).x, y: plants.find(p => p.id === id).y });
      return;
    }
    setPlants((prev) => prev.map(p => p.id === id ? { ...p, x, y } : p));
  };

  // linea temporanea e distanza
  let tempLine = null;
  let tempText = null;
  if (isDrawing && currentPos && points.length > 0) {
    const x1 = points[points.length - 2];
    const y1 = points[points.length - 1];
    const x2 = currentPos.x;
    const y2 = currentPos.y;
    const dist = getDistance(x1, y1, x2, y2);

    tempLine = <Line points={[x1, y1, x2, y2]} stroke="#a67c52" strokeWidth={3} />;
    tempText = <Text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 20} text={`${dist} m`} fontSize={16} fill="#5c4033" />;
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#efe8dc',
      fontFamily: 'Arial, sans-serif',
      paddingTop: '20px',
    }}>
      <h1 style={{ color: '#5c4033', marginBottom: '10px' }}>Editor Aiuola</h1>
      <p style={{ color: '#5c4033', marginBottom: '20px' }}>Traccia la tua aiuola cliccando e trascinando. Le distanze sono mostrate in tempo reale.</p>
      
      <button
        onClick={closePolygon}
        disabled={!isDrawing}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          marginBottom: '20px',
          backgroundColor: '#a67c52',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          boxShadow: '2px 2px 5px rgba(0,0,0,0.3)',
          transition: 'all 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#8c6239'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#a67c52'}
      >
        Chiudi Aiuola
      </button>

      <Stage
        width={900}
        height={600}
        style={{
          borderRadius: '15px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
          border: '3px solid #5c4033',
          backgroundColor: '#f5f0e1',
        }}
        ref={stageRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
      >
        <Layer>
          {/* segmenti piazzati */}
          {segments.map((seg, idx) => (
            <React.Fragment key={idx}>
              <Line points={[seg.x1, seg.y1, seg.x2, seg.y2]} stroke="#5c4033" strokeWidth={3} />
              <Text
                x={(seg.x1 + seg.x2) / 2}
                y={(seg.y1 + seg.y2) / 2 - 20}
                text={`${seg.distance} m`}
                fontSize={16}
                fill="#5c4033"
              />
            </React.Fragment>
          ))}

          {/* linea temporanea */}
          {tempLine}
          {tempText}

          {/* piante */}
          {plants.map((p) => (
            <Circle
              key={p.id}
              x={p.x}
              y={p.y}
              radius={p.radius}
              fill="#8a9a5b"
              stroke="#5c4033"
              strokeWidth={3}
              draggable
              onDragMove={(e) => handleDragMove(e, p.id)}
            />
          ))}
        </Layer>
      </Stage>

      <footer style={{ marginTop: '30px', color: '#5c4033' }}>
        &copy; 2025 GardenAI
      </footer>
    </div>
  );
}
