async function request(path, { method = "GET", body, headers } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Errore ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

let healthPromise = null;
export function getHealth() {
  healthPromise ??= request("/health").catch(() => ({ ok: false, database: false, ai: false, plantSource: null }));
  return healthPromise;
}

export function searchPlants(filters, signal) {
  const params = new URLSearchParams(Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== ""));
  return fetch(`/api/plants?${params}`, { signal }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Ricerca non riuscita");
    return data;
  });
}

export const getPlant = (id) => request(`/plants/${encodeURIComponent(id)}`);
export const getPlantPhotos = (name, full = false) =>
  request(`/plants/photos?name=${encodeURIComponent(name)}${full ? "&full=1" : ""}`);
export const suggestBed = (payload) => request("/suggest", { method: "POST", body: payload });

export const projectsApi = (ownerKey) => {
  const headers = { "X-Owner-Key": ownerKey };
  return {
    list: () => request("/projects", { headers }),
    get: (id) => request(`/projects/${id}`, { headers }),
    create: (name, data) => request("/projects", { method: "POST", body: { name, data }, headers }),
    update: (id, name, data) => request(`/projects/${id}`, { method: "PUT", body: { name, data }, headers }),
    remove: (id) => request(`/projects/${id}`, { method: "DELETE", headers }),
  };
};

// ---- account ----
export const authApi = {
  me: () => request("/auth/me"),
  register: (body) => request("/auth/register", { method: "POST", body }),
  login: (body) => request("/auth/login", { method: "POST", body }),
  logout: () => request("/auth/logout", { method: "POST", body: {} }),
  verify: (token) => request("/auth/verify", { method: "POST", body: { token } }),
  resendVerification: () => request("/auth/resend-verification", { method: "POST", body: {} }),
  forgot: (email) => request("/auth/forgot", { method: "POST", body: { email } }),
  reset: (token, password) => request("/auth/reset", { method: "POST", body: { token, password } }),
};

export const accountApi = {
  get: () => request("/account"),
  saveSettings: (settings) => request("/account/settings", { method: "PUT", body: settings }),
  setMarketing: (marketing) => request("/account/consents", { method: "PUT", body: { marketing } }),
  subscribePush: (sub) => request("/account/push", { method: "POST", body: sub }),
  unsubscribePush: (endpoint) => request("/account/push", { method: "DELETE", body: { endpoint } }),
  testNotification: (email) => request("/account/test-notification", { method: "POST", body: { email } }),
  remove: (password) => request("/account", { method: "DELETE", body: { password } }),
};

// ---- meteo ----
export const weatherApi = {
  forecast: ({ lat, lon }, ctx = {}) =>
    request(
      `/weather?${new URLSearchParams({
        lat: lat.toFixed(3),
        lon: lon.toFixed(3),
        pots: ctx.pots ? "1" : "0",
        vegetable: ctx.vegetable ? "1" : "0",
        irrigation: ctx.irrigation ? "1" : "0",
      })}`,
    ),
  geocode: (q) => request(`/weather/geocode?q=${encodeURIComponent(q)}`),
};
