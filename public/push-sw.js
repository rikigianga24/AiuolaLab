// Notifiche push di AiuolaLab (importato dal service worker generato da Workbox).

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data && event.data.text() };
  }
  const title = data.title || "AiuolaLab";
  const options = {
    body: data.body || "",
    icon: "/icons/icon-192.png",
    // icona piccola nella barra di stato (Android): sagoma bianca
    badge: "/icons/badge-96.png",
    tag: data.tag || "aiuolalab",
    renotify: Boolean(data.tag),
    vibrate: [80, 40, 80],
    timestamp: Date.now(),
    data: { url: data.url || "/calendario", taskId: data.taskId || null },
  };
  // pulsanti nella notifica (Android, computer); su iPhone si tocca la notifica
  if (Array.isArray(data.actions) && data.actions.length) options.actions = data.actions.slice(0, 2);
  if (data.image) options.image = data.image;

  const jobs = [self.registration.showNotification(title, options)];
  // numero sull'icona dell'app (iPhone con app sulla Home, Android, computer)
  if (typeof data.badge === "number" && self.navigator && "setAppBadge" in self.navigator) {
    jobs.push((data.badge > 0 ? self.navigator.setAppBadge(data.badge) : self.navigator.clearAppBadge()).catch(() => {}));
  }
  event.waitUntil(Promise.all(jobs));
});

async function markTask(taskId, action) {
  const r = await fetch("/api/account/task-state", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: taskId, action }),
  });
  if (!r.ok) throw new Error(String(r.status));
}

async function openUrl(url) {
  const list = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const client of list) {
    if ("focus" in client) {
      if ("navigate" in client) await client.navigate(url).catch(() => {});
      return client.focus();
    }
  }
  return self.clients.openWindow(url);
}

self.addEventListener("notificationclick", (event) => {
  const { url = "/calendario", taskId = null } = event.notification.data || {};
  event.notification.close();
  const action = event.action;

  if ((action === "done" || action === "snooze") && taskId) {
    event.waitUntil(
      markTask(taskId, action)
        .then(() => {
          if (self.navigator && "clearAppBadge" in self.navigator) self.navigator.clearAppBadge().catch(() => {});
          return self.registration.showNotification(action === "done" ? "✅ Segnato come fatto" : "⏰ Te lo ricordo tra una settimana", {
            body: action === "done" ? "Bravo! Una cosa in meno da fare in giardino 🌿" : "Nessun problema, ci pensiamo più avanti.",
            icon: "/icons/icon-192.png",
            badge: "/icons/badge-96.png",
            tag: "conferma",
            silent: true,
          });
        })
        // senza connessione o senza accesso si apre l'app sul promemoria
        .catch(() => openUrl(url)),
    );
    return;
  }
  // notifica di prova: i pulsanti mostrano solo come funzionano
  if (action === "done" || action === "snooze") {
    event.waitUntil(
      self.registration.showNotification(action === "done" ? "✅ Così si segna come fatto" : "⏰ Così si rimanda di una settimana", {
        body: "Con i promemoria veri l'attività si aggiorna nel tuo calendario.",
        icon: "/icons/icon-192.png",
        badge: "/icons/badge-96.png",
        tag: "conferma",
        silent: true,
      }),
    );
    return;
  }
  event.waitUntil(openUrl(url));
});
