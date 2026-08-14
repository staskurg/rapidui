"use client";

import { useRouter } from "next/navigation";
import { type SubmitEvent } from "react";

import {
  buildEvalTrialFilterHref,
  evalTrialFilterInputFromForm,
  EVAL_TRIAL_RESULT_FILTERS,
} from "@/lib/eval/evalTrialFilterQuery";
import { useObserveNavigation } from "@/lib/observe/observePendingContext";
import { MetricInfoTooltip } from "@/components/observe/MetricInfoTooltip";
import { evalMetricTooltips } from "@/lib/observe/metric-tooltips";

type ObserveDateRange = {
  from?: string;
  to?: string;
};

type EvalTrialFiltersFormProps = {
  formKey: string;
  hasActiveFilters: boolean;
  preserveDateRange?: ObserveDateRange;
  params: {
    result?: string;
    experiment?: string;
    overCap?: string;
  };
};

export function EvalTrialFiltersForm({
  formKey,
  hasActiveFilters,
  preserveDateRange,
  params,
}: EvalTrialFiltersFormProps) {
  const router = useRouter();
  const { startObserveTransition } = useObserveNavigation();

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const filters: Record<string, string | undefined> = {};

    for (const [key, value] of data.entries()) {
      if (typeof value === "string") {
        filters[key] = value;
      }
    }

    if (data.get("overCap") === "on") {
      filters.overCap = "1";
    }

    startObserveTransition(() => {
      router.push(
        buildEvalTrialFilterHref({
          ...evalTrialFilterInputFromForm(filters),
          ...preserveDateRange,
        }),
      );
    });
  }

  return (
    <form
      key={formKey}
      onSubmit={handleSubmit}
      className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex flex-wrap items-end gap-3 p-4">
        <label className="min-w-36 flex-1 space-y-1 text-ui">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Result</span>
          <select
            name="result"
            defaultValue={params.result ?? ""}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          >
            {EVAL_TRIAL_RESULT_FILTERS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="min-w-52 flex-[2] space-y-1 text-ui">
          <span className="inline-flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-300">
            Experiment id
            <MetricInfoTooltip
              label="Experiment id search"
              description={evalMetricTooltips.experimentSearch}
              icon="i"
              placement="bottom"
            />
          </span>
          <input
            type="search"
            name="experiment"
            defaultValue={params.experiment ?? ""}
            placeholder="Paste or prefix-match UUID from eval:run"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-caption dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>

        <label className="flex items-center gap-2 pb-2 text-ui">
          <input
            type="checkbox"
            name="overCap"
            defaultChecked={params.overCap === "1"}
            className="rounded border-zinc-300 dark:border-zinc-700"
          />
          <span className="inline-flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-300">
            Over process cap
            <MetricInfoTooltip
              label="Over process cap"
              description={evalMetricTooltips.overProcessCap}
              placement="bottom"
            />
          </span>
        </label>

        <button
          type="submit"
          className="inline-flex min-w-13 items-center justify-center rounded-md bg-zinc-900 px-3 py-2 text-ui font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Apply
        </button>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={() => {
              startObserveTransition(() => {
                router.replace(buildEvalTrialFilterHref({ ...preserveDateRange }));
                router.refresh();
              });
            }}
            className="inline-flex items-center justify-center rounded-md border border-zinc-300 p-2 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label="Clear filters"
          >
            ×
          </button>
        ) : null}
      </div>
    </form>
  );
}
