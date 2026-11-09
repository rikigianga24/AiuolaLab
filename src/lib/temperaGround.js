// Prato, pacciamature e bordure dipinti a tempera (stile "tempera").
// Le piastrelle si ripetono senza giunture: ogni pennellata vicina al bordo
// viene ridisegnata anche dal lato opposto.
import { dab, darken as dk, impasto, lighten as lt, line, loaded, mix, rng } from "./tempera.js";

const TAU = Math.PI * 2;

function tile(size, seed, paint) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  const rand = rng("terra" + seed);
  const P = { ctx, rand, U: (v) => v };
  // disegna con ripetizione ai bordi
  const at = (x, y, margin, fn) => {
    for (const dx of [-size, 0, size])
      for (const dy of [-size, 0, size]) {
        const X = x + dx, Y = y + dy;
        if (X < -margin || Y < -margin || X > size + margin || Y > size + margin) continue;
        fn(X, Y);
      }
  };
  paint(P, at, size);
  impasto(ctx, size, 0.9);
  return c;
}

let lawn = null;
export function lawnTile() {
  lawn ??= paintLawn(512);
  return lawn;
}

function paintLawn(size) {
  return tile(size, "prato", (P, at, S) => {
    const { ctx, rand } = P;
    ctx.fillStyle = "#6f9a48";
    ctx.fillRect(0, 0, S, S);
    // macchie di tono larghe
    for (let i = 0; i < 30; i++) {
      const x = rand() * S, y = rand() * S, r = 40 + rand() * 80, c = rand() < 0.5 ? "#7fa852" : "#5f8a3e";
      at(x, y, r, (X, Y) => dab(P, X, Y, r, c, 0.35));
    }
    // fili d'erba: tante pennellate corte e cariche
    const greens = ["#4f7a32", "#5f8c3c", "#76a04a", "#8ab35a", "#9cc068", "#668f40"];
    for (let i = 0; i < 5200; i++) {
      const x = rand() * S, y = rand() * S;
      const a = -Math.PI / 2 + (rand() - 0.5) * 1.6, len = 7 + rand() * 9;
      const c = greens[Math.floor(rand() * greens.length)];
      at(x, y, 20, (X, Y) => loaded(P, X, Y, a, len, 2.6 + rand() * 1.5, c));
    }
    // qualche ciuffo di trifoglio
    for (let i = 0; i < 26; i++) {
      const x = rand() * S, y = rand() * S;
      at(x, y, 12, (X, Y) => {
        for (let k = 0; k < 3; k++) dab(P, X + Math.cos(k * 2.1) * 3.2, Y + Math.sin(k * 2.1) * 3.2, 3.2, "#5f9a44");
      });
    }
  });
}

function pebbleField(P, at, S, { base, colors, count, minR, maxR, flat = 0.6, crumbs = null }) {
  const { ctx, rand } = P;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, S, S);
  if (crumbs) for (let i = 0; i < count * 0.6; i++) {
    const x = rand() * S, y = rand() * S;
    at(x, y, 4, (X, Y) => dab(P, X, Y, 1 + rand() * 1.8, crumbs[Math.floor(rand() * crumbs.length)]));
  }
  for (let i = 0; i < count; i++) {
    const x = rand() * S, y = rand() * S, r = minR + rand() * (maxR - minR), a = rand() * Math.PI;
    const c = colors[Math.floor(rand() * colors.length)];
    at(x, y, r * 1.5, (X, Y) => {
      ctx.save();
      ctx.translate(X, Y);
      ctx.rotate(a);
      // ombra, sasso, luce: tre strati di colore pieno
      ctx.beginPath();
      ctx.ellipse(r * 0.18, r * 0.22, r, r * flat, 0, 0, TAU);
      ctx.fillStyle = "rgba(20,14,8,0.45)";
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * flat, 0, 0, TAU);
      ctx.fillStyle = c;
      ctx.fill();
      ctx.restore();
      loaded(P, X - r * 0.6, Y - r * 0.1, a, r * 1.1, r * flat * 0.9, c);
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.ellipse(X - r * 0.25, Y - r * 0.25, r * 0.45, r * flat * 0.3, a, 0, TAU);
      ctx.fillStyle = lt(c, 0.35);
      ctx.fill();
      ctx.restore();
    });
  }
}

export const GROUNDS = {
  bark: {
    label: "Corteccia",
    make: () =>
      tile(512, "corteccia", (P, at, S) => {
        const { ctx, rand } = P;
        ctx.fillStyle = "#3a2516";
        ctx.fillRect(0, 0, S, S);
        const cols = ["#7a4e2e", "#8f5e36", "#5e3a22", "#a06a3e", "#6b4428", "#b07a48"];
        for (let i = 0; i < 1300; i++) {
          const x = rand() * S, y = rand() * S, a = rand() * Math.PI, len = 14 + rand() * 22, w = 6 + rand() * 7;
          const c = cols[Math.floor(rand() * cols.length)];
          at(x, y, len, (X, Y) => {
            ctx.save();
            ctx.translate(X, Y);
            ctx.rotate(a);
            ctx.fillStyle = "rgba(20,10,4,0.5)";
            ctx.beginPath();
            ctx.roundRect(-len / 2 + 2, -w / 2 + 2, len, w, 2);
            ctx.fill();
            ctx.fillStyle = c;
            ctx.beginPath();
            // scaglia irregolare
            ctx.moveTo(-len / 2, -w * 0.3);
            ctx.lineTo(-len * 0.2, -w / 2);
            ctx.lineTo(len / 2, -w * 0.35);
            ctx.lineTo(len * 0.45, w * 0.4);
            ctx.lineTo(-len * 0.3, w / 2);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            loaded(P, X - Math.cos(a) * len * 0.45, Y - Math.sin(a) * len * 0.45, a, len * 0.9, w * 0.7, c);
            line(P, X - Math.cos(a) * len * 0.3, Y - Math.sin(a) * len * 0.3, X + Math.cos(a) * len * 0.3, Y + Math.sin(a) * len * 0.3, dk(c, 0.35), 1, 0.6);
          });
        }
      }),
  },
  gravel: {
    label: "Ghiaia bianca",
    make: () => tile(512, "ghiaia", (P, at, S) => pebbleField(P, at, S, { base: "#8d8a83", colors: ["#e9e6df", "#d8d4cb", "#f4f2ec", "#c9c4ba", "#bdb8ad"], count: 2200, minR: 4, maxR: 8 })),
  },
  pebbles: {
    label: "Ciottoli di fiume",
    make: () => tile(512, "ciottoli", (P, at, S) => pebbleField(P, at, S, { base: "#4f4b45", colors: ["#8d8a84", "#a7a39b", "#6f6c66", "#b9b2a6", "#7d7468", "#5f5c58"], count: 700, minR: 10, maxR: 20, flat: 0.62 })),
  },
  lapillo: {
    label: "Lapillo vulcanico",
    make: () => tile(512, "lapillo", (P, at, S) => pebbleField(P, at, S, { base: "#4a2418", colors: ["#8a3b24", "#a2482b", "#6e2d1c", "#b5583a", "#5a2618"], count: 2600, minR: 3, maxR: 7, flat: 0.75 })),
  },
  soil: {
    label: "Terra nuda",
    make: () =>
      tile(512, "terra", (P, at, S) => {
        const { ctx, rand } = P;
        ctx.fillStyle = "#5e4129";
        ctx.fillRect(0, 0, S, S);
        for (let i = 0; i < 40; i++) {
          const x = rand() * S, y = rand() * S, r = 30 + rand() * 60;
          at(x, y, r, (X, Y) => dab(P, X, Y, r, rand() < 0.5 ? "#6b4a2e" : "#4f3520", 0.35));
        }
        const cols = ["#7a5636", "#4a3220", "#8a6440", "#5a3e26", "#6b4c30"];
        for (let i = 0; i < 2600; i++) {
          const x = rand() * S, y = rand() * S, a = rand() * TAU;
          at(x, y, 10, (X, Y) => loaded(P, X, Y, a, 4 + rand() * 7, 3 + rand() * 3, cols[Math.floor(rand() * cols.length)]));
        }
        for (let i = 0; i < 90; i++) {
          const x = rand() * S, y = rand() * S;
          at(x, y, 6, (X, Y) => {
            dab(P, X + 1, Y + 1.5, 3, "rgba(20,12,6,0.5)");
            dab(P, X, Y, 2.8, "#9a8a76");
          });
        }
      }),
  },
};

// ---------- bordure: blocchi dipinti lungo il perimetro ----------

export const BORDERS = {
  stone: { label: "Pietra", width: 0.12, block: 0.22, gap: 0.02, colors: ["#cbc2b1", "#bdb3a0", "#d6cfc0", "#b5aa96"], joint: "#4b443b", kind: "stone" },
  brick: { label: "Mattoni", width: 0.11, block: 0.24, gap: 0.014, colors: ["#a9553b", "#b5603f", "#9a4a33", "#b86a46"], joint: "#d8cfc0", kind: "brick" },
  wood: { label: "Legno", width: 0.08, block: 0.9, gap: 0.012, colors: ["#8c6a46", "#9a7650", "#7e5e3c"], joint: "#3a2818", kind: "wood" },
  corten: { label: "Acciaio corten", width: 0.025, block: 1.2, gap: 0, colors: ["#8f4a22", "#a35a2a", "#7a3e1c"], joint: "#3e1c0c", kind: "corten" },
};

export function drawBorder(ctx, pts, kind, pxPerM, seed = "b") {
  const B = BORDERS[kind];
  if (!B) return;
  const rand = rng("bordo" + kind + seed);
  const P = { ctx, rand, U: (v) => v };
  const W = B.width * pxPerM, L = B.block * pxPerM, G = B.gap * pxPerM;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % n];
    const seg = Math.hypot(x2 - x1, y2 - y1), a = Math.atan2(y2 - y1, x2 - x1);
    const count = Math.max(1, Math.round(seg / (L + G)));
    const bl = seg / count - G;
    for (let k = 0; k < count; k++) {
      const t = (k * (bl + G)) / seg;
      const bx = x1 + (x2 - x1) * t, by = y1 + (y2 - y1) * t;
      const c = B.colors[Math.floor(rand() * B.colors.length)];
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(a);
      // ombra portata
      ctx.fillStyle = "rgba(20,12,6,0.45)";
      ctx.beginPath();
      ctx.roundRect(W * 0.12, -W / 2 + W * 0.18, bl, W, B.kind === "stone" ? W * 0.3 : 1);
      ctx.fill();
      // corpo del blocco
      ctx.fillStyle = c;
      ctx.beginPath();
      if (B.kind === "stone") {
        // pietra irregolare
        const j = () => (rand() - 0.5) * W * 0.18;
        ctx.moveTo(j(), -W / 2 + j());
        ctx.lineTo(bl * 0.5, -W / 2 + j());
        ctx.lineTo(bl + j(), -W / 2 + j());
        ctx.lineTo(bl + j(), W / 2 + j());
        ctx.lineTo(bl * 0.5, W / 2 + j());
        ctx.lineTo(j(), W / 2 + j());
        ctx.closePath();
      } else ctx.roundRect(0, -W / 2, bl, W, B.kind === "corten" ? 0 : 1.5);
      ctx.fill();
      ctx.restore();
      // pennellate lungo il blocco
      const bands = Math.max(2, Math.round(W / 4));
      for (let b = 0; b < bands; b++) {
        const off = ((b + 0.5) / bands - 0.5) * W * 0.8;
        const sx = bx - Math.sin(a) * off, sy = by + Math.cos(a) * off;
        loaded(P, sx, sy, a, bl, (W / bands) * 1.1, B.kind === "corten" ? mix(c, rand() < 0.5 ? "#c87a3a" : "#5a2a12", rand() * 0.5) : c, { taper: false });
      }
      if (B.kind === "wood") {
        // venatura e chiodi
        for (let g = 0; g < 3; g++) {
          const off = (g - 1) * W * 0.25;
          line(P, bx - Math.sin(a) * off, by + Math.cos(a) * off, bx + Math.cos(a) * bl - Math.sin(a) * off, by + Math.sin(a) * bl + Math.cos(a) * off, dk(c, 0.35), 1, 0.5);
        }
      }
      if (B.kind === "corten") for (let s = 0; s < bl / 6; s++) {
        const t2 = rand() * bl;
        dab(P, bx + Math.cos(a) * t2, by + Math.sin(a) * t2, W * 0.35, rand() < 0.5 ? "#c4743a" : "#5e2a10", 0.6);
      }
      // luce sul bordo superiore sinistro
      const ox = -Math.sin(a) * (-W * 0.42), oy = Math.cos(a) * (-W * 0.42);
      line(P, bx + ox, by + oy, bx + ox + Math.cos(a) * bl, by + oy + Math.sin(a) * bl, lt(c, 0.35), Math.max(1, W * 0.12), 0.7);
    }
  }
}

const groundCache = new Map();
export function groundTile(kind) {
  const key = GROUNDS[kind] ? kind : "bark";
  if (!groundCache.has(key)) groundCache.set(key, GROUNDS[key].make());
  return groundCache.get(key);
}

// Bordura già dipinta su un canvas, da appoggiare sul disegno: si ridisegna
// solo quando cambiano forma o materiale, non a ogni spostamento della vista.
const PX_PER_M = 160;
const borderCache = new Map();
export function borderImage(points, kind) {
  const key = `${kind}|${points.map((p) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(";")}`;
  if (borderCache.has(key)) return borderCache.get(key);
  const pad = 0.25;
  const xs = points.map((p) => p.x), ys = points.map((p) => p.y);
  const minX = Math.min(...xs) - pad, minY = Math.min(...ys) - pad;
  const w = Math.max(...xs) + pad - minX, h = Math.max(...ys) + pad - minY;
  const scale = Math.min(PX_PER_M, 4096 / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(w * scale));
  canvas.height = Math.max(1, Math.ceil(h * scale));
  const pts = points.map((p) => [(p.x - minX) * scale, (p.y - minY) * scale]);
  drawBorder(canvas.getContext("2d"), pts, kind, scale, key.length.toString());
  const out = { image: canvas, x: minX, y: minY, width: canvas.width / scale, height: canvas.height / scale };
  if (borderCache.size > 200) borderCache.delete(borderCache.keys().next().value);
  borderCache.set(key, out);
  return out;
}
