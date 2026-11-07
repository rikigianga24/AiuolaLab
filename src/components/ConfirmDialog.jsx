import { useEffect, useRef } from "react";

export default function ConfirmDialog({ title, message, confirmLabel = "Conferma", onConfirm, onCancel }) {
  const confirmRef = useRef(null);
  useEffect(() => {
    confirmRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="modal is-active" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="modal-background" onClick={onCancel} />
      <div className="modal-card confirm-card">
        <section className="modal-card-body">
          <h2 id="confirm-title" className="title is-5">
            {title}
          </h2>
          {message && <p>{message}</p>}
          <div className="buttons is-right mt-4">
            <button className="button" onClick={onCancel}>
              Annulla
            </button>
            <button ref={confirmRef} className="button is-danger" onClick={onConfirm}>
              {confirmLabel}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
