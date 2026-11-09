// Orientamento del disegno. northDeg = angolo del Nord rispetto all'alto
// dello schermo, in senso orario (0 = Nord in alto).
export const ORIENT_DIRS = [
  { deg: 0, label: "in alto" },
  { deg: 45, label: "in alto a destra" },
  { deg: 90, label: "a destra" },
  { deg: 135, label: "in basso a destra" },
  { deg: 180, label: "in basso" },
  { deg: 225, label: "in basso a sinistra" },
  { deg: 270, label: "a sinistra" },
  { deg: 315, label: "in alto a sinistra" },
];

export const norm = (d) => ((Math.round(d) % 360) + 360) % 360;
export const sunriseFromNorth = (northDeg) => norm((northDeg ?? 0) + 90);

export function describeOrientation(northDeg) {
  if (northDeg == null) return "non indicato";
  const near = (deg) => ORIENT_DIRS.reduce((best, d) => (Math.abs(((deg - d.deg + 540) % 360) - 180) < Math.abs(((deg - best.deg + 540) % 360) - 180) ? d : best), ORIENT_DIRS[0]);
  return `il sole sorge ${near(sunriseFromNorth(northDeg)).label}, a mezzogiorno è ${near(norm(northDeg + 180)).label}`;
}

