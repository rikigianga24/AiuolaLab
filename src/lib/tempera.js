// Icone delle piante dipinte "a tempera", viste dall'alto (o appena inclinate).
// Colore coprente e opaco, pennellate visibili, luce da in alto a sinistra.
// Ogni tipo di pianta ha il suo pittore; alcune specie molto note
// (girasole, papavero, peonia...) hanno un disegno dedicato, più fedele
// alla pianta vera che alla categoria.

// ---------- utilità ----------

function rng(seedText) {
  let h = 2166136261;
  for (const ch of seedText) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const toHex = (r, g, b) => "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
export const mix = (a, b, t) => {
  const A = hex(a), B = hex(b);
  return toHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
};
const dk = (c, t) => mix(c, "#0b1408", t);
const lt = (c, t) => mix(c, "#fff6dc", t);
const TAU = Math.PI * 2;
// luce da in alto a sinistra: 1 = pienamente illuminato
const litAt = (x, y) => Math.max(0, Math.min(1, 0.5 - (x + y) * 0.45));
const shadeBy = (c, lit, amt = 0.3) => (lit > 0.5 ? lt(c, (lit - 0.5) * 2 * amt) : dk(c, (0.5 - lit) * 2 * amt));

// ---------- pennelli ----------

// Pennellata a forma di foglia/petalo con setole visibili.
function stroke(P, x, y, ang, len, wid, color, { alpha = 1, bristles = 5, rib = false, round = false, serrated = false } = {}) {
  const { ctx, rand } = P;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  if (round) ctx.ellipse(len / 2, 0, len / 2, wid / 2, 0, 0, TAU);
  else if (serrated) {
    const n = 7;
    ctx.moveTo(0, 0);
    for (let i = 1; i <= n; i++) {
      const t = i / n, w = Math.sin(Math.PI * t) * wid * 0.6;
      ctx.lineTo(len * (t - 0.5 / n), -w * 1.15);
      ctx.lineTo(len * t, -w * 0.8);
    }
    for (let i = n; i >= 1; i--) {
      const t = i / n, w = Math.sin(Math.PI * t) * wid * 0.6;
      ctx.lineTo(len * t, w * 0.8);
      ctx.lineTo(len * (t - 0.5 / n), w * 1.15);
    }
    ctx.closePath();
  } else {
    const j = () => 1 + (rand() - 0.5) * 0.25;
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(len * 0.25, -wid * 0.75 * j(), len * 0.7, -wid * 0.6 * j(), len, 0);
    ctx.bezierCurveTo(len * 0.7, wid * 0.6 * j(), len * 0.25, wid * 0.75 * j(), 0, 0);
  }
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineCap = "round";
  for (let k = 0; k < bristles; k++) {
    const off = (rand() - 0.5) * wid * 0.6;
    ctx.beginPath();
    ctx.moveTo(len * 0.12, off);
    ctx.quadraticCurveTo(len * 0.5, off + (rand() - 0.5) * wid * 0.3, len * (0.75 + rand() * 0.15), off * 0.4);
    ctx.strokeStyle = rand() < 0.5 ? lt(color, 0.25) : dk(color, 0.2);
    ctx.globalAlpha = alpha * 0.6;
    ctx.lineWidth = Math.max(0.6, wid * 0.13);
    ctx.stroke();
  }
  if (rib) {
    ctx.beginPath();
    ctx.moveTo(len * 0.06, 0);
    ctx.lineTo(len * 0.85, 0);
    ctx.strokeStyle = lt(color, 0.35);
    ctx.globalAlpha = alpha * 0.6;
    ctx.lineWidth = Math.max(0.5, wid * 0.08);
    ctx.stroke();
  }
  ctx.restore();
}

function dab(P, x, y, r, color, alpha = 1) {
  const { ctx } = P;
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.3, r), 0, TAU);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.globalAlpha = 1;
}

function line(P, x1, y1, x2, y2, color, w, alpha = 1, cx = null, cy = null) {
  const { ctx } = P;
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  if (cx != null) ctx.quadraticCurveTo(cx, cy, x2, y2);
  else ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(0.5, w);
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.globalAlpha = 1;
}

// Massa di fondo irregolare, per non lasciare buchi tra le foglie.
function mass(P, R, color, { lobes = 6, cx = 0, cy = 0 } = {}) {
  const { ctx, rand, U } = P;
  ctx.beginPath();
  const ph = rand() * 10;
  for (let i = 0; i <= 44; i++) {
    const a = (i / 44) * TAU;
    const r = U(R * (1 + 0.07 * Math.sin(a * lobes + ph) + (rand() - 0.5) * 0.08));
    const x = U(cx) + Math.cos(a) * r, y = U(cy) + Math.sin(a) * r;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

// Chioma a tre strati (ombra, tono medio, luce).
function canopy(P, { R = 0.75, n = 80, len = 0.3, wid = 0.12, greens = GREENS, rib = true, round = false, serrated = false, radial = true }) {
  const { rand, U } = P;
  const [g0, g1, g2] = greens;
  const layers = [
    { col: g0, k: 1.0, count: n * 0.45, light: false },
    { col: g1, k: 0.85, count: n * 0.4, light: false },
    { col: g2, k: 0.62, count: n * 0.25, light: true },
  ];
  for (const L of layers) {
    for (let i = 0; i < L.count; i++) {
      const a = rand() * TAU;
      const d = Math.sqrt(rand()) * R * L.k;
      let x = Math.cos(a) * d, y = Math.sin(a) * d;
      if (L.light) {
        x -= 0.12;
        y -= 0.12;
      }
      const out = radial ? Math.atan2(y, x) + (rand() - 0.5) * 0.9 : rand() * TAU;
      const l = len * (0.75 + rand() * 0.5);
      const c = mix(L.col, rand() < 0.5 ? g0 : g2, rand() * 0.25);
      stroke(P, U(x - Math.cos(out) * l * 0.35), U(y - Math.sin(out) * l * 0.35), out, U(l), U(wid * (0.8 + rand() * 0.4)), c, { rib, round, serrated });
    }
  }
}

// Foglia grande con nervature (ortensia, zucca, cavolo, hosta...).
function bigLeaf(P, x, y, ang, len, wid, color, { veins = 5, lobed = false, vein = null } = {}) {
  const { ctx } = P;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.beginPath();
  if (lobed) {
    // foglia palmata a 5 lobi (zucca, vite...)
    for (let i = 0; i <= 5; i++) {
      const a = -1.25 + (i / 5) * 2.5;
      const r = len * (i % 2 ? 0.72 : 1) * (i === 0 || i === 5 ? 0.6 : 1);
      const px = Math.cos(a) * r, py = Math.sin(a) * r * (wid / len) * 1.6;
      i ? ctx.quadraticCurveTo(Math.cos(a - 0.25) * r * 1.05, Math.sin(a - 0.25) * r * (wid / len) * 1.8, px, py) : ctx.moveTo(px, py);
    }
    ctx.lineTo(0, 0);
  } else {
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(len * 0.15, -wid * 0.9, len * 0.75, -wid * 0.75, len, 0);
    ctx.bezierCurveTo(len * 0.75, wid * 0.75, len * 0.15, wid * 0.9, 0, 0);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = dk(color, 0.25);
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = Math.max(0.5, len * 0.02);
  ctx.stroke();
  ctx.globalAlpha = 0.65;
  ctx.strokeStyle = vein ?? lt(color, 0.3);
  ctx.lineWidth = Math.max(0.5, len * 0.025);
  ctx.beginPath();
  ctx.moveTo(len * 0.04, 0);
  ctx.lineTo(len * 0.9, 0);
  ctx.stroke();
  ctx.lineWidth = Math.max(0.4, len * 0.014);
  for (let i = 1; i <= veins; i++) {
    const t = i / (veins + 1);
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(len * t * 0.9, 0);
      ctx.quadraticCurveTo(len * (t * 0.9 + 0.08), s * wid * 0.25, len * (t * 0.9 + 0.16), s * wid * 0.55 * Math.sin(Math.PI * Math.min(0.95, t + 0.1)));
      ctx.stroke();
    }
  }
  ctx.restore();
}

const GREENS = ["#29461f", "#466f30", "#7a9e4c"];
const BLUEGREEN = ["#2c4a44", "#4c7266", "#86a596"];
const SILVER = ["#4b5e45", "#77866a", "#a8b39a"];
const DEEP = ["#1f3a19", "#3a6227", "#6f9442"];

// ---------- fiori riutilizzabili ----------

function roseBloom(P, x, y, s, col, r0, { full = false, pointed = false, outer = null } = {}) {
  const { ctx, rand } = P;
  dab(P, x + s * 0.12, y + s * 0.16, s * 1.05, dk(col, 0.55));
  const oc = outer ?? col;
  // petali esterni aperti e un po' spettinati (a punta negli ibridi di tea)
  for (let k = 0; k < (pointed ? 9 : 7); k++) {
    const a = (k / (pointed ? 9 : 7)) * TAU + r0 * 5 + (rand() - 0.5) * 0.35;
    const lit = (Math.cos(a - 3.9) + 1) / 2;
    stroke(P, x + Math.cos(a) * s * 0.3, y + Math.sin(a) * s * 0.3, a + (rand() - 0.5) * 0.4, s * (pointed ? 0.85 : 0.72), s * (pointed ? 0.5 : 0.62), mix(dk(oc, 0.12), lt(oc, 0.28), lit * 0.8), { bristles: 3, serrated: false });
  }
  const rings = full
    ? [
        { r: 0.9, n: 8, w: 0.55 },
        { r: 0.76, n: 8, w: 0.5 },
        { r: 0.62, n: 7, w: 0.48 },
        { r: 0.48, n: 6, w: 0.45 },
        { r: 0.35, n: 5, w: 0.42 },
        { r: 0.24, n: 4, w: 0.4 },
      ]
    : [
        { r: 0.86, n: 6, w: 0.62 },
        { r: 0.66, n: 6, w: 0.55 },
        { r: 0.48, n: 5, w: 0.5 },
        { r: 0.32, n: 4, w: 0.45 },
      ];
  rings.forEach((ring, ri) => {
    for (let k = 0; k < ring.n; k++) {
      const a = (k / ring.n) * TAU + ri * 0.55 + r0 * 4 + (rand() - 0.5) * 0.5;
      const rr = s * ring.r * (0.88 + rand() * 0.24);
      const lit = (Math.cos(a - 3.9) + 1) / 2;
      const ringCol = outer && ri < 2 ? mix(outer, col, ri * 0.5) : col;
      const base = mix(dk(ringCol, 0.1 + ri * (full ? 0.04 : 0.06)), lt(ringCol, 0.3), lit * 0.7);
      ctx.save();
      ctx.translate(x + Math.cos(a) * rr * 0.42, y + Math.sin(a) * rr * 0.42);
      ctx.rotate(a + Math.PI / 2 + (rand() - 0.5) * 0.3);
      const w = rr * ring.w, h = rr * 0.42;
      ctx.beginPath();
      ctx.moveTo(-w, h * 0.3);
      ctx.bezierCurveTo(-w * 0.9, -h * (0.9 + rand() * 0.4), w * 0.9, -h * (0.9 + rand() * 0.4), w, h * 0.3);
      ctx.quadraticCurveTo(0, h * 0.6, -w, h * 0.3);
      ctx.fillStyle = base;
      ctx.fill();
      // ombra sotto il petalo successivo
      ctx.beginPath();
      ctx.moveTo(-w * 0.8, h * 0.35);
      ctx.quadraticCurveTo(0, h * 0.62, w * 0.8, h * 0.35);
      ctx.strokeStyle = dk(col, 0.4);
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = Math.max(0.6, s * 0.05);
      ctx.stroke();
      // bordo arrotolato chiaro
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.moveTo(-w * 0.85, -h * 0.2);
      ctx.bezierCurveTo(-w * 0.6, -h * 0.98, w * 0.6, -h * 0.98, w * 0.85, -h * 0.2);
      ctx.strokeStyle = lt(base, 0.35 + lit * 0.3);
      ctx.lineWidth = Math.max(0.7, s * 0.065);
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.restore();
    }
  });
  // cuore chiuso a spirale
  dab(P, x + s * 0.02, y + s * 0.03, s * 0.19, dk(col, 0.45));
  ctx.beginPath();
  for (let t = 0; t < 9; t += 0.25) {
    const r = s * 0.17 * (1 - t / 9);
    ctx.lineTo(x + Math.cos(t + r0 * 6) * r, y + Math.sin(t + r0 * 6) * r);
  }
  ctx.strokeStyle = lt(col, 0.25);
  ctx.lineWidth = Math.max(0.5, s * 0.04);
  ctx.stroke();
}

function daisyBloom(P, x, y, s, col, center = "#2d180b", petals = 13, r0 = 0, petalWid = 0.3) {
  for (let k = 0; k < petals; k++) {
    const a = (k / petals) * TAU + r0;
    const c = mix(col, Math.cos(a + 2.3) > 0 ? lt(col, 0.35) : dk(col, 0.2), Math.abs(Math.cos(a + 2.3)) * 0.7);
    stroke(P, x + Math.cos(a) * s * 0.18, y + Math.sin(a) * s * 0.18, a, s * 0.95, s * petalWid, c, { bristles: 2 });
  }
  dab(P, x, y, s * 0.32, center);
  dab(P, x - s * 0.06, y - s * 0.06, s * 0.2, lt(center, 0.2));
  for (let k = 0; k < 7; k++) dab(P, x + (P.rand() - 0.6) * s * 0.3, y + (P.rand() - 0.6) * s * 0.3, s * 0.035, "#e2c25a");
}

function fivePetal(P, x, y, s, col, r0 = 0, eye = "#f3e2a0") {
  for (let p = 0; p < 5; p++) {
    const a = (p / 5) * TAU + r0;
    const lit = (Math.cos(a - 3.9) + 1) / 2;
    dab(P, x + Math.cos(a) * s * 0.5, y + Math.sin(a) * s * 0.5, s * 0.5, mix(dk(col, 0.15), lt(col, 0.25), lit));
  }
  for (let p = 0; p < 5; p++) {
    const a = (p / 5) * TAU + r0;
    line(P, x, y, x + Math.cos(a) * s * 0.6, y + Math.sin(a) * s * 0.6, dk(col, 0.3), s * 0.06, 0.5);
  }
  dab(P, x, y, s * 0.18, eye);
}

function starBloom(P, x, y, s, col, n = 6, r0 = 0, throat = null) {
  for (let k = 0; k < n; k++) {
    const a = (k / n) * TAU + r0;
    const lit = (Math.cos(a - 3.9) + 1) / 2;
    stroke(P, x, y, a, s, s * 0.42, mix(dk(col, 0.15), lt(col, 0.3), lit), { bristles: 2, rib: true });
  }
  dab(P, x, y, s * 0.22, throat ?? dk(col, 0.35));
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * TAU + r0 + 0.3;
    line(P, x, y, x + Math.cos(a) * s * 0.45, y + Math.sin(a) * s * 0.45, "#7a5a22", s * 0.03);
    dab(P, x + Math.cos(a) * s * 0.47, y + Math.sin(a) * s * 0.47, s * 0.055, "#a8541c");
  }
}

function berry(P, x, y, r, col, gloss = true) {
  dab(P, x + r * 0.15, y + r * 0.2, r, dk(col, 0.45));
  dab(P, x, y, r * 0.92, col);
  dab(P, x - r * 0.15, y - r * 0.15, r * 0.6, lt(col, 0.15));
  if (gloss) dab(P, x - r * 0.32, y - r * 0.32, r * 0.22, lt(col, 0.35), 0.9);
}

// Frutto allungato (zucchina, peperone, melanzana...).
function longFruit(P, x, y, ang, len, wid, col, { stripes = null, cap = "#3d6a2a" } = {}) {
  const { ctx } = P;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.ellipse(len / 2 + wid * 0.1, wid * 0.15, len / 2, wid / 2, 0, 0, TAU);
  ctx.fillStyle = dk(col, 0.45);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(len / 2, 0, len / 2, wid / 2, 0, 0, TAU);
  ctx.fillStyle = col;
  ctx.fill();
  if (stripes) {
    ctx.strokeStyle = stripes;
    ctx.lineWidth = Math.max(0.5, wid * 0.08);
    for (const o of [-0.25, 0, 0.25]) {
      ctx.beginPath();
      ctx.moveTo(len * 0.08, o * wid);
      ctx.quadraticCurveTo(len / 2, o * wid * 1.3, len * 0.92, o * wid);
      ctx.stroke();
    }
  }
  ctx.beginPath();
  ctx.ellipse(len * 0.45, -wid * 0.18, len * 0.3, wid * 0.12, 0, 0, TAU);
  ctx.fillStyle = lt(col, 0.35);
  ctx.globalAlpha = 0.7;
  ctx.fill();
  ctx.globalAlpha = 1;
  stroke(P, 0, 0, Math.PI, wid * 0.6, wid * 0.5, cap, { bristles: 0 });
  ctx.restore();
}

// ---------- pittori per tipo ----------

function scatter(P, n, rmax, fn) {
  const { rand } = P;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rand() * 0.6;
    const d = i === 0 ? rand() * 0.1 : rmax * (0.45 + rand() * 0.55);
    fn(Math.cos(a) * d, Math.sin(a) * d, i, rand());
  }
}

const TYPES = {
  flower(P, cols) {
    mass(P, 0.6, "#213b19");
    canopy(P, { R: 0.72, n: 80 });
    scatter(P, 9, 0.6, (x, y, i, r) => fivePetal(P, P.U(x), P.U(y), P.U(0.13), cols[i % cols.length], r * 6));
  },
  daisy(P, cols) {
    mass(P, 0.6, "#213b19");
    canopy(P, { R: 0.72, n: 80, len: 0.26, wid: 0.1 });
    const center = cols[0] === "#f4f1ea" ? "#e0b52f" : "#2d180b";
    scatter(P, 8, 0.55, (x, y, i, r) => daisyBloom(P, P.U(x), P.U(y), P.U(0.17), cols[i % cols.length], center, 13, r * 6));
  },
  rose(P, cols) {
    mass(P, 0.62, "#203a18");
    canopy(P, { R: 0.75, n: 90, len: 0.24, wid: 0.13, serrated: true, greens: ["#243f1b", "#3e6a2c", "#6e9447"] });
    scatter(P, 5, 0.48, (x, y, i, r) => {
      // qualche bocciolo tra le rose
      if (i === 4) {
        dab(P, P.U(x), P.U(y), P.U(0.08), dk(cols[0], 0.3));
        dab(P, P.U(x) - 1, P.U(y) - 1, P.U(0.05), cols[0]);
        return;
      }
      roseBloom(P, P.U(x), P.U(y), P.U(0.24), cols[i % cols.length], r);
    });
  },
  spike(P, cols) {
    mass(P, 0.5, "#3f4f3b");
    canopy(P, { R: 0.55, n: 150, len: 0.24, wid: 0.04, greens: SILVER, rib: false });
    const { U, rand } = P;
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * TAU + rand() * 0.3, to = 0.8 + rand() * 0.16;
      line(P, U(Math.cos(a) * 0.15), U(Math.sin(a) * 0.15), U(Math.cos(a) * to), U(Math.sin(a) * to), "#6f7d5c", U(0.018));
      const col = cols[i % cols.length];
      for (let t = 0.4; t <= to; t += 0.022) {
        const side = (rand() - 0.5) * 0.06;
        const x = Math.cos(a) * t - Math.sin(a) * side, y = Math.sin(a) * t + Math.cos(a) * side;
        dab(P, U(x), U(y), U(0.026 + (to - t) * 0.035), rand() < 0.3 ? dk(col, 0.35) : rand() < 0.6 ? col : lt(col, 0.3));
      }
    }
  },
  cluster(P, cols) {
    mass(P, 0.66, "#1f3818");
    const { U, rand } = P;
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * TAU + rand() * 0.3;
      bigLeaf(P, U(Math.cos(a) * 0.3), U(Math.sin(a) * 0.3), a, U(0.5), U(0.3), shadeBy("#4b7a35", litAt(Math.cos(a), Math.sin(a)), 0.4), { veins: 4 });
    }
    scatter(P, 4, 0.36, (x, y, i) => {
      const col = cols[i % cols.length], s = U(0.32);
      dab(P, U(x) + s * 0.12, U(y) + s * 0.14, s, dk(col, 0.5));
      for (let k = 0; k < 38; k++) {
        const a = rand() * TAU, d = Math.sqrt(rand()) * s * 0.85;
        const fx = U(x) + Math.cos(a) * d, fy = U(y) + Math.sin(a) * d;
        const lit = 1 - Math.hypot(fx - (U(x) - s * 0.35), fy - (U(y) - s * 0.35)) / (s * 1.6);
        const fc = mix(mix(col, rand() < 0.3 ? "#b49ad8" : col, 0.5), lit > 0.5 ? lt(col, 0.45) : dk(col, 0.15), Math.abs(lit - 0.5));
        for (let p = 0; p < 4; p++) {
          const pa = (p / 4) * TAU + rand();
          dab(P, fx + Math.cos(pa) * s * 0.09, fy + Math.sin(pa) * s * 0.09, s * 0.1, fc);
        }
      }
    });
  },
  star(P, cols) {
    // gigli, emerocallidi: foglie nastriformi e grandi fiori a stella
    mass(P, 0.45, "#22391a");
    canopy(P, { R: 0.6, n: 70, len: 0.5, wid: 0.07, greens: GREENS, rib: true });
    scatter(P, 4, 0.45, (x, y, i, r) => starBloom(P, P.U(x), P.U(y), P.U(0.3), cols[i % cols.length], 6, r * 6));
  },
  cup(P, cols) {
    // tulipani: foglie larghe glauche e coppe viste dall'alto
    canopy(P, { R: 0.55, n: 40, len: 0.5, wid: 0.18, greens: BLUEGREEN, rib: true });
    scatter(P, 6, 0.45, (x, y, i, r) => tulipCup(P, P.U(x), P.U(y), P.U(0.16), cols[i % cols.length], r));
  },
  grass(P, cols, name) {
    const { U, rand } = P;
    if (/mais|zea mays/.test(name)) {
      // mais: foglie lunghe e larghe a nastro, pennacchio al centro
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU + rand() * 0.3;
        stroke(P, 0, 0, a + (rand() - 0.5) * 0.2, U(0.92), U(0.16), shadeBy("#4f8035", litAt(Math.cos(a), Math.sin(a)), 0.45), { rib: true });
      }
      for (let i = 0; i < 9; i++) line(P, 0, 0, U(Math.cos(i * 0.7) * 0.22), U(Math.sin(i * 0.7) * 0.22), "#d8c27a", U(0.03));
      dab(P, 0, 0, U(0.05), "#c9a95a");
      return;
    }
    // ciuffo fitto: base scura, poi tre strati di fili sempre più chiari
    mass(P, 0.3, "#3d4f28");
    const tint = cols[0];
    const layers = [
      { c: ["#3f5a2c", "#4d6b34"], n: 70, w: 0.026, k: 0.85 },
      { c: ["#6c8a45", "#7d9450"], n: 70, w: 0.022, k: 0.95 },
      { c: ["#a9ad6a", "#c2b878"], n: 55, w: 0.016, k: 1 },
    ];
    for (const L of layers) {
      for (let i = 0; i < L.n; i++) {
        const a = rand() * TAU, len = (0.55 + rand() * 0.42) * L.k, bend = (rand() - 0.5) * 0.6;
        const a2 = a + bend * len;
        line(P, U(Math.cos(a) * 0.04), U(Math.sin(a) * 0.04), U(Math.cos(a2) * len), U(Math.sin(a2) * len), L.c[i % 2], U(L.w), 1, U(Math.cos(a) * len * 0.6), U(Math.sin(a) * len * 0.6));
      }
    }
    for (let i = 0; i < 16; i++) {
      const a = rand() * TAU, d = 0.6 + rand() * 0.3;
      stroke(P, U(Math.cos(a) * d * 0.75), U(Math.sin(a) * d * 0.75), a, U(0.2), U(0.06), tint ? mix(tint, "#e3d6a4", 0.4) : "#e3d6a4", { alpha: 0.9, bristles: 2 });
    }
  },
  foliage(P, cols, name) {
    // hosta, heuchera, felci: foglie grandi con nervature
    const { U, rand } = P;
    if (/felc|fern|polystich|dryopter|athyr|osmunda|matteuccia|blechnum|asplen|adiant/.test(name)) return fern(P);
    const base = /heuchera/.test(name) ? "#6b2f3c" : /hosta/.test(name) ? "#4f7d5d" : "#4b7a35";
    mass(P, 0.6, dk(base, 0.5));
    const variegated = /hosta|variegat/.test(name);
    for (let ring = 0; ring < 3; ring++) {
      const n = [11, 9, 6][ring];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + ring * 0.4 + rand() * 0.3;
        const d = [0.3, 0.18, 0.05][ring];
        const c = shadeBy(base, litAt(Math.cos(a) * 0.6, Math.sin(a) * 0.6) * 0.7 + ring * 0.15, 0.45);
        bigLeaf(P, U(Math.cos(a) * d), U(Math.sin(a) * d), a, U([0.6, 0.5, 0.38][ring]), U([0.38, 0.32, 0.26][ring]), c, { veins: 6, vein: variegated ? "#e8e0b8" : null });
      }
    }
  },
  shrub(P, cols, name) {
    if (/rosmarin/.test(name)) return SPECIES.rosmarino(P, cols);
    mass(P, 0.8, "#1c3517");
    canopy(P, { R: 0.78, n: 700, len: 0.085, wid: 0.055, greens: DEEP, rib: false, round: true });
    const { U, rand } = P;
    for (let i = 0; i < 40; i++) {
      const a = rand() * TAU, d = Math.sqrt(rand()) * 0.55;
      dab(P, U(Math.cos(a) * d - 0.18), U(Math.sin(a) * d - 0.18), U(0.012), "#c9dd8f", 0.8);
    }
    // arbusti fioriti: fiorellini sparsi
    if (cols.length) for (let i = 0; i < 30; i++) {
      const a = rand() * TAU, d = Math.sqrt(rand()) * 0.7;
      fivePetal(P, U(Math.cos(a) * d), U(Math.sin(a) * d), U(0.05), cols[i % cols.length], rand() * 6);
    }
  },
  groundcover(P, cols) {
    // tappeto basso dai bordi irregolari, foglioline e fiorellini
    const { U, rand } = P;
    for (let i = 0; i < 9; i++) {
      const a = rand() * TAU, d = rand() * 0.45;
      mass(P, 0.32 + rand() * 0.15, "#2a4520", { cx: Math.cos(a) * d, cy: Math.sin(a) * d, lobes: 9 });
    }
    for (let i = 0; i < 500; i++) {
      const a = rand() * TAU, d = Math.sqrt(rand()) * 0.85;
      const x = Math.cos(a) * d, y = Math.sin(a) * d;
      stroke(P, U(x), U(y), rand() * TAU, U(0.06), U(0.035), shadeBy(GREENS[1], litAt(x, y), 0.4), { round: true, bristles: 0 });
    }
    if (cols.length) for (let i = 0; i < 90; i++) {
      const a = rand() * TAU, d = Math.sqrt(rand()) * 0.8;
      const x = Math.cos(a) * d, y = Math.sin(a) * d;
      fivePetal(P, U(x), U(y), U(0.03), shadeBy(cols[i % cols.length], litAt(x, y), 0.3), rand() * 6, lt(cols[i % cols.length], 0.6));
    }
  },

  // ---------- ortaggi ----------
  leafy(P, cols, name) {
    const { U, rand } = P;
    const v = /basilic/.test(name) ? "basil" : /radicch|cicori/.test(name) ? "radicchio" : /bietol|barbabiet/.test(name) ? "chard" : /carciof/.test(name) ? "artichoke"
      : /spinac/.test(name) ? "spinach" : /patat/.test(name) ? "potato" : /rucol/.test(name) ? "rocket" : /ravanell|rapa/.test(name) ? "radish" : "lettuce";
    if (v === "basil") {
      mass(P, 0.55, "#2b5320");
      canopy(P, { R: 0.65, n: 70, len: 0.26, wid: 0.17, greens: ["#2f5e24", "#4f8a35", "#86b85a"], rib: true });
      for (let i = 0; i < 6; i++) {
        const a = rand() * TAU, d = rand() * 0.4;
        line(P, U(Math.cos(a) * d), U(Math.sin(a) * d), U(Math.cos(a) * d + 0.05), U(Math.sin(a) * d), "#f1ecd8", U(0.04));
      }
      return;
    }
    if (v === "artichoke") {
      mass(P, 0.7, "#3c5048");
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU + rand() * 0.2;
        stroke(P, 0, 0, a, U(0.9), U(0.3), shadeBy("#8aa098", litAt(Math.cos(a), Math.sin(a)), 0.5), { serrated: true, rib: true });
      }
      // capolino
      for (let k = 0; k < 14; k++) {
        const a = (k / 14) * TAU;
        stroke(P, U(Math.cos(a) * 0.04), U(Math.sin(a) * 0.04), a, U(0.16), U(0.12), mix("#5a7a4a", "#7b4a78", 0.4), { bristles: 1 });
      }
      dab(P, 0, 0, U(0.07), "#6a4a6e");
      return;
    }
    if (v === "potato") {
      mass(P, 0.6, "#2a4520");
      canopy(P, { R: 0.72, n: 110, len: 0.16, wid: 0.11, greens: ["#2d4a22", "#4a6e34", "#7a9a55"], rib: true, radial: false });
      for (let i = 0; i < 10; i++) {
        const a = rand() * TAU, d = rand() * 0.5;
        fivePetal(P, U(Math.cos(a) * d), U(Math.sin(a) * d), U(0.045), "#e9e3f2", rand() * 6, "#f2c94c");
      }
      return;
    }
    const conf = {
      lettuce: { c: "#9cc25e", n: 22, len: 0.75, wid: 0.5, center: "#d6e89a", ruffle: true },
      radicchio: { c: "#7a2238", n: 18, len: 0.7, wid: 0.5, center: "#a8344e", vein: "#f2ece6" },
      chard: { c: "#3f6e2c", n: 10, len: 0.9, wid: 0.42, center: "#4f8a35", vein: cols[0] ?? "#d64545" },
      spinach: { c: "#2f5a26", n: 16, len: 0.7, wid: 0.38, center: "#3f6e2c" },
      rocket: { c: "#4f7d38", n: 20, len: 0.8, wid: 0.22, center: "#5f8f42", lobedNarrow: true },
      radish: { c: "#5f8f42", n: 10, len: 0.6, wid: 0.32, center: "#7aa858" },
    }[v];
    mass(P, conf.len * 0.85, dk(conf.c, 0.45));
    for (let ring = 0; ring < 3; ring++) {
      const n = Math.round(conf.n / (ring + 1));
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + ring * 0.35 + rand() * 0.2;
        const c = shadeBy(mix(conf.c, conf.center, ring * 0.35), litAt(Math.cos(a) * 0.6, Math.sin(a) * 0.6), 0.4);
        const L = U(conf.len * (1 - ring * 0.25)), W = U(conf.wid * (1 - ring * 0.2));
        if (conf.lobedNarrow) stroke(P, 0, 0, a, L, W, c, { serrated: true, rib: true });
        else bigLeaf(P, 0, 0, a, L, W, c, { veins: 4, vein: conf.vein });
        if (conf.ruffle) {
          // bordo increspato chiaro
          for (let k = 0; k < 6; k++) {
            const t = 0.7 + k * 0.05, s = (k % 2 ? 1 : -1) * 0.3;
            dab(P, Math.cos(a) * L * t - Math.sin(a) * W * s, Math.sin(a) * L * t + Math.cos(a) * W * s, W * 0.18, lt(c, 0.3), 0.8);
          }
        }
      }
    }
    if (v === "radish") dab(P, 0, 0, U(0.06), "#c8506a", 0.8);
    dab(P, 0, 0, U(conf.len * 0.12), lt(conf.center, 0.25));
  },
  fruiting(P, cols, name) {
    const { U, rand } = P;
    const v = /melanzan/.test(name) ? "eggplant" : /peperoncin/.test(name) ? "chili" : /peperon/.test(name) ? "pepper" : "tomato";
    mass(P, 0.62, "#22381a");
    canopy(P, { R: 0.75, n: 75, len: 0.3, wid: v === "tomato" ? 0.11 : 0.15, greens: ["#26401c", "#3f6a2b", "#6c9442"], serrated: v === "tomato" });
    if (v === "tomato") {
      const col = cols[0] ?? "#d64545";
      scatter(P, 4, 0.45, (x, y) => {
        // grappolo di 3-4 pomodori
        for (let k = 0; k < 4; k++) berry(P, U(x + (rand() - 0.5) * 0.14), U(y + (rand() - 0.5) * 0.14), U(0.075), k === 3 ? mix(col, "#7fae4a", 0.6) : col);
      });
    } else if (v === "pepper") {
      scatter(P, 4, 0.4, (x, y, i) => longFruit(P, U(x), U(y), rand() * TAU, U(0.24), U(0.16), cols[i % cols.length] ?? "#d64545"));
    } else if (v === "eggplant") {
      scatter(P, 4, 0.4, (x, y) => longFruit(P, U(x), U(y), rand() * TAU, U(0.3), U(0.15), "#3b1d4a", { cap: "#4a6b3a" }));
      for (let i = 0; i < 4; i++) fivePetal(P, U((rand() - 0.5) * 0.9), U((rand() - 0.5) * 0.9), U(0.05), "#9b6fc4", rand() * 6);
    } else {
      for (let i = 0; i < 16; i++) {
        const a = rand() * TAU, d = 0.2 + rand() * 0.5;
        longFruit(P, U(Math.cos(a) * d), U(Math.sin(a) * d), a, U(0.16), U(0.05), cols[i % cols.length] ?? "#d64545");
      }
    }
  },
  squash(P, cols, name) {
    const { U, rand } = P;
    const v = /zucchin/.test(name) ? "zucchini" : /angur|cocomer/.test(name) ? "watermelon" : /melon/.test(name) ? "melon" : /cetriol/.test(name) ? "cucumber" : "pumpkin";
    mass(P, 0.75, "#22401b");
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU + rand() * 0.3, d = 0.25 + rand() * 0.15;
      bigLeaf(P, U(Math.cos(a) * d * 0.4), U(Math.sin(a) * d * 0.4), a, U(0.62), U(0.42), shadeBy("#3f7a2e", litAt(Math.cos(a), Math.sin(a)), 0.4), { lobed: true, veins: 0, vein: "#a9c98a" });
    }
    // macchie argentate tipiche delle foglie di zucca
    for (let i = 0; i < 20; i++) dab(P, U((rand() - 0.5) * 1.2), U((rand() - 0.5) * 1.2), U(0.02), "#c8d8b0", 0.5);
    if (v === "zucchini") {
      for (let i = 0; i < 3; i++) longFruit(P, U(-0.05 + i * 0.05), U(0.05), 0.3 + i * 1.9, U(0.48), U(0.12), "#3f6b2a", { stripes: "#6f9a4f" });
    } else if (v === "cucumber") {
      for (let i = 0; i < 4; i++) longFruit(P, U(0.1 * i - 0.1), U(0.1), 0.5 + i * 1.6, U(0.32), U(0.1), "#2f5a22", { stripes: "#5f8a45" });
    } else {
      const fruit = { pumpkin: "#e07a2a", watermelon: "#2f6b2a", melon: "#c9b26a" }[v];
      const r = { pumpkin: 0.24, watermelon: 0.26, melon: 0.18 }[v];
      berry(P, U(0.18), U(0.2), U(r), fruit, false);
      if (v === "pumpkin") for (let k = 0; k < 6; k++) line(P, U(0.18), U(0.2 - r), U(0.18 + Math.cos(k) * r * 0.2), U(0.2 + r * 0.95), dk(fruit, 0.3), U(0.012), 0.6, U(0.18 + (k - 2.5) * r * 0.35), U(0.2));
      if (v === "watermelon") for (let k = -2; k <= 2; k++) line(P, U(0.18 + k * 0.08), U(0.2 - r * 0.9), U(0.18 + k * 0.08), U(0.2 + r * 0.9), "#9ac072", U(0.02), 0.7, U(0.18 + k * 0.12), U(0.2));
      if (v === "melon") for (let k = 0; k < 40; k++) dab(P, U(0.18 + (rand() - 0.5) * r * 1.4), U(0.2 + (rand() - 0.5) * r * 1.4), U(0.008), "#efe3b8", 0.8);
    }
    // fiori gialli a campana
    for (let i = 0; i < 3; i++) starBloom(P, U((rand() - 0.5) * 0.9), U((rand() - 0.5) * 0.9), U(0.1), "#f2b632", 5, rand() * 6, "#d98b1c");
  },
  feathery(P, cols, name) {
    const { U, rand } = P;
    const v = /prezzemol/.test(name) ? "parsley" : /sedan/.test(name) ? "celery" : /finocch/.test(name) ? "fennel" : /asparag/.test(name) ? "asparagus" : "carrot";
    if (v === "celery") {
      mass(P, 0.35, "#5f8a45");
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU + rand() * 0.3;
        line(P, 0, 0, U(Math.cos(a) * 0.5), U(Math.sin(a) * 0.5), "#a9c98a", U(0.07));
        for (let k = 0; k < 3; k++) stroke(P, U(Math.cos(a) * 0.5), U(Math.sin(a) * 0.5), a + (k - 1) * 0.6, U(0.3), U(0.18), shadeBy("#4f8a35", litAt(Math.cos(a), Math.sin(a)), 0.4), { serrated: true });
      }
      return;
    }
    if (v === "parsley") {
      mass(P, 0.55, "#2a5520");
      for (let i = 0; i < 160; i++) {
        const a = rand() * TAU, d = Math.sqrt(rand()) * 0.7;
        const x = Math.cos(a) * d, y = Math.sin(a) * d;
        dab(P, U(x), U(y), U(0.045), shadeBy("#3f8a2e", litAt(x, y), 0.5));
      }
      return;
    }
    const col = { fennel: "#7faa5a", asparagus: "#5f8f42", carrot: "#4f8a35" }[v];
    if (v === "fennel") {
      dab(P, 0, 0, U(0.2), "#dfe8c4");
      dab(P, U(-0.04), U(-0.04), U(0.12), "#f1f4e2");
    }
    // fronde finissime: tanti piccoli tratti lungo i rami
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * TAU + rand() * 0.3, len = 0.6 + rand() * 0.3;
      line(P, 0, 0, U(Math.cos(a) * len), U(Math.sin(a) * len), dk(col, 0.2), U(0.012));
      for (let t = 0.15; t < len; t += 0.04) {
        for (const side of [-1, 1]) {
          const b = a + side * (0.6 + rand() * 0.4);
          const x = Math.cos(a) * t, y = Math.sin(a) * t;
          line(P, U(x), U(y), U(x + Math.cos(b) * 0.08), U(y + Math.sin(b) * 0.08), shadeBy(col, litAt(x, y), 0.45), U(0.01));
        }
      }
    }
    if (v === "carrot") dab(P, 0, 0, U(0.07), "#e07a2a");
  },
  allium(P, cols, name) {
    const { U, rand } = P;
    const v = /porr/.test(name) ? "leek" : /agli/.test(name) ? "garlic" : "onion";
    if (v === "leek") {
      // porro: ventaglio di foglie piatte glauche
      for (let i = 0; i < 10; i++) {
        const a = (i % 2 ? 0 : Math.PI) + (i - 5) * 0.12;
        stroke(P, 0, 0, a, U(0.9 - Math.abs(i - 5) * 0.04), U(0.16), shadeBy("#5a8a78", litAt(Math.cos(a), 0), 0.4), { rib: true });
      }
      dab(P, 0, 0, U(0.12), "#e9efd6");
      return;
    }
    const col = v === "garlic" ? "#6f9a7a" : "#5f8f6a";
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU + rand() * 0.4, len = 0.65 + rand() * 0.3;
      // foglie cave e tubolari, che si piegano
      line(P, 0, 0, U(Math.cos(a) * len), U(Math.sin(a) * len), dk(col, 0.3), U(0.07), 1, U(Math.cos(a + 0.3) * len * 0.6), U(Math.sin(a + 0.3) * len * 0.6));
      line(P, 0, 0, U(Math.cos(a) * len), U(Math.sin(a) * len), col, U(0.045), 1, U(Math.cos(a + 0.3) * len * 0.6), U(Math.sin(a + 0.3) * len * 0.6));
      line(P, 0, 0, U(Math.cos(a) * len * 0.9), U(Math.sin(a) * len * 0.9), lt(col, 0.35), U(0.012), 0.8, U(Math.cos(a + 0.3) * len * 0.55), U(Math.sin(a + 0.3) * len * 0.55));
    }
    const bulb = cols[0] ?? (v === "garlic" ? "#efe6d6" : "#c98a4a");
    berry(P, 0, 0, U(0.16), bulb, false);
  },
  legume(P, cols, name) {
    const { U, rand } = P;
    const v = /pisell/.test(name) ? "pea" : /fava/.test(name) ? "broad" : /cec/.test(name) ? "chickpea" : "bean";
    mass(P, 0.66, "#2f5226");
    canopy(P, { R: 0.35, n: 30, len: 0.18, wid: 0.12, greens: v === "pea" || v === "broad" ? ["#3f6a52", "#5f8a6a", "#8ab096"] : ["#2f5a26", "#4f8035", "#7aa858"], rib: true, radial: false });
    // foglie composte: foglioline a coppie lungo i piccioli
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU + rand() * 0.4;
      const pair = v === "bean" ? 1 : 3, len = 0.62;
      for (let k = 1; k <= pair; k++) {
        const t = (k / (pair + 1)) * len + 0.05;
        for (const s of [-1, 1]) {
          const x = Math.cos(a) * t, y = Math.sin(a) * t;
          stroke(P, U(x), U(y), a + s * 0.8, U(v === "bean" ? 0.25 : 0.16), U(v === "bean" ? 0.2 : 0.11), shadeBy(v === "pea" || v === "broad" ? "#6f9a7a" : "#4f8035", litAt(x, y), 0.4), { rib: true });
        }
      }
      if (v === "bean") stroke(P, U(Math.cos(a) * 0.45), U(Math.sin(a) * 0.45), a, U(0.28), U(0.22), shadeBy("#4f8035", litAt(Math.cos(a), Math.sin(a)), 0.4), { rib: true });
    }
    const flower = v === "broad" ? "#f4f1ea" : v === "pea" ? "#f4f1ea" : v === "chickpea" ? "#d8a0c8" : "#f4f1ea";
    for (let i = 0; i < 8; i++) {
      const a = rand() * TAU, d = rand() * 0.6;
      fivePetal(P, U(Math.cos(a) * d), U(Math.sin(a) * d), U(0.045), flower, rand() * 6, v === "broad" ? "#2d1b2f" : "#f2c94c");
    }
    for (let i = 0; i < 5; i++) {
      const a = rand() * TAU, d = 0.2 + rand() * 0.4;
      longFruit(P, U(Math.cos(a) * d), U(Math.sin(a) * d), a + 1.4, U(v === "broad" ? 0.28 : 0.22), U(0.06), v === "bean" ? "#7aa84a" : "#8ab85a", { cap: "#5a7a3a" });
    }
  },
  brassica(P, cols, name) {
    const { U, rand } = P;
    const v = /cavolfior/.test(name) ? "cauli" : /brocc|cime/.test(name) ? "broccoli" : /nero|kale|riccio/.test(name) ? "kale" : /rosso|cappuccio/.test(name) && /ross/.test(name) ? "red" : "cabbage";
    if (v === "kale") {
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU + rand() * 0.2;
        stroke(P, 0, 0, a, U(0.92), U(0.2), shadeBy("#2c3f3a", litAt(Math.cos(a), Math.sin(a)), 0.5), { rib: true });
        // bolle sulla foglia
        for (let t = 0.25; t < 0.85; t += 0.08) dab(P, U(Math.cos(a) * t), U(Math.sin(a) * t), U(0.02), "#4c625c", 0.7);
      }
      return;
    }
    const leafC = v === "red" ? "#5a3a6a" : "#5f8a84";
    mass(P, 0.8, dk(leafC, 0.45));
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU + rand() * 0.3;
      bigLeaf(P, 0, 0, a, U(0.82), U(0.55), shadeBy(leafC, litAt(Math.cos(a), Math.sin(a)), 0.4), { veins: 5, vein: "#d8e6e0" });
    }
    if (v === "cauli") {
      dab(P, U(0.02), U(0.03), U(0.3), "#c9bf9a");
      for (let k = 0; k < 40; k++) {
        const a = rand() * TAU, d = Math.sqrt(rand()) * 0.26;
        dab(P, U(Math.cos(a) * d), U(Math.sin(a) * d), U(0.055), shadeBy("#f1ead2", litAt(Math.cos(a) * d, Math.sin(a) * d) * 0.6 + 0.3, 0.3));
      }
    } else if (v === "broccoli") {
      dab(P, U(0.02), U(0.03), U(0.3), "#2a4a2c");
      for (let k = 0; k < 40; k++) {
        const a = rand() * TAU, d = Math.sqrt(rand()) * 0.26;
        dab(P, U(Math.cos(a) * d), U(Math.sin(a) * d), U(0.055), shadeBy("#4f7a4c", litAt(Math.cos(a) * d, Math.sin(a) * d), 0.4));
      }
    } else {
      // testa del cavolo: foglie avvolte
      const head = v === "red" ? "#7a4a8a" : "#9cc0a8";
      berry(P, 0, 0, U(0.32), head, false);
      for (let k = 0; k < 5; k++) {
        const a = k * 1.3;
        P.ctx.beginPath();
        P.ctx.arc(U(Math.cos(a) * 0.06), U(Math.sin(a) * 0.06), U(0.26 - k * 0.04), a, a + 2.4);
        P.ctx.strokeStyle = lt(head, 0.3);
        P.ctx.lineWidth = U(0.02);
        P.ctx.stroke();
      }
    }
  },
  berry(P) {
    // fragola: foglie trifogliate seghettate, fiori bianchi, frutti con semini
    const { U, rand } = P;
    mass(P, 0.55, "#2a4a20");
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU + rand() * 0.3, d = i % 3 === 0 ? 0.08 : 0.34;
      const x = Math.cos(a) * d, y = Math.sin(a) * d;
      for (const o of [-0.7, 0, 0.7]) stroke(P, U(x), U(y), a + o, U(0.26), U(0.2), shadeBy("#3f7a2e", litAt(x, y), 0.4), { serrated: true, rib: true });
    }
    for (let i = 0; i < 4; i++) {
      const a = rand() * TAU, d = rand() * 0.55;
      fivePetal(P, U(Math.cos(a) * d), U(Math.sin(a) * d), U(0.07), "#f6f2e6", rand() * 6, "#f2c94c");
    }
    for (let i = 0; i < 6; i++) {
      const a = rand() * TAU, d = 0.25 + rand() * 0.4;
      const x = U(Math.cos(a) * d), y = U(Math.sin(a) * d), r = U(0.075);
      berry(P, x, y, r, i === 5 ? "#e8a0a0" : "#c8282e");
      for (let k = 0; k < 7; k++) dab(P, x + (rand() - 0.5) * r * 1.2, y + (rand() - 0.5) * r * 1.2, r * 0.07, "#f2d36a");
      stroke(P, x, y - r * 0.8, -Math.PI / 2, r * 0.6, r * 0.5, "#3d6a2a", { bristles: 0 });
    }
  },
};

function fern(P) {
  const { U, rand } = P;
  mass(P, 0.35, "#24401c");
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU + rand() * 0.3, len = 0.85;
    line(P, 0, 0, U(Math.cos(a) * len), U(Math.sin(a) * len), "#3d5a2a", U(0.015));
    for (let t = 0.12; t < len; t += 0.045) {
      const w = 0.16 * Math.sin(Math.PI * (t / len)) + 0.02;
      for (const s of [-1, 1]) {
        const x = Math.cos(a) * t, y = Math.sin(a) * t;
        stroke(P, U(x), U(y), a + s * 1.2, U(w), U(0.035), shadeBy("#5a8a3a", litAt(x, y), 0.4), { bristles: 0 });
      }
    }
  }
}

function tulipCup(P, x, y, s, col, r0) {
  // coppa: 6 petali sovrapposti visti dall'alto, interno scuro con stami
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * TAU + r0 * 6;
    const lit = (Math.cos(a - 3.9) + 1) / 2;
    P.ctx.save();
    P.ctx.translate(x + Math.cos(a) * s * 0.35, y + Math.sin(a) * s * 0.35);
    P.ctx.rotate(a);
    P.ctx.beginPath();
    P.ctx.ellipse(0, 0, s * 0.55, s * 0.5, 0, 0, TAU);
    P.ctx.fillStyle = mix(dk(col, 0.2), lt(col, 0.3), lit);
    P.ctx.fill();
    P.ctx.restore();
  }
  dab(P, x, y, s * 0.42, dk(col, 0.25));
  dab(P, x, y, s * 0.2, "#2a1e14");
  for (let k = 0; k < 6; k++) dab(P, x + Math.cos(k) * s * 0.18, y + Math.sin(k) * s * 0.18, s * 0.05, "#3a2a1a");
}

// ---------- specie famose, disegnate dal vero ----------

const SPECIES = {
  girasole(P) {
    const { U } = P;
    mass(P, 0.75, "#22401b");
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU;
      bigLeaf(P, U(Math.cos(a) * 0.2), U(Math.sin(a) * 0.2), a, U(0.6), U(0.42), shadeBy("#4b7a35", litAt(Math.cos(a), Math.sin(a)), 0.4), { veins: 4 });
    }
    // grande capolino: petali gialli, disco con semi a spirale
    daisyBloom(P, U(-0.02), U(-0.02), U(0.42), "#f2b81f", "#3a2412", 24, 0, 0.26);
    const { ctx } = P;
    for (let k = 0; k < 160; k++) {
      const r = Math.sqrt(k / 160) * U(0.13), a = k * 2.399963;
      ctx.fillStyle = k % 3 ? "#5a3a1c" : "#2a170a";
      ctx.beginPath();
      ctx.arc(U(-0.02) + Math.cos(a) * r, U(-0.02) + Math.sin(a) * r, U(0.009), 0, TAU);
      ctx.fill();
    }
  },
  papavero(P, cols) {
    const { U, rand, ctx } = P;
    mass(P, 0.55, "#3a5238");
    canopy(P, { R: 0.68, n: 90, len: 0.3, wid: 0.12, greens: SILVER, serrated: true });
    const col = cols[0] ?? "#d8321f";
    scatter(P, 4, 0.42, (x, y, i, r) => {
      const s = U(0.3);
      // 4 petali di seta stropicciati
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * TAU + r * 6;
        const lit = (Math.cos(a - 3.9) + 1) / 2;
        ctx.save();
        ctx.translate(U(x) + Math.cos(a) * s * 0.45, U(y) + Math.sin(a) * s * 0.45);
        ctx.rotate(a);
        ctx.beginPath();
        for (let j = 0; j <= 16; j++) {
          const t = (j / 16) * TAU, rr = s * 0.55 * (1 + 0.06 * Math.sin(t * 7 + k));
          ctx.lineTo(Math.cos(t) * rr, Math.sin(t) * rr * 0.95);
        }
        ctx.fillStyle = mix(dk(col, 0.2), lt(col, 0.2), lit);
        ctx.fill();
        // pieghe della seta
        for (let j = 0; j < 4; j++) line(P, -s * 0.2, (j - 1.5) * s * 0.12, s * 0.45, (j - 1.5) * s * 0.2, dk(col, 0.25), s * 0.03, 0.5);
        ctx.restore();
      }
      // macchia nera alla base e capsula
      dab(P, U(x), U(y), s * 0.32, "#1c1410");
      dab(P, U(x), U(y), s * 0.16, "#7a8a5a");
      for (let k = 0; k < 8; k++) line(P, U(x), U(y), U(x) + Math.cos(k * 0.78) * s * 0.14, U(y) + Math.sin(k * 0.78) * s * 0.14, "#3a3a2a", s * 0.02);
      for (let k = 0; k < 14; k++) dab(P, U(x) + Math.cos(k * 0.45) * s * 0.24, U(y) + Math.sin(k * 0.45) * s * 0.24, s * 0.025, "#2a2440");
      if (rand() < 0) return;
    });
  },
  peonia(P, cols) {
    const { U, rand } = P;
    mass(P, 0.68, "#213b19");
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU + rand() * 0.3;
      for (const o of [-0.45, 0, 0.45]) stroke(P, U(Math.cos(a) * 0.35), U(Math.sin(a) * 0.35), a + o, U(0.32), U(0.13), shadeBy("#466f30", litAt(Math.cos(a), Math.sin(a)), 0.4), { rib: true });
    }
    scatter(P, 3, 0.36, (x, y, i) => {
      const col = cols[i % cols.length] ?? "#e88fb4", s = U(0.34);
      // fiore enorme e spettinato: tanti petali increspati, dal fuori al centro
      dab(P, U(x) + s * 0.1, U(y) + s * 0.12, s, dk(col, 0.45));
      for (let k = 0; k < 60; k++) {
        const t = k / 60, a = rand() * TAU, d = (1 - t) * s * 0.75;
        const px = U(x) + Math.cos(a) * d, py = U(y) + Math.sin(a) * d;
        const lit = 1 - Math.hypot(px - (U(x) - s * 0.4), py - (U(y) - s * 0.4)) / (s * 1.8);
        stroke(P, px, py, a + Math.PI / 2 + (rand() - 0.5), s * (0.42 - t * 0.25), s * (0.34 - t * 0.18), mix(dk(col, 0.15), lt(col, 0.4), lit), { bristles: 1 });
      }
      for (let k = 0; k < 6; k++) dab(P, U(x) + (rand() - 0.5) * s * 0.2, U(y) + (rand() - 0.5) * s * 0.2, s * 0.03, "#f2d36a");
    });
  },
  dalia(P, cols) {
    const { U } = P;
    mass(P, 0.62, "#213b19");
    canopy(P, { R: 0.72, n: 70, len: 0.28, wid: 0.14, serrated: true });
    scatter(P, 4, 0.42, (x, y, i, r) => {
      const col = cols[i % cols.length] ?? "#d64545", s = U(0.28);
      dab(P, U(x) + s * 0.1, U(y) + s * 0.12, s, dk(col, 0.45));
      // petali a cucchiaio in anelli regolari, sempre più piccoli
      for (let ring = 0; ring < 6; ring++) {
        const n = 16 - ring * 2, rr = s * (0.92 - ring * 0.15);
        for (let k = 0; k < n; k++) {
          const a = (k / n) * TAU + ring * 0.25 + r * 6;
          const lit = (Math.cos(a - 3.9) + 1) / 2;
          stroke(P, U(x) + Math.cos(a) * rr * 0.35, U(y) + Math.sin(a) * rr * 0.35, a, rr * 0.65, rr * 0.3, mix(dk(col, 0.1 + ring * 0.04), lt(col, 0.35), lit * (1 - ring * 0.1)), { bristles: 1, rib: true });
        }
      }
      dab(P, U(x), U(y), s * 0.1, dk(col, 0.4));
    });
  },
  agapanto(P, cols) {
    const { U, rand } = P;
    canopy(P, { R: 0.6, n: 50, len: 0.6, wid: 0.09, greens: GREENS, rib: true });
    scatter(P, 4, 0.38, (x, y, i) => {
      const col = cols[i % cols.length] ?? "#5b8fd9", s = U(0.24);
      dab(P, U(x), U(y), s * 0.9, dk(col, 0.5), 0.7);
      // ombrella di fiori a trombetta, ognuno con 6 lobi
      for (let k = 0; k < 26; k++) {
        const a = rand() * TAU, d = Math.sqrt(rand()) * s * 0.85;
        const fx = U(x) + Math.cos(a) * d, fy = U(y) + Math.sin(a) * d;
        starBloom(P, fx, fy, s * 0.17, shadeBy(col, litAt((fx - U(x)) / s, (fy - U(y)) / s), 0.35), 6, rand() * 6, lt(col, 0.4));
      }
    });
  },
  geranio(P, cols) {
    const { U, rand } = P;
    // foglie tonde con l'anello scuro tipico del geranio zonale
    mass(P, 0.66, "#24401c");
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU + rand() * 0.4, d = 0.2 + rand() * 0.38;
      const x = U(Math.cos(a) * d), y = U(Math.sin(a) * d), r = U(0.17);
      dab(P, x, y, r, shadeBy("#4f8035", litAt(Math.cos(a) * d, Math.sin(a) * d), 0.4));
      P.ctx.beginPath();
      P.ctx.arc(x, y, r * 0.6, 0, TAU);
      P.ctx.strokeStyle = "#3a3a1c";
      P.ctx.globalAlpha = 0.45;
      P.ctx.lineWidth = r * 0.18;
      P.ctx.stroke();
      P.ctx.globalAlpha = 1;
    }
    scatter(P, 5, 0.42, (x, y, i) => {
      const col = cols[i % cols.length] ?? "#d64545", s = U(0.14);
      dab(P, U(x) + s * 0.2, U(y) + s * 0.2, s * 1.3, dk(col, 0.5), 0.9);
      for (let k = 0; k < 9; k++) {
        const a = rand() * TAU, d = rand() * s * 0.85;
        fivePetal(P, U(x) + Math.cos(a) * d, U(y) + Math.sin(a) * d, s * 0.4, mix(col, lt(col, 0.25), rand() * 0.6), rand() * 6, lt(col, 0.6));
      }
    });
  },
  rosmarino(P) {
    const { U, rand } = P;
    mass(P, 0.7, "#34503a");
    // rami fitti di aghi verde scuro con il rovescio argentato, fiorellini azzurri
    for (let i = 0; i < 26; i++) {
      const a = rand() * TAU, len = 0.5 + rand() * 0.35, bend = (rand() - 0.5) * 0.4;
      for (let t = 0.05; t < len; t += 0.03) {
        const aa = a + bend * t, x = Math.cos(aa) * t, y = Math.sin(aa) * t;
        for (const s of [-1, 1]) line(P, U(x), U(y), U(x + Math.cos(aa + s * 1.1) * 0.06), U(y + Math.sin(aa + s * 1.1) * 0.06), shadeBy(rand() < 0.35 ? "#b4c4b0" : "#557a5a", litAt(x, y), 0.4), U(0.014));
      }
    }
    for (let i = 0; i < 40; i++) {
      const a = rand() * TAU, d = Math.sqrt(rand()) * 0.75;
      dab(P, U(Math.cos(a) * d), U(Math.sin(a) * d), U(0.018), rand() < 0.5 ? "#8fb0e0" : "#b8c8f0");
    }
  },
  iris(P, cols) {
    const { U } = P;
    // ventaglio di foglie a spada e fiori con 3 petali ricadenti barbati
    for (let i = 0; i < 18; i++) {
      const a = (i % 2 ? -0.3 : Math.PI - 0.3) + (i - 9) * 0.09;
      stroke(P, 0, 0, a, U(0.88), U(0.13), shadeBy("#5a8a78", litAt(Math.cos(a), Math.sin(a)), 0.4), { rib: true });
    }
    scatter(P, 4, 0.38, (x, y, i, r) => {
      const col = cols[i % cols.length] ?? "#7a5cc8", s = U(0.3);
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * TAU + r * 6;
        stroke(P, U(x), U(y), a, s, s * 0.7, shadeBy(col, (Math.cos(a - 3.9) + 1) / 2, 0.35), { bristles: 2, rib: true });
        line(P, U(x), U(y), U(x) + Math.cos(a) * s * 0.5, U(y) + Math.sin(a) * s * 0.5, "#f2c94c", s * 0.08);
      }
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * TAU + r * 6 + Math.PI / 3;
        stroke(P, U(x), U(y), a, s * 0.6, s * 0.45, lt(col, 0.25), { bristles: 1 });
      }
    });
  },
};

// Riconoscimento delle specie dal nome (comune o scientifico).
export const SPECIES_RULES = [
  ["girasole", /girasol|helianthus annuus/],
  ["papavero", /papaver|papavero|rosolaccio/],
  ["peonia", /paeoni|peoni/],
  ["dalia", /dahlia|dalia/],
  ["agapanto", /agapant/],
  ["geranio", /pelargon|\bgerani[oi]?\b(?! perenn)/],
  ["rosmarino", /rosmarin|salvia rosmarinus/],
  ["iris", /\biris\b|giaggiol/],
];

export function speciesFor(name = "") {
  const t = name.toLowerCase();
  for (const [k, re] of SPECIES_RULES) if (re.test(t)) return k;
  return null;
}

// Disegna l'icona: tipo (categoria), colori dei fiori, nome per varianti e specie.
export function paintTempera(ctx, size, { type, colors = [], name = "" }) {
  const S = size / 2;
  const lname = name.toLowerCase();
  const P = { ctx, rand: rng("tempera:" + type + ":" + lname + ":" + colors.join(",")), U: (v) => v * S };
  ctx.save();
  ctx.translate(S, S);
  ctx.save();
  ctx.filter = `blur(${size * 0.02}px)`;
  dab(P, P.U(0.09), P.U(0.11), P.U(type === "grass" ? 0.6 : 0.8), "#2b1d10", 0.45);
  ctx.restore();
  const cols = colors.length ? colors : ["#e88fb4"];
  const sp = speciesFor(lname);
  if (sp) SPECIES[sp](P, colors.length ? colors : [], lname);
  else {
    const raw = ["shrub", "groundcover", "grass", "leafy", "fruiting", "squash", "feathery", "allium", "legume", "brassica", "berry"].includes(type);
    (TYPES[type] ?? TYPES.flower)(P, raw ? colors : cols, lname);
  }
  ctx.restore();
  // superficie opaca: grana fine solo dove c'è colore
  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  const r2 = rng("grana");
  for (let i = 0; i < size * size * 0.08; i++) {
    ctx.fillStyle = r2() < 0.5 ? "rgba(255,245,220,0.10)" : "rgba(20,15,5,0.10)";
    ctx.fillRect(r2() * size, r2() * size, 1 + r2(), 1 + r2());
  }
  ctx.restore();
}

// =====================================================================
// Tonalità precise dalle descrizioni del catalogo ("albicocca",
// "cremisi", "rosa tenue"...), così ogni varietà ha il suo colore.
// =====================================================================
const TONES = [
  [/rosso quasi nero|rosso scuro|cremisi scuro|bordeaux|vinaccia/, "#6e1426"],
  [/cremisi/, "#a3162f"],
  [/carminio/, "#b3123a"],
  [/lampone/, "#c2274f"],
  [/rosso mattone/, "#a8452e"],
  [/rosso aranciato|\brame\b/, "#d0522a"],
  [/rosso vivo|scarlatto/, "#d42a2a"],
  [/magenta|fucsia/, "#c8287a"],
  [/ciliegia/, "#d63a6a"],
  [/rosa carico|rosa intenso/, "#d9578a"],
  [/salmone/, "#f28a78"],
  [/corallo/, "#f2706a"],
  [/pesca/, "#f6b59a"],
  [/albicocca/, "#f3a46c"],
  [/rosa carne/, "#f2c0a8"],
  [/rosa conchiglia|rosa perla|rosa tenue|rosa pallido|rosa cipria/, "#f5cdd6"],
  [/lilla|malva/, "#c7a0d6"],
  [/viola notte|viola scuro|viola reale|porpora/, "#4f2a7a"],
  [/ardesia/, "#6a6a9a"],
  [/viola intenso/, "#6f3fa8"],
  [/giallo pallido|giallo limone/, "#f6e7a2"],
  [/bianco crema|\bcrema\b/, "#f3e6c4"],
  [/giallo oro|\boro\b/, "#f0b323"],
  [/mandarino|arancio/, "#f08a2a"],
  [/azzurr/, "#8fb6e8"],
];

export function tonesFrom(text = "") {
  // "profumo di limone/rosa" non è un colore
  const t = text.toLowerCase().replace(/profum[^·,.;]*/g, " ");
  const found = [];
  const taken = [];
  // le voci più precise vengono prima: una parola già usata ("cremisi scuro")
  // non conta di nuovo per una più generica ("cremisi")
  for (const [re, hexv] of TONES) {
    const m = t.match(re);
    if (!m) continue;
    const a = m.index, b = m.index + m[0].length;
    if (taken.some(([x, y]) => a < y && b > x)) continue;
    taken.push([a, b]);
    found.push([a, hexv]);
  }
  return found.sort((a, b) => a[0] - b[0]).map(([, h]) => h).filter((h, i, a) => a.indexOf(h) === i).slice(0, 3);
}

function tendril(P, x, y, r, turns = 2.2, color = "#6f9a3f", dir = 1) {
  const { ctx } = P;
  ctx.beginPath();
  for (let t = 0; t <= turns * TAU; t += 0.15) {
    const rr = r * (1 - t / (turns * TAU));
    ctx.lineTo(x + Math.cos(t * dir) * rr, y + Math.sin(t * dir) * rr);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(0.6, r * 0.12);
  ctx.lineCap = "round";
  ctx.stroke();
}

// ---------- rose: un disegno per ogni gruppo ----------

function roseBush(P, { R = 0.75, n = 90 } = {}) {
  mass(P, R * 0.82, "#203a18");
  canopy(P, { R, n, len: 0.24, wid: 0.13, serrated: true, greens: ["#243f1b", "#3e6a2c", "#6e9447"] });
}

// rosa a mazzi piccola e semidoppia (paesaggistiche, polyantha)
function smallRose(P, x, y, s, col, r0) {
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * TAU + r0;
    const lit = (Math.cos(a - 3.9) + 1) / 2;
    dab(P, x + Math.cos(a) * s * 0.5, y + Math.sin(a) * s * 0.5, s * 0.45, mix(dk(col, 0.15), lt(col, 0.35), lit));
  }
  dab(P, x, y, s * 0.42, lt(col, 0.15));
  dab(P, x, y, s * 0.18, "#f2d36a");
}

// rosa botanica: 5 petali semplici, stami gialli e bacche rosse
function wildRose(P, x, y, s, col, r0) {
  for (let p = 0; p < 5; p++) {
    const a = (p / 5) * TAU + r0;
    const lit = (Math.cos(a - 3.9) + 1) / 2;
    dab(P, x + Math.cos(a) * s * 0.5, y + Math.sin(a) * s * 0.5, s * 0.52, mix(dk(col, 0.1), lt(col, 0.45), lit));
    P.ctx.beginPath();
    P.ctx.arc(x + Math.cos(a) * s * 0.5, y + Math.sin(a) * s * 0.5, s * 0.5, a - 0.9, a + 0.9);
    P.ctx.strokeStyle = dk(col, 0.25);
    P.ctx.globalAlpha = 0.5;
    P.ctx.lineWidth = s * 0.04;
    P.ctx.stroke();
    P.ctx.globalAlpha = 1;
  }
  dab(P, x, y, s * 0.3, lt(col, 0.6));
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * TAU;
    line(P, x, y, x + Math.cos(a) * s * 0.28, y + Math.sin(a) * s * 0.28, "#d9a520", s * 0.03);
    dab(P, x + Math.cos(a) * s * 0.3, y + Math.sin(a) * s * 0.3, s * 0.05, "#f2c632");
  }
}

Object.assign(SPECIES, {
  rosa_inglese(P, cols) {
    roseBush(P);
    scatter(P, 5, 0.46, (x, y, i, r) => roseBloom(P, P.U(x), P.U(y), P.U(0.26), cols[0] ?? "#e88fb4", r, { full: true, outer: cols[1] ?? null }));
  },
  rosa_tea(P, cols) {
    roseBush(P, { R: 0.72, n: 80 });
    scatter(P, 4, 0.42, (x, y, i, r) => roseBloom(P, P.U(x), P.U(y), P.U(0.27), cols[0] ?? "#c0283a", r, { pointed: true, outer: cols[1] ?? null }));
  },
  rosa_antica(P, cols) {
    roseBush(P);
    scatter(P, 6, 0.5, (x, y, i, r) => roseBloom(P, P.U(x), P.U(y), P.U(0.22), cols[i % cols.length] ?? "#d9578a", r, { full: true }));
  },
  rosa_rampicante(P, cols) {
    // tralci arcuati con fiori sparsi lungo i rami (vista di un tratto di rampicante)
    const { U, rand } = P;
    for (let k = 0; k < 4; k++) {
      const a = -0.6 + k * 0.4;
      line(P, U(-0.8), U(0.6 - k * 0.2), U(0.85), U(-0.2 - k * 0.15), "#5a4a2a", U(0.03), 1, U(0), U(-0.6 + k * 0.2 + a * 0.1));
    }
    canopy(P, { R: 0.82, n: 120, len: 0.2, wid: 0.11, serrated: true, greens: ["#243f1b", "#3e6a2c", "#6e9447"], radial: false });
    for (let i = 0; i < 12; i++) {
      const x = -0.65 + rand() * 1.3, y = -0.55 + rand() * 1.1;
      if (x * x + y * y > 0.7) continue;
      roseBloom(P, U(x), U(y), U(0.15), cols[i % cols.length] ?? "#e88fb4", rand(), { full: true });
    }
  },
  rosa_paesaggistica(P, cols) {
    roseBush(P, { R: 0.8, n: 120 });
    const { U, rand } = P;
    for (let i = 0; i < 26; i++) {
      const a = rand() * TAU, d = Math.sqrt(rand()) * 0.68;
      smallRose(P, U(Math.cos(a) * d), U(Math.sin(a) * d), U(0.1), cols[i % cols.length] ?? "#e88fb4", rand() * 6);
    }
  },
  rosa_botanica(P, cols) {
    roseBush(P, { R: 0.78, n: 100 });
    const { U, rand } = P;
    scatter(P, 6, 0.55, (x, y, i, r) => wildRose(P, U(x), U(y), U(0.16), cols[i % cols.length] ?? "#d9578a", r * 6));
    for (let i = 0; i < 6; i++) {
      const a = rand() * TAU, d = 0.3 + rand() * 0.35;
      berry(P, U(Math.cos(a) * d), U(Math.sin(a) * d), U(0.05), "#d8401f");
    }
  },
  echinacea(P, cols) {
    const { U } = P;
    mass(P, 0.6, "#213b19");
    canopy(P, { R: 0.72, n: 70, len: 0.3, wid: 0.11, greens: GREENS });
    scatter(P, 6, 0.5, (x, y, i, r) => {
      const col = cols[i % cols.length] ?? "#c7609a", s = U(0.2);
      const cx = U(x), cy = U(y);
      // petali stretti e un po' ricadenti, punte più chiare
      for (let k = 0; k < 15; k++) {
        const a = (k / 15) * TAU + r * 6;
        const lit = (Math.cos(a - 3.9) + 1) / 2;
        stroke(P, cx + Math.cos(a) * s * 0.3, cy + Math.sin(a) * s * 0.3, a + 0.08, s * 0.95, s * 0.22, mix(dk(col, 0.2), lt(col, 0.3), lit), { bristles: 2, rib: true });
      }
      // cono arancio-bruno a spirale, con le punte accese
      const white = col === "#f4f1ea" || /f[0-9a-f]f/i.test(col.slice(1, 4));
      dab(P, cx + s * 0.04, cy + s * 0.05, s * 0.42, "#3a1e0c");
      dab(P, cx, cy, s * 0.38, white ? "#9a7a2a" : "#8a3e14");
      for (let k = 0; k < 60; k++) {
        const rr = Math.sqrt(k / 60) * s * 0.36, a = k * 2.399963;
        dab(P, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, s * 0.035, k % 2 ? "#e2852a" : white ? "#c9b04a" : "#c4521c");
      }
      dab(P, cx - s * 0.12, cy - s * 0.12, s * 0.08, "rgba(255,230,170,0.6)");
    });
  },
  lupino(P, cols) {
    const { U, rand, ctx } = P;
    // foglie palmate a ventaglio
    mass(P, 0.55, "#24401c");
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * TAU + rand() * 0.3, d = 0.25 + rand() * 0.3;
      const x = Math.cos(a) * d, y = Math.sin(a) * d;
      for (let k = 0; k < 9; k++) stroke(P, U(x), U(y), (k / 9) * TAU + a, U(0.15), U(0.05), shadeBy("#4f7d38", litAt(x, y), 0.4), { bristles: 0 });
      dab(P, U(x), U(y), U(0.015), "#2a4a20");
    }
    // spighe coniche viste un po' inclinate: salgono verso l'alto
    const spikes = [[-0.42, 0.42], [0.38, 0.45], [-0.05, 0.58], [-0.3, 0.1], [0.2, 0.12], [0.0, 0.28], [0.5, 0.0], [-0.55, -0.05]].sort((a, b) => a[1] - b[1]);
    spikes.forEach(([bx, by], i) => {
      const col = cols[i % cols.length] ?? "#6f6fd0", top = cols.length > 1 ? cols[(i + 1) % cols.length] : "#f4f1ea";
      const H = Math.min(0.42 + rand() * 0.15, by + 0.9), lean = (rand() - 0.5) * 0.15;
      for (let t = 0; t <= 1; t += 0.06) {
        const w = 0.075 * (1 - t * 0.8);
        const x = bx + lean * t, y = by - H * t;
        for (const sx of [-1, 1]) {
          const fx = U(x + sx * w * 0.6), fy = U(y);
          dab(P, fx + U(0.008), fy + U(0.01), U(w * 0.62), dk(col, 0.45));
          dab(P, fx, fy, U(w * 0.6), mix(col, lt(col, 0.3), sx < 0 ? 0.6 : 0));
          dab(P, fx - U(0.005), fy - U(w * 0.35), U(w * 0.3), mix(top, col, 0.25));
        }
      }
      dab(P, U(bx + lean), U(by - H - 0.02), U(0.02), "#7aa058");
    });
    ctx.globalAlpha = 1;
  },
  // ---------- siepi ----------
  photinia() {
    const P = arguments[0];
    const { U, rand } = P;
    mass(P, 0.8, "#1f3a1a");
    canopy(P, { R: 0.78, n: 150, len: 0.2, wid: 0.1, greens: ["#1f3a1a", "#2f5a26", "#4f7d38"], rib: true });
    // germogli rossi sulle punte esterne
    for (let i = 0; i < 70; i++) {
      const a = rand() * TAU, d = 0.45 + rand() * 0.35;
      const x = Math.cos(a) * d - 0.05, y = Math.sin(a) * d - 0.05;
      stroke(P, U(x), U(y), a + (rand() - 0.5), U(0.17), U(0.09), shadeBy(rand() < 0.5 ? "#c8323a" : "#e05a3a", litAt(x, y), 0.35), { rib: true });
    }
  },
  lauroceraso(P) {
    const { U, rand } = P;
    mass(P, 0.8, "#173016");
    for (let i = 0; i < 46; i++) {
      const a = rand() * TAU, d = Math.sqrt(rand()) * 0.62;
      const x = Math.cos(a) * d, y = Math.sin(a) * d;
      const ang = Math.atan2(y, x) + (rand() - 0.5) * 0.8;
      stroke(P, U(x), U(y), ang, U(0.34), U(0.13), shadeBy("#2a5424", litAt(x, y), 0.5), { rib: true, bristles: 1 });
      // riflesso lucido della foglia coriacea
      stroke(P, U(x + Math.cos(ang) * 0.06), U(y + Math.sin(ang) * 0.06), ang, U(0.16), U(0.03), "#cfe6b0", { alpha: 0.5, bristles: 0 });
    }
  },
  pittosporo(P) {
    const { U, rand } = P;
    mass(P, 0.8, "#2a4a22");
    // rosette di foglie ondulate verde chiaro, mazzetti di fiorellini bianchi
    for (let i = 0; i < 30; i++) {
      const a = rand() * TAU, d = Math.sqrt(rand()) * 0.65;
      const x = Math.cos(a) * d, y = Math.sin(a) * d;
      for (let k = 0; k < 6; k++) stroke(P, U(x), U(y), (k / 6) * TAU + rand(), U(0.14), U(0.07), shadeBy("#6f9a4a", litAt(x, y), 0.45), { rib: true, bristles: 1 });
      if (i % 3 === 0) for (let k = 0; k < 5; k++) fivePetal(P, U(x + (rand() - 0.5) * 0.06), U(y + (rand() - 0.5) * 0.06), U(0.022), "#f6f0dc", rand() * 6, "#f2d36a");
    }
  },
  tasso(P) {
    const { U, rand } = P;
    mass(P, 0.8, "#142a14");
    for (let i = 0; i < 900; i++) {
      const a = rand() * TAU, d = Math.sqrt(rand()) * 0.78;
      const x = Math.cos(a) * d, y = Math.sin(a) * d;
      const b = rand() * TAU;
      line(P, U(x), U(y), U(x + Math.cos(b) * 0.05), U(y + Math.sin(b) * 0.05), shadeBy("#2a4a26", litAt(x, y), 0.55), U(0.012));
    }
    for (let i = 0; i < 10; i++) {
      const a = rand() * TAU, d = Math.sqrt(rand()) * 0.65;
      berry(P, U(Math.cos(a) * d), U(Math.sin(a) * d), U(0.025), "#d02a2a");
    }
  },
  alloro(P) {
    const { U, rand } = P;
    mass(P, 0.8, "#1f381a");
    canopy(P, { R: 0.78, n: 170, len: 0.22, wid: 0.085, greens: ["#223e1c", "#3a6029", "#6a8f45"], rib: true });
    for (let i = 0; i < 18; i++) {
      const a = rand() * TAU, d = Math.sqrt(rand()) * 0.6;
      dab(P, U(Math.cos(a) * d), U(Math.sin(a) * d), U(0.025), "#e9e0a8", 0.9);
    }
  },
  viburno(P, cols) {
    const { U, rand } = P;
    mass(P, 0.8, "#1f381a");
    canopy(P, { R: 0.78, n: 110, len: 0.24, wid: 0.15, greens: GREENS, rib: true });
    const col = cols[0] ?? "#f4f1ea";
    for (let i = 0; i < 9; i++) {
      const a = rand() * TAU, d = Math.sqrt(rand()) * 0.6, x = U(Math.cos(a) * d), y = U(Math.sin(a) * d), s = U(0.11);
      dab(P, x + s * 0.15, y + s * 0.2, s, "rgba(30,40,20,0.5)");
      for (let k = 0; k < 16; k++) {
        const b = rand() * TAU, e = Math.sqrt(rand()) * s * 0.8;
        fivePetal(P, x + Math.cos(b) * e, y + Math.sin(b) * e, s * 0.22, shadeBy(col, 1 - e / s, 0.25), rand() * 6, lt(col, 0.6));
      }
    }
  },
});

// regole specie aggiuntive (in testa: le più specifiche)
SPECIES_RULES.unshift(
  ["rosa_inglese", /rosa inglese|david austin/],
  ["rosa_rampicante", /rampicant|sarmentos|banks|climbing/],
  ["rosa_botanica", /rugosa|glauca|moyesii|canina|rosa botanica|spinosissima/],
  ["rosa_antica", /bourbon|portland|damascena|centifolia|rosa alba|gallica|provins|rosa cinese|moscata/],
  ["rosa_paesaggistica", /paesaggistic|the fairy|tappezzant|polyantha|floribunda|meidiland/],
  ["rosa_tea", /ibrid[oa] di tea|hybrid tea|rosa tea/],
  ["echinacea", /echinac/],
  ["lupino", /lupin/],
  ["photinia", /photinia|fotinia/],
  ["lauroceraso", /lauroceras|laurocerasus/],
  ["pittosporo", /pittospor/],
  ["tasso", /\btaxus\b|\btasso\b/],
  ["alloro", /\blaurus\b|alloro/],
  ["viburno", /viburn|palla di neve/],
);
SPECIES_RULES.unshift(["zucca", /\bzucca\b|cucurbita maxima|cucurbita moschata/], ["anguria", /angur|cocomer|citrullus/], ["melone", /melone|cucumis melo/], ["cetriolo", /cetriol|cucumis sativus/], ["cipolla", /cipoll|allium cepa|\baglio\b|allium sativum|scalogn/]);

// =====================================================================
// SPESSORE DELLA TEMPERA (impasto): il colore steso spesso fa rilievo.
// Si ricava una "mappa delle altezze" dalla luminosità delle pennellate e
// la si illumina da in alto a sinistra: ogni bordo di pennellata prende
// una luce e un'ombra, come la pittura vera vista di sbieco.
// =====================================================================
export function impasto(ctx, size, strength = 1.0) {
  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data, n = size * size;
  // altezza = luminosità; poi si tiene solo il dettaglio fine (passa-alto),
  // così rilievano le setole e i bordi delle pennellate, non le forme intere
  const h = new Float32Array(n);
  for (let i = 0; i < n; i++) h[i] = (0.3 * d[i * 4] + 0.59 * d[i * 4 + 1] + 0.11 * d[i * 4 + 2]) / 255;
  const r = Math.max(2, Math.round(size / 60));
  // sfocatura a box (orizzontale + verticale) per la parte "larga"
  const tmp = new Float32Array(n), low = new Float32Array(n);
  for (let y = 0; y < size; y++) {
    let acc = 0;
    for (let x = -r; x <= r; x++) acc += h[y * size + Math.min(size - 1, Math.max(0, x))];
    for (let x = 0; x < size; x++) {
      tmp[y * size + x] = acc / (2 * r + 1);
      acc += h[y * size + Math.min(size - 1, x + r + 1)] - h[y * size + Math.max(0, x - r)];
    }
  }
  for (let x = 0; x < size; x++) {
    let acc = 0;
    for (let y = -r; y <= r; y++) acc += tmp[Math.min(size - 1, Math.max(0, y)) * size + x];
    for (let y = 0; y < size; y++) {
      low[y * size + x] = acc / (2 * r + 1);
      acc += tmp[Math.min(size - 1, y + r + 1) * size + x] - tmp[Math.max(0, y - r) * size + x];
    }
  }
  const hp = new Float32Array(n);
  for (let i = 0; i < n; i++) hp[i] = h[i] - low[i];
  const o = 1;
  for (let y = o; y < size - o; y++)
    for (let x = o; x < size - o; x++) {
      const i = y * size + x;
      const a = d[i * 4 + 3];
      if (a < 250) continue; // niente alone sui bordi
      const k = (hp[i - o * size - o] - hp[i + o * size + o]) * strength * 255;
      d[i * 4] = Math.max(0, Math.min(255, d[i * 4] + k));
      d[i * 4 + 1] = Math.max(0, Math.min(255, d[i * 4 + 1] + k));
      d[i * 4 + 2] = Math.max(0, Math.min(255, d[i * 4 + 2] + k * 0.85));
    }
  ctx.putImageData(img, 0, 0);
}

// Pennellata "carica": tanti filamenti paralleli di tonalità diverse, così
// lo spessore mostra i segni delle setole.
function loaded(P, x, y, ang, len, wid, color, { taper = true, curve = 0 } = {}) {
  const { ctx, rand } = P;
  const n = Math.max(3, Math.round(wid / 1.6));
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.lineCap = "round";
  for (let k = 0; k < n; k++) {
    const off = ((k + 0.5) / n - 0.5) * wid;
    const w = taper ? 1 - Math.abs(off / wid) * 0.6 : 1;
    ctx.beginPath();
    ctx.moveTo(0, off * 0.6);
    ctx.quadraticCurveTo(len * 0.5, off + curve * len, len * w, off * 0.4 + curve * len * 0.5);
    const t = rand();
    ctx.strokeStyle = t < 0.33 ? lt(color, 0.12 + rand() * 0.1) : t < 0.66 ? dk(color, 0.08 + rand() * 0.12) : color;
    ctx.lineWidth = (wid / n) * 1.9;
    ctx.stroke();
  }
  ctx.restore();
}

// Foglia di cucurbitacea dipinta: forma lobata piena + pennellate cariche
// che seguono le nervature.
function squashLeaf(P, x, y, ang, len, base) {
  const { U } = P;
  const L = U(len);
  bigLeaf(P, U(x), U(y), ang, L, L * 0.75, base, { lobed: true, veins: 0, vein: lt(base, 0.35) });
  P.ctx.save();
  P.ctx.globalAlpha = 0.9;
  P.ctx.strokeStyle = dk(base, 0.5);
  P.ctx.lineWidth = Math.max(0.8, L * 0.03);
  P.ctx.stroke();
  P.ctx.restore();
  for (let k = -2; k <= 2; k++) {
    const a = ang + k * 0.45;
    loaded(P, U(x), U(y), a, L * (0.75 - Math.abs(k) * 0.08), L * 0.16, shadeBy(base, litAt(x + Math.cos(a) * len * 0.4, y + Math.sin(a) * len * 0.4), 0.35));
    P.ctx.globalAlpha = 0.8;
    line(P, U(x), U(y), U(x) + Math.cos(a) * L * 0.7, U(y) + Math.sin(a) * L * 0.7, lt(base, 0.4), L * 0.025);
    P.ctx.globalAlpha = 1;
  }
}

// Fusto che si snoda con i viticci a ricciolo.
function vine(P, pts, tendrils = 3) {
  const { U, ctx, rand } = P;
  ctx.beginPath();
  ctx.moveTo(U(pts[0][0]), U(pts[0][1]));
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
    ctx.quadraticCurveTo(U(pts[i][0]), U(pts[i][1]), U(mx), U(my));
  }
  const last = pts[pts.length - 1];
  ctx.lineTo(U(last[0]), U(last[1]));
  ctx.strokeStyle = "#3d5e26";
  ctx.lineWidth = U(0.045);
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.strokeStyle = "#7da04c";
  ctx.lineWidth = U(0.02);
  ctx.stroke();
  for (let t = 0; t < tendrils; t++) {
    const i = 1 + Math.floor(rand() * (pts.length - 2));
    const [px, py] = pts[i];
    const dir = rand() < 0.5 ? -1 : 1;
    const ox = px + (rand() - 0.5) * 0.12, oy = py + (dir * 0.1);
    line(P, U(px), U(py), U(ox), U(oy), "#6f9a3f", U(0.012));
    tendril(P, U(ox), U(oy), U(0.06 + rand() * 0.03), 2.3, "#6f9a3f", dir);
  }
}

// ---------- cucurbitacee dall'alto: frutto a destra, pianta a sinistra ----------

function plantCluster(P, cx, cy, n, base, R = 0.38) {
  const { rand, U, ctx } = P;
  mass(P, R * 0.5, dk(base, 0.45), { cx, cy, lobes: 5 });
  const leaves = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rand() * 0.5;
    leaves.push({ a, d: R * (0.35 + rand() * 0.25), s: R * (0.55 + rand() * 0.2), c: mix(base, rand() < 0.5 ? lt(base, 0.18) : dk(base, 0.18), rand()) });
  }
  // prima i piccioli, poi le foglie dalla più lontana alla più vicina alla luce
  for (const L of leaves) line(P, U(cx), U(cy), U(cx + Math.cos(L.a) * L.d), U(cy + Math.sin(L.a) * L.d), "#5f8a3a", U(0.02));
  leaves.sort((p, q) => litAt(Math.cos(p.a), Math.sin(p.a)) - litAt(Math.cos(q.a), Math.sin(q.a)));
  for (const L of leaves) {
    const x = cx + Math.cos(L.a) * L.d, y = cy + Math.sin(L.a) * L.d;
    // ombra della foglia sotto
    ctx.save();
    ctx.globalAlpha = 0.35;
    dab(P, U(x + 0.03), U(y + 0.04), U(L.s * 0.55), "#1a2a10");
    ctx.restore();
    squashLeaf(P, x - Math.cos(L.a) * L.s * 0.35, y - Math.sin(L.a) * L.s * 0.35, L.a, L.s, L.c);
  }
  // foglia giovane al centro
  squashLeaf(P, cx - 0.05, cy - 0.05, -2.3, R * 0.45, lt(base, 0.15));
}

const CUCURBITS = {
  zucca(P) {
    const { U, ctx, rand } = P;
    // pianta a sinistra
    plantCluster(P, -0.5, -0.32, 7, "#3f7a2e", 0.42);
    starBloom(P, U(-0.72), U(-0.05), U(0.1), "#f2b632", 5, 0.4, "#d9821c");
    // zucca a destra, vista dall'alto: spicchi che partono dal picciolo
    const cx = U(0.36), cy = U(0.28), R = U(0.46);
    vine(P, [[-0.42, -0.25], [-0.25, 0.1], [0.0, -0.08], [0.18, 0.1], [0.34, 0.16]], 3);
    ctx.save();
    ctx.filter = `blur(${R * 0.06}px)`;
    dab(P, cx + R * 0.1, cy + R * 0.12, R * 1.02, "#2a1a0c", 0.55);
    ctx.restore();
    const ribs = 11;
    for (let k = 0; k < ribs; k++) {
      const a0 = (k / ribs) * TAU, a1 = ((k + 1) / ribs) * TAU, am = (a0 + a1) / 2;
      const lit = (Math.cos(am - 3.9) + 1) / 2;
      const col = mix(mix("#e0761c", "#f2a03a", rand() * 0.4), lit > 0.5 ? "#f6b04a" : "#a8480e", Math.abs(lit - 0.5) * 1.1);
      // spicchio bombato
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      for (let t = 0; t <= 1.0001; t += 0.1) {
        const a = a0 + (a1 - a0) * t;
        const r = R * (0.93 + Math.sin(t * Math.PI) * 0.09);
        ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fillStyle = col;
      ctx.fill();
      // pennellate cariche dal centro verso il bordo, seguendo lo spicchio
      for (let s = 0; s < 4; s++) {
        const a = a0 + (a1 - a0) * (0.2 + s * 0.2);
        loaded(P, cx + Math.cos(a) * R * 0.15, cy + Math.sin(a) * R * 0.15, a, R * 0.8, R * 0.11, col, { curve: (s - 1.5) * 0.04 });
      }
    }
    // solchi tra gli spicchi
    for (let k = 0; k < ribs; k++) {
      const a = (k / ribs) * TAU;
      line(P, cx + Math.cos(a) * R * 0.12, cy + Math.sin(a) * R * 0.12, cx + Math.cos(a) * R * 0.97, cy + Math.sin(a) * R * 0.97, "#7a3008", R * 0.04, 0.85, cx + Math.cos(a + 0.08) * R * 0.6, cy + Math.sin(a + 0.08) * R * 0.6);
    }
    // picciolo legnoso al centro, verso il fusto
    dab(P, cx, cy, R * 0.16, "#5a4a22");
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * TAU;
      line(P, cx, cy, cx + Math.cos(a) * R * 0.15, cy + Math.sin(a) * R * 0.15, k % 2 ? "#8a7a42" : "#3e3216", R * 0.04);
    }
    dab(P, cx - R * 0.03, cy - R * 0.03, R * 0.07, "#a8985a");
    loaded(P, cx, cy, Math.atan2(-0.12, -0.16), R * 0.32, R * 0.1, "#6a7a3a");
  },
  anguria(P) {
    const { U, ctx, rand } = P;
    // pianta in alto a sinistra: foglie grigio-verdi profondamente incise
    mass(P, 0.22, "#24391f", { cx: -0.5, cy: -0.42, lobes: 5 });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + rand() * 0.4, x = -0.5, y = -0.42;
      const L = 0.36 + rand() * 0.08;
      line(P, U(x), U(y), U(x + Math.cos(a) * 0.12), U(y + Math.sin(a) * 0.12), "#5f8a3a", U(0.018));
      const fx = x + Math.cos(a) * 0.1, fy = y + Math.sin(a) * 0.1;
      // tre lobi principali, ognuno seghettato
      for (const o of [-0.7, 0, 0.7]) {
        stroke(P, U(fx), U(fy), a + o, U(L * (o ? 0.75 : 1)), U(0.12), shadeBy("#6a9466", litAt(fx, fy), 0.4), { serrated: true, rib: true });
      }
      P.ctx.globalAlpha = 0.5;
      line(P, U(fx), U(fy), U(fx + Math.cos(a) * L * 0.9), U(fy + Math.sin(a) * L * 0.9), "#d6e6c8", U(0.01));
      P.ctx.globalAlpha = 1;
    }
    starBloom(P, U(-0.12), U(-0.66), U(0.08), "#f2c632", 5, 0.3, "#d9921c");
    vine(P, [[-0.42, -0.3], [-0.25, -0.05], [-0.05, -0.14], [0.1, 0.05], [0.18, 0.1]], 3);
    // anguria ovale dall'alto, in basso a destra
    const cx = U(0.36), cy = U(0.36), rx = U(0.52), ry = U(0.36), rot = -0.55;
    ctx.save();
    ctx.filter = `blur(${rx * 0.05}px)`;
    ctx.beginPath();
    ctx.ellipse(cx + rx * 0.08, cy + ry * 0.14, rx, ry, rot, 0, TAU);
    ctx.fillStyle = "rgba(30,20,10,0.5)";
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, TAU);
    ctx.fillStyle = "#86b45a";
    ctx.fill();
    ctx.clip();
    for (let k = 0; k < 12; k++) loaded(P, -rx * 1.05, (k / 11 - 0.5) * ry * 2, 0, rx * 2.1, ry * 0.2, mix("#8fbc62", "#6f9e48", rand()), { taper: false });
    // bande scure frastagliate dal picciolo alla punta (lungo l'asse lungo)
    for (let k = -3; k <= 3; k++) {
      const yy = k * ry * 0.29;
      for (let t = -1.05; t < 1.05; t += 0.07) {
        const x = t * rx, y = yy * Math.sqrt(Math.max(0, 1 - t * t * 0.55)) + Math.sin(t * 14 + k * 2) * ry * 0.035;
        loaded(P, x, y - ry * 0.07, 0.15 * Math.cos(t * 14 + k), rx * 0.11, ry * 0.12, k % 2 ? "#1f4a1c" : "#24521f", { taper: false });
      }
    }
    // zona più chiara dove poggia a terra
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.ellipse(rx * 0.25, ry * 0.55, rx * 0.4, ry * 0.25, 0, 0, TAU);
    ctx.fillStyle = "#d8cf88";
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, rot, 0, TAU);
    ctx.strokeStyle = "#1c3a16";
    ctx.lineWidth = U(0.018);
    ctx.stroke();
    // picciolo verso il fusto
    line(P, cx - rx * 0.86 * Math.cos(rot), cy - rx * 0.86 * Math.sin(rot), U(0.18), U(0.1), "#4a6a2a", U(0.03));
  },
  melone(P) {
    const { U, ctx, rand } = P;
    // pianta a sinistra con foglie tondeggianti
    plantCluster(P, -0.48, 0.05, 8, "#4a7a32", 0.4);
    for (let i = 0; i < 3; i++) starBloom(P, U(-0.75 + rand() * 0.4), U(-0.35 + rand() * 0.7), U(0.07), "#f2c632", 5, rand() * 6, "#d9921c");
    vine(P, [[-0.35, 0.0], [-0.12, -0.32], [0.1, -0.42], [0.28, -0.3]], 2);
    vine(P, [[-0.32, 0.12], [-0.1, 0.4], [0.12, 0.5]], 2);
    const melon = (mx, my, R, rot) => {
      const cx = U(mx), cy = U(my), r = U(R);
      ctx.save();
      ctx.filter = `blur(${r * 0.06}px)`;
      dab(P, cx + r * 0.1, cy + r * 0.12, r * 1.02, "#2a1a0c", 0.55);
      ctx.restore();
      // buccia: pennellate cariche che girano attorno al frutto
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, TAU);
      ctx.fillStyle = "#b3a960";
      ctx.fill();
      ctx.clip();
      // ombra propria in basso a destra e luce in alto a sinistra
      for (let k = 0; k < 18; k++) {
        const a = 0.785 + (k / 18 - 0.5) * 2.4;
        loaded(P, cx + Math.cos(a) * r * 0.62, cy + Math.sin(a) * r * 0.62, a + Math.PI / 2, r * 0.6, r * 0.22, "#6f6a34");
        loaded(P, cx - Math.cos(a) * r * 0.55, cy - Math.sin(a) * r * 0.55, a + Math.PI / 2, r * 0.5, r * 0.18, "#d8d08e");
      }
      for (let k = 0; k < 40; k++) {
        const a = rand() * TAU, d = r * Math.sqrt(rand());
        const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
        const lit = litAt((x - cx) / r, (y - cy) / r);
        loaded(P, x, y, a + Math.PI / 2, r * 0.45, r * 0.12, mix("#a8955a", lit > 0.5 ? "#d9cb8a" : "#7a6a36", Math.abs(lit - 0.5) * 1.4));
      }
      // spicchi appena accennati
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * TAU + rot;
        ctx.globalAlpha = 0.3;
        line(P, cx + Math.cos(a) * r * 0.2, cy + Math.sin(a) * r * 0.2, cx + Math.cos(a) * r, cy + Math.sin(a) * r, "#6f7a3a", r * 0.05, 0.3, cx + Math.cos(a + 0.12) * r * 0.6, cy + Math.sin(a + 0.12) * r * 0.6);
        ctx.globalAlpha = 1;
      }
      // retina fitta in rilievo
      ctx.strokeStyle = "#f2e6bc";
      ctx.globalAlpha = 0.9;
      ctx.lineWidth = Math.max(0.7, r * 0.026);
      ctx.lineCap = "round";
      for (let i = 0; i < 160; i++) {
        const a = rand() * TAU, d = r * Math.sqrt(rand());
        let px = cx + Math.cos(a) * d, py = cy + Math.sin(a) * d;
        ctx.beginPath();
        ctx.moveTo(px, py);
        for (let s2 = 0; s2 < 3; s2++) {
          px += (rand() - 0.5) * r * 0.14;
          py += (rand() - 0.5) * r * 0.14;
          ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      ctx.restore();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, TAU);
      ctx.strokeStyle = "#5a4a20";
      ctx.lineWidth = Math.max(0.8, r * 0.03);
      ctx.stroke();
      dab(P, cx, cy, r * 0.09, "#6a5a2a");
      dab(P, cx - r * 0.02, cy - r * 0.02, r * 0.045, "#9a8a4a");
    };
    melon(0.4, 0.12, 0.4, 0.2);
    melon(0.32, 0.68, 0.22, 1.1);
  },
};
// cetrioli adagiati a destra, pianta a sinistra, legati dal fusto
CUCURBITS.cetriolo = function cetriolo(P) {
  const { U, ctx, rand } = P;
  plantCluster(P, -0.5, -0.3, 7, "#3f7a2e", 0.4);
  starBloom(P, U(-0.75), U(0.05), U(0.08), "#f2c632", 5, 0.2, "#d9921c");
  vine(P, [[-0.4, -0.2], [-0.2, 0.05], [0.0, -0.05], [0.15, 0.12]], 3);
  const cuke = (x, y, ang, len, wid) => {
    ctx.save();
    ctx.translate(U(x), U(y));
    ctx.rotate(ang);
    const L = U(len), W = U(wid);
    ctx.save();
    ctx.filter = `blur(${W * 0.15}px)`;
    ctx.beginPath();
    ctx.roundRect(-L / 2 + W * 0.15, -W / 2 + W * 0.25, L, W, W / 2);
    ctx.fillStyle = "rgba(25,15,8,0.5)";
    ctx.fill();
    ctx.restore();
    ctx.beginPath();
    ctx.roundRect(-L / 2, -W / 2, L, W, W / 2);
    ctx.fillStyle = "#3f7a2e";
    ctx.fill();
    ctx.save();
    ctx.clip();
    // bande dipinte: chiaro sul lato in luce, scuro sotto
    for (let k = 0; k < 6; k++) {
      const off = (k / 5 - 0.5) * W * 0.9;
      const c = k < 2 ? "#7aa84e" : k < 4 ? "#3f7a2e" : "#244e1c";
      loaded(P, -L / 2, off, 0, L, W * 0.22, c, { taper: false });
    }
    // strisce chiare verso la punta
    for (const o of [-0.18, 0.12]) loaded(P, -L * 0.05, o * W, 0, L * 0.5, W * 0.08, "#a9c98a", { taper: false });
    // bitorzoli: piccoli grumi chiari con la punta scura
    for (let i = 0; i < 14; i++) {
      const px = (rand() - 0.5) * L * 0.85, py = (rand() - 0.5) * W * 0.7;
      dab(P, px, py, W * 0.055, "#9cc276");
      dab(P, px + W * 0.02, py + W * 0.02, W * 0.022, "#1f3a16");
    }
    ctx.restore();
    ctx.strokeStyle = "#1c3a16";
    ctx.lineWidth = Math.max(0.8, W * 0.05);
    ctx.stroke();
    // fiore secco sulla punta, picciolo dall'altra parte
    starBloom(P, L / 2 + W * 0.08, 0, W * 0.4, "#e8b832", 5, 0.4, "#c98a1c");
    loaded(P, -L / 2 - W * 0.25, 0, 0, W * 0.3, W * 0.2, "#5a7a32");
    ctx.restore();
  };
  cuke(0.42, 0.12, -0.5, 0.62, 0.17);
  cuke(0.3, 0.48, 0.15, 0.56, 0.16);
  cuke(0.62, 0.42, -1.3, 0.4, 0.13);
};

// cipolla vista dall'alto: bulbo che spunta dalla terra, foglie a tubo a raggiera
CUCURBITS.cipolla = function cipolla(P, cols, name = "") {
  const { U, rand } = P;
  const red = /ross|tropea/.test(name), garlic = /agli/.test(name);
  const bulb = red ? "#8a2f5a" : garlic ? "#ece6d8" : "#c98a3a";
  const leafC = garlic ? "#6f9a6a" : "#5f9a4a";
  // terra smossa attorno
  mass(P, 0.32, "#4a3220");
  for (let i = 0; i < 30; i++) {
    const a = rand() * TAU, d = 0.18 + rand() * 0.15;
    loaded(P, U(Math.cos(a) * d), U(Math.sin(a) * d), rand() * TAU, U(0.06), U(0.035), rand() < 0.5 ? "#6b4a2e" : "#3e2a18");
  }
  // bulbo: cupola dipinta a spicchi di buccia
  dab(P, U(0.04), U(0.05), U(0.24), "rgba(20,12,6,0.6)");
  dab(P, 0, 0, U(0.22), bulb);
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * TAU;
    const lit = (Math.cos(a - 3.9) + 1) / 2;
    loaded(P, 0, 0, a, U(0.21), U(0.09), mix(dk(bulb, 0.2), lt(bulb, 0.3), lit));
  }
  if (garlic) for (let k = 0; k < 6; k++) line(P, 0, 0, U(Math.cos(k) * 0.2), U(Math.sin(k) * 0.2), "#a87aa0", U(0.012), 0.6);
  // foglie: tubi spessi che salgono e si piegano verso l'esterno
  const n = garlic ? 8 : 7;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rand() * 0.4 + 0.3, len = 0.62 + rand() * 0.25;
    const bend = (rand() - 0.5) * 0.7;
    const x2 = Math.cos(a + bend) * len, y2 = Math.sin(a + bend) * len;
    const cx = Math.cos(a) * len * 0.55, cy = Math.sin(a) * len * 0.55;
    line(P, 0, 0, U(x2), U(y2), dk(leafC, 0.45), U(garlic ? 0.085 : 0.075), 1, U(cx), U(cy));
    line(P, 0, 0, U(x2), U(y2), shadeBy(leafC, litAt(cx, cy), 0.35), U(garlic ? 0.06 : 0.052), 1, U(cx), U(cy));
    line(P, U(-0.01), U(-0.01), U(x2 * 0.92 - 0.01), U(y2 * 0.92 - 0.01), lt(leafC, 0.4), U(0.014), 0.8, U(cx - 0.01), U(cy - 0.01));
    dab(P, U(x2), U(y2), U(0.03), lt(leafC, 0.2));
  }
  // colletto da cui escono le foglie
  dab(P, 0, 0, U(0.06), dk(leafC, 0.3));
  dab(P, U(-0.01), U(-0.01), U(0.035), lt(leafC, 0.2));
};

Object.assign(SPECIES, CUCURBITS);

// Icona completa: disegno + spessore della tempera.
export function paintTemperaIcon(ctx, size, opts) {
  paintTempera(ctx, size, opts);
  impasto(ctx, size, opts.relief ?? 0.85);
}


// Pennelli condivisi con prato, coperture e bordure.
export { loaded, dab, line, rng, lt as lighten, dk as darken };
