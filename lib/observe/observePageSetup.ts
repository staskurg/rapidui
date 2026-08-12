import {
  OBSERVE_WINDOW_PRESETS,
  resolveObserveWindow,
  type ObserveWindowDays,
} from "@/lib/observe/queries";

type ObservePageSearchParams = {
  from?: string;
  to?: string;
  days?: string;
};

export function resolveObservePageWindow(params: ObservePageSearchParams) {
  return resolveObserveWindow({
    from: params.from,
    to: params.to,
    windowDays: params.days ? Number(params.days) : undefined,
  });
}

export function buildObservePresetHrefs<T extends Record<string, string | undefined>>(
  filterInput: T,
  buildHref: (input: T) => string,
  inputWithPreset: (input: T, days: ObserveWindowDays) => T,
): Record<(typeof OBSERVE_WINDOW_PRESETS)[number], string> {
  return Object.fromEntries(
    OBSERVE_WINDOW_PRESETS.map((days) => [
      days,
      buildHref(inputWithPreset(filterInput, days)),
    ]),
  ) as Record<(typeof OBSERVE_WINDOW_PRESETS)[number], string>;
}
