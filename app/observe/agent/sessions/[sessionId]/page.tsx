import Link from "next/link";
import { redirect } from "next/navigation";

import { NewTabLink } from "@/components/demo/NewTabLink";
import { AgentRunOutcomeBadge } from "@/components/observe/AgentRunOutcomeBadge";
import { SpecLink } from "@/components/site/SpecLink";
import {
  formatRelativeTime,
  getAgentRunDetail,
  truncateSessionId,
} from "@/lib/observe/queries";
import { buildMissingSessionAgentObserveHref } from "@/lib/observe/notices";

export const dynamic = "force-dynamic";

type AgentSessionDetailPageProps = {
  params: Promise<{ sessionId: string }>;
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

export default async function AgentSessionDetailPage({ params }: AgentSessionDetailPageProps) {
  const { sessionId } = await params;
  const detail = await getAgentRunDetail(sessionId);

  if (!detail) {
    redirect(buildMissingSessionAgentObserveHref(sessionId));
  }

  const { run, turns, timeline, tokenParityMismatch, validateCountMismatch, transcript } =
    detail;

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <Link
          href="/observe/agent"
          className="text-ui font-medium text-violet-700 dark:text-violet-400"
        >
          ← Back to Agent dashboard
        </Link>
        <div>
          <p className="text-ui text-zinc-500">Agent run detail</p>
          <h1 className="mt-1 font-mono text-subhead font-semibold">{sessionId}</h1>
        </div>
      </header>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">Outcome</dt>
            <dd className="mt-1">
              <AgentRunOutcomeBadge outcome={run.outcome} />
            </dd>
          </div>
          <div>
            <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">Model</dt>
            <dd className="mt-1 font-mono text-ui">{run.model ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">Prompt</dt>
            <dd className="mt-1 font-mono text-ui">{run.promptVersion ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">
              Eval case
            </dt>
            <dd className="mt-1 font-mono text-ui">{run.evalCaseId ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">Intent</dt>
            <dd className="mt-1 text-ui">{run.intent ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">
              Validate attempts
            </dt>
            <dd className="mt-1 text-ui">
              {run.validateAttempts}
              {validateCountMismatch ? (
                <span className="ml-2 text-caption text-amber-700 dark:text-amber-400">
                  (agent reported {run.advisoryValidateAttempts})
                </span>
              ) : null}
            </dd>
          </div>
          <div>
            <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">
              Platform API calls
            </dt>
            <dd className="mt-1 text-ui">{run.platformApiCalls}</dd>
          </div>
          <div>
            <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">Tokens</dt>
            <dd className="mt-1 text-ui">
              {run.totalTokens ?? "—"}
              {tokenParityMismatch ? (
                <span className="ml-2 text-caption text-amber-700 dark:text-amber-400">
                  (turn sum differs)
                </span>
              ) : null}
            </dd>
          </div>
          <div>
            <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">Latency</dt>
            <dd className="mt-1 text-ui">
              {run.latencyMs !== null ? `${run.latencyMs}ms` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">
              Saved spec
            </dt>
            <dd className="mt-1 text-ui">
              {run.specId ? (
                <SpecLink
                  href={`/specs/${run.specId}`}
                  className="font-mono text-violet-700 hover:underline dark:text-violet-400"
                >
                  {truncateSessionId(run.specId, 6)}
                </SpecLink>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">Started</dt>
            <dd className="mt-1 text-ui">{formatRelativeTime(run.startedAt)}</dd>
          </div>
          <div>
            <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">
              Last activity
            </dt>
            <dd className="mt-1 text-ui">{formatRelativeTime(run.lastActivityAt)}</dd>
          </div>
          <div>
            <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">
              Transcript turns
            </dt>
            <dd className="mt-1 text-ui">
              {transcript.hasTranscript ? (transcript.turnCount ?? "—") : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">
              Transcript updated
            </dt>
            <dd className="mt-1 text-ui">
              {transcript.updatedAt ? formatRelativeTime(transcript.updatedAt) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">
              Conversation
            </dt>
            <dd className="mt-1 text-ui">
              {transcript.hasTranscript ? (
                <NewTabLink
                  href={`/chat/${encodeURIComponent(sessionId)}`}
                  className="font-medium text-violet-700 hover:underline dark:text-violet-400"
                >
                  Open in chat
                </NewTabLink>
              ) : (
                <span className="text-zinc-500">No transcript</span>
              )}
            </dd>
          </div>
        </dl>
        {run.errorSummary ? (
          <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-ui text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            {run.errorSummary}
          </p>
        ) : null}
      </section>

      <section className="space-y-4">
        <h2 className="text-subhead font-semibold">Turns</h2>
        {turns.length === 0 ? (
          <p className="text-ui text-zinc-500">No turn metrics recorded.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="min-w-full divide-y divide-zinc-200 text-ui dark:divide-zinc-800">
              <thead className="bg-zinc-50 dark:bg-zinc-950/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Turn</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Latency</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Input tokens</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Output tokens</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Validate</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Save</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {turns.map((turn) => (
                  <tr key={turn.turnIndex}>
                    <td className="px-4 py-3">{turn.turnIndex}</td>
                    <td className="px-4 py-3">
                      {turn.latencyMs !== null ? `${turn.latencyMs}ms` : "—"}
                    </td>
                    <td className="px-4 py-3">{turn.inputTokens ?? "—"}</td>
                    <td className="px-4 py-3">{turn.outputTokens ?? "—"}</td>
                    <td className="px-4 py-3">{turn.hadValidateCall ? "✓" : "—"}</td>
                    <td className="px-4 py-3">{turn.hadSave ? "✓" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-subhead font-semibold">Platform API timeline</h2>
        {timeline.length === 0 ? (
          <p className="text-ui text-zinc-500">No platform API events for this session.</p>
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
                        {event.valid
                          ? "✓ valid"
                          : event.valid === false
                            ? "✗ invalid"
                            : "transport error"}
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

      <footer className="border-t border-zinc-200 pt-6 text-ui dark:border-zinc-800">
        <Link
          href={`/observe/api/sessions/${encodeURIComponent(sessionId)}`}
          className="font-medium text-violet-700 hover:text-violet-900 dark:text-violet-400"
        >
          View API session timeline →
        </Link>
      </footer>
    </div>
  );
}
