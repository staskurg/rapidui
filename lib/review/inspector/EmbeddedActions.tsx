import type { EmbeddedAction } from "@/lib/operations";

type EmbeddedActionsProps = {
  actions: EmbeddedAction[];
};

function actionPath(action: EmbeddedAction): string {
  if (action.type === "act") {
    return `${action.invoke.method} ${action.invoke.path}`;
  }
  return `${action.write.method} ${action.write.path}`;
}

export function EmbeddedActions({ actions }: EmbeddedActionsProps) {
  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        Embedded actions
      </p>
      <ul className="space-y-1.5">
        {actions.map((action) => (
          <li
            key={action.id}
            className="rounded border border-zinc-100 bg-zinc-50 px-2 py-1.5 text-xs dark:border-zinc-800 dark:bg-zinc-950"
          >
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{action.label}</span>
            <span className="mx-1.5 text-zinc-300">·</span>
            <span className="font-mono text-violet-700">{action.type}</span>
            <span className="mx-1.5 text-zinc-300">·</span>
            <span className="font-mono text-zinc-600 dark:text-zinc-400">{actionPath(action)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
