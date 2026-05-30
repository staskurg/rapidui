import { randomUUID } from "node:crypto";

import { sql } from "./client";
import type { ScoreDetails } from "../../eval/types";

export type InsertEvalRunInput = {
  evalCaseId: string;
  agent: string;
  baseUrl: string;
  passed: boolean;
  validateCount: number;
  errorCodes: string[];
  finalSpecId?: string | null;
  viewUrl?: string | null;
  blocksFound: string[];
  scoreDetails?: ScoreDetails;
  notes?: string | null;
};

/** Format string[] for Postgres TEXT[] — sql`` only accepts Primitive params. */
function toPgTextArray(values: string[]): string {
  if (values.length === 0) {
    return "{}";
  }

  const elements = values.map((value) => {
    const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return `"${escaped}"`;
  });

  return `{${elements.join(",")}}`;
}

export type EvalRunRecord = {
  id: string;
  eval_case_id: string;
  agent: string;
  base_url: string;
  started_at: Date | null;
  completed_at: Date;
  passed: boolean;
  validate_count: number;
  error_codes: string[];
  final_spec_id: string | null;
  view_url: string | null;
  blocks_found: string[];
  score_details: ScoreDetails | null;
  notes: string | null;
};

function rowToRecord(row: Record<string, unknown>): EvalRunRecord {
  return {
    id: String(row.id),
    eval_case_id: String(row.eval_case_id),
    agent: String(row.agent),
    base_url: String(row.base_url),
    started_at: row.started_at
      ? row.started_at instanceof Date
        ? row.started_at
        : new Date(String(row.started_at))
      : null,
    completed_at:
      row.completed_at instanceof Date
        ? row.completed_at
        : new Date(String(row.completed_at)),
    passed: Boolean(row.passed),
    validate_count: Number(row.validate_count),
    error_codes: Array.isArray(row.error_codes)
      ? row.error_codes.map(String)
      : [],
    final_spec_id: row.final_spec_id ? String(row.final_spec_id) : null,
    view_url: row.view_url ? String(row.view_url) : null,
    blocks_found: Array.isArray(row.blocks_found)
      ? row.blocks_found.map(String)
      : [],
    score_details: (row.score_details as ScoreDetails | null) ?? null,
    notes: row.notes ? String(row.notes) : null,
  };
}

export async function insertEvalRun(
  input: InsertEvalRunInput,
): Promise<EvalRunRecord> {
  const id = randomUUID();

  const result = await sql`
    INSERT INTO eval_runs (
      id,
      eval_case_id,
      agent,
      base_url,
      passed,
      validate_count,
      error_codes,
      final_spec_id,
      view_url,
      blocks_found,
      score_details,
      notes
    )
    VALUES (
      ${id},
      ${input.evalCaseId},
      ${input.agent},
      ${input.baseUrl},
      ${input.passed},
      ${input.validateCount},
      ${toPgTextArray(input.errorCodes)}::text[],
      ${input.finalSpecId ?? null},
      ${input.viewUrl ?? null},
      ${toPgTextArray(input.blocksFound)}::text[],
      ${input.scoreDetails ? JSON.stringify(input.scoreDetails) : null}::jsonb,
      ${input.notes ?? null}
    )
    RETURNING *
  `;

  const row = result.rows[0];
  if (!row) {
    throw new Error("INSERT INTO eval_runs returned no row");
  }

  return rowToRecord(row);
}

export async function listEvalRunsByCase(
  evalCaseId: string,
): Promise<EvalRunRecord[]> {
  const result = await sql`
    SELECT *
    FROM eval_runs
    WHERE eval_case_id = ${evalCaseId}
    ORDER BY completed_at DESC
  `;

  return result.rows.map((row) => rowToRecord(row));
}
