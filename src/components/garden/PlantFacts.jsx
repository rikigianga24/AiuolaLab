import "../../styles/guide.css";
import { Link } from "react-router-dom";
import PlantSafety from "./PlantSafety";
import { STYLE_BY_ID, stylesFor } from "../../lib/gardenStyles";
import { PRICE_TIERS, priceTier } from "../../lib/budget";
import { FERTILIZERS, fertilizerPlan, monthsText, npkText } from "../../lib/fertilizers";
import { COLORS, CYCLE, GROUPS, SEASONS, SOIL_PH, SOIL_TEXTURE, SUNLIGHT, WATERING, formatRangeCm, hardinessInfo } from "../../lib/labels";

const list = (values, dict) =>
  values?.length ? values.map((v) => (typeof dict[v] === "string" ? dict[v] : dict[v]?.label ?? v)).join(", ") : "n.d.";

export default function PlantFacts({ plant }) {
  const cold = hardinessInfo(plant.hardiness);
  const styles = plant.cropId ? [] : stylesFor(plant);
  const price = PRICE_TIERS[priceTier(plant)];
  const feed = fertilizerPlan(plant);
  const mainFeed = FERTILIZERS[feed.main];
  return (
    <dl className="plant-facts">
      {plant.description && <dd className="facts-wide facts-note-text">{plant.description}</dd>}
      {plant.group && GROUPS[plant.group] && (
        <>
          <dt>Tipo</dt>
          <dd>{GROUPS[plant.group]}</dd>
        </>
      )}
      <dt>Prezzo</dt>
      <dd>
        <span className="price-badge" title="Prezzo indicativo di una pianta in vaso da vivaio">{price.short}</span> {price.label} · {price.range}
      </dd>
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
      {cold && (
        <>
          <dt>Freddo</dt>
          <dd>
            <span className={`cold-badge cold-${cold.level.key}`} title="Temperatura minima invernale sopportata">
              <i className="fa-solid fa-snowflake" /> {cold.text}
            </span>
            <span className="cold-note">{cold.level.label}</span>
          </dd>
        </>
      )}
      <dt>Concime</dt>
      <dd className="feed-facts">
        <span className="feed-badge">
          <i className="fa-solid fa-flask" /> {mainFeed.label}
          {npkText(mainFeed) && <small>{npkText(mainFeed)}</small>}
        </span>
        <span className="feed-months">{monthsText(feed.months)}</span>
        <span className="feed-note">{feed.note}</span>
        {feed.extra.map((x) => (
          <span key={x.id} className="feed-extra">
            + {FERTILIZERS[x.id].label.toLowerCase()} ({monthsText(x.months)}): {x.why}
          </span>
        ))}
        <Link to="/guida#concimi" className="feed-link">
          Guida ai concimi <i className="fa-solid fa-arrow-right" />
        </Link>
      </dd>
      {styles.length > 0 && (
        <>
          <dt>Stili</dt>
          <dd className="style-tags">
            {styles.map((id) => (
              <Link key={id} to={`/stili/${id}`} title={STYLE_BY_ID[id].tagline}>
                {STYLE_BY_ID[id].short}
              </Link>
            ))}
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
