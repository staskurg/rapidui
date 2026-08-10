-- lib/db/migrations/010_agent_runs_env.sql

ALTER TABLE agent_runs ADD COLUMN IF NOT EXISTS env TEXT;

CREATE INDEX IF NOT EXISTS agent_runs_env_started_idx ON agent_runs (env, started_at DESC);
