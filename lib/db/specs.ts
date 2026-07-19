import { randomUUID } from "node:crypto";

import type { Rui } from "@/lib/operations";

import { sql } from "./client";
import { computeContentHash } from "./hash";
import type { InsertSpecMeta, SavedSpec, SpecRecord } from "./types";
import { buildSpecUrl, buildViewUrl } from "./urls";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function mapRecordToSavedSpec(record: SpecRecord): SavedSpec {
  return {
    specId: record.id,
    url: buildSpecUrl(record.id),
    viewUrl: buildViewUrl(record.id),
    createdAt: record.created_at.toISOString(),
    contentHash: record.content_hash,
    validationVersion: record.validation_version,
    registryVersion: record.registry_version,
    normalizedRui: record.rui,
  };
}

function rowToRecord(row: Record<string, unknown>): SpecRecord {
  return {
    id: String(row.id),
    content_hash: String(row.content_hash),
    validation_version: String(row.validation_version),
    registry_version: String(row.registry_version),
    rui: row.rui as Rui,
    created_at: row.created_at instanceof Date
      ? row.created_at
      : new Date(String(row.created_at)),
  };
}

/** Accept any valid UUID string (not v4-only). */
export function isValidSpecId(id: string): boolean {
  return UUID_REGEX.test(id);
}

export async function insertSpec(
  normalizedRui: Rui,
  meta: InsertSpecMeta,
): Promise<SavedSpec> {
  const specId = randomUUID();
  const contentHash = computeContentHash(normalizedRui);

  const result = await sql`
    INSERT INTO specs (id, content_hash, validation_version, registry_version, rui)
    VALUES (
      ${specId},
      ${contentHash},
      ${meta.validationVersion},
      ${meta.registryVersion},
      ${JSON.stringify(normalizedRui)}::jsonb
    )
    RETURNING id, content_hash, validation_version, registry_version, rui, created_at
  `;

  const row = result.rows[0];
  if (!row) {
    throw new Error("INSERT INTO specs returned no row");
  }

  return mapRecordToSavedSpec(rowToRecord(row));
}

export async function getSpecById(specId: string): Promise<SavedSpec | null> {
  const result = await sql`
    SELECT id, content_hash, validation_version, registry_version, rui, created_at
    FROM specs
    WHERE id = ${specId}
  `;

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return mapRecordToSavedSpec(rowToRecord(row));
}
