// Cuore "mi piace" per piante e ortaggi.
export default function FavButton({ active, onToggle, name, size = "normal", withLabel = false }) {
  return (
    <button
      type="button"
      className={`fav-btn is-${size} ${active ? "is-active" : ""} ${withLabel ? "has-label" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-pressed={active}
      aria-label={active ? `Togli ${name} dalle preferite` : `Aggiungi ${name} alle preferite`}
      title={active ? "Tra le tue preferite" : "Mi piace"}
    >
      <i className={`fa-${active ? "solid" : "regular"} fa-heart`} aria-hidden="true" />
      {withLabel && <span>{active ? "Ti piace" : "Mi piace"}</span>}
    </button>
  );
}
