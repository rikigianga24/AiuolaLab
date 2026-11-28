// Fiore rosa usato come simbolo di fioritura (pannello, legenda, stampa).
// È disegnato in SVG, così non dipende dai font emoji del dispositivo.
const PETALS = [0, 1, 2, 3, 4];

export function Blossom({ size = 16, outline = false }) {
  return (
    <svg className="blossom" width={size} height={size} viewBox="-10 -10 20 20" aria-hidden="true" focusable="false">
      {outline && <circle r="9.5" fill="#fff" fillOpacity="0.92" />}
      {PETALS.map((i) => {
        const a = ((i * 72 - 90) * Math.PI) / 180;
        return <circle key={i} cx={Math.cos(a) * 4.6} cy={Math.sin(a) * 4.6} r="3.9" fill="#f08cb0" stroke="#cf5e89" strokeWidth="0.7" />;
      })}
      <circle r="2.3" fill="#f7d154" stroke="#c9a227" strokeWidth="0.5" />
    </svg>
  );
}
