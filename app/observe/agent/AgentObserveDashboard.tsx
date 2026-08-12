import Link from "next/link";

import { AgentSessionStateBadge } from "@/components/observe/AgentSessionStateBadge";
import {
  ObserveApplyButton,
  ObserveClearFiltersButton,
  ObserveFiltersForm,
} from "@/components/observe/ObserveFiltersForm";
import { StatCard } from "@/components/observe/StatCard";
import { StatCardGrid } from "@/components/observe/StatCardGrid";
import {
  buildAgentFilterQuery,
  hasActiveAgentFilters,
  type AgentFilterSearchInput,
} from "@/lib/observe/agentFilterQuery";
import {
  AGENT_RUN_ENVS,
  AGENT_SESSION_STATES,
  parseAgentEnvFilter,
  parseAgentStateFilter,
} from "@/lib/observe/agentFilterOptions";
import { agentMetricTooltips } from "@/lib/observe/metric-tooltips";
import { formatEstCostUsd, formatTokenCount } from "@/lib/observe/modelPricing";
import {
  formatRelativeTime,
  getAgentObserveSummary,
  listAgentRuns,
  listDistinctAgentRunAgents,
  listDistinctModels,
  listDistinctPromptVersions,
  truncateSessionId,
} from "@/lib/observe/queries";

type AgentObserveDashboardProps = {
  params: {
    model?: string;
    promptVersion?: string;
    agent?: string;
    session?: string;
    state?: string;
    env?: string;
  };
  filterQueryParams: AgentFilterSearchInput & { from: string; to: string };
  preserveDateRange: Pick<AgentFilterSearchInput, "from" | "to">;
};

function formatLatency(value: number | null, minSavedRuns: number, savedCount: number): string {
  if (value === null || savedCount < minSavedRuns) {
    return "—";
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}s`;
  }
  return `${value}ms`;
}

export async function AgentObserveDashboard({
  params,
  filterQueryParams,
  preserveDateRange,
}: AgentObserveDashboardProps) {
  const stateFilter = parseAgentStateFilter(params.state);
  const envFilter = parseAgentEnvFilter(params.env);
  const filters = {
    model: params.model,
    promptVersion: params.promptVersion,
    agent: params.agent,
    session: params.session,
    state: stateFilter,
    env: envFilter,
    from: filterQueryParams.from,
    to: filterQueryParams.to,
  };

  const [summary, runs, models, promptVersions, agents] = await Promise.all([
    getAgentObserveSummary(filters),
    listAgentRuns(filters),
    listDistinctModels({ from: filterQueryParams.from, to: filterQueryParams.to }),
    listDistinctPromptVersions({ from: filterQueryParams.from, to: filterQueryParams.to }),
    listDistinctAgentRunAgents({ from: filterQueryParams.from, to: filterQueryParams.to }),
  ]);

  const filterQuery = buildAgentFilterQuery(filterQueryParams);
  const hasActiveFilters = hasActiveAgentFilters(filterQueryParams);
  const hasData = summary.runCount > 0;

  return (
    <>
      <ObserveFiltersForm
        formKey={filterQuery || "default"}
        preserveDateRange={preserveDateRange}
        scope="agent"
        className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="flex flex-wrap items-end gap-3 p-4">
          <label className="min-w-36 flex-1 space-y-1 text-ui">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Model</span>
            <select
              name="model"
              defaultValue={params.model ?? ""}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-ui dark:border-zinc-700 dark:bg-zinc-950"
            >
              <option value="">All models</option>
              {models.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-36 flex-1 space-y-1 text-ui">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Prompt</span>
            <select
              name="promptVersion"
              defaultValue={params.promptVersion ?? ""}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-ui dark:border-zinc-700 dark:bg-zinc-950"
            >
              <option value="">All prompts</option>
              {promptVersions.map((version) => (
                <option key={version} value={version}>
                  {version}
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-36 flex-1 space-y-1 text-ui">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">State</span>
            <select
              name="state"
              defaultValue={params.state ?? ""}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-ui dark:border-zinc-700 dark:bg-zinc-950"
            >
              <option value="">All states</option>
              {AGENT_SESSION_STATES.map((state) => (
                <option key={state} value={state}>
                  {state.charAt(0).toUpperCase() + state.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-36 flex-1 space-y-1 text-ui">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Env</span>
            <select
              name="env"
              defaultValue={params.env ?? ""}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-ui dark:border-zinc-700 dark:bg-zinc-950"
            >
              <option value="">All envs</option>
              {AGENT_RUN_ENVS.map((env) => (
                <option key={env} value={env}>
                  {env}
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-36 flex-1 space-y-1 text-ui">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Agent id</span>
            <select
              name="agent"
              defaultValue={params.agent ?? ""}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-ui dark:border-zinc-700 dark:bg-zinc-950"
            >
              <option value="">All agents</option>
              {agents.map((agent) => (
                <option key={agent} value={agent}>
                  {agent}
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-48 flex-1.5 space-y-1 text-ui">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Session id</span>
            <input
              name="session"
              defaultValue={params.session ?? ""}
              placeholder="Filter by session id"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-ui dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <div className="shrink-0 space-y-1 text-ui">
            <span
              className="font-medium text-zinc-700 opacity-0 dark:text-zinc-300"
              aria-hidden="true"
            >
              Apply
            </span>
            <div className="flex items-center gap-1.5">
              <ObserveApplyButton />
              {hasActiveFilters ? (
                <ObserveClearFiltersButton preserveDateRange={preserveDateRange} scope="agent" />
              ) : null}
            </div>
          </div>
        </div>
      </ObserveFiltersForm>

      <StatCardGrid>
        <StatCard label="Runs" value={String(summary.runCount)} />
        <StatCard
          label="p50 latency"
          value={formatLatency(summary.p50LatencyMs, 3, summary.savedRunsForLatency)}
          hint="min. 3 saved runs"
          tooltip={agentMetricTooltips.p50Latency}
        />
        <StatCard
          label="p95 latency"
          value={formatLatency(summary.p95LatencyMs, 10, summary.savedRunsForLatency)}
          hint="min. 10 saved runs"
          tooltip={agentMetricTooltips.p95Latency}
        />
        <StatCard
          label="Avg tokens"
          value={summary.avgTokens === null ? "—" : String(summary.avgTokens)}
          tooltip={agentMetricTooltips.avgTokens}
        />
        <StatCard
          label="Total tokens"
          value={formatTokenCount(summary.totalTokens)}
          hint="in selected period"
          tooltip={agentMetricTooltips.totalTokens}
        />
        <StatCard
          label="Avg est. cost"
          value={formatEstCostUsd(summary.avgEstCostUsd)}
          hint="per session with turn tokens"
          tooltip={agentMetricTooltips.avgEstCost}
        />
        <StatCard
          label="Total est. cost"
          value={formatEstCostUsd(
            summary.totalEstCostUsd,
            summary.estCostHasListBasis ? "list" : null,
          )}
          hint={
            summary.estCostHasListBasis
              ? "includes ~ list-price runs"
              : "in selected period"
          }
          tooltip={agentMetricTooltips.totalEstCost}
        />
        <StatCard
          label="Avg validate attempts"
          value={
            summary.avgValidateAttempts === null ? "—" : String(summary.avgValidateAttempts)
          }
          hint="from api_events"
          tooltip={agentMetricTooltips.avgValidateAttempts}
        />
        <StatCard
          label="Avg platform API calls"
          value={
            summary.avgPlatformApiCalls === null ? "—" : String(summary.avgPlatformApiCalls)
          }
          hint="per session"
          tooltip={agentMetricTooltips.avgPlatformApiCalls}
        />
      </StatCardGrid>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-subhead font-semibold">Recent runs</h2>
          <span className="text-ui text-zinc-500">{runs.length} shown</span>
        </div>

        {!hasData ? (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-ui text-zinc-600 dark:text-zinc-400">
              No agent runs yet. Start a chat on the demo page — each session posts to{" "}
              <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-caption dark:bg-zinc-800">
                agent_runs
              </code>{" "}
              after the first turn.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="min-w-full divide-y divide-zinc-200 text-ui dark:divide-zinc-800">
              <thead className="bg-zinc-50 dark:bg-zinc-950/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Session</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">State</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Env</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Model</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Validates</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Platform calls</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Tokens</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Est. cost</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Started</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {runs.map((run) => (
                  <tr key={run.sessionId} className="hover:bg-zinc-50 dark:hover:bg-zinc-950/40">
                    <td className="px-4 py-3">
                      <Link
                        href={`/observe/agent/sessions/${encodeURIComponent(run.sessionId)}${filterQuery}`}
                        className="font-mono text-caption font-medium text-violet-700 hover:underline dark:text-violet-400"
                        title={run.sessionId}
                      >
                        {truncateSessionId(run.sessionId)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <AgentSessionStateBadge state={run.state} />
                    </td>
                    <td className="px-4 py-3 font-mono text-caption">{run.env ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-caption">{run.model ?? "—"}</td>
                    <td className="px-4 py-3">{run.validateAttempts}</td>
                    <td className="px-4 py-3">{run.platformApiCalls}</td>
                    <td className="px-4 py-3">{run.totalTokens ?? "—"}</td>
                    <td className="px-4 py-3">
                      {formatEstCostUsd(run.estCostUsd, run.estCostBasis)}
                    </td>
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
          <h2 className="text-body font-semibold">Runs by day</h2>
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="min-w-full text-ui">
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
    </>
  );
}
