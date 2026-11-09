import PlantSafety from "./PlantSafety";
import { COLORS, CYCLE, GROUPS, SEASONS, SOIL_PH, SOIL_TEXTURE, SUNLIGHT, WATERING, formatRangeCm } from "../../lib/labels";

const list = (values, dict) =>
  values?.length ? values.map((v) => (typeof dict[v] === "string" ? dict[v] : dict[v]?.label ?? v)).join(", ") : "n.d.";

export default function PlantFacts({ plant }) {
  return (
    <dl className="plant-facts">
      {plant.description && <dd className="facts-wide facts-note-text">{plant.description}</dd>}
      {plant.group && GROUPS[plant.group] && (
        <>
          <dt>Tipo</dt>
          <dd>{GROUPS[plant.group]}</dd>
        </>
      )}
      <dt>Esposizione</dt>
      <dd>{list(plant.sunlight, SUNLIGHT)}</dd>
      <dt>Acqua</dt>
      <dd>{plant.watering ? WATERING[plant.watering].label : "n.d."}</dd>
      <dt>Terreno</dt>
      <dd>
        {list(plant.soil?.ph, SOIL_PH)}
        {plant.soil?.texture?.length ? ` · ${list(plant.soil.texture, SOIL_TEXTURE)}` : ""}
      </dd>
      <dt>Altezza</dt>
      <dd>{formatRangeCm(plant.heightCm)}</dd>
      <dt>Larghezza</dt>
      <dd>{formatRangeCm(plant.spreadCm)}</dd>
      <dt>Fiori</dt>
      <dd className="color-dots">
        {plant.flowerColors?.length
          ? plant.flowerColors.map((c) => (
              <span key={c} title={COLORS[c]?.label}>
                <span className="dot" style={{ background: COLORS[c]?.hex }} />
                {COLORS[c]?.label}
              </span>
            ))
          : "n.d."}
      </dd>
      <dt>Fioritura</dt>
      <dd>{list(plant.floweringSeasons, SEASONS)}</dd>
      {plant.cycle && (
        <>
          <dt>Ciclo</dt>
          <dd>
            {CYCLE[plant.cycle] ?? plant.cycle}
            {plant.evergreen ? " · sempreverde" : ""}
          </dd>
        </>
      )}
      {plant.hardiness?.min != null && (
        <>
          <dt>Rusticità</dt>
          <dd>
            zone USDA {plant.hardiness.min}
            {plant.hardiness.max ? `–${plant.hardiness.max}` : ""}
          </dd>
        </>
      )}
      {!plant.detailsLoaded && <dd className="facts-note">Scheda completa in caricamento…</dd>}
      <dd className="facts-wide">
        <PlantSafety plant={plant} />
      </dd>
    </dl>
  );
}
