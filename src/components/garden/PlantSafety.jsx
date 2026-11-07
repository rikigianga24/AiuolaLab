import { PETS, plantInfo, toxLevelLabel } from "../../lib/plantInfo";
import { useSession } from "../../lib/session";

// Scheda "Sicurezza, fauna e origine" di una pianta o di un ortaggio.
export default function PlantSafety({ plant }) {
  const { settings } = useSession();
  const info = plantInfo(plant, { climate: settings.climate });
  const myPets = settings.pets ?? [];
  const toxForMine = info.tox?.to.filter((t) => myPets.includes(t)) ?? [];
  const empty = !info.tox && !info.wildlife.length && !info.good && !info.origin && !info.invasive && !info.notes.length;
  if (empty) return null;

  return (
    <div className="safety">
      {info.invasive && (
        <p className="safety-row is-danger">
          <i className="fa-solid fa-ban" /> <span>{info.invasive}</span>
        </p>
      )}
      {info.tox && (
        <p className={`safety-row tox-${info.tox.level} ${toxForMine.length ? "is-mine" : ""}`}>
          <i className="fa-solid fa-skull-crossbones" />
          <span>
            <strong>
              Tossica per {info.tox.to.map((t) => PETS[t]).join(", ")} (rischio {toxLevelLabel(info.tox.level)})
            </strong>
            {toxForMine.length > 0 && <em> — attenzione: hai indicato {toxForMine.map((t) => PETS[t]).join(" e ")}</em>}
            <br />
            {info.tox.note}
          </span>
        </p>
      )}
      {info.wildlife.map((w) => (
        <p key={w.who} className="safety-row">
          <i className="fa-solid fa-paw" />
          <span>
            <strong>{w.who[0].toUpperCase() + w.who.slice(1)}</strong>: {w.note}
          </span>
        </p>
      ))}
      {info.good && (
        <p className="safety-row is-good">
          <i className="fa-solid fa-bug" />
          <span>Attira {info.good}</span>
        </p>
      )}
      {info.origin && (
        <p className="safety-row">
          <i className={`fa-solid ${info.origin.native ? "fa-house-chimney" : "fa-earth-europe"}`} />
          <span>
            <strong>{info.origin.native ? "Autoctona" : "Non autoctona"}</strong>: {info.origin.from}
          </span>
        </p>
      )}
      {info.notes.map((n) => (
        <p key={n} className="safety-row">
          <i className="fa-solid fa-location-dot" /> <span>{n}</span>
        </p>
      ))}
      {info.tox && <p className="safety-disclaimer">In caso di ingestione contatta subito il veterinario o un centro antiveleni.</p>}
    </div>
  );
}
