import { ObserveNavIcon } from "@/components/observe/ObserveNavIcons";
import { NewTabLink } from "@/components/demo/NewTabLink";

type SessionBarProps = {
  sessionId: string | null;
  observeEnabled?: boolean;
};

const observeIconClass =
  "inline-flex shrink-0 items-center justify-center rounded-md p-1.5 transition-colors";

export function SessionBar({ sessionId, observeEnabled = false }: SessionBarProps) {
  if (!sessionId) {
    return (
      <div className="flex min-w-0 flex-wrap items-center gap-2 text-ui">
        <span className="shrink-0 text-zinc-500">Session</span>
        <span className="text-zinc-700 dark:text-zinc-300">New conversation</span>
      </div>
    );
  }

  const observeHref = `/observe/agent/sessions/${encodeURIComponent(sessionId)}`;
  const enabledLabel = "Open session telemetry in Observe (new tab)";
  const disabledLabel = "Send a message to open session telemetry in Observe";

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2 text-ui">
      <span className="shrink-0 text-zinc-500">Session</span>
      <code
        className="min-w-0 break-all rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 font-mono text-caption text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
        title={sessionId}
      >
        {sessionId}
      </code>
      {observeEnabled ? (
        <NewTabLink
          href={observeHref}
          title={enabledLabel}
          aria-label={enabledLabel}
          className={`${observeIconClass} text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100`}
        >
          <ObserveNavIcon name="telemetry" className="h-4 w-4" />
        </NewTabLink>
      ) : (
        <button
          type="button"
          disabled
          title={disabledLabel}
          aria-label={disabledLabel}
          className={`${observeIconClass} cursor-not-allowed text-zinc-400 dark:text-zinc-600`}
        >
          <ObserveNavIcon name="telemetry" className="h-4 w-4 opacity-60" />
        </button>
      )}
    </div>
  );
}
