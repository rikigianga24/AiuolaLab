// Icone delle piante viste dall'alto, disegnate su canvas, nello stile delle
// tavole di progetto dei paesaggisti. Ogni icona è generata una sola volta
// per tipo + colori e poi riusata (sul canvas Konva e nelle liste).
import { COLORS } from "./labels.js";
import { getArtStyle } from "./artStyle.js";
import { paintTemperaIcon, tonesFrom } from "./tempera.js";
import { CROP_BY_ID } from "./crops.js";

export const ICON_TYPES = {
  flower: "Fiori a 5 petali",
  daisy: "Margherite",
  rose: "Rose e fiori doppi",
  spike: "Spighe (lavanda, lupinus...)",
  cluster: "Infiorescenze a palla",
  star: "Fiori a stella / bulbose",
  cup: "Tulipani",
  grass: "Graminacee",
  foliage: "Fogliame decorativo",
  shrub: "Arbusti",
  groundcover: "Tappezzanti",
};

// Riconoscimento dal nome (scientifico o comune). L'ordine conta.
const RULES = [
  ["spike", /lavand|lupin|salvia(?! rosmarinus)|digital|verben|perovsk|veronic|delphin|speron|consolida|agastach|liatris|nepeta|kniphof|astilbe|lythrum|epilob|gaura|antirrh|bocca di leone|verbasc|persicaria|sanguisorb|actaea|gladiol|penstemon|alcea|malvone|lobelia|celosia piumosa|amaranthus/],
  ["rose", /^ros[ae]\b|camell|paeoni|peoni|ranuncul|gardenia|dahlia|dalia|garofan|dianthus|begonia/],
  ["daisy", /echinac|rudbeck|cosmo|coreops|leucanth|\baster\b|gaillard|helenium|tagete|zinnia|osteosp|gerber|bellis|margher|girasol|helianth|anthemis|erigeron|calendul|arnica|gazania/],
  ["cluster", /hydrang|ortensi|achille|agapant|allium|sedum|borracin|phlox|lantana|viburn|pieris|syringa|lillà|hortensia|ageratum|eupator/],
  ["grass", /pennisetum|stipa|festuca|miscanth|carex|calamagr|panicum|imperata|graminac|grass|lino delle fate|molinia|hakonechloa|briza|deschampsia|sesleria|muhlenberg|eragrostis|anemanthele|ophiopogon|liriope/],
  ["star", /narcis|hemerocall|emerocall|lilium|giglio|clemat|amaryll|hippeastr|ornithog/],
  ["cup", /tulip|crocus|colchic/],
  ["groundcover", /thymus|\btimo\b|vinca|pervinc|ajuga|bugola|\biva\b|erica|calluna|sagina|dichondra|lysimach|aubriet|arabis|cerastium|phyla|trifoli/],
  ["foliage", /hosta|heuchera|fern|felce|helleb|elleb|bergenia|acanthus|brunnera|polystich|dryopter|athyr|coleus|caladium|osmunda|matteuccia|blechnum|asplenium|adiantum|ligularia|rodgersia|stachys byzantina|artemisia|senecio|helichrysum petiolare|plectranth/],
  ["shrub", /buxus|bosso|rhododendr|rododendr|azalea|rosmarin|pittospor|\bilex\b|agrifog|taxus|tasso|lonicera|abelia|spiraea|hebe|choisya|euonymus|ligustr|photinia|myrtus|mirto|laurus|alloro/],
];

const nonGreen = (codes = []) => codes.filter((c) => c && c !== "green");

export function iconTypeFor(plant) {
  if (plant?.cropId && CROP_BY_ID[plant.cropId]) return CROP_BY_ID[plant.cropId].icon;
  const text = [plant?.scientificName, plant?.commonName, plant?.name, ...(plant?.otherNames ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  for (const [type, re] of RULES) if (re.test(text)) return type;
  if (/grass/i.test(plant?.type ?? "")) return "grass";
  const spread = plant?.spreadCm?.max ?? plant?.heightCm?.max ?? 0;
  if (!nonGreen(plant?.flowerColors).length) return spread > 100 ? "shrub" : "foliage";
  if (spread > 150) return "shrub";
  return "flower";
}

// Colori dei fiori in esadecimale (massimo 3).
export function flowerHexes(plant) {
  // tonalità precise scritte nella descrizione ("albicocca", "cremisi"...)
  const tones = tonesFrom(plant?.description ?? "");
  if (tones.length && nonGreen(plant?.flowerColors).length) return tones;
  return nonGreen(plant?.flowerColors)
    .map((c) => COLORS[c]?.hex)
    .filter(Boolean)
    .slice(0, 3);
}

// ---------- utilità di disegno ----------

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

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
  const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

const GREENS = ["#3f6b2f", "#4f7d3a", "#5d8c43", "#6b9a4c", "#476f34"];

function leaf(ctx, x, y, angle, len, wid, color, rib = true) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const g = ctx.createLinearGradient(0, 0, len, 0);
  g.addColorStop(0, shade(color, -0.35));
  g.addColorStop(0.6, color);
  g.addColorStop(1, shade(color, 0.12));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * 0.45, -wid, len, 0);
  ctx.quadraticCurveTo(len * 0.45, wid, 0, 0);
  ctx.fill();
  if (rib) {
    ctx.strokeStyle = shade(color, 0.25);
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = Math.max(0.6, wid * 0.08);
    ctx.beginPath();
    ctx.moveTo(len * 0.05, 0);
    ctx.lineTo(len * 0.9, 0);
    ctx.stroke();
  }
  ctx.restore();
}

function softShadow(ctx, c, R) {
  ctx.save();
  const off = 10000;
  ctx.shadowColor = "rgba(20, 30, 10, 0.45)";
  ctx.shadowBlur = R * 0.18;
  ctx.shadowOffsetX = off + R * 0.09;
  ctx.shadowOffsetY = off + R * 0.12;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(c - off, c - off, R * 0.92, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function foliageMound(ctx, rand, c, R, { count = 26, greens = GREENS, narrow = false } = {}) {
  const base = ctx.createRadialGradient(c - R * 0.2, c - R * 0.2, R * 0.1, c, c, R);
  base.addColorStop(0, "#5f8f45");
  base.addColorStop(1, "#2f5124");
  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.arc(c, c, R * 0.82, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < count; i++) {
    const a = rand() * Math.PI * 2;
    const d = rand() * R * 0.25;
    const len = R * (0.55 + rand() * 0.42);
    const wid = R * (narrow ? 0.05 + rand() * 0.04 : 0.12 + rand() * 0.09);
    leaf(ctx, c + Math.cos(a) * d, c + Math.sin(a) * d, a + (rand() - 0.5) * 0.4, len, wid, greens[(rand() * greens.length) | 0]);
  }
}

function petalColor(ctx, x, y, r, color) {
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  g.addColorStop(0, shade(color, 0.35));
  g.addColorStop(0.7, color);
  g.addColorStop(1, shade(color, -0.25));
  return g;
}

function flower5(ctx, rand, x, y, r, color) {
  const rot = rand() * Math.PI;
  for (let i = 0; i < 5; i++) {
    const a = rot + (i * Math.PI * 2) / 5;
    const px = x + Math.cos(a) * r * 0.48, py = y + Math.sin(a) * r * 0.48;
    ctx.fillStyle = petalColor(ctx, px, py, r * 0.52, color);
    ctx.beginPath();
    ctx.arc(px, py, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#f2c94c";
  ctx.beginPath();
  ctx.arc(x, y, r * 0.24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(120, 70, 10, 0.55)";
  for (let i = 0; i < 5; i++) {
    const a = rand() * Math.PI * 2, d = rand() * r * 0.15;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, r * 0.04, 0, Math.PI * 2);
    ctx.fill();
  }
}

function daisyHead(ctx, rand, x, y, r, color, centerColor) {
  const n = 14 + ((rand() * 6) | 0);
  const rot = rand() * Math.PI;
  for (let i = 0; i < n; i++) {
    const a = rot + (i * Math.PI * 2) / n;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    const g = ctx.createLinearGradient(0, 0, r, 0);
    g.addColorStop(0, shade(color, -0.2));
    g.addColorStop(1, shade(color, 0.2));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(r * 0.55, 0, r * 0.45, r * 0.11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  const cg = ctx.createRadialGradient(x - r * 0.08, y - r * 0.08, 0, x, y, r * 0.32);
  cg.addColorStop(0, shade(centerColor, 0.3));
  cg.addColorStop(1, shade(centerColor, -0.3));
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.3, 0, Math.PI * 2);
  ctx.fill();
}

function roseBloom(ctx, rand, x, y, r, color) {
  const layers = [
    [5, 0.5, 0.5, -0.2],
    [5, 0.3, 0.38, -0.05],
    [4, 0.15, 0.26, 0.05],
  ];
  let rot = rand() * Math.PI;
  for (const [n, dist, size, tone] of layers) {
    rot += Math.PI / n;
    for (let i = 0; i < n; i++) {
      const a = rot + (i * Math.PI * 2) / n;
      const px = x + Math.cos(a) * r * dist, py = y + Math.sin(a) * r * dist;
      ctx.fillStyle = petalColor(ctx, px, py, r * size, shade(color, tone));
      ctx.beginPath();
      ctx.arc(px, py, r * size, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = shade(color, -0.4);
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = r * 0.03;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
  // spirale centrale
  ctx.strokeStyle = shade(color, -0.45);
  ctx.lineWidth = r * 0.04;
  ctx.beginPath();
  for (let t = 0; t < 4 * Math.PI; t += 0.2) {
    const rr = (r * 0.16 * t) / (4 * Math.PI);
    const px = x + Math.cos(t) * rr, py = y + Math.sin(t) * rr;
    if (t === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
}

// ---------- tipi di pianta ----------

const DRAW = {
  flower(ctx, rand, c, R, colors) {
    foliageMound(ctx, rand, c, R);
    const n = 6 + ((rand() * 3) | 0);
    for (let i = 0; i < n; i++) {
      const a = rand() * Math.PI * 2, d = i === 0 ? 0 : R * (0.25 + rand() * 0.45);
      flower5(ctx, rand, c + Math.cos(a) * d, c + Math.sin(a) * d, R * (0.2 + rand() * 0.06), colors[i % colors.length]);
    }
  },

  daisy(ctx, rand, c, R, colors, name) {
    foliageMound(ctx, rand, c, R, { count: 22 });
    const center = /echinac/.test(name) ? "#b5541c" : /rudbeck/.test(name) ? "#3b2412" : "#d9a520";
    const n = 4 + ((rand() * 2) | 0);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rand(), d = i === 0 ? 0 : R * (0.35 + rand() * 0.25);
      daisyHead(ctx, rand, c + Math.cos(a) * d, c + Math.sin(a) * d, R * (0.3 + rand() * 0.06), colors[i % colors.length], center);
    }
  },

  rose(ctx, rand, c, R, colors) {
    foliageMound(ctx, rand, c, R, { count: 30, greens: ["#2f5a2a", "#3a6a31", "#2a4f25", "#41733a"] });
    const n = 4;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rand() * 0.6, d = i === 0 ? 0 : R * (0.42 + rand() * 0.15);
      roseBloom(ctx, rand, c + Math.cos(a) * d, c + Math.sin(a) * d, R * (0.3 + rand() * 0.05), colors[i % colors.length]);
    }
  },

  spike(ctx, rand, c, R, colors) {
    foliageMound(ctx, rand, c, R, { count: 40, narrow: true, greens: ["#7d9a76", "#8fa58a", "#6c8a66", "#9db497"] });
    const n = 16;
    const order = Array.from({ length: n }, (_, i) => i).sort(() => rand() - 0.5);
    for (const i of order) {
      const a = (i / n) * Math.PI * 2 + (rand() - 0.5) * 0.35;
      const len = R * (0.62 + rand() * 0.36);
      const color = colors[i % colors.length];
      ctx.strokeStyle = "#5d7a52";
      ctx.lineWidth = R * 0.025;
      ctx.beginPath();
      ctx.moveTo(c, c);
      ctx.lineTo(c + Math.cos(a) * len, c + Math.sin(a) * len);
      ctx.stroke();
      for (let t = 0.42; t <= 1.001; t += 0.06) {
        const jitter = (rand() - 0.5) * R * 0.06;
        const px = c + Math.cos(a) * len * t - Math.sin(a) * jitter;
        const py = c + Math.sin(a) * len * t + Math.cos(a) * jitter;
        const rr = R * (0.065 - t * 0.035);
        ctx.fillStyle = petalColor(ctx, px, py, rr, rand() > 0.5 ? color : shade(color, -0.15));
        ctx.beginPath();
        ctx.arc(px, py, rr, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  },

  cluster(ctx, rand, c, R, colors) {
    foliageMound(ctx, rand, c, R, { count: 18 });
    const n = 4 + ((rand() * 2) | 0);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rand() * 0.5, d = i === 0 ? 0 : R * (0.4 + rand() * 0.15);
      const hx = c + Math.cos(a) * d, hy = c + Math.sin(a) * d, hr = R * (0.28 + rand() * 0.08);
      const color = colors[i % colors.length];
      ctx.fillStyle = "rgba(20,30,10,0.35)";
      ctx.beginPath();
      ctx.arc(hx + hr * 0.12, hy + hr * 0.15, hr, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = petalColor(ctx, hx, hy, hr, shade(color, -0.1));
      ctx.beginPath();
      ctx.arc(hx, hy, hr, 0, Math.PI * 2);
      ctx.fill();
      for (let k = 0; k < 34; k++) {
        const fa = rand() * Math.PI * 2, fd = Math.sqrt(rand()) * hr * 0.88;
        const fx = hx + Math.cos(fa) * fd, fy = hy + Math.sin(fa) * fd, fr = hr * 0.13;
        ctx.fillStyle = shade(color, (rand() - 0.3) * 0.5);
        for (let p = 0; p < 4; p++) {
          const pa = fa + (p * Math.PI) / 2;
          ctx.beginPath();
          ctx.arc(fx + Math.cos(pa) * fr * 0.5, fy + Math.sin(pa) * fr * 0.5, fr * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  },

  star(ctx, rand, c, R, colors, name) {
    for (let i = 0; i < 14; i++) {
      const a = rand() * Math.PI * 2;
      leaf(ctx, c, c, a, R * (0.75 + rand() * 0.25), R * 0.07, GREENS[(rand() * GREENS.length) | 0]);
    }
    const trumpet = /narcis/.test(name) ? "#f2994a" : "#c26a1a";
    const n = 3 + ((rand() * 2) | 0);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rand(), d = R * (0.2 + rand() * 0.3);
      const x = c + Math.cos(a) * d, y = c + Math.sin(a) * d, r = R * 0.3;
      const color = colors[i % colors.length];
      const rot = rand() * Math.PI;
      for (let p = 0; p < 6; p++) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot + (p * Math.PI) / 3);
        ctx.fillStyle = petalColor(ctx, r * 0.5, 0, r * 0.6, color);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(r * 0.5, -r * 0.3, r, 0);
        ctx.quadraticCurveTo(r * 0.5, r * 0.3, 0, 0);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = petalColor(ctx, x, y, r * 0.3, trumpet);
      ctx.beginPath();
      ctx.arc(x, y, r * 0.28, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  cup(ctx, rand, c, R, colors) {
    for (let i = 0; i < 8; i++) {
      const a = rand() * Math.PI * 2;
      leaf(ctx, c, c, a, R * (0.7 + rand() * 0.25), R * 0.16, ["#7c9a7a", "#6d8d6b", "#89a586"][i % 3]);
    }
    const n = 4;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rand() * 0.5, d = i === 0 ? 0 : R * 0.38;
      const x = c + Math.cos(a) * d, y = c + Math.sin(a) * d, r = R * 0.24;
      const color = colors[i % colors.length];
      for (const [k, dist, size, tone] of [[0, 0.32, 0.62, -0.15], [1, 0.22, 0.5, 0.05]]) {
        for (let p = 0; p < 3; p++) {
          const pa = (p * Math.PI * 2) / 3 + k * (Math.PI / 3);
          const px = x + Math.cos(pa) * r * dist, py = y + Math.sin(pa) * r * dist;
          ctx.fillStyle = petalColor(ctx, px, py, r * size, shade(color, tone));
          ctx.beginPath();
          ctx.arc(px, py, r * size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.fillStyle = "rgba(40, 20, 10, 0.55)";
      ctx.beginPath();
      ctx.arc(x, y, r * 0.16, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  grass(ctx, rand, c, R, colors) {
    const blue = colors.includes(COLORS.blue.hex);
    const blades = blue ? ["#8fb3b8", "#7ea3a9", "#a2c2c4", "#6f949b"] : ["#7f9b4f", "#93ad5d", "#6c8a42", "#a6b86a"];
    const plumes = blue ? [] : colors;
    for (let i = 0; i < 70; i++) {
      const a = rand() * Math.PI * 2;
      const len = R * (0.55 + rand() * 0.45);
      const bend = (rand() - 0.5) * R * 0.5;
      const ex = c + Math.cos(a) * len, ey = c + Math.sin(a) * len;
      const mx = c + Math.cos(a) * len * 0.5 - Math.sin(a) * bend;
      const my = c + Math.sin(a) * len * 0.5 + Math.cos(a) * bend;
      ctx.strokeStyle = blades[(rand() * blades.length) | 0];
      ctx.lineWidth = R * (0.015 + rand() * 0.02);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(c, c);
      ctx.quadraticCurveTo(mx, my, ex, ey);
      ctx.stroke();
      if (plumes.length && i % 3 === 0) {
        ctx.save();
        ctx.translate(ex, ey);
        ctx.rotate(a);
        ctx.globalAlpha = 0.75;
        ctx.fillStyle = shade(plumes[i % plumes.length], 0.15);
        ctx.beginPath();
        ctx.ellipse(0, 0, R * 0.13, R * 0.045, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  },

  foliage(ctx, rand, c, R) {
    const variegated = rand() > 0.5;
    const n = 8;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rand() * 0.4;
      const color = ["#3f7a3a", "#4f8a45", "#5f9a55", "#3a6e46"][i % 4];
      ctx.save();
      ctx.translate(c, c);
      ctx.rotate(a);
      const len = R * (0.85 + rand() * 0.12), wid = R * 0.36;
      const g = ctx.createLinearGradient(0, 0, len, 0);
      g.addColorStop(0, shade(color, -0.3));
      g.addColorStop(1, shade(color, 0.15));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(len * 0.3, -wid, len * 0.85, -wid * 0.8, len, 0);
      ctx.bezierCurveTo(len * 0.85, wid * 0.8, len * 0.3, wid, 0, 0);
      ctx.fill();
      if (variegated) {
        ctx.strokeStyle = "#dfe9b8";
        ctx.lineWidth = R * 0.035;
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(230, 245, 200, 0.4)";
      ctx.lineWidth = R * 0.012;
      for (let v = -2; v <= 2; v++) {
        ctx.beginPath();
        ctx.moveTo(len * 0.05, 0);
        ctx.quadraticCurveTo(len * 0.5, v * wid * 0.32, len * 0.92, v * wid * 0.08);
        ctx.stroke();
      }
      ctx.restore();
    }
  },

  shrub(ctx, rand, c, R, colors) {
    const base = ctx.createRadialGradient(c, c, R * 0.2, c, c, R);
    base.addColorStop(0, "#3d6a2e");
    base.addColorStop(1, "#24401c");
    ctx.fillStyle = base;
    ctx.beginPath();
    ctx.arc(c, c, R * 0.9, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 46; i++) {
      const a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * R * 0.72;
      const x = c + Math.cos(a) * d, y = c + Math.sin(a) * d, r = R * (0.14 + rand() * 0.12);
      const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.4, r * 0.1, x, y, r);
      g.addColorStop(0, "#7fae5e");
      g.addColorStop(0.6, "#4f8038");
      g.addColorStop(1, "#2e5222");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    if (colors.length) {
      for (let i = 0; i < 22; i++) {
        const a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * R * 0.75;
        const x = c + Math.cos(a) * d, y = c + Math.sin(a) * d, r = R * (0.06 + rand() * 0.04);
        ctx.fillStyle = petalColor(ctx, x, y, r, colors[i % colors.length]);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  },

  groundcover(ctx, rand, c, R, colors) {
    ctx.fillStyle = "#3f6630";
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const a = (i / 24) * Math.PI * 2, rr = R * (0.82 + rand() * 0.14);
      const x = c + Math.cos(a) * rr, y = c + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    for (let i = 0; i < 160; i++) {
      const a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * R * 0.85;
      leaf(ctx, c + Math.cos(a) * d, c + Math.sin(a) * d, rand() * Math.PI * 2, R * 0.12, R * 0.05, GREENS[(rand() * GREENS.length) | 0], false);
    }
    if (colors.length) {
      for (let i = 0; i < 70; i++) {
        const a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * R * 0.82;
        const x = c + Math.cos(a) * d, y = c + Math.sin(a) * d;
        ctx.fillStyle = shade(colors[i % colors.length], (rand() - 0.5) * 0.3);
        ctx.beginPath();
        ctx.arc(x, y, R * 0.035, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  },

  // ---- ortaggi ----

  leafy(ctx, rand, c, R, colors, name) {
    const tint = colors[0];
    const greens = /rucol|spinac|basilic/.test(name) ? ["#3f7a2f", "#4f8a3a", "#5f9a45"] : ["#7fb24f", "#93c35e", "#a9d273", "#6ea343"];
    const layers = [[10, 0.95, 0.42], [8, 0.7, 0.36], [6, 0.45, 0.3]];
    layers.forEach(([n, len, wid], li) => {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + li * 0.4 + rand() * 0.3;
        const color = tint && rand() > 0.35 ? shade(tint, -0.1 + li * 0.1) : shade(greens[(rand() * greens.length) | 0], li * 0.08);
        ctx.save();
        ctx.translate(c, c);
        ctx.rotate(a);
        const L = R * len, W = R * wid;
        const g = ctx.createLinearGradient(0, 0, L, 0);
        g.addColorStop(0, shade(color, -0.25));
        g.addColorStop(1, shade(color, 0.15));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        // bordo ondulato
        for (let k = 0; k <= 10; k++) {
          const t = k / 10;
          const ang = -Math.PI / 2 + t * Math.PI;
          const wob = 1 + Math.sin(k * 2.3) * 0.08;
          ctx.lineTo(L * 0.55 + Math.sin(ang) * L * 0.45 * wob, Math.cos(ang) * W * wob * -1);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(240, 255, 220, 0.45)";
        ctx.lineWidth = R * 0.015;
        ctx.beginPath();
        ctx.moveTo(L * 0.05, 0);
        ctx.lineTo(L * 0.9, 0);
        ctx.stroke();
        ctx.restore();
      }
    });
  },

  fruiting(ctx, rand, c, R, colors) {
    foliageMound(ctx, rand, c, R, { count: 30, greens: ["#2f5a24", "#3b6a2c", "#467a33", "#2a4f20"] });
    const n = 6 + ((rand() * 3) | 0);
    for (let i = 0; i < n; i++) {
      const a = rand() * Math.PI * 2, d = R * (0.15 + rand() * 0.5);
      const x = c + Math.cos(a) * d, y = c + Math.sin(a) * d, r = R * (0.13 + rand() * 0.05);
      const color = colors[i % colors.length] ?? "#d64545";
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.beginPath();
      ctx.arc(x + r * 0.15, y + r * 0.2, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = petalColor(ctx, x, y, r, color);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.beginPath();
      ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#3d6b28";
      ctx.lineWidth = r * 0.18;
      ctx.beginPath();
      for (let k = 0; k < 5; k++) {
        const ka = (k / 5) * Math.PI * 2;
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(ka) * r * 0.35, y + Math.sin(ka) * r * 0.35);
      }
      ctx.stroke();
    }
  },

  squash(ctx, rand, c, R, colors) {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + rand() * 0.4, d = R * 0.42;
      const x = c + Math.cos(a) * d, y = c + Math.sin(a) * d, r = R * (0.38 + rand() * 0.1);
      const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
      g.addColorStop(0, "#7fae55");
      g.addColorStop(1, "#3c6b2a");
      ctx.fillStyle = g;
      ctx.beginPath();
      for (let k = 0; k <= 5; k++) {
        const ka = (k / 5) * Math.PI * 2 + a;
        const lobe = r * (k % 2 ? 0.85 : 1);
        ctx.lineTo(x + Math.cos(ka) * lobe, y + Math.sin(ka) * lobe);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(220, 240, 200, 0.5)";
      ctx.lineWidth = R * 0.012;
      ctx.beginPath();
      for (let k = 0; k < 5; k++) {
        const ka = (k / 5) * Math.PI * 2 + a;
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(ka) * r * 0.8, y + Math.sin(ka) * r * 0.8);
      }
      ctx.stroke();
    }
    const flower = colors[0] ?? "#f2c94c";
    for (let i = 0; i < 2; i++) {
      const a = rand() * Math.PI * 2, d = R * 0.3;
      const x = c + Math.cos(a) * d, y = c + Math.sin(a) * d, r = R * 0.16;
      for (let k = 0; k < 5; k++) {
        const ka = (k / 5) * Math.PI * 2;
        ctx.fillStyle = petalColor(ctx, x, y, r, flower);
        ctx.beginPath();
        ctx.ellipse(x + Math.cos(ka) * r * 0.5, y + Math.sin(ka) * r * 0.5, r * 0.55, r * 0.35, ka, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#e08a1e";
      ctx.beginPath();
      ctx.arc(x, y, r * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  feathery(ctx, rand, c, R) {
    const n = 22;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rand() * 0.2;
      const len = R * (0.7 + rand() * 0.28);
      ctx.strokeStyle = "#5d8c3a";
      ctx.lineWidth = R * 0.02;
      ctx.beginPath();
      ctx.moveTo(c, c);
      ctx.lineTo(c + Math.cos(a) * len, c + Math.sin(a) * len);
      ctx.stroke();
      for (let t = 0.25; t <= 1; t += 0.09) {
        const bx = c + Math.cos(a) * len * t, by = c + Math.sin(a) * len * t;
        const side = R * 0.09 * (1.1 - t);
        for (const sgn of [-1, 1]) {
          ctx.strokeStyle = ["#6fa046", "#7fb355", "#5a8f38"][(rand() * 3) | 0];
          ctx.lineWidth = R * 0.016;
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineTo(bx + Math.cos(a + sgn * 1.0) * side, by + Math.sin(a + sgn * 1.0) * side);
          ctx.stroke();
        }
      }
    }
  },

  allium(ctx, rand, c, R, colors, name) {
    const n = /porro/.test(name) ? 10 : 14;
    for (let i = 0; i < n; i++) {
      const a = rand() * Math.PI * 2;
      const len = R * (0.55 + rand() * 0.4);
      ctx.strokeStyle = ["#6f9a8a", "#7fae9a", "#5f8c7a"][(rand() * 3) | 0];
      ctx.lineWidth = R * (/porro/.test(name) ? 0.09 : 0.05);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(c, c);
      ctx.quadraticCurveTo(c + Math.cos(a + 0.3) * len * 0.5, c + Math.sin(a + 0.3) * len * 0.5, c + Math.cos(a) * len, c + Math.sin(a) * len);
      ctx.stroke();
    }
    const bulb = /aglio/.test(name) ? "#efe8e0" : /rossa|tropea/.test(name) ? "#8e2a4a" : "#d9b77a";
    ctx.fillStyle = petalColor(ctx, c, c, R * 0.2, bulb);
    ctx.beginPath();
    ctx.arc(c, c, R * 0.18, 0, Math.PI * 2);
    ctx.fill();
  },

  legume(ctx, rand, c, R, colors) {
    for (let i = 0; i < 16; i++) {
      const a = rand() * Math.PI * 2, d = R * (0.2 + rand() * 0.55);
      const x = c + Math.cos(a) * d, y = c + Math.sin(a) * d;
      for (let k = 0; k < 3; k++) {
        const ka = a + (k - 1) * 0.9;
        leaf(ctx, x, y, ka, R * 0.22, R * 0.1, ["#5d9a45", "#6fab52", "#4f8a3a"][k], false);
      }
    }
    // bacelli
    ctx.strokeStyle = "#7fae4f";
    ctx.lineWidth = R * 0.05;
    ctx.lineCap = "round";
    for (let i = 0; i < 5; i++) {
      const a = rand() * Math.PI * 2, d = R * (0.2 + rand() * 0.4);
      const x = c + Math.cos(a) * d, y = c + Math.sin(a) * d;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + R * 0.08, y + R * 0.1, x + R * 0.05, y + R * 0.22);
      ctx.stroke();
    }
    const flower = colors[0] ?? "#f4f1ea";
    for (let i = 0; i < 6; i++) {
      const a = rand() * Math.PI * 2, d = R * (0.2 + rand() * 0.6);
      ctx.fillStyle = petalColor(ctx, c + Math.cos(a) * d, c + Math.sin(a) * d, R * 0.06, flower);
      ctx.beginPath();
      ctx.arc(c + Math.cos(a) * d, c + Math.sin(a) * d, R * 0.055, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  brassica(ctx, rand, c, R, colors, name) {
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + rand() * 0.3;
      const x = c + Math.cos(a) * R * 0.5, y = c + Math.sin(a) * R * 0.5, r = R * 0.38;
      const g = ctx.createRadialGradient(x, y, r * 0.1, x, y, r);
      g.addColorStop(0, "#9fbfa6");
      g.addColorStop(1, "#5a7f6a");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(230, 245, 235, 0.55)";
      ctx.lineWidth = R * 0.015;
      ctx.beginPath();
      ctx.moveTo(c, c);
      ctx.lineTo(x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7);
      ctx.stroke();
    }
    if (/broccol/.test(name)) {
      for (let i = 0; i < 26; i++) {
        const a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * R * 0.33;
        ctx.fillStyle = petalColor(ctx, c + Math.cos(a) * d, c + Math.sin(a) * d, R * 0.08, "#3f6b3a");
        ctx.beginPath();
        ctx.arc(c + Math.cos(a) * d, c + Math.sin(a) * d, R * 0.075, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = petalColor(ctx, c, c, R * 0.38, "#c9dcb8");
      ctx.beginPath();
      ctx.arc(c, c, R * 0.36, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(120, 150, 110, 0.6)";
      ctx.lineWidth = R * 0.015;
      for (let k = 1; k <= 3; k++) {
        ctx.beginPath();
        ctx.arc(c, c, R * 0.1 * k, rand() * 6, rand() * 6 + 4);
        ctx.stroke();
      }
    }
  },

  berry(ctx, rand, c, R, colors) {
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + rand() * 0.3;
      for (let k = 0; k < 3; k++) {
        leaf(ctx, c + Math.cos(a) * R * 0.25, c + Math.sin(a) * R * 0.25, a + (k - 1) * 0.6, R * 0.6, R * 0.16, ["#3f7a30", "#4f8a3a", "#5a9645"][k]);
      }
    }
    for (let i = 0; i < 4; i++) {
      const a = rand() * Math.PI * 2, d = R * (0.25 + rand() * 0.45);
      flower5(ctx, rand, c + Math.cos(a) * d, c + Math.sin(a) * d, R * 0.1, "#f4f1ea");
    }
    for (let i = 0; i < 5; i++) {
      const a = rand() * Math.PI * 2, d = R * (0.3 + rand() * 0.5);
      const x = c + Math.cos(a) * d, y = c + Math.sin(a) * d, r = R * 0.09;
      ctx.fillStyle = petalColor(ctx, x, y, r, colors[0] ?? "#d64545");
      ctx.beginPath();
      ctx.moveTo(x, y - r);
      ctx.quadraticCurveTo(x + r * 1.2, y - r * 0.6, x, y + r * 1.2);
      ctx.quadraticCurveTo(x - r * 1.2, y - r * 0.6, x, y - r);
      ctx.fill();
    }
  },
};

// Luce dall'alto a sinistra: dà volume all'icona.
function lighting(ctx, c, R) {
  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  const g = ctx.createRadialGradient(c - R * 0.45, c - R * 0.5, R * 0.05, c, c, R * 1.15);
  g.addColorStop(0, "rgba(255, 250, 220, 0.28)");
  g.addColorStop(0.55, "rgba(255, 255, 255, 0)");
  g.addColorStop(1, "rgba(10, 20, 5, 0.32)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, c * 2, c * 2);
  ctx.restore();
}

// Quota del canvas occupata dalla pianta: il resto è margine per l'ombra.
export const ICON_FILL = 0.84;

const cache = new Map();

/**
 * Restituisce un canvas con l'icona. La pianta occupa ICON_FILL del lato.
 * @param {string} type  uno di ICON_TYPES
 * @param {string[]} colors colori esadecimali dei fiori
 * @param {number} size  lato in pixel
 * @param {string} name  nome (per dettagli come il centro delle margherite)
 */
export function getIconCanvas(type, colors = [], size = 320, name = "", style = getArtStyle()) {
  if (style === "tempera") return temperaCanvas(type, colors, size, name);
  const kind = DRAW[type] ? type : "flower";
  const flowering = ["flower", "daisy", "rose", "spike", "cluster", "star", "cup", "fruiting", "berry"].includes(kind);
  const palette = colors.length ? colors : flowering ? ["#e88fb4"] : [];
  const named = ["daisy", "star", "leafy", "allium", "brassica"].includes(kind);
  const key = `${kind}|${palette.join(",")}|${size}|${named ? name : ""}`;
  if (cache.has(key)) return cache.get(key);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const c = size / 2;
  const R = (size * ICON_FILL) / 2;
  const rand = rng(key);
  softShadow(ctx, c, R);
  ctx.save();
  DRAW[kind](ctx, rand, c, R, palette, name.toLowerCase());
  ctx.restore();
  lighting(ctx, c, R);
  cache.set(key, canvas);
  return canvas;
}

// Stile tempera: ogni specie nota ha il suo disegno, quindi conta il nome.
function temperaCanvas(type, colors, size, name) {
  const key = `tempera|${type}|${colors.join(",")}|${size}|${name}`;
  if (cache.has(key)) return cache.get(key);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  paintTemperaIcon(canvas.getContext("2d"), size, { type, colors, name });
  cache.set(key, canvas);
  return canvas;
}

const urlCache = new Map();
export function getIconUrl(type, colors = [], size = 96, name = "", style = getArtStyle()) {
  const key = `${style}|${type}|${colors.join(",")}|${size}|${name}`;
  if (!urlCache.has(key)) urlCache.set(key, getIconCanvas(type, colors, size, name, style).toDataURL("image/png"));
  return urlCache.get(key);
}

// Icona per un esemplare piantato (anche per progetti salvati prima delle icone).
export function iconForPlaced(p) {
  const type = p.icon ?? iconTypeFor({ name: p.name, scientificName: p.scientificName });
  const colors = p.colors?.length ? p.colors : p.color && p.color !== "#6f9a5b" ? [p.color] : [];
  return { type, colors };
}
