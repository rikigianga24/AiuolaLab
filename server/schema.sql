-- Schema AiuolaLab. Viene applicato all'avvio (idempotente).

CREATE TABLE IF NOT EXISTS projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_key   TEXT NOT NULL,
  name        TEXT NOT NULL,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS projects_owner_idx ON projects (owner_key, updated_at DESC);

-- Cache delle risposte del DB piante esterno (il piano gratuito di
-- Perenual ha un limite di richieste giornaliere).
CREATE TABLE IF NOT EXISTS plant_cache (
  provider    TEXT NOT NULL,
  cache_key   TEXT NOT NULL,
  data        JSONB NOT NULL,
  fetched_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, cache_key)
);

-- ---------- Utenti e GDPR ----------

CREATE TABLE IF NOT EXISTS users (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                TEXT NOT NULL UNIQUE,
  password_hash        TEXT NOT NULL,
  email_verified_at    TIMESTAMPTZ,
  privacy_version      TEXT NOT NULL,
  privacy_accepted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  marketing_consent    BOOLEAN NOT NULL DEFAULT false,
  marketing_consent_at TIMESTAMPTZ,
  settings             JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Termini di utilizzo accettati alla registrazione (versione e data).
-- Gli account creati prima dei termini restano NULL.
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_version TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

-- Accesso con Google: account senza password, collegati con l'id Google.
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_sub TEXT UNIQUE;

CREATE TABLE IF NOT EXISTS sessions (
  token_hash  TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions (user_id);

-- Link via email: conferma dell'indirizzo e reimpostazione della password.
CREATE TABLE IF NOT EXISTS auth_tokens (
  token_hash  TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose     TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL
);

-- Dispositivi iscritti alle notifiche push.
CREATE TABLE IF NOT EXISTS push_subscriptions (
  endpoint    TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  keys        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notifiche già inviate, per non ripeterle.
CREATE TABLE IF NOT EXISTS notification_log (
  user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key      TEXT NOT NULL,
  sent_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, key)
);

-- Impostazioni dell'app generate dal server (es. chiavi per le notifiche).
CREATE TABLE IF NOT EXISTS app_settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Piano dell'utente: 'free' (gratis) o 'premium'. Si cambia a mano dal
-- pannello di Supabase (Table Editor > users > colonna plan).
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';
DO $$ BEGIN
  ALTER TABLE users ADD CONSTRAINT users_plan_check CHECK (plan IN ('free', 'premium'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Proposte del consulente IA effettivamente chieste a Google: servono per
-- le quote per utente e per il tetto giornaliero di tutta l'app.
-- google_day è il giorno secondo Google (fuso di Los Angeles).
CREATE TABLE IF NOT EXISTS ai_usage (
  id             BIGSERIAL PRIMARY KEY,
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  google_day     DATE NOT NULL,
  input_tokens   INTEGER,
  output_tokens  INTEGER,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_usage_user_idx ON ai_usage (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_usage_day_idx ON ai_usage (google_day);

-- Proposte già fatte: una richiesta identica riceve la stessa risposta
-- senza consumare richieste a Google.
CREATE TABLE IF NOT EXISTS ai_cache (
  cache_key   TEXT PRIMARY KEY,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Condivisione con un link: chi ha il link vede il progetto in sola lettura.
-- Il token è casuale; togliendolo (NULL) il link smette di funzionare.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS share_token TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS projects_share_token_idx ON projects (share_token) WHERE share_token IS NOT NULL;

-- Abbonamenti Premium (Paddle). Le righe arrivano dagli avvisi di Paddle
-- (webhook): non modificarle a mano, per regalare Premium usa users.plan.
-- Un utente è Premium se ha un abbonamento attivo OPPURE plan = 'premium'.
CREATE TABLE IF NOT EXISTS subscriptions (
  id                   TEXT PRIMARY KEY,               -- sub_... di Paddle
  user_id              UUID REFERENCES users(id) ON DELETE CASCADE,
  customer_id          TEXT NOT NULL,                  -- ctm_... di Paddle
  status               TEXT NOT NULL,                  -- active, trialing, past_due, paused, canceled
  price_id             TEXT,
  billing_interval     TEXT,                           -- month o year
  started_at           TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  cancel_at            TIMESTAMPTZ,                    -- disdetta programmata a fine periodo
  withdrawn_at         TIMESTAMPTZ,                    -- recesso entro 14 giorni
  provider_updated_at  TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS subscriptions_user_idx ON subscriptions (user_id);

-- Avvisi di Paddle già ricevuti: Paddle può mandare lo stesso più volte.
CREATE TABLE IF NOT EXISTS billing_events (
  event_id     TEXT PRIMARY KEY,
  event_type   TEXT NOT NULL,
  received_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row Level Security: su Supabase le tabelle dello schema "public" sono
-- esposte anche dalla sua API REST. Attivando RLS senza regole l'API non
-- vede niente; il server di AiuolaLab si collega come proprietario delle
-- tabelle e continua a leggerle e scriverle normalmente.
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE plant_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

-- Pulizia periodica (eseguita all'avvio).
DELETE FROM sessions WHERE expires_at < now();
DELETE FROM auth_tokens WHERE expires_at < now();
DELETE FROM notification_log WHERE sent_at < now() - interval '400 days';
DELETE FROM ai_usage WHERE created_at < now() - interval '90 days';
DELETE FROM ai_cache WHERE created_at < now() - interval '30 days';
DELETE FROM billing_events WHERE received_at < now() - interval '90 days';
