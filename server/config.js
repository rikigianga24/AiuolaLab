import "dotenv/config";

const env = process.env;

export const config = {
  port: Number(env.PORT) || 3001,
  isProduction: env.NODE_ENV === "production",

  // Postgres (Supabase, Neon, Railway, locale...). Senza URL i progetti
  // restano solo nel browser e la cache piante è in memoria.
  databaseUrl: env.DATABASE_URL || null,
  databaseSsl: env.DATABASE_SSL === "true",

  // Fonte dati piante: "perenual" (DB pubblico) oppure "demo" (catalogo
  // di esempio incluso, utile in sviluppo senza chiave API).
  plantProvider: env.PLANT_PROVIDER || (env.PERENUAL_API_KEY ? "perenual" : "demo"),
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
};
