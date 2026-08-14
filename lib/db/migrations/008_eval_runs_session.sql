-- lib/db/migrations/008_eval_runs_session.sql
-- Path B manual eval_runs cross-link to Observe via session_id.

ALTER TABLE eval_runs ADD COLUMN IF NOT EXISTS session_id TEXT NULL;

CREATE INDEX IF NOT EXISTS eval_runs_session_idx
  ON eval_runs (session_id)
  WHERE session_id IS NOT NULL;
