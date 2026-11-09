// Previsione dell'aiuola a 1, 3 e 5 anni, tutta calcolata (niente IA).
//
// Si parte dalle piante disegnate (posizione e misure adulte del catalogo),
// dai dati di crescita (growth.js), dall'orientamento (dove sorge il sole)
// e dal punto da cui si guarda l'aiuola. Ogni conclusione è accompagnata dal
// motivo, con i numeri da cui deriva.
import { centroid, pointInPolygon, polygonArea } from "./geometry.js";
import { ROOTS_LABEL, ROOT_SPREAD, SPEED_LABEL, growthProfile, sizeAt, vigor } from "./growth.js";

export const YEARS = [1, 3, 5];
const ZONE_MIN = { nord: 7, centro: 8, sud: 9 };
const ZONE_LABEL = { nord: "al Nord", centro: "al Centro", sud: "al Sud" };
const SEASON_ORDER = ["spring", "summer", "autumn", "winter"];
const SEASON_IT = { spring: "primavera", summer: "estate", autumn: "autunno", winter: "inverno" };

const cm = (m) => `${Math.round(m * 100)} cm`;
const pct = (v) => `${Math.round(v)}%`;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const plural = (n, one, many) => (n === 1 ? one : many);

// Area di intersezione di due cerchi (lente).
function lensArea(r1, r2, d) {
  if (d >= r1 + r2) return 0;
  if (d <= Math.abs(r1 - r2)) return Math.PI * Math.min(r1, r2) ** 2;
  const a = r1 * r1 * Math.acos((d * d + r1 * r1 - r2 * r2) / (2 * d * r1));
  const b = r2 * r2 * Math.acos((d * d + r2 * r2 - r1 * r1) / (2 * d * r2));
  const c = 0.5 * Math.sqrt((-d + r1 + r2) * (d + r1 - r2) * (d - r1 + r2) * (d + r1 + r2));
  return a + b - c;
}

// Quota di terreno dell'aiuola coperta dalle chiome (griglia fine).
function coverage(points, circles) {
  const xs = points.map((p) => p.x), ys = points.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const step = Math.max(0.02, Math.max(maxX - minX, maxY - minY) / 110);
  let inside = 0, covered = 0;
  for (let x = minX + step / 2; x < maxX; x += step)
    for (let y = minY + step / 2; y < maxY; y += step) {
      if (!pointInPolygon({ x, y }, points)) continue;
      inside++;
      if (circles.some((c) => (x - c.x) ** 2 + (y - c.y) ** 2 <= c.r * c.r)) covered++;
    }
  return inside ? (covered / inside) * 100 : 0;
}

const needsFullSun = (p) => Array.isArray(p.sunlight) && p.sunlight.length > 0 && !p.sunlight.includes("part_shade") && !p.sunlight.includes("full_shade");

// Direzione del sud nel disegno: northDeg è l'angolo del nord rispetto
// all'alto dello schermo, in senso orario (0 = nord in alto).
function southVector(northDeg) {
  const a = ((northDeg ?? 0) * Math.PI) / 180;
  return { x: -Math.sin(a), y: Math.cos(a) };
}

/** Stato di ogni pianta in un certo anno. */
function snapshot(plants, profiles, year) {
  return plants.map((p) => {
    const s = year === "design" ? { spread: p.spreadM ?? 0.4, height: (p.heightCm ?? (p.spreadM ?? 0.4) * 100) / 100, alive: true, note: null } : sizeAt(p, year, profiles[p.id]);
    return { p, prof: profiles[p.id], x: p.x, y: p.y, r: s.spread / 2, h: s.height, alive: s.alive, note: s.note };
  });
}

/** Frase per una sovrapposizione di chiome (anche tra due esemplari uguali). */
export function overlapText(o) {
  return o.a.name === o.b.name ? `due ${o.a.name} si coprono per il ${pct(o.ratio * 100)}` : `${o.winner.name} copre il ${pct(o.ratio * 100)} di ${o.loser.name}`;
}

function pairs(list) {
  const out = [];
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) out.push([list[i], list[j]]);
  return out;
}

function analyzeYear(bed, snap, ctx) {
  const alive = snap.filter((s) => s.alive);
  const area = ctx.area;
  const cov = coverage(bed.points, alive.map((s) => ({ x: s.x, y: s.y, r: s.r })));
  const canopy = alive.reduce((a, s) => a + Math.PI * s.r * s.r, 0);
  const density = (canopy / area) * 100;

  const overlaps = [], roots = [], shade = [];
  for (const [A, B] of pairs(alive)) {
    const d = Math.hypot(A.x - B.x, A.y - B.y);
    // chiome: quanto della pianta più piccola è coperto dall'altra
    const small = Math.min(A.r, B.r);
    const lens = lensArea(A.r, B.r, d);
    const ratio = lens / (Math.PI * small * small);
    if (ratio > 0.15) {
      const [winner, loser] = vigor(A.p, A.prof) + A.r >= vigor(B.p, B.prof) + B.r ? [A, B] : [B, A];
      overlaps.push({ a: A.p, b: B.p, ratio, severe: ratio > 0.3, winner: winner.p, loser: loser.p });
    }
    // radici: zona più ampia per stolonifere e invasive
    const ra = A.r * ROOT_SPREAD[A.prof.roots], rb = B.r * ROOT_SPREAD[B.prof.roots];
    const rootRatio = lensArea(ra, rb, d) / (Math.PI * Math.min(ra, rb) ** 2);
    const aggressive = ["stolonifere", "invasive"].includes(A.prof.roots) || ["stolonifere", "invasive"].includes(B.prof.roots);
    if (rootRatio > (aggressive ? 0.2 : 0.45)) {
      const [strong, weak] = vigor(A.p, A.prof) >= vigor(B.p, B.prof) ? [A, B] : [B, A];
      roots.push({ a: A.p, b: B.p, ratio: rootRatio, strong: strong.p, weak: weak.p, reason: ROOTS_LABEL[strong.prof.roots] });
    }
    // ombra: una pianta alta a sud (o a est/ovest) di una bassa che vuole sole
    for (const [T, S] of [
      [A, B],
      [B, A],
    ]) {
      if (!(T.h > S.h + 0.2 && T.h > S.h * 1.4)) continue;
      if (!needsFullSun(S.p)) continue;
      const v = { x: T.x - S.x, y: T.y - S.y };
      const len = Math.hypot(v.x, v.y) || 1e-6;
      const cos = (v.x * ctx.south.x + v.y * ctx.south.y) / len;
      let weight = 0, reach = 0, side = "";
      if (cos > 0.7) {
        weight = 1;
        reach = (T.h - S.h) * 0.9; // sole di mezzogiorno, alto
        side = "a sud";
      } else if (cos > -0.35) {
        weight = 0.5;
        reach = (T.h - S.h) * 1.4; // sole del mattino o del pomeriggio, più basso
        side = "a est o a ovest";
      }
      if (!weight) continue;
      const gap = Math.max(0, len - T.r - S.r * 0.5);
      if (gap >= reach) continue;
      const intensity = weight * (1 - gap / reach);
      if (intensity > 0.3) shade.push({ tall: T.p, small: S.p, intensity, side, tallH: T.h, smallH: S.h });
    }
  }

  // chi domina e chi rischia
  const loserCount = new Map(), winnerCount = new Map();
  // tra esemplari della stessa specie non c'è un vincitore: sono solo troppo fitti
  for (const o of overlaps.filter((o) => o.severe)) {
    const same = o.a.name === o.b.name;
    loserCount.set(o.loser.id, (loserCount.get(o.loser.id) ?? 0) + (same ? 0.5 : 1));
    if (!same) winnerCount.set(o.winner.id, (winnerCount.get(o.winner.id) ?? 0) + 1);
  }
  for (const r of roots) {
    if (r.a.name === r.b.name) continue;
    loserCount.set(r.weak.id, (loserCount.get(r.weak.id) ?? 0) + 0.5);
    winnerCount.set(r.strong.id, (winnerCount.get(r.strong.id) ?? 0) + 0.5);
  }
  for (const s of shade.filter((s) => s.intensity > 0.55)) loserCount.set(s.small.id, (loserCount.get(s.small.id) ?? 0) + 1);
  const atRisk = snap.filter((s) => (loserCount.get(s.p.id) ?? 0) >= 1).map((s) => s.p);
  const dominant = snap.filter((s) => (winnerCount.get(s.p.id) ?? 0) >= 1 || s.prof.roots === "invasive").map((s) => s.p);
  const dead = snap.filter((s) => !s.alive).map((s) => s.p);

  let riskPts = overlaps.filter((o) => o.severe).length * 2 + overlaps.filter((o) => !o.severe).length * 0.7 + roots.length * 1.2 + shade.length * 1.5 + dead.length * 1.5;
  riskPts += snap.filter((s) => s.prof.roots === "invasive").length * 2;
  riskPts += density > 140 ? 3 : density > 115 ? 1.5 : 0;
  const scaled = riskPts / Math.max(1, Math.sqrt(snap.length));
  const risk = scaled < 1.2 ? "basso" : scaled < 3 ? "medio" : "alto";
  return { coverage: cov, density, overlaps, roots, shade, atRisk, dominant, dead, risk, riskPts: scaled, snap };
}

// ---------- estetica ----------

function aesthetic(bed, snap, yr, ctx) {
  const alive = snap.filter((s) => s.alive);
  if (!alive.length) return { score: 0, parts: [] };
  const parts = [];
  // 1. copertura: ideale 85-110%, poi l'eccesso affolla
  const c = yr.coverage, d = yr.density;
  let cov = c < 40 ? 0.25 + (c / 40) * 0.25 : c < 85 ? 0.5 + ((c - 40) / 45) * 0.5 : 1;
  if (d > 120) cov -= Math.min(0.5, (d - 120) / 160);
  parts.push({ key: "copertura", value: clamp(cov), text: `copertura ${pct(c)}${d > 120 ? `, chiome sovrapposte (densità ${pct(d)})` : ""}` });

  // 2. altezze in ordine rispetto a chi guarda
  let layer = 1, layerText = "";
  if (ctx.viewer) {
    let hidden = 0, checked = 0;
    for (const [A, B] of pairs(alive)) {
      const da = Math.hypot(A.x - ctx.viewer.x, A.y - ctx.viewer.y), db = Math.hypot(B.x - ctx.viewer.x, B.y - ctx.viewer.y);
      const [near, far] = da < db ? [A, B] : [B, A];
      const dn = Math.min(da, db);
      const angNear = Math.atan2(near.y - ctx.viewer.y, near.x - ctx.viewer.x), angFar = Math.atan2(far.y - ctx.viewer.y, far.x - ctx.viewer.x);
      let dAng = Math.abs(angNear - angFar);
      if (dAng > Math.PI) dAng = 2 * Math.PI - dAng;
      if (dAng > Math.atan2(near.r + far.r * 0.5, dn)) continue;
      checked++;
      if (near.h > far.h + 0.25 && near.h > far.h * 1.3) hidden++;
    }
    layer = checked ? 1 - hidden / checked : 1;
    layerText = hidden ? `${hidden} ${plural(hidden, "pianta bassa resta nascosta", "piante basse restano nascoste")} dietro una più alta` : "piante basse davanti e alte dietro, rispetto a chi guarda";
  } else if ((bed.viewedFrom ?? "all") === "all") {
    // vista da tutti i lati: le più alte al centro
    const cen = centroid(bed.points);
    const ds = alive.map((s) => Math.hypot(s.x - cen.x, s.y - cen.y)), hs = alive.map((s) => s.h);
    const md = ds.reduce((a, b) => a + b, 0) / ds.length, mh = hs.reduce((a, b) => a + b, 0) / hs.length;
    let num = 0, den1 = 0, den2 = 0;
    ds.forEach((dv, i) => {
      num += (dv - md) * (hs[i] - mh);
      den1 += (dv - md) ** 2;
      den2 += (hs[i] - mh) ** 2;
    });
    const corr = den1 && den2 ? num / Math.sqrt(den1 * den2) : 0;
    layer = clamp(0.6 - corr * 0.4);
    layerText = corr < -0.2 ? "piante alte al centro e basse ai bordi" : corr > 0.2 ? "piante alte ai bordi: coprono quelle al centro" : "altezze mescolate";
  }
  if (layerText) parts.push({ key: "altezze", value: clamp(layer), text: layerText });

  // 3. fioriture nelle stagioni
  const seasons = new Set(alive.flatMap((s) => s.p.seasons ?? []));
  const evergreen = alive.some((s) => s.p.evergreen);
  const sv = clamp(seasons.size / 3.5 + (evergreen ? 0.15 : 0));
  parts.push({
    key: "stagioni",
    value: sv,
    text: seasons.size ? `fioriture in ${SEASON_ORDER.filter((x) => seasons.has(x)).map((x) => SEASON_IT[x]).join(", ")}${evergreen ? " e verde anche d'inverno" : ""}` : "fioriture non indicate",
  });

  // 4. colori: da 2 a 4 famiglie stanno bene insieme
  const colors = new Set(alive.flatMap((s) => (s.p.flowerCodes ?? []).filter((x) => x !== "green")));
  const cv = colors.size === 0 ? 0.5 : colors.size === 1 ? 0.75 : colors.size <= 4 ? 1 : colors.size === 5 ? 0.8 : 0.6;
  parts.push({ key: "colori", value: cv, text: colors.size ? `${colors.size} ${plural(colors.size, "colore", "colori")} di fiori${colors.size > 4 ? ": tavolozza un po' confusa" : ""}` : "colori non indicati" });

  // 5. varietà di forme e 6. ripetizione (ritmo)
  const forms = new Set(alive.map((s) => s.p.icon));
  parts.push({ key: "forme", value: forms.size >= 3 ? 1 : forms.size === 2 ? 0.75 : 0.5, text: `${forms.size} ${plural(forms.size, "forma", "forme")} diverse (spighe, cuscini, fogliame...)` });
  const counts = new Map();
  alive.forEach((s) => counts.set(s.p.name, (counts.get(s.p.name) ?? 0) + 1));
  const repeated = alive.filter((s) => counts.get(s.p.name) >= 2).length / alive.length;
  parts.push({ key: "ritmo", value: clamp(repeated / 0.6), text: repeated >= 0.5 ? "specie ripetute: l'aiuola ha un ritmo" : "molte piante singole: effetto un po' a collezione" });

  // 7. salute: piante soffocate o esaurite tolgono bellezza
  const health = clamp(1 - (yr.atRisk.length + yr.dead.length) / Math.max(2, snap.length));
  parts.push({ key: "salute", value: health, text: yr.atRisk.length || yr.dead.length ? `${yr.atRisk.length + yr.dead.length} ${plural(yr.atRisk.length + yr.dead.length, "pianta in difficoltà", "piante in difficoltà")}` : "tutte le piante in buona salute" });

  const W = { copertura: 0.25, altezze: 0.15, stagioni: 0.15, colori: 0.1, forme: 0.1, ritmo: 0.1, salute: 0.15 };
  const totalW = parts.reduce((a, p) => a + W[p.key], 0);
  const score = (parts.reduce((a, p) => a + W[p.key] * p.value, 0) / totalW) * 10;
  return { score: Math.round(score * 2) / 2, parts };
}

// ---------- analisi completa ----------

/**
 * @param bed      aiuola (points, plants, conditions, viewedFrom)
 * @param options  { viewer: {x,y}|null, northDeg: number|null, climate: "nord"|"centro"|"sud" }
 */
export function analyzeBed(bed, { viewer = null, northDeg = null, climate = "centro" } = {}) {
  const plants = (bed?.plants ?? []).filter((p) => p && Number.isFinite(p.x));
  const area = polygonArea(bed?.points ?? []);
  if (!plants.length || area <= 0) return { ok: false, reason: plants.length ? "Aiuola senza area." : "L'aiuola è vuota: aggiungi qualche pianta per vedere come crescerà." };

  const profiles = Object.fromEntries(plants.map((p) => [p.id, growthProfile(p)]));
  const ctx = { area, south: southVector(northDeg), viewer, climate };
  const design = analyzeYear(bed, snapshot(plants, profiles, "design"), ctx);
  const years = Object.fromEntries(YEARS.map((y) => [y, analyzeYear(bed, snapshot(plants, profiles, y), ctx)]));
  const planting = coverage(bed.points, snapshot(plants, profiles, 0).map((s) => ({ x: s.x, y: s.y, r: s.r })));

  // specie (stesso nome = stessa specie)
  const species = [];
  for (const p of plants) {
    let sp = species.find((s) => s.name === p.name);
    if (!sp) {
      sp = { name: p.name, sample: p, profile: profiles[p.id], ids: [] };
      species.push(sp);
    }
    sp.ids.push(p.id);
  }

  // ---- situazione attuale (il progetto così com'è disegnato) ----
  const c = bed.conditions ?? {};
  const compat = [];
  const sunMismatch = plants.filter((p) => c.sunlight && Array.isArray(p.sunlight) && p.sunlight.length && !p.sunlight.includes(c.sunlight));
  const waterSet = new Set(plants.map((p) => p.watering).filter(Boolean));
  const phMismatch = plants.filter((p) => c.ph && Array.isArray(p.soilPh) && p.soilPh.length && !p.soilPh.includes(c.ph));
  const frost = plants.filter((p) => Number.isFinite(p.hardinessMin) && p.hardinessMin > ZONE_MIN[climate]);
  const uniq = (list) => [...new Set(list.map((p) => p.name))];
  if (sunMismatch.length) compat.push(`${uniq(sunMismatch).join(", ")}: ${plural(uniq(sunMismatch).length, "non è adatta", "non sono adatte")} all'esposizione dell'aiuola.`);
  if (waterSet.has("minimum") && waterSet.has("frequent"))
    compat.push(`Insieme ci sono piante che vogliono poca acqua (${uniq(plants.filter((p) => p.watering === "minimum")).join(", ")}) e piante che ne vogliono molta (${uniq(plants.filter((p) => p.watering === "frequent")).join(", ")}): con un'unica irrigazione una delle due soffrirà.`);
  if (phMismatch.length) compat.push(`${uniq(phMismatch).join(", ")}: ${plural(uniq(phMismatch).length, "vuole", "vogliono")} un terreno con pH diverso da quello dell'aiuola.`);
  if (frost.length) compat.push(`${uniq(frost).join(", ")}: ${plural(uniq(frost).length, "teme", "temono")} il freddo invernale ${ZONE_LABEL[climate]}.`);

  const tooClose = [], tooFar = [];
  for (const [A, B] of pairs(design.snap)) {
    const d = Math.hypot(A.x - B.x, A.y - B.y);
    if (d < (A.r + B.r) * 0.55) tooClose.push({ a: A.p, b: B.p, d, ideal: (A.r + B.r) * 0.85 });
  }
  for (const S of design.snap) {
    const nearest = Math.min(...design.snap.filter((o) => o !== S).map((o) => Math.hypot(o.x - S.x, o.y - S.y) - o.r - S.r), Infinity);
    if (Number.isFinite(nearest) && nearest > 0.6) tooFar.push({ p: S.p, gap: nearest });
  }
  const aesNow = aesthetic(bed, design.snap, design, ctx);

  const current = {
    plantingCoverage: planting,
    designCoverage: design.coverage,
    designDensity: design.density,
    compat,
    tooClose,
    tooFar,
    aesthetic: aesNow,
  };

  // ---- sviluppo delle specie ----
  const development = species.map((sp) => {
    const y = Object.fromEntries([0, ...YEARS].map((yy) => [yy, sizeAt(sp.sample, yy, sp.profile)]));
    return { name: sp.name, count: sp.ids.length, profile: sp.profile, sizes: y };
  });

  // ---- manutenzione per anno ----
  const maintenance = Object.fromEntries(
    YEARS.map((yy) => {
      const list = [];
      for (const sp of species) {
        const pr = sp.profile;
        if (pr.habit === "annuale") list.push(`${sp.name}: da riseminare o ripiantare ogni anno.`);
        if (pr.divideEvery && yy >= pr.divideEvery) list.push(`${sp.name}: da dividere (ogni ${pr.divideEvery} anni), il cespo al centro si svuota.`);
        if (pr.prune === "frequente") list.push(`${sp.name}: potatura di contenimento 2-3 volte l'anno.`);
        else if (pr.prune === "annuale" && yy >= 1) list.push(`${sp.name}: potatura annuale.`);
        if (pr.roots === "invasive") list.push(`${sp.name}: contenere le radici (barriera antiradice o estirpare i polloni).`);
        if (pr.habit === "si autosemina" && yy >= 2) list.push(`${sp.name}: diradare le piantine nate da sole.`);
        if (pr.lifespan && pr.habit !== "annuale" && yy > pr.lifespan) list.push(`${sp.name}: a fine vita, da sostituire.`);
      }
      return [yy, [...new Set(list)]];
    }),
  );

  // ---- problemi futuri (solo previsti, senza ripetizioni) ----
  const problems = [];
  const seen = new Set();
  const add = (key, text) => {
    if (seen.has(key)) return;
    seen.add(key);
    problems.push(text);
  };
  for (const yy of YEARS) {
    const Y = years[yy];
    for (const o of Y.overlaps.filter((o) => o.severe))
      add(`ov:${o.a.id}:${o.b.id}`, `Entro ${yy} ${plural(yy, "anno", "anni")} ${overlapText(o)}: troppo vicine.`);
    for (const r of Y.roots)
      add(
        `rt:${r.a.id}:${r.b.id}`,
        r.a.name === r.b.name
          ? `Entro ${yy} ${plural(yy, "anno", "anni")} le radici di due ${r.a.name} vicine si contendono acqua e spazio.`
          : `Entro ${yy} ${plural(yy, "anno", "anni")} le radici di ${r.strong.name} (${r.reason}) entrano in competizione con ${r.weak.name}.`,
      );
    for (const s of Y.shade) add(`sh:${s.tall.id}:${s.small.id}`, `Entro ${yy} ${plural(yy, "anno", "anni")} ${s.tall.name} (alta ${cm(s.tallH)}) fa ombra ${s.side} a ${s.small.name}, che vuole il pieno sole.`);
    for (const d of Y.dead) add(`dd:${d.name}`, `${d.name}: vive circa ${profiles[d.id].lifespan} anni, al ${yy}° anno va sostituita.`);
  }
  if (years[5].density > 130) add("dens", `A 5 anni le chiome occupano il ${pct(years[5].density)} della superficie: l'aiuola sarà sovraffollata.`);
  if (years[3].coverage < 60) add("bare", `A 3 anni resta scoperto il ${pct(100 - years[3].coverage)} del terreno: crescono le erbacce.`);
  for (const t of compat) add(`cp:${t}`, t);

  // ---- suggerimenti ----
  const reduce = [], increase = [], alternatives = [];
  for (const sp of species) {
    const ids = new Set(sp.ids);
    const severe = years[3].overlaps.filter((o) => o.severe && (ids.has(o.a.id) || ids.has(o.b.id))).length;
    if (sp.profile.roots === "invasive") reduce.push({ name: sp.name, why: "radici invasive: toglila o mettila in un contenitore interrato" });
    else if (severe && sp.ids.length > 1) {
      const target = Math.max(1, sp.ids.length - Math.ceil(severe / 2));
      if (target < sp.ids.length) reduce.push({ name: sp.name, from: sp.ids.length, to: target, why: `a 3 anni ${severe} ${plural(severe, "sovrapposizione forte", "sovrapposizioni forti")}` });
    }
  }
  if (years[3].coverage < 70) {
    const healthy = species.filter((sp) => !sp.ids.some((id) => years[3].atRisk.some((p) => p.id === id)) && sp.profile.roots !== "invasive" && sp.profile.habit !== "annuale");
    const missing = ((70 - years[3].coverage) / 100) * area;
    for (const sp of healthy.slice(0, 2)) {
      const r = sizeAt(sp.sample, 3, sp.profile).spread / 2;
      const n = Math.max(1, Math.round(missing / healthy.slice(0, 2).length / (Math.PI * r * r)));
      increase.push({ name: sp.name, add: n, why: `a 3 anni il terreno coperto è solo il ${pct(years[3].coverage)}` });
    }
  }
  const shaded = new Set(years[3].shade.map((s) => s.small.name));
  for (const sp of species) {
    const reasons = [];
    const p = sp.sample;
    let sunlight = c.sunlight ?? null;
    if (shaded.has(sp.name)) {
      reasons.push("resterà all'ombra di piante più alte");
      sunlight = "part_shade";
    }
    if (sunMismatch.some((q) => q.name === sp.name)) reasons.push("non adatta all'esposizione");
    if (frost.some((q) => q.name === sp.name)) reasons.push("teme il freddo della zona");
    if (phMismatch.some((q) => q.name === sp.name)) reasons.push("vuole un altro pH");
    if (sp.profile.lifespan && sp.profile.lifespan <= 4 && sp.profile.habit !== "annuale" && sp.profile.habit !== "si autosemina") reasons.push(`dura solo ${sp.profile.lifespan} anni`);
    if (!reasons.length) continue;
    alternatives.push({
      forName: sp.name,
      why: reasons.join(", "),
      filters: { sunlight: sunlight ?? undefined, watering: c.watering ?? p.watering ?? undefined, ph: c.ph ?? undefined, color: (p.flowerCodes ?? []).find((x) => x !== "green") },
      exclude: sp.name,
    });
  }

  // ---- voti ----
  const aes3 = aesthetic(bed, years[3].snap, years[3], ctx);
  const aes5 = aesthetic(bed, years[5].snap, years[5], ctx);
  let maint = 0;
  const maintWhy = [];
  for (const sp of species) {
    const pr = sp.profile, n = sp.ids.length;
    if (pr.prune === "frequente") maint += 0.6 * n;
    else if (pr.prune === "annuale") maint += 0.25 * n;
    if (pr.divideEvery && pr.divideEvery <= 5) maint += 0.35 * n;
    if (pr.roots === "invasive") maint += 2;
    if (pr.habit === "annuale") maint += 0.3 * n;
    if (pr.habit === "si autosemina") maint += 0.3;
    if (pr.lifespan && pr.lifespan <= 5 && pr.habit !== "annuale") maint += 0.4 * n;
  }
  if (waterSet.has("minimum") && waterSet.has("frequent")) maint += 1.5;
  maint += years[5].overlaps.filter((o) => o.severe).length * 0.4;
  const maintenanceRisk = Math.round(clamp((maint / Math.sqrt(Math.max(1, plants.length))) * 1.6, 0, 10) * 2) / 2;
  if (species.some((s) => s.profile.prune === "frequente")) maintWhy.push("potature frequenti");
  if (species.some((s) => s.profile.divideEvery && s.profile.divideEvery <= 5)) maintWhy.push("divisioni dei cespi");
  if (species.some((s) => s.profile.habit === "annuale")) maintWhy.push("piante da ripiantare ogni anno");
  if (species.some((s) => s.profile.roots === "invasive")) maintWhy.push("radici invasive da contenere");
  if (waterSet.has("minimum") && waterSet.has("frequent")) maintWhy.push("bisogni d'acqua diversi");
  if (!maintWhy.length) maintWhy.push("piante che chiedono poche cure");

  const d5 = years[5].density;
  const crowd = d5 <= 100 ? (d5 / 100) * 3 : d5 <= 130 ? 3 + ((d5 - 100) / 30) * 2.5 : 5.5 + Math.min(4.5, ((d5 - 130) / 70) * 4.5);
  const overcrowdingRisk = Math.round(clamp(crowd + years[5].overlaps.filter((o) => o.severe).length * 0.4, 0, 10) * 2) / 2;

  return {
    ok: true,
    area,
    plantCount: plants.length,
    assumptions: { viewer: Boolean(viewer), orientation: northDeg != null },
    current,
    development,
    years,
    maintenance,
    problems,
    suggestions: { reduce, increase, alternatives },
    scores: {
      aestheticNow: aesNow.score,
      aesthetic3: aes3.score,
      aesthetic5: aes5.score,
      maintenance: maintenanceRisk,
      overcrowding: overcrowdingRisk,
      why: {
        aestheticNow: aesNow.parts,
        aesthetic3: aes3.parts,
        aesthetic5: aes5.parts,
        maintenance: maintWhy,
        overcrowding: `a 5 anni le chiome occupano il ${pct(d5)} della superficie, con ${years[5].overlaps.filter((o) => o.severe).length} sovrapposizioni forti`,
      },
    },
  };
}

/** Misure e segnalazioni per il disegno di un certo anno (0 = oggi). */
export function plantStatesAt(bed, year) {
  const plants = bed?.plants ?? [];
  const out = {};
  for (const p of plants) {
    const s = sizeAt(p, year);
    out[p.id] = { spread: s.spread, alive: s.alive };
  }
  return out;
}

export { SPEED_LABEL, ROOTS_LABEL };
