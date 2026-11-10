// Archivio progetti: sul server (Postgres) se disponibile, altrimenti nel
// browser. Il progetto aperto viene comunque salvato in locale ad ogni modifica.
import { getHealth, projectsApi } from "./api.js";
import { newId } from "./ids.js";
import { load, save } from "./storage.js";

// Un progetto aperto per ciascun ambiente: giardino e balcone/terrazzo.
const CURRENT_KEY = "aiuolalab.current";
const currentKey = (type) => (type === "balcony" || type === "vegetable" ? `${CURRENT_KEY}.${type}` : CURRENT_KEY);

export const ENVIRONMENTS = {
  garden: { label: "Giardino", icon: "fa-tree", defaultName: "Il mio giardino" },
  balcony: { label: "Balcone / terrazzo", short: "Balcone", icon: "fa-building", defaultName: "Il mio terrazzo" },
  vegetable: { label: "Orto", icon: "fa-carrot", defaultName: "Il mio orto" },
};
const LOCAL_LIST_KEY = "aiuolalab.projects";
const OWNER_KEY = "aiuolalab.ownerKey";

export const emptyProject = (type = "garden") => ({
  id: newId(),
  remoteId: null,
  type,
  name: ENVIRONMENTS[type]?.defaultName ?? "Il mio giardino",
  beds: [],
  updatedAt: new Date().toISOString(),
});

export const loadCurrent = (type = "garden") => {
  const p = load(currentKey(type), null);
  return p && Array.isArray(p.beds) ? { ...p, type: p.type ?? type } : emptyProject(type);
};
export const saveCurrent = (project) => save(currentKey(project.type), project);
export const lastEnvironment = () => load(`${CURRENT_KEY}.env`, "garden");
export const saveLastEnvironment = (type) => save(`${CURRENT_KEY}.env`, type);

function ownerKey() {
  let key = load(OWNER_KEY, null);
  if (!key) {
    key = newId();
    save(OWNER_KEY, key);
  }
  return key;
}

const localStore = {
  kind: "local",
  async list() {
    const all = load(LOCAL_LIST_KEY, {});
    return Object.values(all)
      .map(({ id, name, updatedAt }) => ({ id, name, updatedAt }))
      .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  },
  async open(id) {
    return load(LOCAL_LIST_KEY, {})[id] ?? null;
  },
  async save(project) {
    const all = load(LOCAL_LIST_KEY, {});
    const saved = { ...project, updatedAt: new Date().toISOString() };
    all[saved.id] = saved;
    if (!save(LOCAL_LIST_KEY, all)) throw new Error("Spazio del browser esaurito");
    return saved;
  },
  async remove(id) {
    const all = load(LOCAL_LIST_KEY, {});
    delete all[id];
    save(LOCAL_LIST_KEY, all);
  },
};

function remoteStore() {
  const api = projectsApi(ownerKey());
  return {
    kind: "cloud",
    async list() {
      return api.list();
    },
    async open(id) {
      const r = await api.get(id);
      return { ...r.data, id: r.data.localId ?? newId(), type: r.data.type ?? "garden", remoteId: r.id, name: r.name, updatedAt: r.updatedAt };
    },
    async save(project) {
      const data = { beds: project.beds, localId: project.id, type: project.type, faucet: project.faucet ?? null, irrigation: project.irrigation ?? null, budget: project.budget ?? null };
      const r = project.remoteId
        ? await api.update(project.remoteId, project.name, data).catch((err) => {
            if (err.status === 404) return api.create(project.name, data);
            throw err;
          })
        : await api.create(project.name, data);
      return { ...project, remoteId: r.id, updatedAt: r.updatedAt };
    },
    async remove(id) {
      await api.remove(id);
    },
  };
}

// Con l'account attivo il progetto aperto viene salvato anche sul server
// (serve alle notifiche). Restituisce il progetto con l'id remoto.
export async function syncProject(project) {
  const health = await getHealth();
  if (!health.database) return project;
  return remoteStore().save(project);
}

export async function getProjectStore() {
  const health = await getHealth();
  return health.database ? remoteStore() : localStore;
}
