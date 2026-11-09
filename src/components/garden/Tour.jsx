import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { markTourDone } from "../../lib/tour";

const STEPS = [
  {
    title: "Benvenuto in AiuolaLab",
    text: "Una guida veloce di un minuto per scoprire le funzioni principali. Puoi saltarla quando vuoi e riaprirla con il pulsante «?».",
  },
  {
    target: ".env-switch",
    title: "Giardino, balcone o orto",
    text: "Scegli dove progettare. Ogni ambiente ha il suo progetto e passare dall'uno all'altro non cancella niente.",
  },
  {
    target: ".garden-toolbar .tool-btn.is-primary",
    title: "Disegna l'aiuola",
    text: "Tocca il terreno per segnare gli angoli e tocca il primo punto per chiudere. Le misure sono in metri reali e gli angoli si possono trascinare.",
  },
  {
    target: ".pot-menu-wrap",
    title: "Vasi e fioriere",
    text: "Aggiungi vasi tondi o quadrati, fioriere, fioriere da ringhiera e vasi appesi. Funzionano come piccole aiuole.",
  },
  {
    target: ".gp-tabs .gp-tab:nth-child(1)",
    title: "Piante e ortaggi",
    text: "Cerca le piante con i filtri (sole, acqua, terreno, colori). Ogni scheda dice se è tossica per gli animali, chi la mangia e da dove viene.",
  },
  {
    target: ".fav-switch",
    title: "Le tue preferite",
    text: "Le piante che hai segnato con il cuore nella pagina «Scopri le piante» sono qui, pronte da mettere nell'aiuola. Puoi sempre passare a tutto il catalogo.",
  },
  {
    target: ".gp-tabs .gp-tab:nth-child(3)",
    title: "Consigli con l'IA",
    text: "Indica gusti e condizioni: l'intelligenza artificiale propone le piante, le quantità e le dispone nell'aiuola.",
  },
  {
    target: ".gp-tabs .gp-tab:nth-child(4)",
    title: "Irrigazione a goccia",
    text: "Metti il rubinetto sul disegno: l'app calcola i tubi più corti, i gocciolatori, la lista dei materiali e quanto irrigare.",
  },
  {
    target: ".zoom-controls",
    title: "Vista",
    text: "Ingrandisci, inquadra tutto, mostra la griglia e i nomi delle piante. Sul telefono usa due dita per lo zoom.",
  },
  {
    target: 'a[href="/calendario"]',
    title: "Il tuo calendario",
    text: "Potature, concimazioni, semine e raccolte delle tue piante, con meteo e avvisi. Con l'account ricevi anche promemoria e notifiche.",
  },
  {
    title: "Tutto pronto!",
    text: "Inizia disegnando la tua prima aiuola. Se ti serve, riapri questa guida con il pulsante «?» accanto ai comandi dello zoom.",
  },
];

function visibleRect(selector) {
  if (!selector) return null;
  for (const el of document.querySelectorAll(selector)) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight) return r;
  }
  return null;
}

export default function Tour({ open, onClose }) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState(null);
  const current = STEPS[step];

  const finish = useCallback(() => {
    markTourDone();
    setStep(0);
    onClose();
  }, [onClose]);

  useLayoutEffect(() => {
    if (!open) return;
    const update = () => setRect(visibleRect(current.target));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [open, current]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") finish();
      if (e.key === "ArrowRight") setStep((s) => Math.min(STEPS.length - 1, s + 1));
      if (e.key === "ArrowLeft") setStep((s) => Math.max(0, s - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, finish]);

  if (!open) return null;

  const pad = 6;
  const spot = rect && { left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 };
  // la scheda va sotto l'elemento se c'è spazio, altrimenti sopra
  const cardStyle = {};
  if (spot) {
    const below = spot.top + spot.height + 12;
    const cardW = Math.min(340, window.innerWidth - 24);
    const left = Math.min(Math.max(12, spot.left + spot.width / 2 - cardW / 2), window.innerWidth - cardW - 12);
    cardStyle.left = left;
    cardStyle.width = cardW;
    if (below + 200 < window.innerHeight) cardStyle.top = below;
    else cardStyle.bottom = window.innerHeight - spot.top + 12;
  }

  const last = step === STEPS.length - 1;
  return (
    <div className="tour" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      {spot ? <div className="tour-spot" style={spot} /> : <div className="tour-backdrop" />}
      <div className={`tour-card ${spot ? "" : "is-centered"}`} style={cardStyle}>
        <p className="tour-step">
          {step + 1} / {STEPS.length}
        </p>
        <h2 id="tour-title">{current.title}</h2>
        <p>{current.text}</p>
        <div className="tour-actions">
          {!last && (
            <button className="button is-small is-white" onClick={finish}>
              Salta la guida
            </button>
          )}
          <span className="grow" />
          {step > 0 && (
            <button className="button is-small" onClick={() => setStep(step - 1)}>
              Indietro
            </button>
          )}
          <button className="button is-small is-primary" onClick={() => (last ? finish() : setStep(step + 1))} autoFocus>
            {last ? "Inizia" : "Avanti"}
          </button>
        </div>
      </div>
    </div>
  );
}
