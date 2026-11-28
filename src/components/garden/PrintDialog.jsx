import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useElementSize } from "../../hooks/useElementSize";
import { bloomSummary, monthsInRange, periodLabel } from "../../lib/bloom";
import { formatM, formatM2, polygonArea } from "../../lib/geometry";
import { SOIL_TEXTURE, SUNLIGHT, floweringLabel } from "../../lib/labels";
import { describeOrientation } from "../../lib/orientation";
import { MARGIN, PAD, PAPERS, bedsToPrint, fitScale, heightLabel, numberPlants, planBounds } from "../../lib/printPlan";
import "../../styles/print.css";
import { MonthPicker } from "./BloomPanel";
import { Blossom } from "./PlanSymbols";
import PlanSvg from "./PlanSvg";

const MM_PX = 96 / 25.4; // pixel CSS per millimetro
const HEADER_H = 22; // mm
const FOOTER_H = 7; // mm
const SIDE_W = 100; // mm: colonna destra (legenda e informazioni)
const GAP = 5; // mm

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" }) : null);
const uniq = (arr) => [...new Set(arr.filter(Boolean))];

function Legend({ items, withBloom, bloomKeys, columns }) {
  return (
    <table className="plan-table">
      <thead>
        <tr>
          <th className="num">N.</th>
          <th>Pianta</th>
          {columns.variety && <th>Varietà</th>}
          <th className="qty">Qtà</th>
          {columns.height && <th>Altezza</th>}
          {columns.spread && <th>Distanza</th>}
          {columns.months && <th>Fioritura</th>}
          {withBloom && (
            <th className="flag" title="In fioritura nel periodo scelto">
              <Blossom size={11} />
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {items.map((it) => (
          <tr key={it.key}>
            <td className="num">{it.n}</td>
            <td>{it.name}</td>
            {columns.variety && <td>{it.variety ?? ""}</td>}
            <td className="qty">{it.count}</td>
            {columns.height && <td>{heightLabel(it.heightCm) ?? "–"}</td>}
            {columns.spread && <td>{it.spreadM ? formatM(it.spreadM) : "–"}</td>}
            {columns.months && <td>{it.months?.length ? floweringLabel(it.months, { short: true }) : "n.d."}</td>}
            {withBloom && <td className="flag">{bloomKeys.has(it.key) ? <Blossom size={11} /> : ""}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SheetHeader({ project, scope, beds, paper, scale, period, bounds }) {
  const area = beds.reduce((s, b) => s + polygonArea(b.points), 0);
  const modified = fmtDate(project.updatedAt);
  return (
    <header className="plan-head">
      <div className="plan-head-main">
        <p className="plan-eyebrow">AiuolaLab · Tavola di progetto</p>
        <h1>{project.name}</h1>
        <p className="plan-sub">{scope === "all" && beds.length > 1 ? `${beds.length} aree: ${beds.map((b) => b.name).join(", ")}` : beds.map((b) => b.name).join(", ")}</p>
      </div>
      <dl className="plan-meta">
        {modified && (
          <>
            <dt>Ultima modifica</dt>
            <dd>{modified}</dd>
          </>
        )}
        {bounds && (
          <>
            <dt>Dimensioni</dt>
            <dd>
              {formatM(bounds.w)} × {formatM(bounds.h)} · {formatM2(area)}
            </dd>
          </>
        )}
        <dt>Scala</dt>
        <dd>
          1:{scale} · {paper}
        </dd>
        {period && (
          <>
            <dt>Fioritura</dt>
            <dd>{period}</dd>
          </>
        )}
      </dl>
    </header>
  );
}

export default function PrintDialog({ project, monthsOf, bloom, onClose }) {
  const [paper, setPaper] = useState("A4");
  const [scope, setScope] = useState("all");
  const [bloomOpt, setBloomOpt] = useState({ on: bloom.on, from: bloom.from, to: bloom.to, picking: false });
  const [notes, setNotes] = useState("");
  const previewRef = useRef(null);
  const { width: viewW } = useElementSize(previewRef);

  const sheet = PAPERS[paper];
  const beds = useMemo(() => bedsToPrint(project, scope === "all" ? null : scope), [project, scope]);
  const numbering = useMemo(() => numberPlants(beds, monthsOf), [beds, monthsOf]);
  const selectedMonths = useMemo(() => monthsInRange(bloomOpt.from, bloomOpt.to), [bloomOpt.from, bloomOpt.to]);
  const summary = useMemo(() => (bloomOpt.on ? bloomSummary(beds, selectedMonths, monthsOf) : null), [bloomOpt.on, beds, selectedMonths, monthsOf]);
  const bloomKeys = useMemo(() => {
    const keys = new Set();
    summary?.list.forEach((g) => keys.add(g.key));
    return keys;
  }, [summary]);

  // geometria della tavola (mm)
  const contentW = sheet.w - 2 * MARGIN;
  const contentH = sheet.h - 2 * MARGIN;
  const mainH = contentH - HEADER_H - FOOTER_H - 2 * GAP;
  const legendOnOwnPage = numbering.items.length > sheet.legendRows;
  const planArea = { w: contentW - SIDE_W - GAP, h: mainH };
  const bounds = planBounds(beds);
  const scale = bounds ? fitScale(bounds, { w: planArea.w - PAD.left - PAD.right, h: planArea.h - PAD.top - PAD.bottom }) : 50;

  const columns = {
    variety: numbering.items.some((it) => it.variety),
    height: numbering.items.some((it) => it.heightCm != null),
    spread: numbering.items.some((it) => it.spreadM),
    months: numbering.items.some((it) => it.months?.length),
  };

  // informazioni aggiuntive: solo quelle disponibili
  const info = useMemo(() => {
    const rows = [];
    const label = (b) => (beds.length > 1 ? `${b.name}: ` : "");
    const sun = beds.filter((b) => SUNLIGHT[b.conditions?.sunlight]).map((b) => `${label(b)}${SUNLIGHT[b.conditions.sunlight].label}`);
    const soil = beds.filter((b) => SOIL_TEXTURE[b.conditions?.texture]).map((b) => `${label(b)}${SOIL_TEXTURE[b.conditions.texture]}`);
    if (sun.length) rows.push(["Esposizione solare", uniq(sun)]);
    if (soil.length) rows.push(["Tipologia di terreno", uniq(soil)]);
    if (project.northDeg != null) rows.push(["Orientamento", [describeOrientation(project.northDeg)]]);
    return rows;
  }, [beds, project.northDeg]);

  const period = bloomOpt.on ? periodLabel(bloomOpt) : null;

  // pagina e stile di stampa; il resto dell'app si nasconde solo mentre la tavola è aperta
  useEffect(() => {
    const style = document.createElement("style");
    style.dataset.printPage = "1";
    style.textContent = `@page { size: ${sheet.w}mm ${sheet.h}mm; margin: 0; }`;
    document.head.appendChild(style);
    document.body.classList.add("printing-plan");
    return () => {
      style.remove();
      document.body.classList.remove("printing-plan");
    };
  }, [sheet.w, sheet.h]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const sheetPx = sheet.w * MM_PX;
  const zoom = viewW ? Math.min(1, (viewW - 24) / sheetPx) : 1;
  const sheetsCount = legendOnOwnPage ? 2 : 1;

  const legend = <Legend items={numbering.items} withBloom={Boolean(summary)} bloomKeys={bloomKeys} columns={columns} />;
  const bloomNote = summary && (
    <p className="plan-note">
      <Blossom size={11} /> In fioritura a {period}
      <span> · senza simbolo: fuori dal periodo di fioritura o fioritura non specificata.</span>
    </p>
  );

  const pageStyle = { width: `${sheet.w}mm`, height: `${sheet.h}mm`, padding: `${MARGIN}mm` };

  const node = (
    <div className="print-root" role="dialog" aria-modal="true" aria-label="Anteprima di stampa">
      <div className="print-ui">
        <div className="print-ui-row">
          <strong className="print-ui-title">
            <i className="fa-solid fa-print" /> Stampa progetto
          </strong>
          <div className="print-ui-actions">
            <button className="button is-primary is-small" onClick={() => window.print()}>
              <i className="fa-solid fa-print" />&nbsp;Stampa / Salva PDF
            </button>
            <button className="button is-small" onClick={onClose}>
              Chiudi
            </button>
          </div>
        </div>
        <div className="print-ui-opts">
          <fieldset>
            <legend>Formato</legend>
            {Object.entries(PAPERS).map(([id, p]) => (
              <label key={id}>
                <input type="radio" name="paper" checked={paper === id} onChange={() => setPaper(id)} /> {p.label}
              </label>
            ))}
          </fieldset>
          {project.beds.length > 1 && (
            <fieldset>
              <legend>Cosa stampare</legend>
              <select value={scope} onChange={(e) => setScope(e.target.value)} aria-label="Cosa stampare">
                <option value="all">Tutto il progetto</option>
                {project.beds.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </fieldset>
          )}
          <fieldset className="print-ui-bloom">
            <legend>Fioritura</legend>
            <label>
              <input type="checkbox" checked={bloomOpt.on} onChange={(e) => setBloomOpt((b) => ({ ...b, on: e.target.checked }))} /> Segna le piante in fioritura
              {bloomOpt.on && <strong> ({period})</strong>}
            </label>
            {bloomOpt.on && <MonthPicker bloom={bloomOpt} onChange={(patch) => setBloomOpt((b) => ({ ...b, ...patch }))} />}
          </fieldset>
          <fieldset className="print-ui-notes">
            <legend>Note del progetto (facoltative)</legend>
            <textarea rows={3} value={notes} maxLength={600} onChange={(e) => setNotes(e.target.value)} placeholder="Appunti, osservazioni, avvertenze per la realizzazione…" />
          </fieldset>
        </div>
        <p className="print-ui-tip">
          Per ottenere un PDF scegli «Salva come PDF» come stampante. Nel riquadro di stampa del browser imposta margini «Nessuno» e disattiva «Intestazioni e piè di pagina».
        </p>
      </div>

      <div className="print-preview" ref={previewRef}>
        <div className="print-pages" style={{ width: sheetPx * zoom, "--zoom": zoom }}>
          {/* Tavola 1: intestazione, planimetria e colonna destra */}
          <div className="print-page-frame" style={{ height: sheet.h * MM_PX * zoom }}>
            <section className="plan-sheet" style={pageStyle}>
              <SheetHeader project={project} scope={scope} beds={beds} paper={paper} scale={scale} period={period} bounds={bounds} />
              <div className="plan-main" style={{ height: `${mainH}mm`, gridTemplateColumns: `${planArea.w}mm ${SIDE_W}mm`, gap: `${GAP}mm` }}>
                <div className="plan-drawing">
                  {bounds ? (
                    <PlanSvg beds={beds} scale={scale} area={planArea} numberOf={numbering.numberOf} bloomIds={summary?.bloomingIds ?? null} northDeg={project.northDeg ?? null} />
                  ) : (
                    <p className="plan-empty">Nessuna area da stampare.</p>
                  )}
                </div>
                <aside className="plan-side">
                  <h2>Legenda botanica</h2>
                  {legendOnOwnPage ? <p className="plan-note">Elenco completo a pagina 2 ({numbering.items.length} voci).</p> : numbering.items.length ? legend : <p className="plan-note">Nessuna pianta nel progetto.</p>}
                  {!legendOnOwnPage && numbering.total > 0 && (
                    <p className="plan-total">
                      {numbering.total} {numbering.total === 1 ? "pianta" : "piante"} · {numbering.items.length} {numbering.items.length === 1 ? "voce" : "voci"}
                    </p>
                  )}
                  {bloomNote}
                  {info.length > 0 && (
                    <>
                      <h2>Informazioni</h2>
                      <dl className="plan-info">
                        {info.map(([k, v]) => (
                          <div key={k}>
                            <dt>{k}</dt>
                            {v.map((line) => (
                              <dd key={line}>{line}</dd>
                            ))}
                          </div>
                        ))}
                      </dl>
                    </>
                  )}
                  {notes.trim() && (
                    <>
                      <h2>Note</h2>
                      <p className="plan-notes-text">{notes.trim()}</p>
                    </>
                  )}
                </aside>
              </div>
              <footer className="plan-foot">
                <span>AiuolaLab · {project.name}</span>
                <span>
                  Tavola 1 di {sheetsCount} · scala 1:{scale} (stampa al 100%)
                </span>
              </footer>
            </section>
          </div>

          {/* Tavola 2: legenda completa quando le voci sono troppe per la colonna */}
          {legendOnOwnPage && (
            <div className="print-page-frame" style={{ height: sheet.h * MM_PX * zoom }}>
              <section className="plan-sheet" style={pageStyle}>
                <SheetHeader project={project} scope={scope} beds={beds} paper={paper} scale={scale} period={period} bounds={bounds} />
                <div className="plan-side is-wide" style={{ height: `${mainH}mm` }}>
                  <h2>Legenda botanica</h2>
                  {legend}
                  <p className="plan-total">
                    {numbering.total} piante · {numbering.items.length} voci
                  </p>
                  {bloomNote}
                </div>
                <footer className="plan-foot">
                  <span>AiuolaLab · {project.name}</span>
                  <span>Tavola 2 di 2</span>
                </footer>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  return createPortal(node, document.body);
}
