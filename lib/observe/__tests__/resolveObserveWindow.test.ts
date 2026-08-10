import { describe, expect, it } from "vitest";

import {
  formatObserveDateRangeLabel,
  parseObserveWindowDays,
  resolveObserveWindow,
  windowRangeForPreset,
} from "@/lib/observe/queries";

describe("parseObserveWindowDays", () => {
  it("accepts 1, 7, and 30", () => {
    expect(parseObserveWindowDays("1")).toBe(1);
    expect(parseObserveWindowDays("7")).toBe(7);
    expect(parseObserveWindowDays("30")).toBe(30);
  });

  it("defaults invalid values to 7", () => {
    expect(parseObserveWindowDays(undefined)).toBe(7);
    expect(parseObserveWindowDays("14")).toBe(7);
  });
});

describe("formatObserveDateRangeLabel", () => {
  it("shows both dates even for a single-day window", () => {
    const label = formatObserveDateRangeLabel(
      new Date("2026-08-10T00:00:00.000Z"),
      new Date("2026-08-10T23:59:59.999Z"),
    );
    expect(label).toBe("Aug 10 – Aug 10 (UTC)");
  });

  it("shows a range for multi-day windows", () => {
    const label = formatObserveDateRangeLabel(
      new Date("2026-08-04T00:00:00.000Z"),
      new Date("2026-08-10T23:59:59.999Z"),
    );
    expect(label).toBe("Aug 04 – Aug 10 (UTC)");
  });
});

describe("resolveObserveWindow", () => {
  it("defaults to 7 calendar days ending today UTC", () => {
    const { windowStart, windowEnd, windowDays, isDefaultWindow } = resolveObserveWindow({});
    expect(windowDays).toBe(7);
    expect(isDefaultWindow).toBe(true);
    expect(windowEnd.getUTCHours()).toBe(23);
    const spanDays =
      (windowEnd.getTime() - windowStart.getTime()) / (24 * 60 * 60 * 1000);
    expect(spanDays).toBeGreaterThanOrEqual(6);
    expect(spanDays).toBeLessThan(7.001);
  });

  it("uses explicit from/to dates from the URL", () => {
    const resolved = resolveObserveWindow({
      from: "2026-08-10",
      to: "2026-08-10",
    });
    expect(resolved.from).toBe("2026-08-10");
    expect(resolved.to).toBe("2026-08-10");
    expect(resolved.windowDays).toBe(1);
    expect(resolved.dateRangeLabel).toBe("Aug 10 – Aug 10 (UTC)");
    expect(resolved.isDefaultWindow).toBe(false);
  });

  it("maps preset length to ISO date range", () => {
    const preset = windowRangeForPreset(30);
    const resolved = resolveObserveWindow({ windowDays: 30 });
    expect(resolved.from).toBe(preset.from);
    expect(resolved.to).toBe(preset.to);
    expect(resolved.windowDays).toBe(30);
  });
});
