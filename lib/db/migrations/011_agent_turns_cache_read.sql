-- lib/db/migrations/011_agent_turns_cache_read.sql
-- Nullable: NULL = legacy row (cache unknown), 0+ = measured cache hits for billing.

ALTER TABLE agent_turns
  ADD COLUMN IF NOT EXISTS cache_read_tokens INT;
