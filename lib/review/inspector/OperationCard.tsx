import type { Operation } from "@/lib/operations";

import { getOperationTypeColors } from "../colors";
import { DataChip } from "./DataChip";
import { EmbeddedActions } from "./EmbeddedActions";

type OperationCardProps = {
  operation: Operation;
};

function formatColumn(column: { key: string; label: string; format?: string }): string {
  return column.format ? `${column.label} (${column.key} · ${column.format})` : `${column.label} (${column.key})`;
}

function PresentationDetails({ operation }: { operation: Operation }) {
  const { presentation } = operation;

  if (presentation.layout === "table") {
    return (
      <dl className="mt-2 space-y-1.5 text-caption text-zinc-800">
        <div>
          <dt className="font-medium text-zinc-600">Columns</dt>
          <dd className="mt-0.5">{presentation.columns.map(formatColumn).join(" · ")}</dd>
        </div>
        {presentation.filter ? (
          <div>
            <dt className="font-medium text-zinc-600">Filter</dt>
            <dd className="mt-0.5">
              {presentation.filter.label} ({presentation.filter.field}) —{" "}
              {presentation.filter.options.map((option) => option.label).join(", ")}
            </dd>
          </div>
        ) : null}
        {presentation.header?.metrics?.length ? (
          <div>
            <dt className="font-medium text-zinc-600">Header metrics</dt>
            <dd className="mt-0.5">
              {presentation.header.metrics
                .map((metric) => `${metric.label}: ${metric.value}`)
                .join(" · ")}
            </dd>
          </div>
        ) : null}
      </dl>
    );
  }

  if (presentation.layout === "form") {
    return (
      <dl className="mt-2 space-y-1.5 text-caption text-zinc-800">
        <div>
          <dt className="font-medium text-zinc-600">Fields</dt>
          <dd className="mt-0.5">
            {presentation.fields
              .map((field) =>
                field.required ? `${field.label} (${field.type}, required)` : `${field.label} (${field.type})`,
              )
              .join(" · ")}
          </dd>
        </div>
      </dl>
    );
  }

  if (presentation.layout === "detail") {
    return (
      <dl className="mt-2 space-y-1.5 text-caption text-zinc-800">
        {presentation.sections.map((section) => (
          <div key={section.title}>
            <dt className="font-medium text-zinc-600">{section.title}</dt>
            <dd className="mt-0.5">
              {section.fields
                .map((field) =>
                  field.format ? `${field.label} (${field.key} · ${field.format})` : `${field.label} (${field.key})`,
                )
                .join(" · ")}
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  if (presentation.layout === "confirm") {
    return (
      <p className="mt-2 text-caption text-zinc-800">
        <span className="font-medium text-zinc-600">Message: </span>
        {presentation.message}
      </p>
    );
  }

  return null;
}

export function OperationCard({ operation }: OperationCardProps) {
  const colors = getOperationTypeColors(operation.type);
  const embeddedActions =
    operation.presentation.layout === "detail" ? (operation.presentation.actions ?? []) : [];

  return (
    <article className={`rounded-lg border ${colors.border} ${colors.bg} p-3`}>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded px-1.5 py-0.5 text-caption font-semibold uppercase ${colors.text}`}
        >
          {operation.type}
        </span>
        <span className="font-medium text-zinc-900">{operation.title}</span>
        <span className="font-mono text-caption text-zinc-600">{operation.id}</span>
      </div>

      <p className="mt-2 font-mono text-caption text-zinc-700">{operation.route}</p>

      <p className="mt-2 text-caption text-zinc-700">
        <span className="font-medium text-zinc-600">Layout: </span>
        {operation.presentation.layout}
      </p>

      <PresentationDetails operation={operation} />

      <div className="mt-2">
        <DataChip data={operation.data} />
      </div>

      <EmbeddedActions actions={embeddedActions} />
    </article>
  );
}
