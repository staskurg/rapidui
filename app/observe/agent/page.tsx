import Link from "next/link";

import { AgentRunOutcomeBadge } from "@/components/observe/AgentRunOutcomeBadge";
import { ObserveNoticeBanner } from "@/components/observe/ObserveNoticeBanner";
import { StatCard } from "@/components/observe/StatCard";
import {
  formatRelativeTime,
  getAgentObserveSummary,
  listAgentRuns,
  listDistinctAgentRunAgents,
  listDistinctEvalCases,
  listDistinctModels,
  listDistinctPromptVersions,
  truncateSessionId,
} from "@/lib/observe/queries";
import { getObserveNotice, isObserveNoticeKey } from "@/lib/observe/notices";

export const dynamic = "force-dynamic";

type AgentObservePageProps = {
  searchParams: Promise<{
    model?: string;
    promptVersion?: string;
    evalCase?: string;
    agent?: string;
    session?: string;
    notice?: string;
  }>;
};

function buildFilterQuery(filters: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      params.set(key, value);
    }
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

function formatLatency(value: number | null, minSavedRuns: number, savedCount: number): string {
  if (value === null || savedCount < minSavedRuns) {
    return "—";
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}s`;
  }
  return `${value}ms`;
}

export default async function AgentObservePage({ searchParams }: AgentObservePageProps) {
  const params = await searchParams;
  const filters = {
    model: params.model,
    promptVersion: params.promptVersion,
    evalCase: params.evalCase,
    agent: params.agent,
    session: params.session,
  };

  const [summary, runs, models, promptVersions, evalCases, agents] = await Promise.all([
    getAgentObserveSummary(filters),
    listAgentRuns(filters),
    listDistinctModels(),
    listDistinctPromptVersions(),
    listDistinctEvalCases(),
    listDistinctAgentRunAgents(),
  ]);

  const filterQuery = buildFilterQuery(filters);
  const hasData = summary.runCount > 0;
  const noticeKey = isObserveNoticeKey(params.notice) ? params.notice : undefined;
  const notice = noticeKey ? getObserveNotice(noticeKey, { sessionId: params.session }) : null;

  return (
    <div className="space-y-8">
      {notice ? (
        <ObserveNoticeBanner
          title={notice.title}
          message={notice.message}
          dismissHref={filterQuery ? `/observe/agent${filterQuery}` : "/observe/agent"}
        />
      ) : null}

      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Agent telemetry</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          RapidUI Agent chat sessions — outcomes, latency, tokens, and platform API usage. Last 30
          days.
        </p>
      </header>

      <form
        method="get"
        className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 md:grid-cols-3 lg:grid-cols-6"
      >
        <label className="space-y-1 text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Model</span>
          <select
            name="model"
            defaultValue={params.model ?? ""}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value="">All models</option>
            {models.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Prompt</span>
          <select
            name="promptVersion"
            defaultValue={params.promptVersion ?? ""}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value="">All prompts</option>
            {promptVersions.map((version) => (
              <option key={version} value={version}>
                {version}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Eval case</span>
          <select
            name="evalCase"
            defaultValue={params.evalCase ?? ""}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value="">All cases</option>
            {evalCases.map((evalCase) => (
              <option key={evalCase} value={evalCase}>
                {evalCase}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Agent id</span>
          <select
            name="agent"
            defaultValue={params.agent ?? ""}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value="">All agents</option>
            {agents.map((agent) => (
              <option key={agent} value={agent}>
                {agent}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm lg:col-span-2">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Session id</span>
          <input
            name="session"
            defaultValue={params.session ?? ""}
            placeholder="Filter by session id"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>
        <div className="flex items-end gap-2 lg:col-span-6">
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Apply filters
          </button>
          {filterQuery ? (
            <Link
              href="/observe/agent"
              className="rounded-md px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"
            >
              Clear
            </Link>
          ) : null}
        </div>
      </form>

      <div className="grid gap-2 grid-cols-2 sm:grid-cols-4 lg:grid-cols-4">
        <StatCard label="Runs" value={String(summary.runCount)} />
        <StatCard
          label="p50 latency"
          value={formatLatency(summary.p50LatencyMs, 3, summary.savedRunsForLatency)}
          hint="min. 3 saved runs"
        />
        <StatCard
          label="p95 latency"
          value={formatLatency(summary.p95LatencyMs, 10, summary.savedRunsForLatency)}
          hint="min. 10 saved runs"
        />
        <StatCard
          label="Avg tokens"
          value={summary.avgTokens === null ? "—" : String(summary.avgTokens)}
        />
        <StatCard label="Saved" value={String(summary.savedCount)} />
        <StatCard label="Failed" value={String(summary.failedCount)} />
        <StatCard label="Abandoned" value={String(summary.abandonedCount)} />
        <StatCard label="In progress" value={String(summary.inProgressCount)} />
        <StatCard
          label="Avg validate attempts"
          value={
            summary.avgValidateAttempts === null ? "—" : String(summary.avgValidateAttempts)
          }
          hint="from api_events"
        />
        <StatCard
          label="Avg platform API calls"
          value={
            summary.avgPlatformApiCalls === null ? "—" : String(summary.avgPlatformApiCalls)
          }
          hint="per session"
        />
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Recent runs</h2>
          <span className="text-sm text-zinc-500">{runs.length} shown</span>
        </div>

        {!hasData ? (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              No agent runs yet. Start a chat on the demo page — each session posts to{" "}
              <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs dark:bg-zinc-800">
                agent_runs
              </code>{" "}
              after the first turn.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
              <thead className="bg-zinc-50 dark:bg-zinc-950/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Session</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Outcome</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Model</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Eval case</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Validates</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Platform calls</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Tokens</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Started</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {runs.map((run) => (
                  <tr key={run.sessionId} className="hover:bg-zinc-50 dark:hover:bg-zinc-950/40">
                    <td className="px-4 py-3">
                      <Link
                        href={`/observe/agent/sessions/${encodeURIComponent(run.sessionId)}${filterQuery}`}
                        className="font-mono text-xs font-medium text-violet-700 hover:underline dark:text-violet-400"
                        title={run.sessionId}
                      >
                        {truncateSessionId(run.sessionId)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <AgentRunOutcomeBadge outcome={run.outcome} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{run.model ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs">{run.evalCaseId ?? "—"}</td>
                    <td className="px-4 py-3">{run.validateAttempts}</td>
                    <td className="px-4 py-3">{run.platformApiCalls}</td>
                    <td className="px-4 py-3">{run.totalTokens ?? "—"}</td>
                    <td className="px-4 py-3 text-zinc-500">
                      {formatRelativeTime(run.startedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {hasData && summary.runsByDay.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-base font-semibold">Runs by day</h2>
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="min-w-full text-sm">
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {summary.runsByDay.map((row) => (
                  <tr key={row.date}>
                    <td className="px-4 py-2 font-medium">{row.date}</td>
                    <td className="px-4 py-2 text-right text-zinc-500">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <Link
        href="/observe/api"
        className="inline-flex text-sm font-medium text-violet-700 hover:text-violet-900 dark:text-violet-400"
      >
        View API telemetry →
      </Link>
    </div>
  );
}
