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
