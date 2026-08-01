import type { Entity, Operation, Transition } from "@/lib/operations";

import { OperationCard } from "./OperationCard";

type EntitySectionProps = {
  entity: Entity;
  operations: Operation[];
};

export function EntitySection({ entity, operations }: EntitySectionProps) {
  const entityOperations = operations.filter((operation) => operation.entityId === entity.id);

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{entity.label}</h3>
        <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{entity.id}</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {entity.entrypoints.map((entrypoint) => (
          <span
            key={entrypoint}
            className="rounded border border-zinc-200 bg-white px-2 py-0.5 font-mono text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          >
            entry: {entrypoint}
          </span>
        ))}
      </div>

      {entity.scope?.selectors?.length ? (
        <div className="flex flex-wrap gap-1.5">
          {entity.scope.selectors.map((selector) => (
            <span
              key={selector.id}
              className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-900"
            >
              scope: {selector.label}
              {selector.required ? " (required)" : ""}
            </span>
          ))}
        </div>
      ) : null}

      <div className="space-y-2">
        {entityOperations.map((operation) => (
          <OperationCard key={operation.id} operation={operation} />
        ))}
      </div>
    </section>
  );
}

type TransitionsTableProps = {
  transitions: Transition[];
};

export function TransitionsTable({ transitions }: TransitionsTableProps) {
  if (transitions.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Transitions</h3>
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900">
            <tr>
              <th className="px-3 py-2 font-medium">From</th>
              <th className="px-3 py-2 font-medium">To</th>
              <th className="px-3 py-2 font-medium">Trigger</th>
              <th className="px-3 py-2 font-medium">Label / map</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {transitions.map((transition, index) => (
              <tr key={`${transition.from}-${transition.to}-${index}`}>
                <td className="px-3 py-2 font-mono">{transition.from}</td>
                <td className="px-3 py-2 font-mono">{transition.to}</td>
                <td className="px-3 py-2">
                  <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono dark:bg-zinc-800">
                    {transition.trigger}
                  </span>
                </td>
                <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                  {transition.label ?? "—"}
                  {transition.map
                    ? ` · map: ${Object.entries(transition.map)
                        .map(([key, value]) => `${key}→${value}`)
                        .join(", ")}`
                    : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
