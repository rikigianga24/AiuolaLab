// Texture ripetibili generate su canvas: prato e pacciamatura di corteccia.
// Ogni elemento viene disegnato anche sui bordi opposti, così la piastrella
// si ripete senza giunture visibili.

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
