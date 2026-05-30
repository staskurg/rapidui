export { sql } from "./client";
export { computeContentHash } from "./hash";
export { insertEvalRun, listEvalRunsByCase } from "./evalRuns";
export { getSpecById, insertSpec, isValidSpecId } from "./specs";
export type { InsertEvalRunInput, EvalRunRecord } from "./evalRuns";
export type {
  InsertSpecMeta,
  SavedSpec,
  SpecRecord,
  StoreFailure,
} from "./types";
export { buildSpecUrl, buildViewUrl } from "./urls";

export const STORAGE_UNAVAILABLE_RESPONSE = {
  error: "STORAGE_UNAVAILABLE" as const,
  message: "RUI store is temporarily unavailable.",
};
