import "dotenv/config";

const env = process.env;

export const config = {
  port: Number(env.PORT) || 3001,
  isProduction: env.NODE_ENV === "production",

  // Postgres (Supabase, Neon, Railway, locale...). Senza URL i progetti
  // restano solo nel browser e la cache piante è in memoria.
  databaseUrl: env.DATABASE_URL || null,
  databaseSsl: env.DATABASE_SSL === "true",

  // Fonte dati piante: "catalogo" (schede interne in server/plants/catalog,
  // predefinito) oppure "perenual" (DB pubblico a pagamento per uso
  // commerciale, serve anche PERENUAL_API_KEY).
  plantProvider: env.PLANT_PROVIDER === "perenual" && env.PERENUAL_API_KEY ? "perenual" : "catalogo",
  perenual: {
    apiKey: env.PERENUAL_API_KEY || null,
    baseUrl: env.PERENUAL_API_BASE || "https://perenual.com/api/v2",
  },

  // Consulente IA (Claude). La chiave resta solo lato server.
  anthropic: {
    enabled: Boolean(env.ANTHROPIC_API_KEY),
    model: env.ANTHROPIC_MODEL || "claude-opus-5-5",
  },
  // Limite di richieste al consulente IA per IP all'ora (controllo costi).
  suggestRateLimitPerHour: Number(env.SUGGEST_RATE_LIMIT) || 20,

  // Indirizzo pubblico dell'app (link nelle email, controllo di origine).
  appUrl: (env.APP_URL || "http://localhost:5173").replace(/\/$/, ""),

  // Email (SMTP: Brevo, Mailjet, Gmail, Aruba...). Senza SMTP_HOST le email
  // sono disattivate e la registrazione non richiede la conferma.
  mail: {
    enabled: Boolean(env.SMTP_HOST),
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT) || 587,
    secure: env.SMTP_SECURE === "true",
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: env.MAIL_FROM || "AiuolaLab <noreply@example.com>",
  },

  // Notifiche push (Web Push). Genera le chiavi con: npx web-push generate-vapid-keys
  push: {
    enabled: Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY),
    publicKey: env.VAPID_PUBLIC_KEY,
    privateKey: env.VAPID_PRIVATE_KEY,
    subject: env.VAPID_SUBJECT || "mailto:admin@example.com",
  },

  // Meteo MET Norway: i termini d'uso chiedono un contatto nello User-Agent.
  weatherContact: env.WEATHER_CONTACT || (env.VAPID_SUBJECT || "").replace(/^mailto:/, ""),

  // Ora (Europe/Rome) predefinita per le notifiche giornaliere.
  notifyHour: Number(env.NOTIFY_HOUR) || 8,
  // Pianificatore delle notifiche: SCHEDULER=off per disattivarlo.
  schedulerEnabled: env.SCHEDULER !== "off",
  // PHOTO_WARMUP=off disattiva il download dei link delle foto all'avvio
  photoWarmup: env.PHOTO_WARMUP !== "off",
};

// Versione dell'informativa privacy accettata alla registrazione.
export const PRIVACY_VERSION = "2026-11";
