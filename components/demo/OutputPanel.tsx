"use client";

import type { SavedSpec } from "@/lib/db/types";
import { JsonCodeBlock } from "@/lib/review/JsonCodeBlock";
import { RuiInspector } from "@/lib/review/RuiInspector";

import { OutputTabBar, type OutputTab } from "./OutputTabBar";
import type { SpecPanelState } from "@/lib/demo/useSpecPanelListener";

type OutputPanelProps = {
  activeTab: OutputTab;
  onTabChange: (tab: OutputTab) => void;
  panelState: SpecPanelState;
};

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-4">
      <div className="h-6 w-1/3 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-24 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-24 rounded bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}

export function OutputPanel({ activeTab, onTabChange, panelState }: OutputPanelProps) {
  let spec: SavedSpec | null = null;
  let badge: "draft" | "saved" | null = null;

  if (panelState.kind === "draft") {
    spec = panelState.spec;
    badge = "draft";
  } else if (panelState.kind === "saved") {
    spec = panelState.spec;
    badge = "saved";
  }

  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="px-4 pt-3">
        <OutputTabBar activeTab={activeTab} onTabChange={onTabChange} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {activeTab === "preview" ? (
          <div className="flex h-full items-center justify-center text-ui text-zinc-500">
            Preview renderer ships in v0.3
          </div>
        ) : null}

        {activeTab === "spec" ? (
          <>
            {panelState.kind === "empty" ? (
              <p className="text-ui leading-relaxed text-zinc-600 dark:text-zinc-400">
                Pick a use case, paste data, or describe your UI — specs appear here as the agent
                validates.
              </p>
            ) : null}
            {panelState.kind === "loading" ? <LoadingSkeleton /> : null}
            {spec ? (
              <RuiInspector spec={spec} variant="embedded" badge={badge} showJson={false} />
            ) : null}
          </>
        ) : null}

        {activeTab === "json" ? (
          <>
            {spec ? (
              <JsonCodeBlock
                value={spec.normalizedRui}
                className="overflow-x-auto rounded border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950"
              />
            ) : (
              <p className="text-ui text-zinc-500">Validated or saved RUI JSON will appear here.</p>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
