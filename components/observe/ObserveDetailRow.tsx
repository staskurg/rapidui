import type { ReactNode } from "react";

export const observeLinkClass =
  "font-mono text-violet-600 visited:text-violet-600 hover:text-violet-800 dark:text-violet-400 dark:visited:text-violet-400 dark:hover:text-violet-300";

type ObserveDetailRowProps = {
  label: string;
  children: ReactNode;
};

export function ObserveDetailRow({ label, children }: ObserveDetailRowProps) {
  return (
    <div>
      <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </dt>
      <dd className="mt-1 text-ui">{children}</dd>
    </div>
  );
}
