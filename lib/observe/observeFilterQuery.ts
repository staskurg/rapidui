import {
  OBSERVE_DEFAULT_WINDOW_DAYS,
  parseIsoDateUtc,
  parseObserveWindowDays,
  windowRangeForPreset,
  type ObserveWindowDays,
} from "@/lib/observe/queries";

export type ObserveDateRangeSearchInput = {
  from?: string;
  to?: string;
  days?: string;
};

export function resolvedObserveDateRange(
  input: ObserveDateRangeSearchInput,
): { from: string; to: string } {
  const from = parseIsoDateUtc(input.from);
  const to = parseIsoDateUtc(input.to);
  if (from && to) {
    return { from, to };
  }

  if (input.days?.trim()) {
    return windowRangeForPreset(parseObserveWindowDays(input.days));
  }

  return windowRangeForPreset(OBSERVE_DEFAULT_WINDOW_DAYS);
}

type ObserveFilterQueryModuleConfig<TKeys extends readonly string[]> = {
  filterKeys: TKeys;
  basePath: string;
  /** Keys excluded from hasActiveFilters (defaults to from, to). */
  inactiveFilterKeys?: readonly string[];
};

export function createObserveFilterQueryModule<const TKeys extends readonly string[]>(
  config: ObserveFilterQueryModuleConfig<TKeys>,
) {
  type FilterKey = TKeys[number];
  type Input = ObserveDateRangeSearchInput & Partial<Record<FilterKey, string | undefined>>;
  const { filterKeys, basePath } = config;
  const inactiveFilterKeys = new Set(
    config.inactiveFilterKeys ?? (["from", "to"] as const),
  );

  function readField(input: Input, key: FilterKey): string | undefined {
    return input[key];
  }

  function writeField(input: Input, key: FilterKey, value: string | undefined): Input {
    return { ...input, [key]: value };
  }

  function buildQuery(input: Input): string {
    const params = new URLSearchParams();
    const { from, to } = resolvedObserveDateRange(input);

    for (const key of filterKeys) {
      if (key === "from" || key === "to") {
        continue;
      }

      const value = readField(input, key)?.trim();
      if (value) {
        params.set(key, value);
      }
    }

    params.set("from", from);
    params.set("to", to);

    const query = params.toString();
    return query ? `?${query}` : "";
  }

  function buildHref(input: Input): string {
    return `${basePath}${buildQuery(input)}`;
  }

  function shouldCanonicalize(input: Input): boolean {
    if (input.days !== undefined) {
      return true;
    }

    for (const key of filterKeys) {
      if (key === "from" || key === "to") {
        continue;
      }

      if (readField(input, key) === "") {
        return true;
      }
    }

    const from = parseIsoDateUtc(input.from);
    const to = parseIsoDateUtc(input.to);

    if (!from || !to) {
      return true;
    }

    return false;
  }

  function canonicalInput(input: Input): Input {
    const { from, to } = resolvedObserveDateRange(input);
    let canonical = { from, to } as Input;

    for (const key of filterKeys) {
      if (key === "from" || key === "to") {
        continue;
      }

      const value = readField(input, key)?.trim();
      if (value) {
        canonical = writeField(canonical, key, value);
      }
    }

    return canonical;
  }

  function inputFromForm(filters: Record<string, string | undefined>): Input {
    const { days, ...rest } = filters;
    if (days?.trim()) {
      const range = windowRangeForPreset(parseObserveWindowDays(days));
      return {
        ...rest,
        from: range.from,
        to: range.to,
      } as Input;
    }

    return rest as Input;
  }

  function inputWithPreset(input: Input, days: ObserveWindowDays): Input {
    const range = windowRangeForPreset(days);
    let next: Input = { ...input, from: range.from, to: range.to };

    for (const key of filterKeys) {
      if (key === "from" || key === "to") {
        continue;
      }

      const value = readField(input, key);
      if (value !== undefined) {
        next = writeField(next, key, value);
      }
    }

    return next;
  }

  function hasActiveFilters(input: Input): boolean {
    for (const key of filterKeys) {
      if (inactiveFilterKeys.has(key)) {
        continue;
      }

      if (readField(input, key)?.trim()) {
        return true;
      }
    }

    return false;
  }

  return {
    buildQuery,
    buildHref,
    shouldCanonicalize,
    canonicalInput,
    inputFromForm,
    inputWithPreset,
    hasActiveFilters,
  };
}
