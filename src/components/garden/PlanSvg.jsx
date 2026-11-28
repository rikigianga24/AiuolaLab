import { PAD, edgeQuotes, planBounds, scaleBarLength } from "../../lib/printPlan";
import { plantKey } from "../../lib/bloom";
import { formatM } from "../../lib/geometry";

// Planimetria tecnica dall'alto, disegnata in millimetri sulla carta: con la
// stampa al 100% la scala indicata è quella reale. È indipendente dall'editor.
const INK = "#2f3a33";
const SAGE = "#5f7f55";
const SAGE_SOFT = "#e6eddf";
const MUTED = "#6b756d";

function Flower({ x, y, r = 1.7 }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r * 1.35} fill="#fff" stroke="#e6c2d1" strokeWidth="0.12" />
      {[0, 1, 2, 3, 4].map((i) => {
        const a = ((i * 72 - 90) * Math.PI) / 180;
        return <circle key={i} cx={x + Math.cos(a) * r * 0.62} cy={y + Math.sin(a) * r * 0.62} r={r * 0.5} fill="#f08cb0" stroke="#cf5e89" strokeWidth="0.1" />;
      })}
      <circle cx={x} cy={y} r={r * 0.3} fill="#f7d154" />
    </g>
  );
}

// il testo lungo un lato resta sempre leggibile (mai capovolto)
const upright = (deg) => (deg > 90 || deg < -90 ? deg + 180 : deg);

function NorthArrow({ x, y, deg }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${deg})`} stroke={INK} strokeWidth="0.25" fill="none">
      <circle r="5" />
      <path d="M0 -4.2 L1.9 2.4 L0 1.2 L-1.9 2.4 Z" fill={INK} />
      <text y="-6.4" textAnchor="middle" fontSize="3" fill={INK} stroke="none" fontWeight="600" transform={`rotate(${-deg} 0 -6.4)`}>
        N
      </text>
    </g>
  );
}

function ScaleBar({ x, y, scale }) {
  const bar = scaleBarLength(scale);
  const n = bar.m >= 1 ? Math.min(5, Math.round(bar.m)) : 2;
  const seg = bar.mm / n;
  return (
    <g stroke={INK} strokeWidth="0.25">
      {Array.from({ length: n }, (_, i) => (
        <rect key={i} x={x + i * seg} y={y} width={seg} height="1.6" fill={i % 2 ? "#fff" : INK} />
      ))}
      <g fill={INK} stroke="none" fontSize="2.6">
        <text x={x} y={y - 1} textAnchor="middle">0</text>
        <text x={x + bar.mm} y={y - 1} textAnchor="middle">{bar.label}</text>
        <text x={x} y={y + 5.4} fontWeight="600">Scala 1:{scale}</text>
      </g>
    </g>
  );
}

function DimLine({ x1, y1, x2, y2, label, side = "bottom" }) {
  const vertical = side === "right";
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const tick = (x, y) => (vertical ? <line x1={x - 1.2} y1={y} x2={x + 1.2} y2={y} /> : <line x1={x} y1={y - 1.2} x2={x} y2={y + 1.2} />);
  return (
    <g stroke={MUTED} strokeWidth="0.2" fill="none">
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      {tick(x1, y1)}
      {tick(x2, y2)}
      <text
        x={vertical ? mx + 1.2 : mx}
        y={vertical ? my : my - 1.2}
        transform={vertical ? `rotate(90 ${mx + 1.2} ${my}) translate(0 -2.2)` : undefined}
        textAnchor="middle"
        fontSize="2.8"
        fill={INK}
        stroke="none"
        fontWeight="600"
      >
        {label}
      </text>
    </g>
  );
}

/**
 * beds: aiuole da disegnare · scale: N di 1:N · area: {w,h} in mm
 * numberOf: Map(chiave pianta -> numero) · bloomIds: Set di piante in fiore o null
 */
export default function PlanSvg({ beds, scale, area, numberOf, bloomIds = null, northDeg = null }) {
  const bounds = planBounds(beds);
  if (!bounds) return null;
  const k = 1000 / scale; // mm per metro
  const ox = PAD.left + (area.w - PAD.left - PAD.right - bounds.w * k) / 2;
  const oy = PAD.top + (area.h - PAD.top - PAD.bottom - bounds.h * k) / 2;
  const X = (x) => ox + (x - bounds.minX) * k;
  const Y = (y) => oy + (y - bounds.minY) * k;
  const right = X(bounds.maxX);
  const bottom = Y(bounds.maxY);

  return (
    <svg
      className="plan-svg"
      width={`${area.w}mm`}
      height={`${area.h}mm`}
      viewBox={`0 0 ${area.w} ${area.h}`}
      role="img"
      aria-label="Planimetria dell'aiuola"
      fontFamily="Inter, Arial, Helvetica, sans-serif"
    >
      <rect x="0.15" y="0.15" width={area.w - 0.3} height={area.h - 0.3} fill="#fff" stroke={INK} strokeWidth="0.3" />

      {beds.map((bed) => {
        const pts = bed.points.map((p) => `${X(p.x)},${Y(p.y)}`).join(" ");
        const bb = bed.points.reduce((a, p) => ({ x: Math.min(a.x, p.x), y: Math.min(a.y, p.y) }), { x: Infinity, y: Infinity });
        return (
          <g key={bed.id}>
            <polygon points={pts} fill={SAGE_SOFT} fillOpacity="0.55" stroke={INK} strokeWidth="0.5" strokeLinejoin="round" />
            <text x={X(bb.x)} y={Y(bb.y) - 5.2} fontSize="3.1" fontWeight="700" fill={INK}>
              {bed.name}
            </text>
            {edgeQuotes(bed.points).map((q, i) => {
              if (q.len * k < 16) return null;
              const off = 2.4;
              const tx = X(q.mid.x) + q.normal.x * off;
              const ty = Y(q.mid.y) + q.normal.y * off;
              const deg = upright((Math.atan2(Y(q.b.y) - Y(q.a.y), X(q.b.x) - X(q.a.x)) * 180) / Math.PI);
              return (
                <text key={i} x={tx} y={ty} fontSize="2.3" fill={MUTED} textAnchor="middle" dominantBaseline="middle" transform={`rotate(${deg} ${tx} ${ty})`}>
                  {q.label}
                </text>
              );
            })}
            {(bed.plants ?? []).map((pl) => {
              const cx = X(pl.x);
              const cy = Y(pl.y);
              const r = Math.max(((pl.spreadM ?? 0.3) * k) / 2, 1.3);
              const n = numberOf.get(plantKey(pl));
              const big = r >= 2.8;
              return (
                <g key={pl.id}>
                  <circle cx={cx} cy={cy} r={r} fill="#fff" fillOpacity="0.85" stroke={SAGE} strokeWidth="0.3" />
                  {!(big && n != null) && <circle cx={cx} cy={cy} r={Math.min(0.5, r / 3)} fill={SAGE} />}
                  {n != null &&
                    (big ? (
                      <text x={cx} y={cy + 0.9} fontSize={Math.min(3, r * 0.9)} textAnchor="middle" fontWeight="700" fill={INK}>
                        {n}
                      </text>
                    ) : (
                      <text x={cx + r + 0.5} y={cy + 0.8} fontSize="2.2" fontWeight="700" fill={INK}>
                        {n}
                      </text>
                    ))}
                  {bloomIds?.has(pl.id) && <Flower x={cx + r * 0.75} y={cy - r * 0.75} />}
                </g>
              );
            })}
          </g>
        );
      })}

      <DimLine x1={X(bounds.minX)} y1={bottom + 8} x2={right} y2={bottom + 8} label={formatM(bounds.w)} />
      <DimLine x1={right + 8} y1={Y(bounds.minY)} x2={right + 8} y2={bottom} label={formatM(bounds.h)} side="right" />
      <ScaleBar x={PAD.left - 6} y={area.h - 8} scale={scale} />
      {northDeg != null && <NorthArrow x={area.w - 11} y={13} deg={northDeg} />}
    </svg>
  );
}
