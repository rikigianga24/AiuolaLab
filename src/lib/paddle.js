// Modulo di pagamento di Paddle (Paddle.js). Si scarica solo quando qualcuno
// preme «Abbonati», non nelle altre pagine: così Paddle non vede chi visita
// semplicemente il sito.
const SCRIPT_URL = "https://cdn.paddle.com/paddle/v2/paddle.js";

let loading = null;
// funzione da chiamare quando Paddle segnala un evento del pagamento in corso
let onEvent = null;

function loadScript() {
  if (window.Paddle) return Promise.resolve(window.Paddle);
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT_URL;
    s.async = true;
    s.onload = () => (window.Paddle ? resolve(window.Paddle) : reject(new Error("Paddle non disponibile")));
    s.onerror = () => {
      s.remove();
      reject(new Error("Non riesco a caricare il modulo di pagamento. Controlla la connessione o disattiva un eventuale blocco pubblicità per questo sito."));
    };
    document.head.appendChild(s);
  });
}

/** Carica e prepara Paddle.js una volta sola. */
export function loadPaddle({ environment, clientToken }) {
  loading ??= loadScript()
    .then((Paddle) => {
      if (environment !== "production") Paddle.Environment.set("sandbox");
      Paddle.Initialize({ token: clientToken, eventCallback: (ev) => onEvent?.(ev) });
      return Paddle;
    })
    .catch((err) => {
      loading = null;
      throw err;
    });
  return loading;
}

/**
 * Apre il pagamento di Paddle sopra la pagina.
 * `onCompleted` quando il pagamento è andato a buon fine, `onClosed` se la
 * finestra viene chiusa.
 */
export async function openCheckout(billing, { transactionId, email, onCompleted, onClosed }) {
  const Paddle = await loadPaddle(billing);
  let completed = false;
  onEvent = (ev) => {
    if (ev?.name === "checkout.completed") {
      completed = true;
      onCompleted?.(ev.data);
    } else if (ev?.name === "checkout.closed" && !completed) {
      onClosed?.();
    }
  };
  Paddle.Checkout.open({
    transactionId,
    ...(email ? { customer: { email } } : {}),
    settings: { displayMode: "overlay", locale: "it", theme: "light", allowLogout: false },
  });
}

/** Chiude la finestra di pagamento (es. dopo il pagamento riuscito). */
export function closeCheckout() {
  window.Paddle?.Checkout?.close();
}
