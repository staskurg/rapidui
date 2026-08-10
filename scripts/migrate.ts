import fs from "node:fs";
import path from "node:path";

import { sql } from "../lib/db/client";

const MIGRATIONS = [
  "lib/db/migrations/001_specs.sql",
  "lib/db/migrations/002_eval_runs.sql",
  "lib/db/migrations/003_api_events.sql",
  "lib/db/migrations/004_agent_runs.sql",
  "lib/db/migrations/005_agent_turns.sql",
  "lib/db/migrations/006_api_events_http_status.sql",
  "lib/db/migrations/009_agent_runs_transcript.sql",
  "lib/db/migrations/010_agent_runs_env.sql",
  "lib/db/migrations/011_agent_turns_cache_read.sql",
] as const;

async function migrate(): Promise<void> {
  for (const relativePath of MIGRATIONS) {
    const migrationPath = path.join(process.cwd(), relativePath);
    const migration = fs.readFileSync(migrationPath, "utf8");

    await sql.query(migration);

    console.log(`Migration applied: ${relativePath}`);
  }
}

migrate().catch((error: unknown) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
