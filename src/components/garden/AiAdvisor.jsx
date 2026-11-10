import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAiQuota, getHealth, suggestBed } from "../../lib/api";
import { CROP_BY_ID } from "../../lib/crops";
import { bbox, formatM2, polygonArea } from "../../lib/geometry";
import { POT_TYPES, isFloor, isPot, potVolumeL } from "../../lib/containers";
import { useSession } from "../../lib/session";
import { PLANS, quotaLabel } from "../../lib/plans";
import { COLORS, LAYERS, SEASONS, SOIL_PH, SOIL_TEXTURE, STYLES, SUNLIGHT, WATERING } from "../../lib/labels";

const MAINTENANCE = { bassa: "Bassa", media: "Media", alta: "Curata" };

function Chips({ options, values, onToggle }) {
  return (
    <div className="choice-row">
      {Object.entries(options).map(([k, v]) => (
        <button
          key={k}
          type="button"
          className={`choice ${values.includes(k) ? "is-active" : ""}`}
          onClick={() => onToggle(k)}
          aria-pressed={values.includes(k)}
        >
          {v.hex && <span className="dot" style={{ background: v.hex }} />}
          {typeof v === "string" ? v : v.label}
        </button>
      ))}
    </div>
  );
}

const whenLabel = (iso) =>
  new Date(iso).toLocaleString("it-IT", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

// Riga con il piano e le proposte rimaste.
function QuotaNote({ quota }) {
  if (!quota) return null;
  let state;
  if (quota.globalExhausted) state = "Il consulente ha finito le proposte di oggi per tutti: riprova domani mattina.";
  else if (quota.remaining > 0) state = quota.remaining === 1 ? "ti resta 1 proposta." : `ti restano ${quota.remaining} proposte.`;
  else state = `prossima proposta da ${whenLabel(quota.nextAt)}.`;
  return (
    <p className="ai-quota">
      <i className="fa-solid fa-ticket" /> Piano <strong>{quota.planLabel}</strong> ({quota.label}): {state}
      {quota.plan === "free" && <small> Con Premium: {quotaLabel(PLANS.premium.ai)}.</small>}
    </p>
  );
}

const toggleIn = (list, v) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

export default function AiAdvisor({ bed, environment, onUpdateBed, onApply }) {
  const [aiEnabled, setAiEnabled] = useState(null);
  const [prefs, setPrefs] = useState({ colors: [], seasons: [], style: "", maintenance: "", maxHeightCm: "", region: "", notes: "" });
  const [status, setStatus] = useState({ loading: false, error: null });
  const [proposal, setProposal] = useState(null);
  const [replace, setReplace] = useState(true);
  const { settings, user } = useSession();
  const [petSafe, setPetSafe] = useState(Boolean(settings.pets?.length));
  const [quota, setQuota] = useState(null);
  const userId = user?.id;

  useEffect(() => {
    getHealth().then((h) => setAiEnabled(Boolean(h.ai)));
  }, []);

  useEffect(() => {
    if (!aiEnabled || !userId) return;
    let alive = true;
    getAiQuota()
      .then((q) => alive && setQuota(q))
      .catch(() => alive && setQuota(null));
    return () => {
      alive = false;
    };
  }, [aiEnabled, userId]);

  if (isFloor(bed)) {
    return (
      <div className="empty-state">
        <i className="fa-solid fa-bucket" />
        <p>Sul terrazzo l'IA progetta i vasi: seleziona un vaso o una fioriera (o aggiungine uno con «Aggiungi vaso»).</p>
      </div>
    );
  }

  if (!bed) {
    return (
      <div className="empty-state">
        <i className="fa-solid fa-wand-magic-sparkles" />
        <p>Seleziona (o disegna) un'aiuola: l'IA ti proporrà quali piante mettere e dove, in base a forma, esposizione e gusti.</p>
      </div>
    );
  }

  const c = bed.conditions ?? {};
  const area = polygonArea(bed.points);
  const box = bbox(bed.points);

  const ask = async () => {
    setStatus({ loading: true, error: null });
    setProposal(null);
    try {
      const res = await suggestBed({
        bed: {
          areaM2: area,
          widthM: box.width,
          depthM: box.height,
          viewedFrom: bed.viewedFrom ?? "all",
          container: isPot(bed)
            ? { type: POT_TYPES[bed.pot.type]?.label ?? "vaso", volumeL: potVolumeL(bed.pot), depthCm: Math.round(bed.pot.depth * 100), hanging: bed.pot.hanging }
            : undefined,
        },
        environment: environment ?? "garden",
        conditions: {
          sunlight: c.sunlight ?? "full_sun",
          watering: c.watering,
          ph: c.ph,
          texture: c.texture,
          region: prefs.region || undefined,
        },
        preferences: {
          colors: prefs.colors.map((k) => COLORS[k].label.toLowerCase()),
          seasons: prefs.seasons,
          style: prefs.style || undefined,
          maintenance: prefs.maintenance || undefined,
          maxHeightCm: prefs.maxHeightCm ? Number(prefs.maxHeightCm) : undefined,
          notes: prefs.notes || undefined,
          pets: petSafe ? (settings.pets?.length ? settings.pets : ["dog", "cat"]) : [],
          favorites: (settings.favorites ?? [])
            .map((f) => (f.kind === "crop" ? CROP_BY_ID[f.cropId]?.name : f.plant && `${f.plant.commonName} (${f.plant.scientificName})`))
            .filter(Boolean)
            .slice(0, 40),
        },
      });
      setProposal(res);
      if (res.quota) setQuota(res.quota);
      setStatus({ loading: false, error: null });
    } catch (err) {
      if (err.data?.quota) setQuota(err.data.quota);
      setStatus({ loading: false, error: err.message });
    }
  };

  const set = (key, value) => setPrefs((p) => ({ ...p, [key]: value }));
  const totalPlants = proposal?.plants.reduce((s, p) => s + p.quantity, 0) ?? 0;

  return (
    <div className="ai-advisor">
      {aiEnabled === false && <p className="panel-error">Il consulente IA non è attivo in questo momento.</p>}
      {aiEnabled && !user && (
        <p className="ai-login">
          <i className="fa-solid fa-user-lock" /> Il consulente IA è per chi ha un account, ed è gratis: <Link to="/accedi">accedi</Link> o{" "}
          <Link to="/registrati">registrati</Link>. Il tuo disegno resta salvato.
        </p>
      )}

      <div className="summary-box">
        <strong>{bed.name}</strong> · {formatM2(area)}
        <div className="summary-tags">
          <span>{SUNLIGHT[c.sunlight ?? "full_sun"].label}</span>
          {c.watering && <span>{WATERING[c.watering].label}</span>}
          {c.ph && <span>pH {SOIL_PH[c.ph].toLowerCase()}</span>}
          {c.texture && <span>{SOIL_TEXTURE[c.texture]}</span>}
        </div>
        {(!c.ph || !c.watering) && (
          <small>Più dettagli dai nella scheda «Aiuola» (acqua, pH, terreno), più il consiglio sarà preciso.</small>
        )}
      </div>

      <div className="gp-field">
        <span className="gp-label">Esposizione</span>
        <div className="choice-row">
          {Object.entries(SUNLIGHT).map(([k, v]) => (
            <button
              key={k}
              type="button"
              className={`choice ${(c.sunlight ?? "full_sun") === k ? "is-active" : ""}`}
              onClick={() => onUpdateBed(bed.id, { conditions: { ...c, sunlight: k } })}
            >
              <i className={`fa-solid ${v.icon}`} /> {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="gp-field">
        <span className="gp-label">Colori preferiti</span>
        <Chips options={COLORS} values={prefs.colors} onToggle={(k) => set("colors", toggleIn(prefs.colors, k))} />
      </div>

      <div className="gp-field">
        <span className="gp-label">Quando vuoi le fioriture</span>
        <Chips options={SEASONS} values={prefs.seasons} onToggle={(k) => set("seasons", toggleIn(prefs.seasons, k))} />
      </div>

      <div className="field-grid">
        <label className="mini-select">
          <span>Stile</span>
          <select value={prefs.style} onChange={(e) => set("style", e.target.value)}>
            <option value="">Libero</option>
            {STYLES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="mini-select">
          <span>Manutenzione</span>
          <select value={prefs.maintenance} onChange={(e) => set("maintenance", e.target.value)}>
            <option value="">Indifferente</option>
            {Object.entries(MAINTENANCE).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="mini-select">
          <span>Altezza max (cm)</span>
          <input type="number" min="10" max="500" step="10" value={prefs.maxHeightCm} onChange={(e) => set("maxHeightCm", e.target.value)} />
        </label>
        <label className="mini-select">
          <span>Zona / città</span>
          <input type="text" placeholder="es. Bologna, collina" maxLength={120} value={prefs.region} onChange={(e) => set("region", e.target.value)} />
        </label>
      </div>

      <label className="gp-field">
        <span className="gp-label">Altre richieste</span>
        <textarea
          className="textarea is-small"
          rows={2}
          maxLength={500}
          placeholder="es. profumata, adatta alle api, niente piante tossiche per i gatti"
          value={prefs.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </label>

      <label className="checkbox-row">
        <input type="checkbox" checked={petSafe} onChange={(e) => setPetSafe(e.target.checked)} /> Ho animali o bambini: evita le piante tossiche
      </label>

      <QuotaNote quota={user ? quota : null} />
      <button
        className={`button is-primary is-fullwidth ${status.loading ? "is-loading" : ""}`}
        onClick={ask}
        disabled={status.loading || !aiEnabled || !user || Boolean(quota && (quota.remaining <= 0 || quota.globalExhausted))}
      >
        <i className="fa-solid fa-wand-magic-sparkles" />&nbsp; Proponimi un'aiuola
      </button>
      {status.loading && <p className="panel-note">Il consulente sta progettando… può richiedere fino a un minuto.</p>}
      {status.error && <p className="panel-error">{status.error}</p>}

      {proposal && (
        <section className="proposal">
          {proposal.cached && (
            <p className="panel-note">
              Per questa richiesta c'era già una proposta pronta: non ha consumato la tua quota. Cambia una preferenza per averne una diversa.
            </p>
          )}
          <h3>{proposal.title}</h3>
          <p>{proposal.concept}</p>
          <ul className="proposal-plants">
            {proposal.plants.map((p, i) => (
              <li key={i}>
                <div className="proposal-head">
                  <strong>
                    {p.quantity} × {p.common_name}
                  </strong>
                  <span className="tag is-light">{LAYERS[p.layer] ?? p.layer}</span>
                </div>
                <em>{p.scientific_name}</em>
                <small>
                  h {p.height_cm} cm · distanza {p.spacing_cm} cm
                  {p.flower_colors?.length ? ` · ${p.flower_colors.join(", ")}` : ""}
                  {p.bloom_seasons?.length ? ` · ${p.bloom_seasons.map((s) => SEASONS[s] ?? s).join(", ")}` : ""}
                </small>
                <small className="reason">{p.reason}</small>
                {!p.plant && <small className="muted">Non trovata nel database: dati dal consulente.</small>}
              </li>
            ))}
          </ul>
          {proposal.bloom_calendar && (
            <>
              <h4>Calendario fioriture</h4>
              <p>{proposal.bloom_calendar}</p>
            </>
          )}
          {proposal.care_tips?.length > 0 && (
            <>
              <h4>Cura</h4>
              <ul className="bullets">
                {proposal.care_tips.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </>
          )}
          {proposal.warnings?.length > 0 && (
            <>
              <h4>Attenzione</h4>
              <ul className="bullets warn">
                {proposal.warnings.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </>
          )}
          <label className="checkbox-row">
            <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} /> Sostituisci le piante già presenti
          </label>
          <button className="button is-success is-fullwidth" onClick={() => onApply(bed.id, proposal, { replace })}>
            <i className="fa-solid fa-check" />&nbsp; Applica all'aiuola ({totalPlants} piante)
          </button>
        </section>
      )}
    </div>
  );
}
