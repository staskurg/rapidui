-- lib/db/migrations/006_api_events_http_status.sql

ALTER TABLE api_events ADD COLUMN IF NOT EXISTS http_status INT;
