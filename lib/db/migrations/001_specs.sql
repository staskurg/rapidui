-- lib/db/migrations/001_specs.sql

CREATE TABLE IF NOT EXISTS specs (
  id                  UUID PRIMARY KEY,
  content_hash        TEXT NOT NULL,
  validation_version  TEXT NOT NULL,
  registry_version    TEXT NOT NULL,
  rui                 JSONB NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS specs_content_hash_idx ON specs (content_hash);
