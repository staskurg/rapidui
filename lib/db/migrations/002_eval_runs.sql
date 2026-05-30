-- lib/db/migrations/002_eval_runs.sql

CREATE TABLE IF NOT EXISTS eval_runs (
  id                UUID PRIMARY KEY,
  eval_case_id      TEXT NOT NULL,
  agent             TEXT NOT NULL,
  base_url          TEXT NOT NULL,
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  passed            BOOLEAN NOT NULL,
  validate_count    INT NOT NULL DEFAULT 0,
  error_codes       TEXT[] NOT NULL DEFAULT '{}',
  final_spec_id     UUID REFERENCES specs(id),
  view_url          TEXT,
  blocks_found      TEXT[] NOT NULL DEFAULT '{}',
  score_details     JSONB,
  notes             TEXT
);

CREATE INDEX IF NOT EXISTS eval_runs_case_idx ON eval_runs (eval_case_id);
CREATE INDEX IF NOT EXISTS eval_runs_agent_idx ON eval_runs (agent);
CREATE INDEX IF NOT EXISTS eval_runs_passed_idx ON eval_runs (passed);
CREATE INDEX IF NOT EXISTS eval_runs_completed_idx ON eval_runs (completed_at DESC);
