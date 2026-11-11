import assert from "node:assert/strict";
import { test } from "node:test";
import { GARDEN_STYLES } from "../src/lib/gardenStyles.js";
import { SITEMAP_PATHS, pageMeta, sharedMeta } from "../src/lib/seo.js";
import { STYLE_GUIDE } from "../src/lib/styleGuide.js";
import { hasStylePhoto, stylePhoto } from "../src/lib/stylePhotos.js";
import { renderIndex } from "../server/seo.js";

const HTML = `<html><head>
    <meta name="description" content="vecchia" />
    <title>AiuolaLab</title>
  </head><body></body></html>`;

test("ogni stile ha la sua pagina con titolo e descrizione", () => {
  for (const s of GARDEN_STYLES) {
    const m = pageMeta(`/stili/${s.id}`);
    assert.ok(m.title.startsWith(s.name), s.id);
    assert.ok(m.description.includes(s.tagline), s.id);
    assert.ok(SITEMAP_PATHS.includes(`/stili/${s.id}`));
  }
  assert.equal(pageMeta("/stili/").title, pageMeta("/stili").title);
  assert.equal(pageMeta("/stili/inesistente").title, "AiuolaLab");
});

test("consigli pratici completi per ogni stile", () => {
  for (const s of GARDEN_STYLES) {
    const g = STYLE_GUIDE[s.id];
    assert.ok(g, `manca ${s.id}`);
    assert.ok([1, 2, 3].includes(g.cost.level) && g.cost.text, s.id);
    assert.ok(g.space && g.mistake, s.id);
    for (const k of ["primavera", "estate", "autunno", "inverno"]) assert.ok(g.seasons[k], `${s.id} ${k}`);
    assert.ok(g.balcony.text && g.balcony.plants.length >= 3, s.id);
    assert.ok(g.sizes.length && g.sizes.every((z) => ["balcone", "piccolo", "grande"].includes(z)), s.id);
  }
  assert.deepEqual(Object.keys(STYLE_GUIDE).sort(), GARDEN_STYLES.map((s) => s.id).sort());
});

test("foto degli stili: anteprima solo se c'è la foto", () => {
  assert.ok(hasStylePhoto("cottage"));
  assert.equal(stylePhoto("cottage").og, "/img/stili/cottage-og.jpg");
  assert.equal(stylePhoto("roccioso"), null);
  assert.equal(pageMeta("/stili/cottage").image, "/img/stili/cottage-og.jpg");
  assert.equal(pageMeta("/stili/roccioso").image, "/img/og-aiuolalab.jpg");
});

test("i meta finiscono nell'HTML, con i caratteri speciali protetti", () => {
  const out = renderIndex(HTML, sharedMeta('Il "mio" <orto>'), { origin: "https://esempio.it", pathname: "/condiviso/abc" });
  assert.match(out, /<title>«Il &quot;mio&quot; &lt;orto&gt;» · progetto su AiuolaLab<\/title>/);
  assert.doesNotMatch(out, /<orto>/);
  assert.match(out, /<meta property="og:image" content="https:\/\/esempio.it\/img\/og-aiuolalab.jpg" \/>/);
  assert.match(out, /name="robots" content="noindex"/);
  assert.doesNotMatch(out, /content="vecchia"/);

  const style = renderIndex(HTML, pageMeta("/stili/italiano"), { origin: "https://esempio.it", pathname: "/stili/italiano" });
  assert.match(style, /<link rel="canonical" href="https:\/\/esempio.it\/stili\/italiano" \/>/);
  assert.match(style, /og:image" content="https:\/\/esempio.it\/img\/stili\/italiano-og.jpg"/);
});

test("pagina dei termini di utilizzo", () => {
  assert.match(pageMeta("/termini").title, /^Termini di utilizzo/);
});

test("nel nome di un progetto i segni come $& e $' restano testo", () => {
  const out = renderIndex(HTML, sharedMeta("Orto $& $' $`"), { origin: "https://esempio.it", pathname: "/condiviso/abc" });
  assert.match(out, /<title>«Orto \$&amp; \$' \$`» · progetto su AiuolaLab<\/title>/);
  assert.equal(out.match(/<title>/g).length, 1);
});
