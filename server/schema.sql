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
