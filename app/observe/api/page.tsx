import Link from "next/link";

import { SessionOutcomeBadge } from "@/components/observe/SessionOutcomeBadge";
import { StatCard } from "@/components/observe/StatCard";
import {
  formatRelativeTime,
  getApiObserveSummary,
  listDistinctAgents,
  listDistinctEvalCases,
  listRecentSessions,
  truncateSessionId,
} from "@/lib/observe/queries";

export const dynamic = "force-dynamic";

type ApiObservePageProps = {
  searchParams: Promise<{
    agent?: string;
    evalCase?: string;
    session?: string;
  }>;
};

function formatPercent(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "—";
  }
  return `${Math.round(value * 100)}%`;
}

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

export default async function ApiObservePage({ searchParams }: ApiObservePageProps) {
  const params = await searchParams;
  const filters = {
    agent: params.agent,
    evalCase: params.evalCase,
    session: params.session,
  };

  const [summary, sessions, agents, evalCases] = await Promise.all([
    getApiObserveSummary(filters),
    listRecentSessions(filters),
    listDistinctAgents(),
    listDistinctEvalCases(),
  ]);

  const filterQuery = buildFilterQuery(filters);
  const hasData =
    summary.apiRequestCount > 0 || (summary.discoveryHits ?? 0) > 0;
  const discoveryByEndpoint = summary.discoveryByEndpoint ?? {};

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm text-zinc-500">Observe › API</p>
        <h1 className="text-2xl font-semibold tracking-tight">API telemetry</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Discovery, validate, and save events from external agents and RapidUI Agent — last 30
          days.
        </p>
      </header>

      {(summary.discoveryHits ?? 0) > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Discovery &amp; health
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard label="Discovery hits" value={String(summary.discoveryHits ?? 0)} />
            <StatCard
              label="llms.txt"
              value={String(discoveryByEndpoint["/llms.txt"] ?? 0)}
            />
            <StatCard label="/api/docs" value={String(discoveryByEndpoint["/api/docs"] ?? 0)} />
            <StatCard
              label="/api/schema"
              value={String(discoveryByEndpoint["/api/schema"] ?? 0)}
            />
            <StatCard
              label="/api/health"
              value={String(discoveryByEndpoint["/api/health"] ?? 0)}
            />
          </div>
        </section>
      ) : null}

      <form method="get" className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 md:grid-cols-4">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Agent</span>
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
        <label className="space-y-1 text-sm md:col-span-2">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Session id</span>
          <input
            name="session"
            defaultValue={params.session ?? ""}
            placeholder="Paste SESSION_ID from terminal"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>
        <div className="flex items-end gap-2 md:col-span-4">
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Apply filters
          </button>
          {filterQuery ? (
            <Link
              href="/observe/api"
              className="rounded-md px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"
            >
              Clear
            </Link>
          ) : null}
        </div>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sessions" value={String(summary.sessionCount)} />
        <StatCard label="Validate OK" value={formatPercent(summary.validateSuccessRate)} />
        <StatCard label="Specs saved" value={String(summary.specsSaved)} />
        <StatCard
          label="Avg tries before save"
          value={
            summary.avgTriesBeforeSave === null
              ? "—"
              : String(summary.avgTriesBeforeSave)
          }
        />
      </div>

      {summary.transportFailureCount > 0 ? (
        <p className="text-sm text-amber-700 dark:text-amber-400">
          {summary.transportFailureCount} transport-level validate failures (valid is null)
        </p>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Recent sessions</h2>
          <span className="text-sm text-zinc-500">{sessions.length} shown</span>
        </div>

        {!hasData ? (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              No API telemetry yet. Run an agent session: start at{" "}
              <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs dark:bg-zinc-800">
                GET /llms.txt
              </code>
              , generate a session id, then validate → save with{" "}
              <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs dark:bg-zinc-800">
                X-RapidUI-Session-Id
              </code>
              .
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
              <thead className="bg-zinc-50 dark:bg-zinc-950/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Session</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Agent</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Eval case</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Validates</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Outcome</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Spec</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Last activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {sessions.map((session) => (
                  <tr key={session.sessionId} className="hover:bg-zinc-50 dark:hover:bg-zinc-950/40">
                    <td className="px-4 py-3">
                      <Link
                        href={`/observe/api/sessions/${encodeURIComponent(session.sessionId)}${buildFilterQuery({ fromAgent: params.agent })}`}
                        className="font-mono text-xs font-medium text-violet-700 hover:underline dark:text-violet-400"
                        title={session.sessionId}
                      >
                        {truncateSessionId(session.sessionId)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {session.agent ? (
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium dark:bg-zinc-800">
                          {session.agent}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{session.evalCaseId ?? "—"}</td>
                    <td className="px-4 py-3">{session.validateCount}</td>
                    <td className="px-4 py-3">
                      <SessionOutcomeBadge outcome={session.outcome} />
                    </td>
                    <td className="px-4 py-3">
                      {session.finalSpecId ? (
                        <Link
                          href={`/specs/${session.finalSpecId}`}
                          className="font-mono text-xs text-violet-700 hover:underline dark:text-violet-400"
                        >
                          {truncateSessionId(session.finalSpecId, 6)}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {formatRelativeTime(session.lastActivityAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {hasData ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {summary.funnel ? (
            <section className="space-y-3 lg:col-span-2">
              <h2 className="text-base font-semibold">Session funnel</h2>
              <p className="text-sm text-zinc-500">
                Sessions that reached each stage in the window (identified by session id).
              </p>
              <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                <table className="min-w-full text-sm">
                  <thead className="bg-zinc-50 dark:bg-zinc-950/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-zinc-500">llms.txt</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-500">/api/docs</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-500">
                        /api/schema
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-500">validate</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-500">save</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-4 py-3">{summary.funnel.llms}</td>
                      <td className="px-4 py-3">{summary.funnel.docs}</td>
                      <td className="px-4 py-3">{summary.funnel.schema}</td>
                      <td className="px-4 py-3">{summary.funnel.validate}</td>
                      <td className="px-4 py-3">{summary.funnel.save}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
          <SupportingTable
            title="Top error codes"
            emptyLabel="No validation errors in window"
            rows={summary.topErrorCodes.map((row) => ({
              key: row.code,
              primary: row.code,
              secondary: String(row.count),
            }))}
          />
          <SupportingTable
            title="Saves by agent"
            emptyLabel="No saved specs in window"
            rows={summary.savesByAgent.map((row) => ({
              key: row.agent,
              primary: row.agent,
              secondary: String(row.count),
            }))}
          />
          <SupportingTable
            title="Requests by day"
            emptyLabel="No requests in window"
            rows={summary.requestsByDay.map((row) => ({
              key: row.date,
              primary: row.date,
              secondary: String(row.count),
            }))}
            className="lg:col-span-2"
          />
        </div>
      ) : null}
    </div>
  );
}

function SupportingTable({
  title,
  emptyLabel,
  rows,
  className,
}: {
  title: string;
  emptyLabel: string;
  rows: { key: string; primary: string; secondary: string }[];
  className?: string;
}) {
  return (
    <section className={`space-y-3 ${className ?? ""}`}>
      <h2 className="text-base font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-zinc-500">{emptyLabel}</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="min-w-full text-sm">
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {rows.map((row) => (
                <tr key={row.key}>
                  <td className="px-4 py-2 font-medium">{row.primary}</td>
                  <td className="px-4 py-2 text-right text-zinc-500">{row.secondary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
