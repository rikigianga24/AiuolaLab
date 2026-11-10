import { useCallback, useEffect, useState } from "react";
import { ENVIRONMENTS, getProjectStore, shareProject, shareUrl, unshareProject } from "../../lib/projects";
import BudgetPanel from "./BudgetPanel";

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short" }) : "";

// Condivisione con un link in sola lettura.
function ShareBox({ project, onShared, notify }) {
  const [busy, setBusy] = useState(false);
  const what = (ENVIRONMENTS[project.type]?.short ?? ENVIRONMENTS[project.type]?.label ?? "giardino").toLowerCase();
  const url = project.shareToken ? shareUrl(project.shareToken) : null;
  const message = `Guarda il mio ${what} «${project.name}» su AiuolaLab`;

  const create = async () => {
    if (!project.beds.length) return notify("Disegna almeno un'aiuola prima di condividere.", "warning");
    setBusy(true);
    try {
      onShared(await shareProject(project));
      notify("Link creato: ora puoi mandarlo a chi vuoi.", "success");
    } catch (err) {
      notify(`Condivisione non riuscita: ${err.message}`, "danger");
    } finally {
      setBusy(false);
    }
  };

  const stop = async () => {
    if (!window.confirm("Smettere di condividere? Chi ha il link non potrà più vedere il progetto.")) return;
    setBusy(true);
    try {
      onShared(await unshareProject(project));
      notify("Il link non funziona più.", "success");
    } catch (err) {
      notify(`Operazione non riuscita: ${err.message}`, "danger");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      notify("Link copiato.", "success");
    } catch {
      window.prompt("Copia il link:", url);
    }
  };

  const nativeShare = () => navigator.share({ title: project.name, text: message, url }).catch(() => {});

  return (
    <div className="share-box">
      <h3 className="gp-heading">
        <i className="fa-solid fa-share-nodes" /> Condividi
      </h3>
      {url ? (
        <>
          <p className="panel-note">Chi apre il link vede il progetto ma non può modificarlo. Le tue modifiche compaiono da sole.</p>
          <div className="share-link">
            <input className="input is-small" value={url} readOnly onFocus={(e) => e.target.select()} aria-label="Link di condivisione" />
            <button className="button is-small is-primary" onClick={copy}>
              <i className="fa-solid fa-copy" />
              &nbsp; Copia
            </button>
          </div>
          <div className="button-stack horizontal">
            {typeof navigator !== "undefined" && navigator.share && (
              <button className="button is-small is-light" onClick={nativeShare}>
                <i className="fa-solid fa-arrow-up-from-bracket" />
                &nbsp; Invia…
              </button>
            )}
            <a className="button is-small is-light" href={`https://wa.me/?text=${encodeURIComponent(`${message}: ${url}`)}`} target="_blank" rel="noopener noreferrer">
              <i className="fa-brands fa-whatsapp" />
              &nbsp; WhatsApp
            </a>
            <a className="button is-small is-light" href={url} target="_blank" rel="noopener noreferrer">
              <i className="fa-solid fa-eye" />
              &nbsp; Anteprima
            </a>
          </div>
          <button className={`button is-small is-text share-stop ${busy ? "is-loading" : ""}`} onClick={stop}>
            Smetti di condividere
          </button>
        </>
      ) : (
        <>
          <p className="panel-note">Crea un link per mostrare questo progetto ad amici, familiari o al vivaio. Chi lo apre lo vede senza poterlo modificare.</p>
          <button className={`button is-small is-primary ${busy ? "is-loading" : ""}`} onClick={create}>
            <i className="fa-solid fa-link" />
            &nbsp; Crea link di condivisione
          </button>
        </>
      )}
    </div>
  );
}

export default function ProjectPanel({ project, onOpen, onNew, onRename, onSaved, onShared, onBudgetSettings, notify }) {
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

      {store?.kind === "cloud" && <ShareBox project={project} onShared={onShared} notify={notify} />}

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
