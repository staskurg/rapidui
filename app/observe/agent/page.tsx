import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AgentObservePlaceholderPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Agent Observe</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          RapidUI Agent metrics ship in Phase 6 after the chat agent (Phase 4) populates{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs dark:bg-zinc-800">
            agent_runs
          </code>{" "}
          and{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs dark:bg-zinc-800">
            agent_turns
          </code>
          .
        </p>
      </header>

      <section className="rounded-lg border border-dashed border-zinc-300 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Coming in Phase 6
        </h2>
        <ul className="mt-4 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
          <li>Runs over time — success vs failed saves</li>
          <li>p50 / p95 latency per run</li>
          <li>Validate attempts per successful save</li>
          <li>Tokens per run from model usage</li>
          <li>Tool calls per run</li>
          <li>Outcomes by use case, intent, model, and prompt version</li>
          <li>Drill-down joined to API events by session id</li>
        </ul>
      </section>

      <Link
        href="/observe/api"
        className="inline-flex text-sm font-medium text-violet-700 hover:text-violet-900 dark:text-violet-400"
      >
        View API telemetry →
      </Link>
    </div>
  );
}
