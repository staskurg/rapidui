import fs from "node:fs";
import path from "node:path";

import type { EvalCase } from "../../eval/types";

const CASES_DIR = path.join(process.cwd(), "eval/cases");

/** Load an eval case JSON by id (filename without .json). */
export function loadCase(caseId: string): EvalCase {
  const filePath = path.join(CASES_DIR, `${caseId}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Eval case not found: ${caseId} (expected ${filePath})`);
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw) as EvalCase;

  if (parsed.id !== caseId) {
    throw new Error(
      `Eval case id mismatch: file is ${caseId}.json but JSON id is "${parsed.id}"`,
    );
  }

  return parsed;
}

/** List available eval case ids (basename without .json). */
export function listCaseIds(): string[] {
  if (!fs.existsSync(CASES_DIR)) {
    return [];
  }

  return fs
    .readdirSync(CASES_DIR)
    .filter((name) => name.endsWith(".json"))
    .map((name) => name.replace(/\.json$/, ""))
    .sort();
}
