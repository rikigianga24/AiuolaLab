import { useEffect, useRef } from "react";
import { getIconCanvas } from "../../lib/plantIcons";
import { useInView } from "../../lib/photos";
import { lawnTexture, surfaceTexture } from "../../lib/textures";
import { stylePhoto } from "../../lib/stylePhotos";

// Piante che compaiono nella scena di ogni stile: [tipo, colori, nome].
const SCENE_PLANTS = {
  cottage: [["rose", ["#e88fb4"], "Rosa inglese"], ["spike", ["#9b6fc4"], "Lavanda"], ["spike", ["#e88fb4"], "Digitale"], ["spike", ["#5b8fd9", "#f4f1ea"], "Lupino"], ["flower", ["#8fb6e8"], "Campanula"], ["rose", ["#f4f1ea"], "Peonia"], ["groundcover", ["#f2e27a"], "Alchemilla"]],
  italiano: [["spike", ["#9b6fc4"], "Lavanda"], ["rose", ["#e88fb4"], "Rosa"]],
  francese: [["cup", ["#d64545"], "Tulipano"], ["cup", ["#f2c94c"], "Tulipano giallo"]],
  giapponese: [["foliage", [], "Heuchera"], ["shrub", ["#e88fb4"], "Azalea"], ["foliage", [], "Felce"], ["foliage", [], "Hosta"], ["grass", [], "Ophiopogon"]],
  mediterraneo: [["spike", ["#9b6fc4"], "Lavanda"], ["shrub", [], "Rosmarino"], ["spike", ["#5b8fd9"], "Salvia"], ["groundcover", ["#f2c94c"], "Santolina"], ["grass", [], "Stipa"], ["flower", ["#e88fb4"], "Cisto"]],
  moderno: [["grass", [], "Pennisetum"], ["shrub", [], "Bosso"], ["spike", ["#9b6fc4"], "Lavanda"], ["cluster", ["#9b6fc4"], "Allium"]],
  geometrico: [["groundcover", ["#e88fb4"], "Timo"], ["spike", ["#9b6fc4"], "Lavanda"], ["daisy", ["#f2994a"], "Calendula"], ["leafy", [], "Lattuga"], ["spike", ["#5b8fd9"], "Salvia"], ["groundcover", ["#f2c94c"], "Santolina"]],
  naturalistico: [["daisy", ["#c7609a"], "Echinacea"], ["daisy", ["#f2c94c"], "Rudbeckia"], ["spike", ["#8fb6e8"], "Perovskia"], ["grass", [], "Pennisetum"], ["cluster", ["#f2e27a"], "Achillea"], ["spike", ["#9b6fc4"], "Verbena"]],
  roccioso: [["cluster", ["#e88fb4"], "Sedum"], ["groundcover", ["#9b6fc4"], "Aubrieta"], ["groundcover", ["#e88fb4"], "Phlox"], ["grass", [], "Festuca"], ["groundcover", ["#f4f1ea"], "Iberis"]],
  ombra: [["foliage", [], "Hosta"], ["foliage", [], "Felce"], ["foliage", [], "Heuchera"], ["flower", ["#f4f1ea"], "Elleboro"], ["spike", ["#e88fb4"], "Astilbe"], ["cluster", ["#8fb6e8"], "Ortensia"]],
  impollinatori: [["spike", ["#9b6fc4"], "Lavanda"], ["daisy", ["#c7609a"], "Echinacea"], ["spike", ["#5b8fd9"], "Nepeta"], ["cluster", ["#f2e27a"], "Achillea"], ["daisy", ["#f2c94c"], "Girasole"], ["spike", ["#c7609a"], "Agastache"]],
};

function rng(seed) {
  let s = 0;
  for (const ch of seed) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function fillGround(ctx, W, H, kind) {
  const img = kind === "lawn" ? lawnTexture() : surfaceTexture(kind).image;
  ctx.save();
  ctx.fillStyle = ctx.createPattern(img, "repeat");
  ctx.scale(0.55, 0.55);
  ctx.fillRect(0, 0, W / 0.55, H / 0.55);
  ctx.restore();
}

function plant(ctx, [type, colors, name], x, y, size) {
  ctx.drawImage(getIconCanvas(type, colors, Math.round(size * 1.6), name), x - size * 0.8, y - size * 0.8, size * 1.6, size * 1.6);
}

function stone(ctx, x, y, rx, ry) {
  ctx.save();
  ctx.fillStyle = "rgba(25,18,10,0.45)";
  ctx.beginPath();
  ctx.ellipse(x + rx * 0.15, y + ry * 0.25, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  const g = ["#8d8a84", "#a7a39b", "#77736c"];
  ctx.fillStyle = g[Math.floor((x + y) % 3)];
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,250,235,0.35)";
  ctx.beginPath();
  ctx.ellipse(x - rx * 0.3, y - ry * 0.35, rx * 0.45, ry * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Siepe bassa di bosso lungo un tratto.
function hedge(ctx, x1, y1, x2, y2, step = 15) {
  const n = Math.max(1, Math.round(Math.hypot(x2 - x1, y2 - y1) / step));
  for (let i = 0; i <= n; i++) plant(ctx, ["shrub", [], "Bosso"], x1 + ((x2 - x1) * i) / n, y1 + ((y2 - y1) * i) / n, step * 1.05);
}

const LAYOUTS = {
  drifts(ctx, W, H, plants, rand, { loose = false } = {}) {
    const spots = [];
    const cols = loose ? 6 : 8, rows = loose ? 3 : 4;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) spots.push([((c + 0.5 + (rand() - 0.5) * 0.6) / cols) * W, ((r + 0.5 + (rand() - 0.5) * 0.6) / rows) * H]);
    // gruppi: piante vicine sono della stessa specie
    spots.sort((a, b) => a[1] - b[1]);
    spots.forEach(([x, y]) => {
      const k = Math.floor(((x / W) * 2.2 + (y / H) * 1.3 + rand() * 0.8) * plants.length) % plants.length;
      plant(ctx, plants[k], x, y, (loose ? 38 : 42) * (0.85 + rand() * 0.3));
    });
    if (loose) for (let i = 0; i < 4; i++) stone(ctx, rand() * W, rand() * H, 9 + rand() * 7, 6 + rand() * 4);
  },
  formal(ctx, W, H, plants) {
    const m = 14, gap = 22, cw = (W - m * 2 - gap) / 2, ch = (H - m * 2 - gap) / 2;
    for (const [qx, qy] of [
      [m, m],
      [m + cw + gap, m],
      [m, m + ch + gap],
      [m + cw + gap, m + ch + gap],
    ]) {
      ctx.fillStyle = "rgba(90,64,40,0.85)";
      ctx.fillRect(qx, qy, cw, ch);
      for (let i = 0; i < 3; i++) plant(ctx, plants[i % plants.length], qx + cw * (0.25 + i * 0.25), qy + ch / 2, 30);
      hedge(ctx, qx, qy, qx + cw, qy);
      hedge(ctx, qx, qy + ch, qx + cw, qy + ch);
      hedge(ctx, qx, qy, qx, qy + ch);
      hedge(ctx, qx + cw, qy, qx + cw, qy + ch);
    }
    // centro: vaso con agrume
    ctx.fillStyle = "#b8613f";
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 22, 0, Math.PI * 2);
    ctx.fill();
    plant(ctx, ["shrub", ["#f2c94c"], "Limone"], W / 2, H / 2, 34);
  },
  broderie(ctx, W, H, plants) {
    // ricami di bosso simmetrici su due ghiaie
    ctx.fillStyle = "rgba(196,120,80,0.35)";
    ctx.fillRect(0, 0, W, H);
    for (const side of [-1, 1]) {
      for (const amp of [0.22, 0.34]) {
        let px = null, py = null;
        for (let t = 0; t <= 1.0001; t += 0.05) {
          const x = W / 2 + side * (12 + t * (W / 2 - 26));
          const y = H / 2 + Math.sin(t * Math.PI * 2.5) * H * amp;
          if (px != null) hedge(ctx, px, py, x, y, 12);
          px = x;
          py = y;
        }
      }
    }
    for (let i = 0; i < 8; i++) {
      plant(ctx, plants[i % 2], W * (0.12 + (i % 4) * 0.25), H * (i < 4 ? 0.2 : 0.8), 26);
    }
    plant(ctx, ["shrub", [], "Tasso"], W / 2, H / 2, 40);
  },
  grid(ctx, W, H, plants) {
    const cols = 3, rows = 2, m = 10, gap = 14;
    const cw = (W - m * 2 - gap * (cols - 1)) / cols, ch = (H - m * 2 - gap * (rows - 1)) / rows;
    let k = 0;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const x = m + c * (cw + gap), y = m + r * (ch + gap);
        const p = plants[k++ % plants.length];
        for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) plant(ctx, p, x + cw * (0.28 + i * 0.44), y + ch * (0.3 + j * 0.42), 26);
        hedge(ctx, x, y, x + cw, y, 12);
        hedge(ctx, x, y + ch, x + cw, y + ch, 12);
        hedge(ctx, x, y, x, y + ch, 12);
        hedge(ctx, x + cw, y, x + cw, y + ch, 12);
      }
  },
  blocks(ctx, W, H, plants) {
    const bands = [
      [0.05, 0.36, plants[0], 34],
      [0.4, 0.62, plants[2], 26],
      [0.66, 0.95, plants[3], 26],
    ];
    for (const [a, b, p, s] of bands) {
      for (let x = W * a + s / 2; x < W * b; x += s * 0.85) for (let y = s * 0.7; y < H - s * 0.4; y += s * 0.85) plant(ctx, p, x, y, s);
    }
    for (let x = 20; x < W; x += 40) plant(ctx, plants[1], x, H - 14, 24);
  },
  sparse(ctx, W, H, plants, rand, { raked = false } = {}) {
    const stones = [
      [W * 0.3, H * 0.45, 22, 15],
      [W * 0.68, H * 0.6, 16, 11],
      [W * 0.52, H * 0.3, 11, 8],
    ];
    if (raked) {
      // ghiaia rastrellata: linee parallele che girano attorno alle pietre
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 1.2;
      for (let y = 6; y < H; y += 7) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      for (const [x, y, rx, ry] of stones)
        for (let k = 1; k <= 3; k++) {
          ctx.strokeStyle = "rgba(255,255,255,0.45)";
          ctx.beginPath();
          ctx.ellipse(x, y, rx + k * 6, ry + k * 5, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
    }
    for (const s of stones) stone(ctx, ...s);
    const spots = raked
      ? [[W * 0.12, H * 0.25, 48], [W * 0.86, H * 0.25, 40], [W * 0.88, H * 0.82, 34], [W * 0.15, H * 0.8, 36], [W * 0.45, H * 0.82, 26]]
      : Array.from({ length: 10 }, () => [rand() * W, rand() * H, 26 + rand() * 12]);
    spots.forEach(([x, y, s], i) => plant(ctx, plants[i % plants.length], x, y, s));
    if (!raked) for (let i = 0; i < 6; i++) stone(ctx, rand() * W, rand() * H, 10 + rand() * 10, 7 + rand() * 6);
  },
};

// Foto dello stile se c'è, altrimenti il disegno visto dall'alto.
export function StyleImage({ style, width = 360, height = 220, sizes = "(max-width: 768px) 100vw, 360px", eager = false }) {
  const photo = stylePhoto(style.id);
  if (!photo) return <StyleScene style={style} width={width} height={height} />;
  return (
    <div className="style-scene is-photo">
      <img
        src={photo.src}
        srcSet={photo.srcSet}
        sizes={sizes}
        alt={`Esempio di ${style.name}`}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : undefined}
        decoding="async"
        style={{ aspectRatio: `${width} / ${height}` }}
      />
    </div>
  );
}

export default function StyleScene({ style, width = 360, height = 220 }) {
  const canvasRef = useRef(null);
  const [wrapRef, inView] = useInView("200px");
  useEffect(() => {
    if (!inView) return;
    const c = canvasRef.current;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = width * dpr;
    c.height = height * dpr;
    const ctx = c.getContext("2d");
    ctx.scale(dpr, dpr);
    const rand = rng(style.id);
    fillGround(ctx, width, height, style.scene.ground);
    const plants = SCENE_PLANTS[style.id] ?? SCENE_PLANTS.cottage;
    const layout = style.scene.layout;
    if (layout === "drifts-loose") LAYOUTS.drifts(ctx, width, height, plants, rand, { loose: true });
    else if (layout === "sparse") LAYOUTS.sparse(ctx, width, height, plants, rand, { raked: style.id === "giapponese" });
    else (LAYOUTS[layout] ?? LAYOUTS.drifts)(ctx, width, height, plants, rand);
  }, [inView, style, width, height]);
  return (
    <div ref={wrapRef} className="style-scene">
      <canvas ref={canvasRef} style={{ width: "100%", aspectRatio: `${width} / ${height}` }} aria-label={`Esempio di ${style.name}`} role="img" />
    </div>
  );
}
