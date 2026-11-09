// Disegno della base di un'aiuola, di un pavimento di terrazzo o di un vaso.
import { Circle, Image as KImage, Line, Rect } from "react-konva";
import { POT_MATERIALS, potCenter, potInner } from "../../lib/containers";
import { EDGINGS, RAILINGS, floorTexture, hasPaintedBorder, surfaceTexture } from "../../lib/textures";
import { borderImage } from "../../lib/temperaGround";

const flatten = (pts) => pts.flatMap((p) => [p.x, p.y]);

// Bordura dipinta a tempera: immagine pronta, appoggiata sopra la copertura.
function PaintedBorder({ bed }) {
  const b = borderImage(bed.points, bed.edging ?? "stone");
  return <KImage image={b.image} x={b.x} y={b.y} width={b.width} height={b.height} listening={false} perfectDrawEnabled={false} />;
}

function GardenBed({ bed, flat }) {
  const surface = surfaceTexture(bed.surface);
  const edging = EDGINGS[bed.edging] ?? EDGINGS.stone;
  return (
    <>
      {/* copertura: corteccia, ghiaia, ciottoli... */}
      <Line
        kind="bed"
        id={bed.id}
        points={flat}
        closed
        fillPatternImage={surface.image}
        fillPatternScale={{ x: surface.tileM / 512, y: surface.tileM / 512 }}
        perfectDrawEnabled={false}
      />
      {/* ombra verso l'interno: dà profondità */}
      <Line
        points={flat}
        closed
        stroke="rgba(20, 12, 5, 0.4)"
        strokeWidth={Math.max(edging.width, 0.05) * 2.2}
        lineJoin="round"
        listening={false}
        perfectDrawEnabled={false}
      />
      {edging.width > 0 && hasPaintedBorder(bed.edging ?? "stone") && <PaintedBorder bed={bed} />}
      {edging.width > 0 && !hasPaintedBorder(bed.edging ?? "stone") && (
        <>
          <Line
            points={flat}
            closed
            stroke={edging.joint}
            strokeWidth={edging.width + 0.02}
            lineJoin={edging.dash ? "round" : "miter"}
            listening={false}
            shadowColor="black"
            shadowOpacity={0.35}
            shadowBlur={4}
            shadowOffset={{ x: 0.02, y: 0.03 }}
          />
          <Line
            points={flat}
            closed
            stroke={edging.color}
            strokeWidth={edging.width}
            dash={edging.dash ?? undefined}
            lineJoin={edging.dash ? "round" : "miter"}
            listening={false}
            perfectDrawEnabled={false}
          />
        </>
      )}
    </>
  );
}

function Floor({ bed, flat }) {
  const floor = floorTexture(bed.floor);
  const railing = RAILINGS[bed.railing] ?? RAILINGS.metal;
  return (
    <>
      <Line
        kind="bed"
        id={bed.id}
        points={flat}
        closed
        fillPatternImage={floor.image}
        fillPatternScale={{ x: floor.tileM / 512, y: floor.tileM / 512 }}
        shadowColor="black"
        shadowOpacity={0.35}
        shadowBlur={10}
        shadowOffset={{ x: 0.05, y: 0.08 }}
        perfectDrawEnabled={false}
      />
      {bed.railing === "wall" ? (
        <>
          <Line points={flat} closed stroke={railing.joint} strokeWidth={railing.width + 0.02} lineJoin="miter" listening={false} />
          <Line points={flat} closed stroke={railing.color} strokeWidth={railing.width} lineJoin="miter" listening={false} />
        </>
      ) : bed.railing === "glass" ? (
        <>
          <Line points={flat} closed stroke={railing.frame} strokeWidth={railing.width + 0.02} lineJoin="miter" listening={false} />
          <Line points={flat} closed stroke={railing.color} strokeWidth={railing.width} lineJoin="miter" listening={false} />
        </>
      ) : (
        <>
          {/* corrimano + montanti */}
          <Line points={flat} closed stroke={railing.color} strokeWidth={railing.width} lineJoin="miter" listening={false} />
          <Line
            points={flat}
            closed
            stroke={railing.color}
            strokeWidth={railing.postWidth}
            dash={railing.posts}
            lineJoin="miter"
            listening={false}
          />
        </>
      )}
    </>
  );
}

function Pot({ bed, flat }) {
  const mat = POT_MATERIALS[bed.pot.material] ?? POT_MATERIALS.terracotta;
  const inner = flatten(potInner(bed));
  const soil = surfaceTexture("soil");
  const hanging = bed.pot.hanging;
  const c = potCenter(bed);
  const r = bed.pot.w / 2;
  return (
    <>
      {/* corpo del vaso con ombra: più lontana se il vaso è appeso */}
      <Line
        kind="bed"
        id={bed.id}
        points={flat}
        closed
        fillLinearGradientStartPoint={{ x: c.x - r, y: c.y - r }}
        fillLinearGradientEndPoint={{ x: c.x + r, y: c.y + r }}
        fillLinearGradientColorStops={[0, mat.rim, 0.5, mat.color, 1, mat.color]}
        stroke="rgba(0,0,0,0.35)"
        strokeWidth={0.006}
        shadowColor="black"
        shadowOpacity={hanging ? 0.3 : 0.45}
        shadowBlur={hanging ? 16 : 6}
        shadowOffset={hanging ? { x: 0.18, y: 0.24 } : { x: 0.03, y: 0.05 }}
      />
      {/* terriccio */}
      <Line
        points={inner}
        closed
        fillPatternImage={soil.image}
        fillPatternScale={{ x: 0.6 / 512, y: 0.6 / 512 }}
        stroke="rgba(0,0,0,0.45)"
        strokeWidth={0.008}
        listening={false}
        perfectDrawEnabled={false}
      />
    </>
  );
}

export function BedBase({ bed }) {
  const flat = flatten(bed.points);
  if (bed.kind === "floor") return <Floor bed={bed} flat={flat} />;
  if (bed.kind === "pot") return <Pot bed={bed} flat={flat} />;
  return <GardenBed bed={bed} flat={flat} />;
}

// Catenelle del vaso appeso, disegnate sopra le piante (vista dall'alto).
export function HangingChains({ bed, scale }) {
  if (bed.kind !== "pot" || !bed.pot.hanging) return null;
  const c = potCenter(bed);
  const r = bed.pot.w / 2 - 0.01;
  return (
    <>
      {[0, 1, 2].map((i) => {
        const a = -Math.PI / 2 + (i * Math.PI * 2) / 3;
        return (
          <Line
            key={i}
            points={[c.x + Math.cos(a) * r, c.y + Math.sin(a) * r, c.x, c.y]}
            stroke="#222"
            strokeWidth={2}
            dash={[4, 2]}
            strokeScaleEnabled={false}
            shadowColor="white"
            shadowOpacity={0.8}
            shadowBlur={2}
            listening={false}
          />
        );
      })}
      <Circle x={c.x} y={c.y} radius={5 / scale} stroke="#222" strokeWidth={2.5} strokeScaleEnabled={false} listening={false} />
    </>
  );
}

// Sagoma di anteprima mentre si posiziona un vaso.
export function PotGhost({ type, def, at }) {
  if (def.shape === "round") {
    return <Circle x={at.x} y={at.y} radius={def.w / 2} fill="#c0643b" opacity={0.5} stroke="#000" strokeWidth={1} dash={[4, 3]} strokeScaleEnabled={false} listening={false} key={type} />;
  }
  return (
    <Rect
      x={at.x - def.w / 2}
      y={at.y - def.d / 2}
      width={def.w}
      height={def.d}
      fill="#c0643b"
      opacity={0.5}
      stroke="#000"
      strokeWidth={1}
      dash={[4, 3]}
      strokeScaleEnabled={false}
      listening={false}
    />
  );
}
