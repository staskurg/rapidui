import Link from "next/link";

import { StatCard } from "@/components/observe/StatCard";
import { getAgentObserveSummary, getEvalTeaser, getObserveHubSummary } from "@/lib/observe/queries";
import { getEvalTrialsTeaser } from "@/lib/eval/queryEvalTrials";

export const dynamic = "force-dynamic";

function formatPercent(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "—";
  }
  return `${Math.round(value * 100)}%`;
}

export default async function ObserveHubPage() {
  const [summary, agentSummary, evalTrialsTeaser, pathBTeaser] = await Promise.all([
    getObserveHubSummary(),
    getAgentObserveSummary(),
    getEvalTrialsTeaser(),
    getEvalTeaser(),
  ]);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-title font-semibold tracking-tight">Overview</h1>
        <p className="text-ui text-zinc-600 dark:text-zinc-400">
          Analytics for RapidUI API traffic, agent runs, and eval lab results.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-ui font-semibold uppercase tracking-wide text-zinc-500">API</h2>
              <p className="mt-1 text-ui text-zinc-600 dark:text-zinc-400">
                Validate and save telemetry from all agents
              </p>
            </div>
            <Link
              href="/observe/api"
              className="text-ui font-medium text-violet-700 hover:text-violet-900 dark:text-violet-400"
            >
              View API →
            </Link>
          </div>
          <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">
                API requests
              </dt>
              <dd className="mt-1 text-title font-semibold">{summary.apiRequestCount}</dd>
            </div>
            <div>
              <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">
                Validate OK
              </dt>
              <dd className="mt-1 text-title font-semibold">
                {formatPercent(summary.validateSuccessRate)}
              </dd>
            </div>
            <div>
              <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">
                Specs saved
              </dt>
              <dd className="mt-1 text-title font-semibold">{summary.specsSaved}</dd>
            </div>
            <div>
              <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">
                Discovery hits
              </dt>
              <dd className="mt-1 text-title font-semibold">{summary.discoveryHits ?? 0}</dd>
              <dd className="mt-1 text-caption text-zinc-500">
                llms · docs · schema · health
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-ui font-semibold uppercase tracking-wide text-zinc-500">
                Agent
              </h2>
              <p className="mt-1 text-ui text-zinc-600 dark:text-zinc-400">
                RapidUI Agent chat sessions
              </p>
            </div>
            <Link
              href="/observe/agent"
              className="text-ui font-medium text-violet-700 hover:text-violet-900 dark:text-violet-400"
            >
              View Agent →
            </Link>
          </div>
          <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">Runs</dt>
              <dd className="mt-1 text-title font-semibold">{agentSummary.runCount}</dd>
            </div>
            <div>
              <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">Saved</dt>
              <dd className="mt-1 text-title font-semibold">{agentSummary.savedCount}</dd>
            </div>
            <div>
              <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">Draft</dt>
              <dd className="mt-1 text-title font-semibold">{agentSummary.draftCount}</dd>
            </div>
            <div>
              <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">
                Active
              </dt>
              <dd className="mt-1 text-title font-semibold">{agentSummary.activeCount}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-ui font-semibold uppercase tracking-wide text-zinc-500">
                Evals
              </h2>
              <p className="mt-1 text-ui text-zinc-600 dark:text-zinc-400">
                Automated guided trials and manual Path B runs
              </p>
            </div>
            <Link
              href="/observe/evals"
              className="text-ui font-medium text-violet-700 hover:text-violet-900 dark:text-violet-400"
            >
              View Evals →
            </Link>
          </div>
          {evalTrialsTeaser.totalTrials > 0 ? (
            <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">
                  Automated trials
                </dt>
                <dd className="mt-1 text-title font-semibold">{evalTrialsTeaser.totalTrials}</dd>
              </div>
              <div>
                <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">
                  Pass rate
                </dt>
                <dd className="mt-1 text-title font-semibold">
                  {evalTrialsTeaser.passRate === null
                    ? "—"
                    : `${evalTrialsTeaser.passRate}%`}
                </dd>
              </div>
              {pathBTeaser.totalRuns > 0 ? (
                <div>
                  <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">
                    Path B runs
                  </dt>
                  <dd className="mt-1 text-title font-semibold">{pathBTeaser.totalRuns}</dd>
                </div>
              ) : null}
            </dl>
          ) : pathBTeaser.totalRuns > 0 ? (
            <div className="mt-5">
              <StatCard
                label="Path B pass rate"
                value={
                  pathBTeaser.overallPassRate === null
                    ? "—"
                    : `${pathBTeaser.overallPassRate}%`
                }
                hint={`${pathBTeaser.totalRuns} manual eval runs`}
              />
            </div>
          ) : (
            <p className="mt-5 text-ui text-zinc-500">
              Run{" "}
              <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-caption dark:bg-zinc-800">
                npm run eval:run
              </code>{" "}
              to populate trials.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
