import { useCallback, useEffect, useState } from "react";
import { getProjectStore } from "../../lib/projects";
import BudgetPanel from "./BudgetPanel";

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short" }) : "";

export default function ProjectPanel({ project, onOpen, onNew, onRename, onSaved, onBudgetSettings, notify }) {
  const [store, setStore] = useState(null);
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async (s) => {
    try {
      setItems(await s.list());
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    getProjectStore().then((s) => {
      setStore(s);
      refresh(s);
    });
  }, [refresh]);

  const saveNow = async () => {
    if (!store) return;
    setBusy(true);
    try {
      const saved = await store.save(project);
      if (saved.remoteId !== project.remoteId) onSaved(saved.remoteId);
      notify(store.kind === "cloud" ? "Progetto salvato nel cloud." : "Progetto salvato in questo browser.", "success");
      refresh(store);
    } catch (err) {
      notify(`Salvataggio non riuscito: ${err.message}`, "danger");
    } finally {
      setBusy(false);
    }
  };

  const open = async (id) => {
    setBusy(true);
    try {
      const p = await store.open(id);
      if (p) onOpen(p);
    } catch (err) {
      notify(`Apertura non riuscita: ${err.message}`, "danger");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Eliminare definitivamente questo progetto dall'archivio?")) return;
    try {
      await store.remove(id);
      refresh(store);
    } catch (err) {
      notify(`Eliminazione non riuscita: ${err.message}`, "danger");
    }
  };

  const currentKey = store?.kind === "cloud" ? project.remoteId : project.id;

  return (
    <div className="project-panel">
      <div className="gp-field">
        <label className="gp-label" htmlFor="project-name">
          Nome del progetto
        </label>
        <input
          id="project-name"
          className="input is-small"
          value={project.name}
          maxLength={120}
          onChange={(e) => onRename(e.target.value)}
        />
      </div>
      <div className="button-stack horizontal">
        <button className={`button is-primary is-small ${busy ? "is-loading" : ""}`} onClick={saveNow} disabled={!store || !project.name.trim()}>
          <i className="fa-solid fa-floppy-disk" />&nbsp; Salva
        </button>
        <button className="button is-small is-light" onClick={onNew}>
          <i className="fa-solid fa-file-circle-plus" />&nbsp; Nuovo
        </button>
      </div>
      <p className="panel-note">
        {store?.kind === "cloud"
          ? "I progetti sono salvati sul server e legati a questo dispositivo."
          : "Il server non ha un database: i progetti sono salvati in questo browser."}{" "}
        Le modifiche al progetto aperto vengono comunque conservate automaticamente.
      </p>

      <BudgetPanel project={project} onSettings={onBudgetSettings} />

      <h3 className="gp-heading">Archivio</h3>
      {error && <p className="panel-error">{error}</p>}
      {items.length ? (
        <ul className="project-list">
          {items.map((it) => (
            <li key={it.id} className={it.id === currentKey ? "is-current" : ""}>
              <button className="grow" onClick={() => open(it.id)} disabled={busy}>
                <strong>{it.name}</strong>
                <small>{fmtDate(it.updatedAt)}</small>
              </button>
              <button className="icon-btn" onClick={() => remove(it.id)} aria-label={`Elimina ${it.name}`}>
                <i className="fa-solid fa-trash-can" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="panel-note">Nessun progetto salvato.</p>
      )}
    </div>
  );
}
