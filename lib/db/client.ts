import { neon } from "@neondatabase/serverless";

type SqlValue = string | number | boolean | Date | string[] | null | undefined;

type QueryResult = {
  rows: Record<string, unknown>[];
};

function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }
  return databaseUrl;
}

let cachedNeon: ReturnType<typeof neon> | null = null;

function getNeonClient(): ReturnType<typeof neon> {
  if (!cachedNeon) {
    cachedNeon = neon(getDatabaseUrl());
  }
  return cachedNeon;
}

function toRows(result: unknown): Record<string, unknown>[] {
  return Array.isArray(result) ? (result as Record<string, unknown>[]) : [];
}

async function taggedQuery(
  strings: TemplateStringsArray,
  ...values: SqlValue[]
): Promise<QueryResult> {
  const rows = await getNeonClient()(strings, ...values);
  return { rows: toRows(rows) };
}

function splitSqlStatements(source: string): string[] {
  return source
    .split(";")
    .map((part) =>
      part
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n")
        .trim(),
    )
    .filter((statement) => statement.length > 0);
}

async function rawQuery(source: string): Promise<QueryResult> {
  const client = getNeonClient();
  const statements = splitSqlStatements(source);
  let lastRows: Record<string, unknown>[] = [];

  for (const statement of statements) {
    const rows = await client.query(statement, []);
    lastRows = toRows(rows);
  }

  return { rows: lastRows };
}

export const sql = Object.assign(taggedQuery, { query: rawQuery });
