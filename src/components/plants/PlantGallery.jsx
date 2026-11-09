import { useState } from "react";
import { setConsent, useConsent } from "../../lib/consent";
import { usePlantPhotos } from "../../lib/photos";

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

// Galleria nella scheda della pianta: foto grande, miniature, crediti.
export default function PlantGallery({ name, fallbackImage, compact = false }) {
  const consent = useConsent();
  const allowed = Boolean(consent?.external);
  const { loading, data, error } = usePlantPhotos(name, { full: true, enabled: allowed });
  const [index, setIndex] = useState(0);

  if (!allowed) return <PhotoConsent compact={compact} />;
  if (loading)
    return (
      <div className={`gallery ${compact ? "is-compact" : ""}`}>
        <div className="gallery-main is-loading" aria-label="Caricamento foto" />
      </div>
    );

  const photos = data?.photos ?? [];
  if (!photos.length) {
    if (fallbackImage) return <img className="plant-photo" src={fallbackImage} alt={name} loading="lazy" />;
    return <p className="gallery-empty">{error ? "Foto non disponibili al momento." : "Nessuna foto libera trovata per questa pianta."}</p>;
  }
  const current = photos[Math.min(index, photos.length - 1)];
  return (
    <div className={`gallery ${compact ? "is-compact" : ""}`}>
      <a className="gallery-main" href={current.large} target="_blank" rel="noopener noreferrer" title="Apri la foto grande">
        <img src={current.medium} alt={`${name}, foto ${index + 1} di ${photos.length}`} loading="lazy" />
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
    </div>
  );
}
