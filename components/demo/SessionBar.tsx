import { NewTabLink } from "@/components/demo/NewTabLink";

type SessionBarProps = {
  sessionId: string;
  showObserveLink?: boolean;
};

export function SessionBar({ sessionId, showObserveLink = false }: SessionBarProps) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
      <span className="shrink-0 text-zinc-500">Session</span>
      <code
        className="min-w-0 break-all rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 font-mono text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
        title={sessionId}
      >
        {sessionId}
      </code>
      {showObserveLink ? (
        <NewTabLink
          href={`/observe/agent/sessions/${encodeURIComponent(sessionId)}`}
          title="Open agent telemetry for this session in a new tab"
          className="shrink-0 text-xs font-medium text-zinc-700 underline underline-offset-2 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
        >
          Observe ↗
        </NewTabLink>
      ) : null}
    </div>
  );
}
