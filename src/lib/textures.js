// Texture ripetibili generate su canvas: prato e pacciamatura di corteccia.
// Ogni elemento viene disegnato anche sui bordi opposti, così la piastrella
// si ripete senza giunture visibili.

import { getArtStyle } from "./artStyle.js";
import { BORDERS, GROUNDS, groundTile, lawnTile } from "./temperaGround.js";

function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function wrapped(size, x, y, draw) {
  for (const dx of [-size, 0, size]) for (const dy of [-size, 0, size]) draw(x + dx, y + dy);
}

let lawn = null;
export function lawnTexture() {
  if (getArtStyle() === "tempera") return lawnTile();
  if (lawn) return lawn;
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const rand = rng(7);
  ctx.fillStyle = "#86a85e";
  ctx.fillRect(0, 0, size, size);
  // macchie di tono per un prato non uniforme
  for (let i = 0; i < 40; i++) {
    const x = rand() * size, y = rand() * size, r = 40 + rand() * 90;
    const tone = rand() > 0.5 ? "rgba(150, 180, 100, 0.18)" : "rgba(90, 125, 60, 0.16)";
    wrapped(size, x, y, (px, py) => {
      const g = ctx.createRadialGradient(px, py, 0, px, py, r);
      g.addColorStop(0, tone);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(px - r, py - r, r * 2, r * 2);
    });
  }
  // fili d'erba
  const blades = ["#6f9449", "#9cbd6d", "#7ea255", "#5f8540", "#a9c67c"];
  ctx.lineCap = "round";
  for (let i = 0; i < 9000; i++) {
    const x = rand() * size, y = rand() * size;
    const len = 3 + rand() * 5, a = -Math.PI / 2 + (rand() - 0.5) * 1.4;
    ctx.strokeStyle = blades[(rand() * blades.length) | 0];
    ctx.globalAlpha = 0.55 + rand() * 0.4;
    ctx.lineWidth = 0.8 + rand() * 0.7;
    wrapped(size, x, y, (px, py) => {
      if (px < -10 || py < -10 || px > size + 10 || py > size + 10) return;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.cos(a) * len, py + Math.sin(a) * len);
      ctx.stroke();
    });
  }
  ctx.globalAlpha = 1;
  lawn = canvas;
  return canvas;
}

let mulch = null;
export function mulchTexture() {
  if (mulch) return mulch;
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const rand = rng(42);
  ctx.fillStyle = "#4a3324";
  ctx.fillRect(0, 0, size, size);
  const chips = ["#6b4a32", "#7d5a3c", "#8a6545", "#5c3f2a", "#9a7550", "#73513a"];
  for (let i = 0; i < 2600; i++) {
    const x = rand() * size, y = rand() * size;
    const w = 6 + rand() * 14, h = 3 + rand() * 6, a = rand() * Math.PI;
    const color = chips[(rand() * chips.length) | 0];
    wrapped(size, x, y, (px, py) => {
      if (px < -20 || py < -20 || px > size + 20 || py > size + 20) return;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(a);
      ctx.fillStyle = "rgba(25, 15, 8, 0.45)";
      ctx.beginPath();
      ctx.ellipse(1.2, 1.5, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 230, 190, 0.12)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-w * 0.35, -h * 0.1);
      ctx.lineTo(w * 0.35, -h * 0.15);
      ctx.stroke();
      ctx.restore();
    });
  }
  mulch = canvas;
  return canvas;
}

// ---- coperture dell'aiuola ----

function stoneTexture({ seed, base, colors, count, minR, maxR, flat = 1, gloss = 0.25, shadow = 0.4 }) {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const rand = rng(seed);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < count; i++) {
    const x = rand() * size, y = rand() * size;
    const rx = minR + rand() * (maxR - minR), ry = rx * (flat + rand() * (1 - flat)), a = rand() * Math.PI;
    const color = colors[(rand() * colors.length) | 0];
    wrapped(size, x, y, (px, py) => {
      if (px < -maxR * 2 || py < -maxR * 2 || px > size + maxR * 2 || py > size + maxR * 2) return;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(a);
      ctx.fillStyle = `rgba(0, 0, 0, ${shadow})`;
      ctx.beginPath();
      ctx.ellipse(rx * 0.18, ry * 0.25, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      const g = ctx.createRadialGradient(-rx * 0.35, -ry * 0.4, 0, 0, 0, rx);
      g.addColorStop(0, `rgba(255, 255, 255, ${gloss})`);
      g.addColorStop(0.5, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = g;
      ctx.fill();
      ctx.restore();
    });
  }
  return canvas;
}

function soilTexture() {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const rand = rng(99);
  ctx.fillStyle = "#5b4030";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 18000; i++) {
    const x = rand() * size, y = rand() * size, r = 0.6 + rand() * 1.8;
    ctx.fillStyle = rand() > 0.5 ? "rgba(140, 105, 75, 0.5)" : "rgba(40, 25, 15, 0.5)";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // zolle
  for (let i = 0; i < 160; i++) {
    const x = rand() * size, y = rand() * size, r = 4 + rand() * 9;
    wrapped(size, x, y, (px, py) => {
      const g = ctx.createRadialGradient(px - r * 0.3, py - r * 0.3, 0, px, py, r);
      g.addColorStop(0, "rgba(150, 115, 85, 0.65)");
      g.addColorStop(1, "rgba(60, 40, 25, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  return canvas;
}

// Coperture disponibili: etichetta, lato della piastrella in metri, generatore.
export const SURFACES = {
  bark: { label: "Corteccia", tileM: 1.2, make: () => mulchTexture() },
  gravel: {
    label: "Ghiaia bianca",
    tileM: 0.9,
    make: () =>
      stoneTexture({ seed: 11, base: "#8d8a83", colors: ["#e9e6df", "#d8d4cb", "#f4f2ec", "#c9c4ba", "#bdb8ad"], count: 2600, minR: 4, maxR: 9, flat: 0.6 }),
  },
  pebbles: {
    label: "Ciottoli di fiume",
    tileM: 1.6,
    make: () =>
      stoneTexture({ seed: 23, base: "#4f4b45", colors: ["#8d8a84", "#a7a39b", "#6f6c66", "#b9b2a6", "#7d7468", "#5f5c58"], count: 900, minR: 9, maxR: 20, flat: 0.55, gloss: 0.35 }),
  },
  lapillo: {
    label: "Lapillo vulcanico",
    tileM: 0.8,
    make: () =>
      stoneTexture({ seed: 31, base: "#4a2418", colors: ["#8a3b24", "#a2482b", "#6e2d1c", "#b5583a", "#5a2618"], count: 3200, minR: 3, maxR: 8, flat: 0.5, gloss: 0.12, shadow: 0.5 }),
  },
  soil: { label: "Terra nuda", tileM: 1.2, make: soilTexture },
};

const surfaceCache = new Map();
export function surfaceTexture(kind) {
  const def = SURFACES[kind] ?? SURFACES.bark;
  const key = SURFACES[kind] ? kind : "bark";
  if (getArtStyle() === "tempera" && GROUNDS[key]) return { image: groundTile(key), tileM: def.tileM };
  if (!surfaceCache.has(key)) surfaceCache.set(key, def.make());
  return { image: surfaceCache.get(key), tileM: def.tileM };
}

// Bordure: spessore (m), blocchetti [pieno, fuga] (m), colori.
export const EDGINGS = {
  stone: { label: "Pietra", width: 0.12, dash: [0.22, 0.025], color: "#cbc2b1", joint: "#4b443b" },
  brick: { label: "Mattoni", width: 0.11, dash: [0.24, 0.015], color: "#a9553b", joint: "#d8cfc0" },
  wood: { label: "Legno", width: 0.08, dash: [0.9, 0.012], color: "#8c6a46", joint: "#4a3523" },
  corten: { label: "Acciaio corten", width: 0.025, dash: null, color: "#8f4a22", joint: "#4b2410" },
  none: { label: "Nessuna", width: 0, dash: null, color: null, joint: null },
};

const previewCache = new Map();
// Piccola anteprima (data URL) di una copertura, per i pulsanti di scelta.
export function surfacePreview(kind) {
  const pkey = `${getArtStyle()}|${kind}`;
  if (!previewCache.has(pkey)) {
    const { image } = surfaceTexture(kind);
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    c.getContext("2d").drawImage(image, 0, 0, 160, 160, 0, 0, 64, 64);
    previewCache.set(pkey, c.toDataURL());
  }
  return previewCache.get(pkey);
}

// ---- pavimenti del terrazzo ----

function tileTexture({ seed, cols, rows, colors, grout, groutW, noise = 0.15, plank = false }) {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const rand = rng(seed);
  ctx.fillStyle = grout;
  ctx.fillRect(0, 0, size, size);
  const tw = size / cols, th = size / rows;
  for (let r = 0; r < rows; r++) {
    // le assi del legno hanno giunte sfalsate
    const segments = plank ? [[0, 0.35 + rand() * 0.3], [0, 1]] : [[0, 1]];
    let start = 0;
    for (const [, end] of segments) {
      for (let c = 0; c < cols; c++) {
        const x0 = plank ? start * size : c * tw;
        const w = plank ? (end - start) * size : tw;
        if (plank && c > 0) break;
        const color = colors[(rand() * colors.length) | 0];
        const x = x0 + groutW / 2, y = r * th + groutW / 2;
        const g = ctx.createLinearGradient(x, y, x + w, y + th);
        g.addColorStop(0, color);
        g.addColorStop(1, color + "cc");
        ctx.fillStyle = g;
        ctx.fillRect(x, y, w - groutW, th - groutW);
        // grana / venature
        for (let k = 0; k < (plank ? 14 : 220); k++) {
          ctx.fillStyle = rand() > 0.5 ? `rgba(255,255,255,${noise * rand()})` : `rgba(0,0,0,${noise * rand()})`;
          if (plank) ctx.fillRect(x + rand() * w, y + rand() * th, 30 + rand() * 120, 1);
          else ctx.fillRect(x + rand() * (w - groutW), y + rand() * (th - groutW), 2, 2);
        }
      }
      start = end;
    }
  }
  return canvas;
}

export const FLOORS = {
  cotto: {
    label: "Cotto",
    tileM: 1.2, // 4 × 4 piastrelle da 30 cm
    make: () => tileTexture({ seed: 5, cols: 4, rows: 4, colors: ["#b8613f", "#c26c47", "#a95a3a", "#c97a52"], grout: "#d9cbb6", groutW: 4 }),
  },
  gres: {
    label: "Gres grigio",
    tileM: 1.2, // 2 × 2 lastre da 60 cm
    make: () => tileTexture({ seed: 8, cols: 2, rows: 2, colors: ["#a4a29d", "#9c9a95", "#adaba6"], grout: "#7f7d79", groutW: 3, noise: 0.08 }),
  },
  decking: {
    label: "Legno (decking)",
    tileM: 0.6, // 4 assi da 15 cm
    make: () => tileTexture({ seed: 13, cols: 1, rows: 4, colors: ["#9b7048", "#8a6240", "#a87b52", "#93693f"], grout: "#3b2a1c", groutW: 5, plank: true, noise: 0.18 }),
  },
  cemento: {
    label: "Cemento",
    tileM: 1,
    make: () => tileTexture({ seed: 21, cols: 1, rows: 1, colors: ["#b9b7b1"], grout: "#b9b7b1", groutW: 0, noise: 0.12 }),
  },
};

const floorCache = new Map();
export function floorTexture(kind) {
  const key = FLOORS[kind] ? kind : "cotto";
  if (!floorCache.has(key)) floorCache.set(key, FLOORS[key].make());
  return { image: floorCache.get(key), tileM: FLOORS[key].tileM };
}

export function floorPreview(kind) {
  const key = `floor:${kind}`;
  if (!previewCache.has(key)) {
    const { image } = floorTexture(kind);
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    c.getContext("2d").drawImage(image, 0, 0, 256, 256, 0, 0, 64, 64);
    previewCache.set(key, c.toDataURL());
  }
  return previewCache.get(key);
}

// Parapetti del terrazzo: spessore (m), colore, montanti [pieno, vuoto].
export const RAILINGS = {
  metal: { label: "Ringhiera", width: 0.05, color: "#2e3236", posts: [0.02, 0.1], postWidth: 0.07 },
  wall: { label: "Muretto", width: 0.18, color: "#e7e1d4", joint: "#b9b0a0" },
  glass: { label: "Vetro", width: 0.03, color: "rgba(160, 200, 220, 0.75)", frame: "#7d8a93" },
};

let city = null;
// Sfondo neutro per il terrazzo (quello che c'è oltre il parapetto).
export function cityTexture() {
  if (city) return city;
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const rand = rng(77);
  ctx.fillStyle = "#c7ccd1";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 3000; i++) {
    ctx.fillStyle = rand() > 0.5 ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)";
    ctx.fillRect(rand() * size, rand() * size, 2, 2);
  }
  city = canvas;
  return canvas;
}

// Bordure dipinte (stile tempera): esiste una versione per ogni bordura?
export const hasPaintedBorder = (kind) => getArtStyle() === "tempera" && Boolean(BORDERS[kind]);
