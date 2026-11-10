import { useMemo, useState } from "react";
import { bbox, formatM, formatM2, perimeter, polygonArea } from "../../lib/geometry";
import { SOIL_PH, SOIL_TEXTURE, SUNLIGHT, WATERING } from "../../lib/labels";
import { getIconUrl, iconForPlaced } from "../../lib/plantIcons";
import { EDGINGS, FLOORS, RAILINGS, SURFACES, floorPreview, surfacePreview } from "../../lib/textures";
import { POT_MATERIALS, POT_TYPES, isFloor, isPot, potVolumeL, resizePot } from "../../lib/containers";
import { companionReport, rotationWarnings } from "../../lib/crops";
import { PETS, plantInfo, toxLevelLabel } from "../../lib/plantInfo";
import { useSession } from "../../lib/session";
import { MULCHES, SOIL_BAG, bedMaterials, formatEur } from "../../lib/budget";

// Riepilogo dei rischi dell'aiuola: piante tossiche e animali da cui difenderla.
function BedRisks({ bed }) {
  const { settings } = useSession();
  const myPets = settings.pets ?? [];
  const seen = new Map();
  for (const p of bed.plants ?? []) {
    const key = p.cropId ?? p.plantId ?? p.name;
    if (!seen.has(key)) seen.set(key, { name: p.name, info: plantInfo(p, { climate: settings.climate }) });
  }
  const toxic = [...seen.values()].filter((s) => s.info.tox);
  const wildlife = new Map();
  for (const s of seen.values()) for (const w of s.info.wildlife) {
    if (/evit/.test(w.note)) continue; // animali che la evitano: non è un rischio
    const list = wildlife.get(w.who) ?? [];
    list.push(s.name);
    wildlife.set(w.who, list);
  }
  const invasive = [...seen.values()].filter((s) => s.info.invasive);
  if (!toxic.length && !wildlife.size && !invasive.length) return null;
  return (
    <>
      <h3 className="gp-heading">Rischi e fauna</h3>
      {invasive.map((s) => (
        <p key={s.name} className="panel-error">
          <i className="fa-solid fa-ban" /> {s.info.invasive}
        </p>
      ))}
      {toxic.map((s) => {
        const mine = s.info.tox.to.filter((t) => myPets.includes(t));
        return (
          <p key={s.name} className={mine.length || s.info.tox.level === "high" ? "panel-warning" : "panel-note"}>
            <i className="fa-solid fa-skull-crossbones" /> <strong>{s.name}</strong>: tossica per {s.info.tox.to.map((t) => PETS[t]).join(", ")} (rischio{" "}
            {toxLevelLabel(s.info.tox.level)})
          </p>
        );
      })}
      {[...wildlife.entries()].map(([who, names]) => (
        <p key={who} className="panel-note">
          <i className="fa-solid fa-paw" /> <strong>{who[0].toUpperCase() + who.slice(1)}</strong>: {names.join(", ")}
        </p>
      ))}
    </>
  );
}

function VegetablePanel({ bed, onEndSeason }) {
  const [confirming, setConfirming] = useState(false);
  const report = companionReport(bed.plants ?? []);
  const rotation = rotationWarnings(bed);
  const year = new Date().getFullYear();
  const last = (bed.history ?? []).filter((h) => h.year < year).sort((a, b) => b.year - a.year)[0];
  return (
    <>
      <h3 className="gp-heading">Orto</h3>
      {report.bad.map((b) => (
        <p key={b.a + b.b} className="panel-warning">
          <i className="fa-solid fa-triangle-exclamation" /> <strong>{b.a}</strong> e <strong>{b.b}</strong> non stanno bene vicini
          (linea rossa sul disegno): allontanali o cambia una delle due colture.
        </p>
      ))}
      {rotation.length > 0 && (
        <p className="panel-warning">
          <i className="fa-solid fa-rotate" /> Rotazione: l'anno scorso qui c'erano {rotation.join(", ").toLowerCase()}. Ripiantare la
          stessa famiglia nello stesso posto favorisce malattie e impoverisce il terreno.
        </p>
      )}
      {report.good.length > 0 && (
        <p className="panel-note">
          <i className="fa-solid fa-heart" style={{ color: "#4f7942" }} /> Buone consociazioni: {report.good.map((g) => `${g.a} + ${g.b}`).join(", ").toLowerCase()}.
        </p>
      )}
      {last && <p className="panel-note">Nel {last.year}: {last.families.join(", ") || "nessuna coltura registrata"}.</p>}
      {!confirming ? (
        <button className="button is-small is-light" onClick={() => setConfirming(true)}>
          <i className="fa-solid fa-flag-checkered" />&nbsp; Fine stagione
        </button>
      ) : (
        <div className="delete-box">
          <p>Registro le famiglie coltivate quest'anno per consigliarti la rotazione. Vuoi anche svuotare l'aiuola?</p>
          <div className="buttons mt-2">
            <button className="button is-small" onClick={() => (onEndSeason(bed.id, false), setConfirming(false))}>
              Registra e basta
            </button>
            <button className="button is-small is-primary" onClick={() => (onEndSeason(bed.id, true), setConfirming(false))}>
              Registra e svuota
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// Quanto materiale serve per questa aiuola o vaso.
function BedMaterials({ bed, soilCm }) {
  const { soil, mulch } = bedMaterials(bed, { soilCm });
  if (!soil && !mulch) return null;
  return (
    <p className="panel-note">
      <i className="fa-solid fa-cart-shopping" /> Servono circa{" "}
      {soil && (
        <>
          <strong>
            {soil.bags} {soil.bags === 1 ? "sacco" : "sacchi"}
          </strong>{" "}
          di terriccio ({soil.litres} L, sacchi da {SOIL_BAG.bagL} L)
        </>
      )}
      {soil && mulch && " e "}
      {mulch && (
        <>
          <strong>
            {mulch.qty} {mulch.qty === 1 ? mulch.unit.replace(/i$/, "o") : mulch.unit}
          </strong>{" "}
          di {mulch.label.toLowerCase()} ({mulch.m2 ? `${mulch.m2.toLocaleString("it-IT")} m² con le sovrapposizioni` : `${mulch.litres} L, strato di ${MULCHES[mulch.kind].layerCm} cm`})
        </>
      )}
      : {formatEur((soil?.eur ?? 0) + (mulch?.eur ?? 0))}.
    </p>
  );
}

function SizeInput({ label, value, onChange }) {
  return (
    <label className="mini-select">
      <span>{label}</span>
      <input
        type="number"
        min="10"
        max="300"
        step="5"
        value={Math.round(value * 100)}
        onChange={(e) => {
          const cm = Number(e.target.value);
          if (cm >= 10 && cm <= 300) onChange(cm / 100);
        }}
      />
    </label>
  );
}

function Choice({ label, value, options, onChange, allowEmpty = true }) {
  return (
    <div className="gp-field">
      <span className="gp-label">{label}</span>
      <div className="choice-row">
        {Object.entries(options).map(([k, v]) => (
          <button
            key={k}
            type="button"
            className={`choice ${value === k ? "is-active" : ""}`}
            onClick={() => onChange(value === k && allowEmpty ? undefined : k)}
            aria-pressed={value === k}
          >
            {v.icon && <i className={`fa-solid ${v.icon}`} />}
            {v.swatch && <span className="dot" style={{ background: v.swatch }} />} {typeof v === "string" ? v : v.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function BedInspector({ project, bed, selection, onSelect, onUpdate, onReplace, onDeletePlant, onDeleteBed, onRemovePlants, onGoTo, onEndSeason }) {
  const stats = useMemo(() => {
    if (!bed) return null;
    const b = bbox(bed.points);
    return { area: polygonArea(bed.points), perimeter: perimeter(bed.points), width: b.width, height: b.height };
  }, [bed]);

  const groups = useMemo(() => {
    const map = new Map();
    for (const p of bed?.plants ?? []) {
      const key = p.cropId ?? p.plantId ?? p.name;
      const g = map.get(key) ?? { key, name: p.name, icon: iconForPlaced(p), ids: [] };
      g.ids.push(p.id);
      map.set(key, g);
    }
    return [...map.values()].sort((a, b) => b.ids.length - a.ids.length);
  }, [bed]);

  if (!bed) {
    return (
      <div className="bed-inspector">
        {project.beds.length ? (
          <>
            <p className="panel-note">Tocca un'aiuola sul disegno o sceglila qui:</p>
            <ul className="bed-list">
              {project.beds.map((b) => (
                <li key={b.id}>
                  <button onClick={() => onSelect({ bedId: b.id, plantId: null })}>
                    <i className={`fa-solid ${isPot(b) ? "fa-bucket" : isFloor(b) ? "fa-border-all" : "fa-draw-polygon"}`} /> {b.name}
                    <small>
                      {formatM2(polygonArea(b.points))} · {b.plants?.length ?? 0} piante
                    </small>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="empty-state">
            <i className="fa-solid fa-draw-polygon" />
            <p>
              {project.type === "balcony" ? (
                <>
                  Premi <strong>Disegna terrazzo</strong> per segnare il pavimento, poi <strong>Aggiungi vaso</strong> per vasi,
                  fioriere e vasi appesi.
                </>
              ) : (
                <>
                  Nessuna aiuola. Premi <strong>Disegna aiuola</strong> e tocca il terreno per segnare gli angoli, oppure{" "}
                  <strong>Aggiungi vaso</strong>.
                </>
              )}
            </p>
          </div>
        )}
      </div>
    );
  }

  const pot = isPot(bed);
  const floor = isFloor(bed);
  const c = bed.conditions ?? {};
  const setCond = (key, value) => onUpdate(bed.id, { conditions: { ...c, [key]: value } });
  const selectedPlant = selection?.plantId ? bed.plants.find((p) => p.id === selection.plantId) : null;

  return (
    <div className="bed-inspector">
      <div className="gp-field">
        <label className="gp-label" htmlFor="bed-name">
          Nome
        </label>
        <input
          id="bed-name"
          className="input is-small"
          value={bed.name}
          maxLength={60}
          onChange={(e) => onUpdate(bed.id, { name: e.target.value })}
        />
      </div>

      {pot ? (
        <div className="stats-row">
          <div>
            <strong>{POT_TYPES[bed.pot.type]?.label}</strong>
            <span>tipo</span>
          </div>
          <div>
            <strong>{potVolumeL(bed.pot)} litri</strong>
            <span>terriccio circa</span>
          </div>
          <div>
            <strong>{formatM2(stats.area)}</strong>
            <span>superficie</span>
          </div>
        </div>
      ) : (
      <div className="stats-row">
        <div>
          <strong>{formatM2(stats.area)}</strong>
          <span>superficie</span>
        </div>
        <div>
          <strong>{formatM(stats.perimeter)}</strong>
          <span>perimetro (bordura)</span>
        </div>
        <div>
          <strong>
            {formatM(stats.width)} × {formatM(stats.height)}
          </strong>
          <span>ingombro</span>
        </div>
      </div>
      )}
      <BedMaterials bed={bed} soilCm={project.budget?.soilCm} />

      {selectedPlant && (
        <div className="selected-plant">
          <img
            className="legend-icon"
            src={getIconUrl(iconForPlaced(selectedPlant).type, iconForPlaced(selectedPlant).colors, 64, selectedPlant.name)}
            alt=""
          />
          <div>
            <strong>{selectedPlant.name}</strong>
            <small>
              ingombro {formatM(selectedPlant.spreadM)}
              {selectedPlant.heightCm ? ` · altezza ${selectedPlant.heightCm} cm` : ""}
            </small>
          </div>
          <button className="button is-small is-danger is-light" onClick={onDeletePlant}>
            Rimuovi
          </button>
        </div>
      )}

      {pot && (
        <>
          <h3 className="gp-heading">Vaso</h3>
          <div className="field-grid">
            {bed.pot.shape === "round" ? (
              <SizeInput label="Diametro (cm)" value={bed.pot.w} onChange={(w) => onReplace(resizePot(bed, { w }))} />
            ) : (
              <>
                <SizeInput label="Lunghezza (cm)" value={bed.pot.w} onChange={(w) => onReplace(resizePot(bed, { w }))} />
                <SizeInput label="Larghezza (cm)" value={bed.pot.d} onChange={(d) => onReplace(resizePot(bed, { d }))} />
              </>
            )}
            <SizeInput label="Profondità (cm)" value={bed.pot.depth} onChange={(depth) => onReplace(resizePot(bed, { depth }))} />
            {bed.pot.shape === "rect" && (
              <button className="button is-small is-light rotate-btn" onClick={() => onReplace(resizePot(bed, { w: bed.pot.d, d: bed.pot.w }))}>
                <i className="fa-solid fa-rotate" />&nbsp; Ruota 90°
              </button>
            )}
          </div>
          <Choice
            label="Materiale"
            value={bed.pot.material}
            options={Object.fromEntries(Object.entries(POT_MATERIALS).map(([k, v]) => [k, { label: v.label, swatch: v.color }]))}
            onChange={(v) => onReplace({ ...bed, pot: { ...bed.pot, material: v } })}
            allowEmpty={false}
          />
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={bed.pot.hanging}
              onChange={(e) => onReplace({ ...bed, pot: { ...bed.pot, hanging: e.target.checked } })}
            />{" "}
            Vaso appeso (a parete, ringhiera o soffitto)
          </label>
        </>
      )}

      {floor ? (
        <>
          <h3 className="gp-heading">Terrazzo</h3>
          <Choice label="Esposizione" value={c.sunlight} options={SUNLIGHT} onChange={(v) => setCond("sunlight", v)} allowEmpty={false} />
          <div className="gp-field">
            <span className="gp-label">Pavimento</span>
            <div className="material-row">
              {Object.entries(FLOORS).map(([k, v]) => (
                <button
                  key={k}
                  type="button"
                  className={`material ${(bed.floor ?? "cotto") === k ? "is-active" : ""}`}
                  onClick={() => onUpdate(bed.id, { floor: k })}
                  aria-pressed={(bed.floor ?? "cotto") === k}
                >
                  <img src={floorPreview(k)} alt="" />
                  <span>{v.label}</span>
                </button>
              ))}
            </div>
          </div>
          <Choice
            label="Parapetto"
            value={bed.railing ?? "metal"}
            options={Object.fromEntries(Object.entries(RAILINGS).map(([k, v]) => [k, v.label]))}
            onChange={(v) => onUpdate(bed.id, { railing: v })}
            allowEmpty={false}
          />
          <p className="panel-note">
            Sul terrazzo le piante vanno nei vasi: usa <strong>Aggiungi vaso</strong>. I vasi messi sul pavimento ne prendono
            l'esposizione.
          </p>
          <div className="button-stack">
            <button className="button is-small is-danger is-light" onClick={() => onDeleteBed(bed.id)}>
              <i className="fa-solid fa-trash-can" />&nbsp; Elimina terrazzo
            </button>
          </div>
        </>
      ) : (
        <>
      <h3 className="gp-heading">Condizioni</h3>
      <Choice label="Esposizione" value={c.sunlight} options={SUNLIGHT} onChange={(v) => setCond("sunlight", v)} allowEmpty={false} />
      <Choice label="Acqua disponibile" value={c.watering} options={WATERING} onChange={(v) => setCond("watering", v)} />
      <Choice label="pH del terreno" value={c.ph} options={SOIL_PH} onChange={(v) => setCond("ph", v)} />
      {!pot && (
        <>
      <Choice label="Tipo di terreno" value={c.texture} options={SOIL_TEXTURE} onChange={(v) => setCond("texture", v)} />
      <Choice
        label="Da dove si guarda"
        value={bed.viewedFrom ?? "all"}
        options={{ all: "Da tutti i lati", one: "Da un lato (contro muro/siepe)" }}
        onChange={(v) => onUpdate(bed.id, { viewedFrom: v })}
        allowEmpty={false}
      />

      <h3 className="gp-heading">Materiali</h3>
      <div className="gp-field">
        <span className="gp-label">Copertura</span>
        <div className="material-row">
          {Object.entries(SURFACES).map(([k, v]) => (
            <button
              key={k}
              type="button"
              className={`material ${(bed.surface ?? "bark") === k ? "is-active" : ""}`}
              onClick={() => onUpdate(bed.id, { surface: k })}
              aria-pressed={(bed.surface ?? "bark") === k}
            >
              <img src={surfacePreview(k)} alt="" />
              <span>{v.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="gp-field">
        <span className="gp-label">Bordura</span>
        <div className="choice-row">
          {Object.entries(EDGINGS).map(([k, v]) => (
            <button
              key={k}
              type="button"
              className={`choice ${(bed.edging ?? "stone") === k ? "is-active" : ""}`}
              onClick={() => onUpdate(bed.id, { edging: k })}
              aria-pressed={(bed.edging ?? "stone") === k}
            >
              <span className="edge-swatch" style={{ background: v.color ?? "transparent", borderColor: v.joint ?? "#999" }} />
              {v.label}
            </button>
          ))}
        </div>
      </div>
        </>
      )}
      {bed.kind === "veg" && <VegetablePanel bed={bed} onEndSeason={onEndSeason} />}

      <h3 className="gp-heading">
        Piante <small>({bed.plants?.length ?? 0})</small>
      </h3>
      {groups.length ? (
        <ul className="group-list">
          {groups.map((g) => (
            <li key={g.key}>
              <img className="legend-icon" src={getIconUrl(g.icon.type, g.icon.colors, 64, g.name)} alt="" />
              <span className="grow">{g.name}</span>
              <span className="count">× {g.ids.length}</span>
              <button className="icon-btn" onClick={() => onRemovePlants(bed.id, g.ids)} aria-label={`Rimuovi ${g.name}`}>
                <i className="fa-solid fa-xmark" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="panel-note">Ancora nessuna pianta.</p>
      )}

      <BedRisks bed={bed} />

      <div className="button-stack">
        <button className="button is-primary is-small" onClick={() => onGoTo("ia")}>
          <i className="fa-solid fa-wand-magic-sparkles" />&nbsp; Chiedi un progetto all'IA
        </button>
        <button className="button is-small is-light" onClick={() => onGoTo("piante")}>
          <i className="fa-solid fa-seedling" />&nbsp; Aggiungi piante dal catalogo
        </button>
        <button className="button is-small is-danger is-light" onClick={() => onDeleteBed(bed.id)}>
          <i className="fa-solid fa-trash-can" />&nbsp; {pot ? "Elimina vaso" : "Elimina aiuola"}
        </button>
      </div>
      <p className="panel-note">
        {pot
          ? "Suggerimento: trascina il vaso per spostarlo; le misure si cambiano qui sopra."
          : "Suggerimento: trascina i pallini bianchi sugli angoli per modificare la forma, o trascina l'aiuola per spostarla."}
      </p>
        </>
      )}
    </div>
  );
}
