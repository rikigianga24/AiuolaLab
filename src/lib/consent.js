// Consenso cookie e contenuti di terze parti (GDPR / linee guida del Garante).
//
// AiuolaLab usa solo strumenti tecnici (cookie di sessione per l'accesso,
// memoria del browser per salvare i progetti), che non richiedono consenso.
// L'unico contenuto di terze parti caricato dal browser sono le foto delle
// piante del database Perenual: si mostrano solo se l'utente lo consente.
import { useSyncExternalStore } from "react";
import { load, save } from "./storage.js";

const KEY = "aiuolalab.consent";
export const CONSENT_VERSION = 1;

export const CATEGORIES = {
  necessary: {
    label: "Necessari",
    description: "Cookie di sessione per l'accesso e memoria del browser per salvare i progetti. Sempre attivi: senza, l'app non funziona.",
    locked: true,
  },
  external: {
    label: "Contenuti esterni",
    description: "Foto delle piante caricate dai server di Perenual: il tuo browser si collega al loro servizio, che può vedere il tuo indirizzo IP.",
  },
};

let current = load(KEY, null);
if (current?.version !== CONSENT_VERSION) current = null;
const listeners = new Set();

export function getConsent() {
  return current;
}

export function setConsent(choices) {
  current = { version: CONSENT_VERSION, date: new Date().toISOString(), necessary: true, external: Boolean(choices.external) };
  save(KEY, current);
  listeners.forEach((l) => l());
}

export function reopenConsent() {
  current = null;
  listeners.forEach((l) => l());
}

const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useConsent() {
  return useSyncExternalStore(subscribe, getConsent, getConsent);
}
