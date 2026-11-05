// Iscrizione del dispositivo alle notifiche push (tramite il service worker
// dell'app installata/pubblicata).
import { accountApi } from "./api.js";

export const pushSupported = () =>
  typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

async function registration() {
  if (!pushSupported()) return null;
  return (await navigator.serviceWorker.getRegistration()) ?? null;
}

export async function currentSubscription() {
  const reg = await registration();
  return reg ? reg.pushManager.getSubscription() : null;
}

function keyToUint8(base64) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export async function enablePush(vapidPublicKey) {
  if (!pushSupported()) throw new Error("Questo browser non supporta le notifiche push. Su iPhone aggiungi prima l'app alla schermata Home.");
  const reg = await registration();
  if (!reg) throw new Error("Le notifiche funzionano nell'app pubblicata (npm run build), non in modalità sviluppo.");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Permesso per le notifiche negato dal browser.");
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToUint8(vapidPublicKey) }));
  const json = sub.toJSON();
  await accountApi.subscribePush({ endpoint: json.endpoint, keys: json.keys });
  return sub;
}

export async function disablePush() {
  const sub = await currentSubscription();
  if (!sub) return;
  await accountApi.unsubscribePush(sub.endpoint).catch(() => {});
  await sub.unsubscribe();
}
