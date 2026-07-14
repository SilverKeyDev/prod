import { describe, expect, it } from "vitest";

import {
  isTimePeriod,
  PERIOD_SCALE,
  periodScale,
  TIME_PERIODS,
  timelineToDateRange,
} from "./analyticsPeriod";

describe("analyticsPeriod", () => {
  it("exposes canonical scale table with month baseline 1", () => {
    expect(PERIOD_SCALE.month).toBe(1);
    expect(PERIOD_SCALE.week).toBe(0.05);
    expect(PERIOD_SCALE.year).toBe(12);
    expect(PERIOD_SCALE["5years"]).toBe(24);
    expect(PERIOD_SCALE.all).toBe(24);
    expect(periodScale("week")).toBeLessThan(periodScale("month"));
    expect(periodScale("month")).toBeLessThan(periodScale("year"));
    expect(periodScale("year")).toBeLessThanOrEqual(periodScale("all"));
  });

  it("maps each timeline to the expected day span", () => {
    const now = new Date("2026-07-12T12:00:00.000Z");
    const spans: Record<string, number> = {
      week: 7,
      month: 30,
      year: 365,
      "5years": 5 * 365,
      all: 10 * 365,
    };
    for (const period of TIME_PERIODS) {
      const { dateFrom, dateTo } = timelineToDateRange(period, now);
      const days = Math.round((dateTo.getTime() - dateFrom.getTime()) / (24 * 60 * 60 * 1000));
      expect(days).toBe(spans[period]);
      expect(dateTo.getTime()).toBe(now.getTime());
    }
  });

  it("type-guards TimePeriod strings", () => {
    expect(isTimePeriod("week")).toBe(true);
    expect(isTimePeriod("5years")).toBe(true);
    expect(isTimePeriod("decade")).toBe(false);
  });
});
