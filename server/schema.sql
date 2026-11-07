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

-- Pulizia periodica (eseguita all'avvio).
DELETE FROM sessions WHERE expires_at < now();
DELETE FROM auth_tokens WHERE expires_at < now();
DELETE FROM notification_log WHERE sent_at < now() - interval '400 days';
