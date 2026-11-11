// Stato condiviso: utente collegato e impostazioni (clima, località,
// notifiche, attività fatte). Senza account le impostazioni restano nel
// browser; con l'account vengono salvate anche sul server.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { accountApi, authApi, getHealth } from "./api.js";
import { load, save } from "./storage.js";

const SETTINGS_KEY = "aiuolalab.settings";

const DEFAULT_SETTINGS = {
  climate: "centro",
  location: null,
  notify: { push: false, pushTasks: true, pushWeather: true, pushStreak: true, emailWeekly: true, emailWeather: true, hour: 8 },
  taskState: {},
  pets: [],
  favorites: [],
  artStyle: "tempera",
};

const merge = (a, b) => ({ ...a, ...b, notify: { ...a.notify, ...(b?.notify ?? {}) }, taskState: { ...a.taskState, ...(b?.taskState ?? {}) } });

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [features, setFeatures] = useState({ accounts: false, mail: false, push: false, google: false, contact: false, vapidPublicKey: null });
  const [settings, setSettings] = useState(() => merge(DEFAULT_SETTINGS, load(SETTINGS_KEY, {})));
  const pending = useRef(null);
  const timer = useRef(null);
  const latest = useRef(settings);
  useEffect(() => {
    latest.current = settings;
  }, [settings]);

  const refresh = useCallback(async () => {
    const health = await getHealth();
    setFeatures({ accounts: Boolean(health.accounts), mail: Boolean(health.mail), push: Boolean(health.push), google: Boolean(health.google), contact: Boolean(health.contact), vapidPublicKey: health.vapidPublicKey ?? null });
    if (!health.accounts) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { user: u } = await authApi.me();
      setUser(u);
      if (u) {
        // le impostazioni del server prevalgono (anche per le attività segnate
        // dai pulsanti delle notifiche); quelle solo su questo dispositivo si uniscono
        setSettings((local) => {
          const server = merge(DEFAULT_SETTINGS, u.settings ?? {});
          const next = { ...server, taskState: { ...local.taskState, ...server.taskState } };
          save(SETTINGS_KEY, next);
          return next;
        });
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    // tornando sull'app (es. dopo "Fatto" in una notifica) si riallinea col server
    const onVisible = () => document.visibilityState === "visible" && !pending.current && refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  const updateSettings = useCallback(
    (patch) => {
      setSettings((s) => {
        const next = merge(s, patch);
        save(SETTINGS_KEY, next);
        return next;
      });
      if (!user) return;
      pending.current = { ...(pending.current ?? {}), ...patch, ...(patch.notify ? { notify: { ...(pending.current?.notify ?? {}), ...patch.notify } } : {}) };
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        const body = pending.current;
        pending.current = null;
        // taskState è inviato completo per non perdere modifiche
        accountApi.saveSettings(body.taskState ? { ...body, taskState: latest.current.taskState } : body).catch(() => {});
      }, 800);
    },
    [user],
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      features,
      settings,
      updateSettings,
      refresh,
      async login(email, password) {
        const r = await authApi.login({ email, password });
        await refresh();
        return r;
      },
      async register(data) {
        const r = await authApi.register(data);
        await refresh();
        return r;
      },
      async logout() {
        await authApi.logout();
        setUser(null);
      },
    }),
    [user, loading, features, settings, updateSettings, refresh],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession fuori da SessionProvider");
  return ctx;
}
