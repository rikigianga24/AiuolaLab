// Vasi e fioriere. Un vaso è un'"aiuola" con kind = "pot": ha i suoi punti
// (il contorno) e i parametri in bed.pot, così catalogo, consigli IA e
// irrigazione funzionano anche sui vasi.
import { centroid } from "./geometry.js";

export const POT_TYPES = {
  round: { label: "Vaso tondo", shape: "round", w: 0.4, d: 0.4, depth: 0.35, icon: "fa-circle" },
  square: { label: "Vaso quadrato", shape: "rect", w: 0.4, d: 0.4, depth: 0.35, icon: "fa-square" },
  planter: { label: "Fioriera", shape: "rect", w: 0.8, d: 0.3, depth: 0.3, icon: "fa-grip-lines" },
  railing: { label: "Fioriera da ringhiera", shape: "rect", w: 0.6, d: 0.2, depth: 0.18, icon: "fa-minus" },
  hanging: { label: "Vaso appeso", shape: "round", w: 0.3, d: 0.3, depth: 0.2, icon: "fa-link", hanging: true },
};

export const POT_MATERIALS = {
  terracotta: { label: "Terracotta", color: "#c0643b", rim: "#d98a62" },
  white: { label: "Bianco", color: "#ecebe6", rim: "#ffffff" },
  anthracite: { label: "Antracite", color: "#3d4044", rim: "#5b5f64" },
  wood: { label: "Legno", color: "#9a7350", rim: "#b8916a" },
  corten: { label: "Corten", color: "#8f4a22", rim: "#a85e33" },
};

const RIM = 0.025; // spessore del bordo del vaso (m)

function outline(shape, w, d, center, inset = 0) {
  if (shape === "round") {
    const r = Math.max(0.01, w / 2 - inset);
    return Array.from({ length: 32 }, (_, i) => {
      const a = (i / 32) * Math.PI * 2;
      return { x: center.x + Math.cos(a) * r, y: center.y + Math.sin(a) * r };
    });
  }
  const hw = Math.max(0.01, w / 2 - inset), hd = Math.max(0.01, d / 2 - inset);
  return [
    { x: center.x - hw, y: center.y - hd },
    { x: center.x + hw, y: center.y - hd },
    { x: center.x + hw, y: center.y + hd },
    { x: center.x - hw, y: center.y + hd },
  ];
}

export function createPot(type, center, { id, name, material = "terracotta" } = {}) {
  const def = POT_TYPES[type] ?? POT_TYPES.round;
  const pot = { type, shape: def.shape, w: def.w, d: def.shape === "round" ? def.w : def.d, depth: def.depth, material, hanging: Boolean(def.hanging) };
  return {
    id,
    kind: "pot",
    name,
    pot,
    points: outline(pot.shape, pot.w, pot.d, center),
    conditions: { sunlight: "full_sun" },
    viewedFrom: "all",
    plants: [],
  };
}

export const potCenter = (bed) => centroid(bed.points);

// Ridisegna il contorno dopo un cambio di misure, mantenendo il centro.
export function resizePot(bed, patch) {
  const pot = { ...bed.pot, ...patch };
  if (pot.shape === "round") pot.d = pot.w;
  return { ...bed, pot, points: outline(pot.shape, pot.w, pot.d, potCenter(bed)) };
}

// Contorno interno (la terra), per il disegno.
export const potInner = (bed) => outline(bed.pot.shape, bed.pot.w, bed.pot.d, potCenter(bed), RIM);

export const potVolumeL = (pot) =>
  Math.round((pot.shape === "round" ? Math.PI * (pot.w / 2) ** 2 : pot.w * pot.d) * pot.depth * 1000 * 0.85);

export const isPot = (bed) => bed?.kind === "pot";
export const isFloor = (bed) => bed?.kind === "floor";
export const isPlantable = (bed) => bed && bed.kind !== "floor";
