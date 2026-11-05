import { useEffect, useImperativeHandle, useRef, useState } from "react";
import { Circle, Group, Image as KImage, Label, Layer, Line, Rect, Shape, Stage, Tag, Text } from "react-konva";
import { bbox, dist, formatM, pointInPolygon, snap } from "../../lib/geometry";
import { ICON_FILL, getIconCanvas, iconForPlaced } from "../../lib/plantIcons";
import { lawnTexture, mulchTexture } from "../../lib/textures";

export const PX_PER_M = 60;
const MIN_ZOOM = 0.15;
const MAX_ZOOM = 6;
const CLOSE_RADIUS_PX = 16;

const COLORS = {
  gridMinor: "rgba(255, 255, 255, 0.10)",
  gridMajor: "rgba(255, 255, 255, 0.22)",
  edgeJoint: "#4b443b",
  edgeStone: "#cbc2b1",
  edgeSelected: "#f2a23a",
  draft: "#fdf8ec",
  draftShadow: "rgba(30, 30, 20, 0.6)",
  label: "#1f2a1a",
};

// Scala delle texture: lato della piastrella in metri.
const LAWN_TILE_M = 2.5;
const MULCH_TILE_M = 1.2;
// Bordura in pietra: spessore e lunghezza dei blocchetti in metri.
const EDGE_W = 0.12;
const EDGE_STONE = [0.22, 0.025];

// Rotazione stabile per ogni esemplare: le piante uguali non sembrano timbri.
const rotationFor = (id) => {
  let h = 0;
  for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h) % 360;
};

// Barra della scala con una lunghezza "tonda" tra 60 e 160 px.
function scaleBar(scale) {
  const steps = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50];
  const m = steps.find((s) => s * scale >= 60) ?? 50;
  return { m, px: m * scale, label: m < 1 ? `${Math.round(m * 100)} cm` : `${m} m` };
}

const clampZoom = (z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

function Grid({ width, height, view }) {
  const scale = view.zoom * PX_PER_M;
  return (
    <Shape
      listening={false}
      sceneFunc={(ctx) => {
        const x0 = -view.x / scale, y0 = -view.y / scale;
        const x1 = x0 + width / scale, y1 = y0 + height / scale;
        const minorStep = scale > 90 ? 0.5 : scale > 12 ? 1 : 5;
        const majorStep = minorStep < 1 ? 1 : minorStep * 5;
        ctx.lineWidth = 1 / scale;
        for (const [step, color] of [[minorStep, COLORS.gridMinor], [majorStep, COLORS.gridMajor]]) {
          ctx.beginPath();
          for (let x = Math.floor(x0 / step) * step; x <= x1; x += step) {
            ctx.moveTo(x, y0);
            ctx.lineTo(x, y1);
          }
          for (let y = Math.floor(y0 / step) * step; y <= y1; y += step) {
            ctx.moveTo(x0, y);
            ctx.lineTo(x1, y);
          }
          ctx.strokeStyle = color;
          ctx.stroke();
        }
      }}
    />
  );
}

function EdgeLabels({ points, closed, scale }) {
  const count = closed ? points.length : points.length - 1;
  const fontSize = 12;
  return Array.from({ length: Math.max(0, count) }, (_, i) => {
    const a = points[i], b = points[(i + 1) % points.length];
    const len = dist(a, b);
    if (len * scale < 36) return null; // troppo corto per l'etichetta
    const text = formatM(len);
    // Etichetta parallela al lato, sempre leggibile (mai capovolta).
    let angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
    if (angle > 90 || angle < -90) angle += 180;
    const width = text.length * fontSize * 0.62;
    return (
      <Group
        key={i}
        x={(a.x + b.x) / 2}
        y={(a.y + b.y) / 2}
        rotation={angle}
        scaleX={1 / scale}
        scaleY={1 / scale}
        listening={false}
      >
        <Text
          text={text}
          fontSize={fontSize}
          fontStyle="600"
          fill="#fff"
          shadowColor="black"
          shadowOpacity={0.9}
          shadowBlur={3}
          width={width}
          align="center"
          offsetX={width / 2}
          offsetY={fontSize * 1.6}
        />
      </Group>
    );
  });
}

export default function GardenStage({
  ref,
  showGrid = true,
  showLabels = true,
  width,
  height,
  beds,
  draft,
  mode,
  placing,
  selection,
  snapStep,
  onDraftPoint,
  onDraftClose,
  onSelect,
  onPlace,
  onPlantDrag,
  onPlantDragEnd,
  onVertexDrag,
  onVertexDragEnd,
  onBedMove,
}) {
  const stageRef = useRef(null);
  const layerRef = useRef(null);
  const pinch = useRef(null);
  const [view, setView] = useState({ x: 40, y: 40, zoom: 1 });
  const [hover, setHover] = useState(null);
  const scale = view.zoom * PX_PER_M;

  // Inquadra tutte le aiuole (o un'area di 8×6 m se il progetto è vuoto).
  const fit = () => {
    if (!width || !height) return;
    const pts = beds.flatMap((b) => b.points);
    const box = pts.length ? bbox(pts) : { minX: 0, minY: 0, width: 8, height: 6 };
    const pad = 48;
    const zoom = clampZoom(
      Math.min((width - pad * 2) / Math.max(box.width, 1), (height - pad * 2) / Math.max(box.height, 1)) / PX_PER_M,
    );
    const s = zoom * PX_PER_M;
    setView({
      zoom,
      x: width / 2 - (box.minX + box.width / 2) * s,
      y: height / 2 - (box.minY + box.height / 2) * s,
    });
  };

  const zoomAt = (factor, center = { x: width / 2, y: height / 2 }) => {
    setView((v) => {
      const zoom = clampZoom(v.zoom * factor);
      const s0 = v.zoom * PX_PER_M, s1 = zoom * PX_PER_M;
      const wx = (center.x - v.x) / s0, wy = (center.y - v.y) / s0;
      return { zoom, x: center.x - wx * s1, y: center.y - wy * s1 };
    });
  };

  useImperativeHandle(ref, () => ({ fit, zoomIn: () => zoomAt(1.25), zoomOut: () => zoomAt(0.8) }));

  // Inquadratura iniziale, appena si conosce la dimensione del canvas.
  const didFit = useRef(false);
  useEffect(() => {
    if (!didFit.current && width && height) {
      didFit.current = true;
      fit();
    }
  });

  const pointer = () => {
    const p = layerRef.current?.getRelativePointerPosition();
    return p ? { x: p.x, y: p.y } : null;
  };

  const bedAt = (p) => [...beds].reverse().find((b) => pointInPolygon(p, b.points));

  const handleTap = (e) => {
    if (pinch.current) return;
    const p = pointer();
    if (!p) return;
    if (mode === "draw") {
      if (draft.length >= 3 && dist(p, draft[0]) * scale < CLOSE_RADIUS_PX) {
        onDraftClose();
        return;
      }
      onDraftPoint({ x: snap(p.x, snapStep), y: snap(p.y, snapStep) });
      return;
    }
    if (mode === "place") {
      const bed = bedAt(p);
      onPlace(bed?.id ?? null, p);
      return;
    }
    // Modalità selezione: cosa è stato toccato?
    let node = e.target;
    while (node && node !== stageRef.current) {
      const kind = node.getAttr("kind");
      if (kind === "plant") return onSelect({ bedId: node.getAttr("bedId"), plantId: node.id() });
      if (kind === "bed") return onSelect({ bedId: node.id(), plantId: null });
      node = node.getParent();
    }
    onSelect(null);
  };

  const handleWheel = (e) => {
    e.evt.preventDefault();
    const p = stageRef.current.getPointerPosition();
    // Trackpad: ctrlKey indica il pinch; altrimenti la rotella zooma.
    const factor = Math.exp(-e.evt.deltaY * (e.evt.ctrlKey ? 0.01 : 0.0015));
    zoomAt(factor, p);
  };

  const handleTouchMove = (e) => {
    const touches = e.evt.touches;
    if (touches.length !== 2) {
      if (!pinch.current) setHover(pointer());
      return;
    }
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (stage.isDragging()) stage.stopDrag();
    const rect = stage.container().getBoundingClientRect();
    const a = { x: touches[0].clientX - rect.left, y: touches[0].clientY - rect.top };
    const b = { x: touches[1].clientX - rect.left, y: touches[1].clientY - rect.top };
    const center = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const d = dist(a, b);
    const last = pinch.current;
    pinch.current = { center, d };
    if (!last) return;
    setView((v) => {
      const zoom = clampZoom(v.zoom * (d / last.d));
      const s0 = v.zoom * PX_PER_M, s1 = zoom * PX_PER_M;
      const wx = (last.center.x - v.x) / s0, wy = (last.center.y - v.y) / s0;
      return { zoom, x: center.x - wx * s1, y: center.y - wy * s1 };
    });
  };

  const handleTouchEnd = (e) => {
    if (e.evt.touches.length < 2 && pinch.current) {
      // Piccolo ritardo: evita che il rilascio del pinch venga letto come tap.
      setTimeout(() => (pinch.current = null), 50);
    }
  };

  const draftTail = draft.at(-1);
  const hoverSnapped = hover && { x: snap(hover.x, snapStep), y: snap(hover.y, snapStep) };
  const closing = mode === "draw" && hover && draft.length >= 3 && dist(hover, draft[0]) * scale < CLOSE_RADIUS_PX;
  const handleR = 7 / scale;

  const bar = scaleBar(scale);

  return (
    <>
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      x={view.x}
      y={view.y}
      scaleX={scale}
      scaleY={scale}
      draggable
      onDragMove={(e) => e.target === stageRef.current && setView((v) => ({ ...v, x: e.target.x(), y: e.target.y() }))}
      onDragEnd={(e) => e.target === stageRef.current && setView((v) => ({ ...v, x: e.target.x(), y: e.target.y() }))}
      onClick={(e) => e.evt.button === 0 && handleTap(e)}
      onTap={handleTap}
      onWheel={handleWheel}
      onMouseMove={() => setHover(pointer())}
      onMouseLeave={() => setHover(null)}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ cursor: mode === "select" ? "grab" : "crosshair" }}
    >
      <Layer ref={layerRef}>
        <Rect
          x={-500}
          y={-500}
          width={1000}
          height={1000}
          fillPatternImage={lawnTexture()}
          fillPatternScale={{ x: LAWN_TILE_M / 512, y: LAWN_TILE_M / 512 }}
          fillPatternOffset={{ x: 0, y: 0 }}
          listening={false}
          perfectDrawEnabled={false}
        />
        {showGrid && <Grid width={width} height={height} view={view} />}

        {beds.map((bed) => {
          const selected = selection?.bedId === bed.id;
          const flat = bed.points.flatMap((p) => [p.x, p.y]);
          return (
            <Group
              key={bed.id}
              draggable={mode === "select" && selected && !selection?.plantId}
              onDragEnd={(e) => {
                if (e.target !== e.currentTarget) return;
                const { x, y } = e.target.position();
                e.target.position({ x: 0, y: 0 });
                if (x || y) onBedMove(bed.id, { x: snap(x, snapStep), y: snap(y, snapStep) });
              }}
            >
              {/* terra con pacciamatura */}
              <Line
                kind="bed"
                id={bed.id}
                points={flat}
                closed
                fillPatternImage={mulchTexture()}
                fillPatternScale={{ x: MULCH_TILE_M / 512, y: MULCH_TILE_M / 512 }}
                perfectDrawEnabled={false}
              />
              {/* ombra della bordura verso l'interno */}
              <Line
                points={flat}
                closed
                stroke="rgba(20, 12, 5, 0.45)"
                strokeWidth={EDGE_W * 2.2}
                lineJoin="round"
                listening={false}
                perfectDrawEnabled={false}
              />
              {/* bordura in pietra: fuga scura + blocchetti */}
              <Line
                points={flat}
                closed
                stroke={COLORS.edgeJoint}
                strokeWidth={EDGE_W + 0.02}
                lineJoin="round"
                listening={false}
                shadowColor="black"
                shadowOpacity={0.35}
                shadowBlur={4}
                shadowOffset={{ x: 0.02, y: 0.03 }}
              />
              <Line
                points={flat}
                closed
                stroke={COLORS.edgeStone}
                strokeWidth={EDGE_W}
                dash={EDGE_STONE}
                lineJoin="round"
                listening={false}
                perfectDrawEnabled={false}
              />
              {selected && (
                <Line
                  points={flat}
                  closed
                  stroke={COLORS.edgeSelected}
                  strokeWidth={2}
                  dash={[10, 6]}
                  strokeScaleEnabled={false}
                  listening={false}
                />
              )}
              {(bed.plants || []).map((pl) => {
                const isSel = selection?.plantId === pl.id;
                const r = pl.spreadM / 2;
                const size = pl.spreadM / ICON_FILL;
                const icon = iconForPlaced(pl);
                return (
                  <Group
                    key={pl.id}
                    kind="plant"
                    id={pl.id}
                    bedId={bed.id}
                    x={pl.x}
                    y={pl.y}
                    draggable={mode === "select"}
                    onDragMove={(e) => {
                      e.cancelBubble = true;
                      onPlantDrag(bed.id, pl.id, e.target.position());
                    }}
                    onDragEnd={(e) => {
                      e.cancelBubble = true;
                      onPlantDragEnd(bed.id, pl.id, e.target.position());
                    }}
                  >
                    <KImage
                      image={getIconCanvas(icon.type, icon.colors, 320, pl.name)}
                      width={size}
                      height={size}
                      offsetX={size / 2}
                      offsetY={size / 2}
                      rotation={rotationFor(pl.id)}
                      listening={false}
                      perfectDrawEnabled={false}
                    />
                    {/* area di tocco */}
                    <Circle radius={Math.max(r, 14 / scale)} fill="rgba(0,0,0,0.001)" />
                    {isSel && (
                      <Circle
                        radius={r * 1.06}
                        stroke={COLORS.edgeSelected}
                        strokeWidth={2.5}
                        dash={[6, 4]}
                        strokeScaleEnabled={false}
                        listening={false}
                      />
                    )}
                    {(isSel || (showLabels && r * scale > 26)) && (
                      // Etichetta in pixel: resta nitida a qualsiasi zoom.
                      <Group y={r} scaleX={1 / scale} scaleY={1 / scale} listening={false}>
                        <Label y={4}>
                          <Tag
                            fill="rgba(255, 255, 255, 0.9)"
                            cornerRadius={4}
                            pointerDirection="up"
                            pointerWidth={8}
                            pointerHeight={4}
                            shadowColor="black"
                            shadowOpacity={0.2}
                            shadowBlur={3}
                          />
                          <Text text={pl.name} fontSize={11} fontStyle="600" fill={COLORS.label} padding={3} />
                        </Label>
                      </Group>
                    )}
                  </Group>
                );
              })}
              {selected && <EdgeLabels points={bed.points} closed scale={scale} />}
              {selected &&
                mode === "select" &&
                !selection?.plantId &&
                bed.points.map((p, i) => (
                  <Circle
                    key={i}
                    x={p.x}
                    y={p.y}
                    radius={handleR}
                    fill="#fff"
                    stroke={COLORS.edgeSelected}
                    strokeWidth={2}
                    strokeScaleEnabled={false}
                    hitStrokeWidth={24}
                    draggable
                    onDragMove={(e) => {
                      e.cancelBubble = true;
                      const pos = { x: snap(e.target.x(), snapStep), y: snap(e.target.y(), snapStep) };
                      e.target.position(pos);
                      onVertexDrag(bed.id, i, pos);
                    }}
                    onDragEnd={(e) => {
                      e.cancelBubble = true;
                      onVertexDragEnd(bed.id, i);
                    }}
                  />
                ))}
            </Group>
          );
        })}

        {/* Aiuola in costruzione */}
        {draft.length > 0 && (
          <>
            <Line
              points={draft.flatMap((p) => [p.x, p.y])}
              stroke={COLORS.draft}
              strokeWidth={3}
              strokeScaleEnabled={false}
              lineJoin="round"
              shadowColor="black"
              shadowOpacity={0.6}
              shadowBlur={3}
              listening={false}
            />
            <EdgeLabels points={draft} closed={false} scale={scale} />
            {hoverSnapped && mode === "draw" && (
              <>
                <Line
                  points={[draftTail.x, draftTail.y, closing ? draft[0].x : hoverSnapped.x, closing ? draft[0].y : hoverSnapped.y]}
                  stroke={COLORS.draft}
                  strokeWidth={2}
                  dash={[8, 6]}
                  shadowColor="black"
                  shadowOpacity={0.5}
                  shadowBlur={2}
                  strokeScaleEnabled={false}
                  listening={false}
                />
                {!closing && dist(draftTail, hoverSnapped) >= 0.05 && (
                  <Text
                    x={hoverSnapped.x + 10 / scale}
                    y={hoverSnapped.y + 10 / scale}
                    scaleX={1 / scale}
                    scaleY={1 / scale}
                    text={formatM(dist(draftTail, hoverSnapped))}
                    fontSize={12}
                    fill="#fff"
                    shadowColor="black"
                    shadowOpacity={0.9}
                    shadowBlur={3}
                    listening={false}
                  />
                )}
              </>
            )}
            {draft.map((p, i) => (
              <Circle
                key={i}
                x={p.x}
                y={p.y}
                radius={(i === 0 && draft.length >= 3 ? 9 : 6) / scale}
                fill={i === 0 && closing ? COLORS.edgeSelected : "#3b4a32"}
                stroke="#fff"
                strokeWidth={2}
                strokeScaleEnabled={false}
                listening={false}
              />
            ))}
          </>
        )}

        {/* Anteprima della pianta da posizionare */}
        {mode === "place" && placing && hover && (
          <KImage
            image={getIconCanvas(placing.icon.type, placing.icon.colors, 320, placing.plant.commonName)}
            x={hover.x}
            y={hover.y}
            width={placing.spreadM / ICON_FILL}
            height={placing.spreadM / ICON_FILL}
            offsetX={placing.spreadM / ICON_FILL / 2}
            offsetY={placing.spreadM / ICON_FILL / 2}
            opacity={0.65}
            listening={false}
          />
        )}
      </Layer>
    </Stage>
    <div className="scale-bar" aria-label={`Scala: ${bar.label}`}>
      <span className="scale-bar-ruler" style={{ width: bar.px }} />
      <span>{bar.label}</span>
    </div>
    </>
  );
}
