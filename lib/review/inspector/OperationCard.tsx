import type { Operation } from "@/lib/operations";

import { getOperationTypeColors } from "../colors";
import { DataChip } from "./DataChip";
import { EmbeddedActions } from "./EmbeddedActions";

type OperationCardProps = {
  operation: Operation;
};

function presentationSummary(operation: Operation): string | null {
  const { presentation } = operation;
  if (presentation.layout === "table") {
    const parts = [`${presentation.columns.length} columns`];
    if (presentation.filter) {
      parts.push(`filter: ${presentation.filter.field}`);
    }
    if (presentation.header?.metrics?.length) {
      parts.push(`${presentation.header.metrics.length} header metrics`);
    }
    return parts.join(" · ");
  }
  if (presentation.layout === "form") {
    return `${presentation.fields.length} fields`;
  }
  if (presentation.layout === "detail") {
    const fieldCount = presentation.sections.reduce(
      (total, section) => total + section.fields.length,
      0,
    );
    return `${presentation.sections.length} sections · ${fieldCount} fields`;
  }
  if (presentation.layout === "confirm") {
    return presentation.message;
  }
  return null;
}

export function OperationCard({ operation }: OperationCardProps) {
  const colors = getOperationTypeColors(operation.type);
  const summary = presentationSummary(operation);
  const embeddedActions =
    operation.presentation.layout === "detail" ? (operation.presentation.actions ?? []) : [];

  return (
    <article
      className={`rounded-lg border ${colors.border} ${colors.bg} p-3 dark:bg-opacity-40`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded px-1.5 py-0.5 text-xs font-semibold uppercase ${colors.text}`}
        >
          {operation.type}
        </span>
        <span className="font-medium text-zinc-900 dark:text-zinc-100">{operation.title}</span>
        <span className="font-mono text-xs text-zinc-500">{operation.id}</span>
      </div>

      <p className="mt-2 font-mono text-xs text-zinc-600 dark:text-zinc-400">{operation.route}</p>

      {summary ? (
        <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
          <span className="font-medium text-zinc-500">Layout: </span>
          {operation.presentation.layout}
          <span className="mx-1.5 text-zinc-300">·</span>
          {summary}
        </p>
      ) : null}

      <div className="mt-2">
        <DataChip data={operation.data} />
      </div>

      <EmbeddedActions actions={embeddedActions} />
    </article>
  );
}
