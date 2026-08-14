-- lib/db/migrations/007_eval_trials.sql
-- Path A automated eval trials (append-only snapshots).

CREATE TABLE IF NOT EXISTS eval_trials (
  id                      UUID PRIMARY KEY,
  experiment_id           UUID NOT NULL,
  trial_index             INT NOT NULL,
  session_id              TEXT NOT NULL,

  eval_case_id            TEXT NOT NULL,
  case_hash               TEXT NOT NULL,
  agent                   TEXT NOT NULL,
  base_url                TEXT NOT NULL,
  model                   TEXT,
  provider                TEXT,
  prompt_version          TEXT,
  prompt_hash             TEXT,
  eval_mode               TEXT NOT NULL DEFAULT 'guided',
  git_commit              TEXT,
  git_dirty               BOOLEAN,
  runner_version          TEXT,
  validation_version      TEXT,
  registry_version        TEXT,

  passed                  BOOLEAN,
  run_state               TEXT NOT NULL,
  failure_owner           TEXT,
  failure_stage           TEXT,
  failure_code            TEXT,
  failure_detail          TEXT,

  final_spec_id           UUID REFERENCES specs(id),
  content_hash            TEXT,
  assertion_results       JSONB NOT NULL DEFAULT '[]'::jsonb,

  user_turns              INT NOT NULL DEFAULT 0,
  validate_attempts       INT NOT NULL DEFAULT 0,
  validation_failures     INT NOT NULL DEFAULT 0,
  tokens_in               INT,
  tokens_out              INT,
  latency_ms              INT,
  must_validate_met       BOOLEAN,

  transcript_jsonb        JSONB,
  conversation_scores     JSONB,
  baseline_experiment_id  UUID,

  started_at              TIMESTAMPTZ NOT NULL,
  completed_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS eval_trials_experiment_idx
  ON eval_trials (experiment_id, trial_index);

CREATE INDEX IF NOT EXISTS eval_trials_case_started_idx
  ON eval_trials (eval_case_id, started_at DESC);

CREATE INDEX IF NOT EXISTS eval_trials_result_idx
  ON eval_trials (run_state, passed);

CREATE INDEX IF NOT EXISTS eval_trials_session_idx
  ON eval_trials (session_id);

CREATE INDEX IF NOT EXISTS eval_trials_completed_idx
  ON eval_trials (completed_at DESC);
