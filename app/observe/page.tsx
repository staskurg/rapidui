import Link from "next/link";

import { StatCard } from "@/components/observe/StatCard";
import { getAgentObserveSummary, getEvalTeaser, getObserveHubSummary } from "@/lib/observe/queries";

export const dynamic = "force-dynamic";

function formatPercent(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "—";
  }
  return `${Math.round(value * 100)}%`;
}

export default async function ObserveHubPage() {
  const [summary, agentSummary, evalTeaser] = await Promise.all([
    getObserveHubSummary(),
    getAgentObserveSummary(),
    getEvalTeaser(),
  ]);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Analytics for RapidUI API traffic, agent runs, and eval lab results.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">API</h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Validate and save telemetry from all agents
              </p>
            </div>
            <Link
              href="/observe/api"
              className="text-sm font-medium text-violet-700 hover:text-violet-900 dark:text-violet-400"
            >
              View API →
            </Link>
          </div>
          <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                API requests
              </dt>
              <dd className="mt-1 text-2xl font-semibold">{summary.apiRequestCount}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Validate OK
              </dt>
              <dd className="mt-1 text-2xl font-semibold">
                {formatPercent(summary.validateSuccessRate)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Specs saved
              </dt>
              <dd className="mt-1 text-2xl font-semibold">{summary.specsSaved}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Discovery hits
              </dt>
              <dd className="mt-1 text-2xl font-semibold">{summary.discoveryHits ?? 0}</dd>
              <dd className="mt-1 text-xs text-zinc-500">
                llms · docs · schema · health
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Agent
              </h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                RapidUI Agent chat sessions
              </p>
            </div>
            <Link
              href="/observe/agent"
              className="text-sm font-medium text-violet-700 hover:text-violet-900 dark:text-violet-400"
            >
              View Agent →
            </Link>
          </div>
          <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Runs</dt>
              <dd className="mt-1 text-2xl font-semibold">{agentSummary.runCount}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Saved</dt>
              <dd className="mt-1 text-2xl font-semibold">{agentSummary.savedCount}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Abandoned
              </dt>
              <dd className="mt-1 text-2xl font-semibold">{agentSummary.abandonedCount}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                In progress
              </dt>
              <dd className="mt-1 text-2xl font-semibold">{agentSummary.inProgressCount}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-dashed border-zinc-300 bg-zinc-100/60 p-5 dark:border-zinc-700 dark:bg-zinc-900/40">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Evals
              </h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Phase 7</p>
            </div>
            <Link
              href="/observe/evals"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"
            >
              View Evals →
            </Link>
          </div>
          {evalTeaser.totalRuns > 0 ? (
            <div className="mt-5">
              <StatCard
                label="Overall pass rate"
                value={
                  evalTeaser.overallPassRate === null
                    ? "—"
                    : `${evalTeaser.overallPassRate}%`
                }
                hint={`${evalTeaser.totalRuns} eval runs in window`}
              />
            </div>
          ) : (
            <p className="mt-5 text-sm font-medium text-zinc-500">
              Model × prompt matrix ships in Phase 7
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
