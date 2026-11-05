// Archivio progetti: sul server (Postgres) se disponibile, altrimenti nel
// browser. Il progetto aperto viene comunque salvato in locale ad ogni modifica.
import { getHealth, projectsApi } from "./api.js";
import { newId } from "./ids.js";
import { load, save } from "./storage.js";

const CURRENT_KEY = "aiuolalab.current";
const LOCAL_LIST_KEY = "aiuolalab.projects";
const OWNER_KEY = "aiuolalab.ownerKey";

export const emptyProject = () => ({
  id: newId(),
  remoteId: null,
  name: "Il mio giardino",
  beds: [],
  updatedAt: new Date().toISOString(),
});

export const loadCurrent = () => {
  const p = load(CURRENT_KEY, null);
  return p && Array.isArray(p.beds) ? p : emptyProject();
};
export const saveCurrent = (project) => save(CURRENT_KEY, project);

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
      return { ...r.data, id: r.data.id ?? newId(), remoteId: r.id, name: r.name, updatedAt: r.updatedAt };
    },
    async save(project) {
      const data = { beds: project.beds, localId: project.id };
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

export async function getProjectStore() {
  const health = await getHealth();
  return health.database ? remoteStore() : localStore;
}
