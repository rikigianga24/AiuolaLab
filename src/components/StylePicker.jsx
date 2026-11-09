import { ART_STYLES } from "../lib/artStyle";
import { getIconUrl } from "../lib/plantIcons";
import { useSession } from "../lib/session";

const SAMPLE = [
  ["rose", ["#e88fb4"], "Rosa inglese"],
  ["spike", ["#9b6fc4"], "Lavanda"],
  ["daisy", ["#f2c94c"], "Rudbeckia"],
];

// Scelta dello stile del disegno, con un'anteprima di tre piante.
export default function StylePicker({ onChange }) {
  const { settings, updateSettings } = useSession();
  const current = settings.artStyle ?? "tempera";
  return (
    <div className="style-picker" role="radiogroup" aria-label="Stile del disegno">
      {Object.entries(ART_STYLES).map(([key, s]) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={current === key}
          className={`style-option ${current === key ? "is-active" : ""}`}
          onClick={() => {
            if (current !== key) updateSettings({ artStyle: key });
            onChange?.(key);
          }}
        >
          <span className="style-sample" aria-hidden="true">
            {SAMPLE.map(([t, c, n]) => (
              <img key={n} src={getIconUrl(t, c, 96, n, key)} alt="" />
            ))}
          </span>
          <span className="style-text">
            <strong>
              <i className={`fa-solid ${s.icon}`} /> {s.label}
            </strong>
            <small>{s.note}</small>
          </span>
        </button>
      ))}
    </div>
  );
}
