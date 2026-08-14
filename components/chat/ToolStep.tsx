import type { ReactNode } from "react";

type ToolStepProps = {
  label: string;
  highlight?: boolean;
  defaultOpen?: boolean;
  children?: ReactNode;
};

const BASE =
  "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300";

const HIGHLIGHT =
  "border-zinc-200 border-l-2 border-l-violet-400 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:border-l-violet-500 dark:bg-zinc-900/60 dark:text-zinc-300";

export function ToolStep({
  label,
  highlight = false,
  defaultOpen = false,
  children,
}: ToolStepProps) {
  return (
    <details
      open={defaultOpen}
      className={["rounded border px-3 py-2 text-caption", highlight ? HIGHLIGHT : BASE].join(
        " ",
      )}
    >
      <summary className="cursor-pointer font-medium">{label}</summary>
      {children ? <div className="mt-2 space-y-2">{children}</div> : null}
    </details>
  );
}
