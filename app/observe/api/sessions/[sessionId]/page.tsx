import Link from "next/link";
import { redirect } from "next/navigation";

import { SessionOutcomeBadge } from "@/components/observe/SessionOutcomeBadge";
import { SpecLink } from "@/components/site/SpecLink";
import {
  formatRelativeTime,
  getAgentRunExists,
  getSessionSummary,
  getSessionTimeline,
  truncateSessionId,
} from "@/lib/observe/queries";
import { buildApiFilterQuery } from "@/lib/observe/apiFilterQuery";
import { buildMissingSessionAgentObserveHref } from "@/lib/observe/notices";

export const dynamic = "force-dynamic";

type SessionDetailPageProps = {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{
    agent?: string;
    evalCase?: string;
    session?: string;
    from?: string;
    to?: string;
    /** @deprecated use agent search param */
    fromAgent?: string;
  }>;
};

function timelineRowClass(event: {
  endpoint: string;
  valid: boolean | null;
  spec_id: string | null;
}): string {
  if (
    event.endpoint === "/llms.txt" ||
    event.endpoint === "/api/docs" ||
    event.endpoint === "/api/schema" ||
    event.endpoint === "/api/health"
  ) {
    return "border-l-4 border-zinc-400 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900/80";
  }
  if (event.spec_id) {
    return "border-l-4 border-violet-500 bg-violet-50/60 dark:bg-violet-950/20";
  }
  if (event.endpoint === "/api/validate" && event.valid === false) {
    return "border-l-4 border-amber-500 bg-amber-50/60 dark:bg-amber-950/20";
  }
  if (event.endpoint === "/api/validate" && event.valid === true) {
    return "border-l-4 border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20";
  }
  return "border-l-4 border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900";
}

export default async function SessionDetailPage({
  params,
  searchParams,
}: SessionDetailPageProps) {
  const { sessionId } = await params;
  const queryParams = await searchParams;
  const agent = queryParams.agent ?? queryParams.fromAgent;

  const [summary, timeline, agentRunExists] = await Promise.all([
    getSessionSummary(sessionId),
    getSessionTimeline(sessionId),
    getAgentRunExists(sessionId),
  ]);

  if (!summary) {
    redirect(buildMissingSessionAgentObserveHref(sessionId));
  }

  const backHref = `/observe/api${buildApiFilterQuery({
    agent,
    evalCase: queryParams.evalCase,
    session: queryParams.session,
    from: queryParams.from,
    to: queryParams.to,
  })}`;

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <Link href={backHref} className="text-ui font-medium text-violet-700 dark:text-violet-400">
          ← Back to API telemetry
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-title font-semibold tracking-tight">API session details</h1>
          <SessionOutcomeBadge outcome={summary.outcome} />
        </div>
        <p className="font-mono text-caption text-zinc-500">{sessionId}</p>
      </header>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">Agent</dt>
            <dd className="mt-1 text-ui">{summary.agent ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">
              Eval case
            </dt>
            <dd className="mt-1 font-mono text-ui">{summary.evalCaseId ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">Intent</dt>
            <dd className="mt-1 text-ui">{summary.intent ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">
              Validate attempts
            </dt>
            <dd className="mt-1 text-ui">{summary.validateCount}</dd>
          </div>
          <div>
            <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">
              Saved spec
            </dt>
            <dd className="mt-1 text-ui">
              {summary.finalSpecId ? (
                <SpecLink
                  href={`/specs/${summary.finalSpecId}`}
                  className="font-mono text-violet-700 hover:underline dark:text-violet-400"
                >
                  {truncateSessionId(summary.finalSpecId, 6)}
                </SpecLink>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">
              First activity
            </dt>
            <dd className="mt-1 text-ui">
              {summary.firstActivityAt ? formatRelativeTime(summary.firstActivityAt) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">
              Last activity
            </dt>
            <dd className="mt-1 text-ui">
              {summary.lastActivityAt ? formatRelativeTime(summary.lastActivityAt) : "—"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="space-y-4">
        <h2 className="text-subhead font-semibold">Timeline</h2>
        {timeline.length === 0 ? (
          <p className="text-ui text-zinc-500">No validate or save events for this session.</p>
        ) : (
          <ol className="space-y-3">
            {timeline.map((event) => (
              <li
                key={event.id}
                className={`rounded-r-lg px-4 py-3 ${timelineRowClass(event)}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-1">
                    <p className="font-mono text-ui font-medium">{event.endpoint}</p>
                    <p className="text-caption text-zinc-500">
                      {event.occurred_at.toISOString()}
                      {event.duration_ms !== null ? ` · ${event.duration_ms}ms` : ""}
                    </p>
                  </div>
                  <div className="text-ui">
                    {event.spec_id ? (
                      <SpecLink
                        href={`/specs/${event.spec_id}`}
                        className="font-medium text-violet-700 hover:underline dark:text-violet-400"
                      >
                        Saved → spec
                      </SpecLink>
                    ) : event.endpoint === "/api/validate" ? (
                      <span
                        className={
                          event.valid
                            ? "font-medium text-emerald-700 dark:text-emerald-400"
                            : event.valid === false
                              ? "font-medium text-amber-700 dark:text-amber-400"
                              : "text-zinc-500"
                        }
                      >
                        {event.valid ? "✓ valid" : event.valid === false ? "✗ invalid" : "transport error"}
                      </span>
                    ) : (
                      <span className="text-zinc-500">discovery</span>
                    )}
                  </div>
                </div>
                {event.error_codes && event.error_codes.length > 0 ? (
                  <p className="mt-2 font-mono text-caption text-amber-800 dark:text-amber-300">
                    {event.error_codes.join(", ")}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>

      {agentRunExists ? (
        <footer className="border-t border-zinc-200 pt-6 text-ui dark:border-zinc-800">
          <Link
            href={`/observe/agent/sessions/${encodeURIComponent(sessionId)}`}
            className="font-medium text-violet-700 hover:text-violet-900 dark:text-violet-400"
          >
            View agent run →
          </Link>
        </footer>
      ) : null}
    </div>
  );
}
