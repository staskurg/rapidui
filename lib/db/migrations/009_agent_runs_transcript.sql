-- lib/db/migrations/009_agent_runs_transcript.sql

ALTER TABLE agent_runs
  ADD COLUMN IF NOT EXISTS transcript_jsonb JSONB NULL,
  ADD COLUMN IF NOT EXISTS transcript_updated_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS transcript_turn_count INT NULL;

CREATE INDEX IF NOT EXISTS agent_runs_transcript_updated_idx
  ON agent_runs (transcript_updated_at DESC)
  WHERE transcript_jsonb IS NOT NULL;
