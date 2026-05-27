import fs from "node:fs";
import path from "node:path";

import { sql } from "../lib/db/client";

async function migrate(): Promise<void> {
  const migrationPath = path.join(
    process.cwd(),
    "lib/db/migrations/001_specs.sql",
  );
  const migration = fs.readFileSync(migrationPath, "utf8");

  await sql.query(migration);

  console.log("Migration applied: lib/db/migrations/001_specs.sql");
}

migrate().catch((error: unknown) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
