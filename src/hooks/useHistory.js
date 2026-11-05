import { useCallback, useState } from "react";

const LIMIT = 100;

// Stato con annulla/ripeti. set(updater) registra un passo nella cronologia;
// set(updater, { transient: true }) aggiorna senza registrare (es. durante un
// trascinamento) e commit() chiude il passo partendo dallo stato salvato.
export function useHistory(initial) {
  const [state, setState] = useState(() => ({ past: [], present: initial, future: [], pending: null }));

  const set = useCallback((updater, { transient = false } = {}) => {
    setState((s) => {
      const next = typeof updater === "function" ? updater(s.present) : updater;
      if (next === s.present) return s;
      if (transient) return { ...s, present: next, pending: s.pending ?? s.present };
      const base = s.pending ?? s.present;
      return { past: [...s.past, base].slice(-LIMIT), present: next, future: [], pending: null };
    });
  }, []);

  const commit = useCallback(() => {
    setState((s) =>
      s.pending ? { past: [...s.past, s.pending].slice(-LIMIT), present: s.present, future: [], pending: null } : s,
    );
  }, []);

  // Annulla le modifiche transitorie (es. trascinamento non valido).
  const cancel = useCallback(() => {
    setState((s) => (s.pending ? { ...s, present: s.pending, pending: null } : s));
  }, []);

  const undo = useCallback(() => {
    setState((s) => {
      if (!s.past.length) return s;
      return { past: s.past.slice(0, -1), present: s.past.at(-1), future: [s.present, ...s.future], pending: null };
    });
  }, []);

  const redo = useCallback(() => {
    setState((s) => {
      if (!s.future.length) return s;
      return { past: [...s.past, s.present], present: s.future[0], future: s.future.slice(1), pending: null };
    });
  }, []);

  // Applica una modifica a tutti gli stati della cronologia, senza creare un
  // passo (es. l'id assegnato dal server dopo il salvataggio).
  const patchAll = useCallback((fn) => {
    setState((s) => ({
      past: s.past.map(fn),
      present: fn(s.present),
      future: s.future.map(fn),
      pending: s.pending && fn(s.pending),
    }));
  }, []);

  const reset = useCallback((value) => setState({ past: [], present: value, future: [], pending: null }), []);

  return {
    state: state.present,
    set,
    commit,
    cancel,
    undo,
    redo,
    reset,
    patchAll,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}
