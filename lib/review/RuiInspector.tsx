import { SitePageHeader } from "@/components/site/SitePageHeader";
import type { SavedSpec } from "@/lib/db/types";
import { SITE_PAGE_NAMES } from "@/lib/site/page-titles";
import type { Rui } from "@/lib/operations";

import { EntitySection, SpecMeta, TransitionsTable } from "./inspector";
import { JsonCodeBlock } from "./JsonCodeBlock";

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

function OperationsInspectorBody({
  rui,
  badge,
  spec,
}: {
  rui: Rui;
  badge?: "draft" | "saved" | null;
  spec: SavedSpec;
}) {
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

function RawJsonPanel({ normalizedRui }: { normalizedRui: unknown }) {
  return (
    <section className="flex min-h-0 flex-col bg-white dark:bg-zinc-900">
      <div className="shrink-0 border-b border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
        Raw JSON
      </div>
      <JsonCodeBlock
        value={normalizedRui}
        className="min-h-0 flex-1 overflow-auto p-4"
      />
    </section>
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

  const inspectorContent = isV02 ? (
    <OperationsInspectorBody rui={normalizedRui} badge={badge} spec={spec} />
  ) : (
    <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      Legacy v0.1 block-tree specs are no longer supported in the inspector. Raw JSON is available
      in the panel on the right.
    </section>
  );

  if (variant === "embedded") {
    return (
      <div className="space-y-4">
        {inspectorContent}
        {showJson ? (
          <details className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Raw JSON
            </summary>
            <JsonCodeBlock
              value={normalizedRui}
              className="overflow-x-auto border-t border-zinc-200 p-4 dark:border-zinc-800"
            />
          </details>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <SitePageHeader pageName={SITE_PAGE_NAMES.ruiInspector} />

      <div className="grid min-h-0 flex-1 grid-cols-[3fr_2fr]">
        <section className="min-h-0 overflow-y-auto border-r border-zinc-200 px-6 py-6 dark:border-zinc-800">
          {inspectorContent}
        </section>
        {showJson ? <RawJsonPanel normalizedRui={normalizedRui} /> : null}
      </div>
    </div>
  );
}
