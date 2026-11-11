import { useState } from "react";
import { setConsent, useConsent } from "../../lib/consent";
import { usePlantPhotos, webImagesUrl } from "../../lib/photos";

// Richiesta di consenso per le foto esterne (GDPR: il browser si collega a
// iNaturalist, che vede l'indirizzo IP).
export function PhotoConsent({ compact = false }) {
  return (
    <div className={`photo-consent ${compact ? "is-compact" : ""}`}>
      <i className="fa-solid fa-camera" aria-hidden="true" />
      <p>
        Le foto vere arrivano da <strong>iNaturalist</strong> e <strong>Wikimedia Commons</strong>, archivi di foto libere scattate da
        appassionati. Per vederle il tuo browser si collega ai loro server.
      </p>
      <button type="button" className="btn-country is-sage is-small" onClick={() => setConsent({ external: true })}>
        <i className="fa-solid fa-image" /> Mostra le foto
      </button>
    </div>
  );
}

export function PhotoCredit({ photo }) {
  return (
    <p className="photo-credit">
      Foto: {photo.attribution} ·{" "}
      {photo.licenseUrl ? (
        <a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer">
          {photo.license}
        </a>
      ) : (
        photo.license
      )}{" "}
      ·{" "}
      <a href={photo.sourceUrl} target="_blank" rel="noopener noreferrer">
        {photo.source ?? "iNaturalist"}
      </a>
    </p>
  );
}

// Avviso quando per una varietà abbiamo solo foto della specie o del genere.
// Le foto generiche restano nascoste finché l'utente non le chiede: una
// rosa selvatica gialla non deve sembrare la rosa rossa che cerca.
function GenericNotice({ data, name, shown, onShow }) {
  const what = data.match === "genus" ? `del genere ${data.name}` : `della specie ${data.name}`;
  return (
    <div className="gallery-generic" role="note">
      <i className="fa-solid fa-circle-info" aria-hidden="true" />
      <div>
        <p>
          {shown
            ? `Queste sono foto ${what}, non della varietà «${data.variety}»: fiori, forma e colore possono essere diversi.`
            : `Non abbiamo foto libere della varietà «${data.variety}».`}
        </p>
        <p className="gallery-generic-actions">
          <a href={webImagesUrl(name)} target="_blank" rel="noopener noreferrer">
            Vedi foto di «{data.variety}» sul web <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" />
          </a>
          {onShow && (
            <button type="button" className="link-button" onClick={onShow}>
              Mostra foto {what}
            </button>
          )}
        </p>
      </div>
    </div>
  );
}

// Galleria nella scheda della pianta: foto grande, miniature, crediti.
export default function PlantGallery({ name, fallbackImage, icon, compact = false }) {
  const consent = useConsent();
  const allowed = Boolean(consent?.external);
  const { loading, data, error } = usePlantPhotos(name, { full: true, enabled: allowed });
  const [index, setIndex] = useState(0);
  const [showGeneric, setShowGeneric] = useState(false);

  if (!allowed) return <PhotoConsent compact={compact} />;
  if (loading)
    return (
      <div className={`gallery ${compact ? "is-compact" : ""}`}>
        <div className="gallery-main is-loading" aria-label="Caricamento foto" />
      </div>
    );

  const photos = data?.photos ?? [];
  const generic = Boolean(data?.variety) && data.match !== "variety";
  if (generic && (!photos.length || !showGeneric))
    return (
      <div className={`gallery is-generic ${compact ? "is-compact" : ""}`}>
        {icon && <img className="gallery-icon" src={icon} alt={`Disegno di ${name}`} />}
        <GenericNotice data={data} name={name} onShow={photos.length ? () => setShowGeneric(true) : null} />
      </div>
    );
  if (!photos.length) {
    if (fallbackImage) return <img className="plant-photo" src={fallbackImage} alt={name} loading="lazy" />;
    return <p className="gallery-empty">{error ? "Foto non disponibili al momento." : "Nessuna foto libera trovata per questa pianta."}</p>;
  }
  const current = photos[Math.min(index, photos.length - 1)];
  return (
    <div className={`gallery ${compact ? "is-compact" : ""} ${generic ? "is-generic" : ""}`}>
      <a className="gallery-main" href={current.large} target="_blank" rel="noopener noreferrer" title="Apri la foto grande">
        <img src={current.medium} alt={generic ? `Foto generica di ${data.name}` : `${name}, foto ${index + 1} di ${photos.length}`} loading="lazy" />
        {generic && <span className="gallery-badge">Foto generica</span>}
        {data?.match === "variety" && <span className="gallery-badge is-variety">Foto della varietà</span>}
        {photos.length > 1 && (
          <span className="gallery-count">
            {index + 1}/{photos.length}
          </span>
        )}
      </a>
      {photos.length > 1 && (
        <div className="gallery-thumbs" role="list">
          {photos.map((p, i) => (
            <button
              key={p.id}
              type="button"
              role="listitem"
              className={i === index ? "is-active" : ""}
              onClick={() => setIndex(i)}
              aria-label={`Foto ${i + 1}`}
            >
              <img src={p.thumb} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
      <PhotoCredit photo={current} />
      {generic && <GenericNotice data={data} name={name} shown />}
    </div>
  );
}
