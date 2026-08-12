import { createObserveFilterQueryModule } from "@/lib/observe/observeFilterQuery";

const API_FILTER_KEYS = ["agent", "evalCase", "session", "from", "to"] as const;

export type ApiFilterSearchInput = Partial<
  Record<(typeof API_FILTER_KEYS)[number] | "days", string | undefined>
>;

const apiFilterQuery = createObserveFilterQueryModule({
  filterKeys: API_FILTER_KEYS,
  basePath: "/observe/api",
});

export const buildApiFilterQuery = apiFilterQuery.buildQuery;
export const buildApiFilterHref = apiFilterQuery.buildHref;
export const shouldCanonicalizeApiFilterUrl = apiFilterQuery.shouldCanonicalize;
export const canonicalApiFilterInput = apiFilterQuery.canonicalInput;
export const apiFilterInputFromForm = apiFilterQuery.inputFromForm;
export const apiFilterInputWithPreset = apiFilterQuery.inputWithPreset;
export const hasActiveApiFilters = apiFilterQuery.hasActiveFilters;
