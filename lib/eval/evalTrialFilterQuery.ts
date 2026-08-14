import { createObserveFilterQueryModule } from "@/lib/observe/observeFilterQuery";

const EVAL_TRIAL_FILTER_KEYS = ["result", "experiment", "overCap", "from", "to"] as const;

export type EvalTrialFilterSearchInput = Partial<
  Record<(typeof EVAL_TRIAL_FILTER_KEYS)[number] | "days", string | undefined>
>;

const evalTrialFilterQuery = createObserveFilterQueryModule({
  filterKeys: EVAL_TRIAL_FILTER_KEYS,
  basePath: "/observe/evals",
  inactiveFilterKeys: ["from", "to"],
});

export const buildEvalTrialFilterQuery = evalTrialFilterQuery.buildQuery;
export const buildEvalTrialFilterHref = evalTrialFilterQuery.buildHref;
export const shouldCanonicalizeEvalTrialFilterUrl = evalTrialFilterQuery.shouldCanonicalize;
export const canonicalEvalTrialFilterInput = evalTrialFilterQuery.canonicalInput;
export const evalTrialFilterInputFromForm = evalTrialFilterQuery.inputFromForm;
export const evalTrialFilterInputWithPreset = evalTrialFilterQuery.inputWithPreset;
export const hasActiveEvalTrialFilters = evalTrialFilterQuery.hasActiveFilters;

export const EVAL_TRIAL_RESULT_FILTERS = [
  { value: "", label: "All results" },
  { value: "pass", label: "Pass" },
  { value: "fail", label: "Fail" },
  { value: "incomplete", label: "Incomplete" },
  { value: "error", label: "Error" },
  { value: "infra", label: "Infra error" },
] as const;

export type EvalTrialResultFilter =
  | ""
  | "pass"
  | "fail"
  | "incomplete"
  | "error"
  | "infra";

export function parseEvalTrialResultFilter(
  value: string | undefined,
): EvalTrialResultFilter {
  if (
    value === "pass" ||
    value === "fail" ||
    value === "incomplete" ||
    value === "error" ||
    value === "infra"
  ) {
    return value;
  }
  return "";
}
