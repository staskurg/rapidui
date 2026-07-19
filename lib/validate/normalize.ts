import type { Rui } from "@/lib/operations";

function orderObject<T extends Record<string, unknown>>(
  value: T,
  keyOrder: string[],
): T {
  const result = {} as T;

  for (const key of keyOrder) {
    if (key in value) {
      result[key as keyof T] = value[key as keyof T];
    }
  }

  return result;
}

/** Deterministic canonical ordering for hash stability. */
export function normalizeRui(rui: Rui): Rui {
  return {
    version: rui.version,
    app: orderObject(rui.app as unknown as Record<string, unknown>, ["title"]) as Rui["app"],
    entities: [...rui.entities]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((entity) => ({
        ...entity,
        entrypoints: [...entity.entrypoints].sort(),
        operationIds: [...entity.operationIds].sort(),
        ...(entity.scope
          ? {
              scope: {
                selectors: [...entity.scope.selectors]
                  .sort((a, b) => a.id.localeCompare(b.id))
                  .map((selector) => ({
                    ...selector,
                    binding: {
                      read: orderObject(
                        selector.binding.read as unknown as Record<string, unknown>,
                        ["method", "path", "valuePath", "labelKey", "valueKey"],
                      ) as typeof selector.binding.read,
                    },
                  })),
              },
            }
          : {}),
      })),
    operations: [...rui.operations]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((operation) => {
        const base = {
          id: operation.id,
          entityId: operation.entityId,
          type: operation.type,
          title: operation.title,
          route: operation.route,
          ...(operation.params ? { params: [...operation.params].sort() } : {}),
          ...(operation.context ? { context: operation.context } : {}),
          presentation: operation.presentation,
          data: operation.data,
          ...("outcomes" in operation ? { outcomes: operation.outcomes } : {}),
        };

        return base as typeof operation;
      }),
    transitions: [...rui.transitions].sort((a, b) => {
      const fromCompare = a.from.localeCompare(b.from);
      if (fromCompare !== 0) {
        return fromCompare;
      }
      const toCompare = a.to.localeCompare(b.to);
      if (toCompare !== 0) {
        return toCompare;
      }
      return a.trigger.localeCompare(b.trigger);
    }),
  };
}
