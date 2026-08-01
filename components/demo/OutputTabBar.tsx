"use client";

export type OutputTab = "preview" | "spec" | "json";

type OutputTabBarProps = {
  activeTab: OutputTab;
  onTabChange: (tab: OutputTab) => void;
};

const tabs: { id: OutputTab; label: string; disabled?: boolean; tooltip?: string }[] = [
  { id: "spec", label: "Spec" },
  { id: "json", label: "JSON" },
  {
    id: "preview",
    label: "Preview",
    disabled: true,
    tooltip: "Renderer ships in v0.3",
  },
];

export function OutputTabBar({ activeTab, onTabChange }: OutputTabBarProps) {
  return (
    <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          disabled={tab.disabled}
          title={tab.tooltip}
          onClick={() => onTabChange(tab.id)}
          className={[
            "px-3 py-2 text-ui font-medium transition-colors",
            tab.disabled
              ? "cursor-not-allowed text-zinc-400"
              : activeTab === tab.id
                ? "border-b-2 border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200",
          ].join(" ")}
        >
          {tab.label}
          {tab.disabled ? " (soon)" : ""}
        </button>
      ))}
    </div>
  );
}
