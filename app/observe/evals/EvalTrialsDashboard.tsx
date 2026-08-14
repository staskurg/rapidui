import Link from "next/link";

import { EvalTrialFiltersForm } from "@/components/observe/EvalTrialFiltersForm";
import { ExperimentOutcomeBadge } from "@/components/observe/ExperimentOutcomeBadge";
import { StatCard } from "@/components/observe/StatCard";
import { StatCardGrid } from "@/components/observe/StatCardGrid";
import {
  buildEvalTrialFilterQuery,
  hasActiveEvalTrialFilters,
  type EvalTrialFilterSearchInput,
} from "@/lib/eval/evalTrialFilterQuery";
import {
  formatExperimentPassRate,
  getEvalObserveSummary,
  queryEvalExperiments,
} from "@/lib/eval/queryEvalExperiments";
import type { EvalTrialsQueryInput } from "@/lib/eval/queryEvalTrials";
import {
  formatTrialLatency,
  truncateExperimentId,
} from "@/lib/eval/trialDisplay";
import { evalMetricTooltips } from "@/lib/observe/metric-tooltips";
import { formatRelativeTime, getEvalTeaser } from "@/lib/observe/queries";

type EvalTrialsDashboardProps = {
  params: EvalTrialFilterSearchInput;
  query: EvalTrialsQueryInput;
  preserveDateRange?: {
    from?: string;
    to?: string;
  };
};

function formatPassRate(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "—";
  }
  return `${Math.round(value * 100)}%`;
}

export async function EvalTrialsDashboard({
  params,
  query,
  preserveDateRange,
}: EvalTrialsDashboardProps) {
  const [experiments, summary, pathBTeaser] = await Promise.all([
    queryEvalExperiments(query),
    getEvalObserveSummary(query),
    getEvalTeaser(),
  ]);

  const filterQuery = buildEvalTrialFilterQuery(params);
  const hasFilters = hasActiveEvalTrialFilters(params);
  const hasData = summary.experimentCount > 0;

  return (
    <>
      <EvalTrialFiltersForm
        formKey={filterQuery || "default"}
        hasActiveFilters={hasFilters}
        preserveDateRange={preserveDateRange}
        params={params}
      />

      <StatCardGrid>
        <StatCard label="Experiments" value={String(summary.experimentCount)} />
        <StatCard
          label="Case pass rate"
          value={formatPassRate(summary.passRate)}
          hint={`${summary.passedCases}/${summary.totalCases} cases`}
          tooltip={evalMetricTooltips.casePassRate}
        />
        <StatCard label="Cases run" value={String(summary.totalCases)} hint="in selected period" />
        <StatCard
          label="p50 latency"
          value={
            summary.latencySampleSize >= 3
              ? formatTrialLatency(summary.p50LatencyMs)
              : "—"
          }
          hint="min. 3 trials with latency"
          tooltip={evalMetricTooltips.p50Latency}
        />
        <StatCard
          label="Avg latency"
          value={formatTrialLatency(summary.avgLatencyMs)}
          tooltip={evalMetricTooltips.avgLatency}
        />
        <StatCard
          label="Avg validates"
          value={
            summary.avgValidateAttempts === null ? "—" : String(summary.avgValidateAttempts)
          }
          tooltip={evalMetricTooltips.avgValidateAttempts}
        />
        <StatCard
          label="Avg user turns"
          value={summary.avgUserTurns === null ? "—" : String(summary.avgUserTurns)}
          tooltip={evalMetricTooltips.avgUserTurns}
        />
        <StatCard
          label="Over cap"
          value={String(summary.overCapCount)}
          hint="tuning signals"
          tooltip={evalMetricTooltips.overCapTrials}
        />
      </StatCardGrid>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-subhead font-semibold">Recent experiments</h2>
          <span className="text-ui text-zinc-500">{experiments.length} shown</span>
        </div>

        {!hasData ? (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-ui text-zinc-600 dark:text-zinc-400">
              {hasFilters
                ? "No experiments match these filters in the selected period."
                : "No automated experiments in this period. Run the guided eval harness locally to populate "}
              {!hasFilters ? (
                <>
                  <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-caption dark:bg-zinc-800">
                    eval_trials
                  </code>
                  .
                </>
              ) : null}
            </p>
            {!hasFilters ? (
              <pre className="mx-auto mt-4 max-w-lg overflow-x-auto rounded-lg bg-zinc-950 px-4 py-3 text-left font-mono text-caption text-zinc-100">
                npm run eval:run -- --case=static-browse-v0.2
              </pre>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="min-w-full divide-y divide-zinc-200 text-ui dark:divide-zinc-800">
              <thead className="bg-zinc-50 dark:bg-zinc-950/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Experiment</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Outcome</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Pass rate</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Cases</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Model</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Prompt</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Started</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {experiments.map((experiment) => (
                  <tr
                    key={experiment.experiment_id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-950/40"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/observe/evals/experiments/${experiment.experiment_id}`}
                        className="font-mono text-caption font-medium text-violet-700 hover:underline dark:text-violet-400"
                        title={experiment.experiment_id}
                      >
                        {truncateExperimentId(experiment.experiment_id)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <ExperimentOutcomeBadge summary={experiment} />
                    </td>
                    <td className="px-4 py-3">
                      {formatExperimentPassRate(experiment)}
                      <span className="ml-1 text-zinc-500">
                        ({experiment.passed}/{experiment.total_cases})
                      </span>
                    </td>
                    <td className="px-4 py-3">{experiment.total_cases}</td>
                    <td className="px-4 py-3 font-mono text-caption">
                      {experiment.model ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-caption">
                      {experiment.prompt_version ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {formatRelativeTime(experiment.started_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {pathBTeaser.totalRuns > 0 ? (
        <section className="space-y-3">
          <h2 className="text-body font-semibold">Path B manual runs (legacy)</h2>
          <p className="text-ui text-zinc-500">
            External agent runs logged via{" "}
            <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-caption dark:bg-zinc-800">
              eval:log
            </code>{" "}
            — teaser only until matrix UI in Phase 7.7.
          </p>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="min-w-full divide-y divide-zinc-200 text-ui dark:divide-zinc-800">
              <thead className="bg-zinc-50 dark:bg-zinc-950/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Eval case</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-500">Passed</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-500">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {pathBTeaser.caseBreakdown.map((row) => (
                  <tr key={row.evalCaseId}>
                    <td className="px-4 py-3 font-mono text-caption">{row.evalCaseId}</td>
                    <td className="px-4 py-3 text-right">{row.passed}</td>
                    <td className="px-4 py-3 text-right text-zinc-500">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <p className="text-caption text-zinc-500">
        Grouped model × prompt matrix comparison ships in Phase 7.7 (
        <code className="font-mono">npm run eval:matrix</code>).
      </p>
    </>
  );
}
