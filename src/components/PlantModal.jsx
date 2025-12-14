import { useState } from "react";

export default function PlantModal({ onClose, onAdd }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchPlants = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(
        `https://openplantbook.herokuapp.com/api/v1/plants/search?query=${query}`
      );
      const data = await res.json();

      setResults(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal is-active">
      <div className="modal-background" onClick={onClose} />

      <div className="modal-card" style={{ width: "90%" }}>
        <header className="modal-card-head">
          <p className="modal-card-title">Aggiungi pianta</p>
          <button className="delete" onClick={onClose} />
        </header>

        <section className="modal-card-body">
          <div className="field has-addons mb-4">
            <div className="control is-expanded">
              <input
                className="input"
                placeholder="Cerca pianta"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchPlants()}
              />
            </div>
            <div className="control">
              <button className="button is-success" onClick={searchPlants}>
                Cerca
              </button>
            </div>
          </div>

          {loading && <p>Caricamento…</p>}

          <div
            style={{
              display: "flex",
              gap: 16,
              overflowX: "auto",
              paddingBottom: 8,
            }}
          >
            {results.map((p) => (
              <div
                key={p.id}
                className="card"
                style={{ minWidth: 220 }}
              >
                <div className="card-image">
                  <figure className="image is-4by3">
                    <img
                      src={p.image_url || "https://via.placeholder.com/300"}
                      alt={p.common_name}
                    />
                  </figure>
                </div>

                <div className="card-content">
                  <p className="title is-6">
                    {p.common_name || "Nome sconosciuto"}
                  </p>
                  <p className="subtitle is-7">
                    {p.scientific_name}
                  </p>

                  <button
                    className="button is-small is-fullwidth is-success"
                    onClick={() =>
                      onAdd({
                        localId: Date.now(),
                        name: p.common_name || p.scientific_name,
                        radius: 20,
                      })
                    }
                  >
                    Aggiungi
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
