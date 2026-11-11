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

  // Consulente IA (Google Gemini). La chiave resta solo lato server.
  // Serve anche il database: le proposte sono riservate a chi ha un account
  // e contate per utente (vedi src/lib/plans.js).
  gemini: {
    apiKey: env.GEMINI_API_KEY || null,
    enabled: Boolean(env.GEMINI_API_KEY),
    model: env.GEMINI_MODEL || "gemini-2.5-flash",
    // token massimi di "ragionamento" per proposta ("auto" = decide il modello)
    thinkingBudget: env.GEMINI_THINKING_BUDGET === "auto" ? null : Number(env.GEMINI_THINKING_BUDGET) || 1024,
    timeoutMs: 90_000,
    // Tetto di proposte al giorno per tutta l'app, un po' sotto il limite
    // del piano gratuito di Google (il giorno di Google finisce a mezzanotte
    // di Los Angeles, cioè verso le 9 del mattino in Italia).
    dailyLimit: Number(env.AI_DAILY_LIMIT) || 230,
  },

  // Indirizzo pubblico dell'app (link nelle email, controllo di origine).
  // su Render RENDER_EXTERNAL_URL è impostato in automatico
  appUrl: (env.APP_URL || env.RENDER_EXTERNAL_URL || "http://localhost:5173").replace(/\/$/, ""),

  // Email (SMTP: Brevo, Mailjet, Gmail, Aruba...). Senza SMTP_HOST le email
  // sono disattivate e la registrazione non richiede la conferma.
  // BREVO_API_KEY: invio tramite l'API di Brevo (HTTPS). Serve dove le
  // porte SMTP sono bloccate, come sul piano gratuito di Render.
  mail: {
    enabled: Boolean(env.BREVO_API_KEY || env.SMTP_HOST),
    brevoApiKey: env.BREVO_API_KEY || null,
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT) || 587,
    secure: env.SMTP_SECURE === "true",
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: env.MAIL_FROM || "AiuolaLab <noreply@example.com>",
  },

  // Accesso con Google: client OAuth "Applicazione web" della Google Cloud
  // Console, con URI di reindirizzamento <APP_URL>/api/auth/google/callback.
  google: {
    enabled: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
    clientId: env.GOOGLE_CLIENT_ID || null,
    clientSecret: env.GOOGLE_CLIENT_SECRET || null,
  },

  // Notifiche push (Web Push). Genera le chiavi con: npx web-push generate-vapid-keys
  push: {
    enabled: Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY),
    publicKey: env.VAPID_PUBLIC_KEY,
    privateKey: env.VAPID_PRIVATE_KEY,
    subject: env.VAPID_SUBJECT || null,
  },

  // Meteo MET Norway: i termini d'uso chiedono un contatto nello User-Agent.
  weatherContact: env.WEATHER_CONTACT || (env.VAPID_SUBJECT || "").replace(/^mailto:/, ""),

  // Ora (Europe/Rome) predefinita per le notifiche giornaliere.
  notifyHour: Number(env.NOTIFY_HOUR) || 8,
  // Pianificatore delle notifiche: SCHEDULER=off per disattivarlo.
  schedulerEnabled: env.SCHEDULER !== "off",
  // PHOTO_WARMUP=off disattiva il download dei link delle foto all'avvio
  photoWarmup: env.PHOTO_WARMUP !== "off",

  // Registro degli errori (Sentry, consigliata la regione UE). Il DSN non è
  // segreto: viene mandato anche al browser per segnalare i suoi errori.
  sentry: {
    dsn: env.SENTRY_DSN || null,
    environment: env.SENTRY_ENVIRONMENT || (env.NODE_ENV === "production" ? "produzione" : "sviluppo"),
    // su Render RENDER_GIT_COMMIT è impostato in automatico
    release: env.RENDER_GIT_COMMIT || undefined,
  },

  // Statistiche di visita senza cookie (Umami). Senza ID sono spente.
  analytics: env.UMAMI_WEBSITE_ID
    ? { websiteId: env.UMAMI_WEBSITE_ID, scriptUrl: env.UMAMI_SCRIPT_URL || "https://cloud.umami.is/script.js" }
    : null,

  // Indirizzo che riceve i messaggi del modulo "Contatti". Senza, la
  // pagina mostra solo l'email indicata nelle pagine legali.
  supportEmail: env.SUPPORT_EMAIL || null,
};

// Versione dell'informativa privacy accettata alla registrazione.
export const PRIVACY_VERSION = "2026-11";
// Versione dei termini di utilizzo accettati alla registrazione.
export const TERMS_VERSION = "2026-11";
