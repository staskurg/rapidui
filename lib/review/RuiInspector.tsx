import type { SavedSpec } from "@/lib/db/types";
import type { Rui } from "@/lib/operations";

import { EntitySection, SpecMeta, TransitionsTable } from "./inspector";

type RuiInspectorProps = {
  spec: SavedSpec;
  variant?: "page" | "embedded";
  badge?: "draft" | "saved" | null;
  showJson?: boolean;
};

function isV02Rui(normalizedRui: Rui | unknown): normalizedRui is Rui {
  return (
    typeof normalizedRui === "object" &&
    normalizedRui !== null &&
    "version" in normalizedRui &&
    normalizedRui.version === "0.2"
  );
}

function OperationsInspectorBody({ rui, badge, spec }: { rui: Rui; badge?: "draft" | "saved" | null; spec: SavedSpec }) {
  return (
    <div className="space-y-6">
      <SpecMeta spec={spec} badge={badge} />
      {rui.entities.map((entity) => (
        <EntitySection key={entity.id} entity={entity} operations={rui.operations} />
      ))}
      <TransitionsTable transitions={rui.transitions} />
    </div>
  );
}

export function RuiInspector({
  spec,
  variant = "page",
  badge = null,
  showJson = true,
}: RuiInspectorProps) {
  const { normalizedRui } = spec;
  const isV02 = isV02Rui(normalizedRui);

  const body = (
    <>
      {isV02 ? (
        <OperationsInspectorBody rui={normalizedRui} badge={badge} spec={spec} />
      ) : (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Legacy v0.1 block-tree specs are no longer supported in the inspector. Raw JSON is
          available below.
        </section>
      )}

      {showJson ? (
        <details className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Raw JSON
          </summary>
          <pre className="overflow-x-auto border-t border-zinc-200 p-4 font-mono text-xs text-zinc-800 dark:border-zinc-800 dark:text-zinc-200">
            {JSON.stringify(normalizedRui, null, 2)}
          </pre>
        </details>
      ) : null}
    </>
  );

  if (variant === "embedded") {
    return <div className="space-y-4">{body}</div>;
  }

  return (
    <div className="flex min-h-full flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <h1 className="text-lg font-semibold tracking-tight">RUI Inspector</h1>
          <p className="text-sm text-zinc-500">RapidUI v0.2</p>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-8">{body}</main>

      <footer className="border-t border-zinc-200 px-6 py-4 text-center text-sm text-zinc-500 dark:border-zinc-800">
        rapidui.dev — RUI Inspector
      </footer>
    </div>
  );
}
