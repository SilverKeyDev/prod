import { describe, expect, it } from "vitest";

import {
  controlWeeklyPerformance,
  variantWeeklyPerformance,
  weeklyPerformance,
} from "packages/features/brokerage/utils/campaigns/campaignFixtureBuilders";

describe("campaign weekly series builders", () => {
  it("pins week 1 and week 8 endpoints and jagged mid weeks", () => {
    const series = weeklyPerformance(15, 19, 30, 40);
    expect(series).toHaveLength(8);
    expect(series[0]?.attach_rate_percent).toBe(15);
    expect(series[0]?.open_rate_percent).toBe(30);
    expect(series[7]?.attach_rate_percent).toBe(19);
    expect(series[7]?.open_rate_percent).toBe(40);

    const midAttach = series.slice(1, 7).map((p) => p.attach_rate_percent);
    const perfectlyLinear = midAttach.every((rate, i) => {
      const t = (i + 1) / 7;
      const expected = Math.round((15 + (19 - 15) * t) * 100) / 100;
      return rate === expected;
    });
    expect(perfectlyLinear).toBe(false);
  });

  it("keeps variant series deterministic with pinned endpoints", () => {
    const a = variantWeeklyPerformance(15, 19, 30, 40, 3, 6.5, 1);
    const b = variantWeeklyPerformance(15, 19, 30, 40, 3, 6.5, 1);
    expect(a).toEqual(b);
    expect(a[0]?.attach_rate_percent).toBe(15);
    expect(a[7]?.attach_rate_percent).toBe(19);
    for (const point of a) {
      expect(point.click_rate_percent).toBeLessThan(point.open_rate_percent);
    }
  });

  it("keeps control near-flat with tiny mid-week wobble", () => {
    const control = controlWeeklyPerformance(15);
    expect(control[0]?.attach_rate_percent).toBe(15);
    expect(control[7]?.attach_rate_percent).toBe(15);
    expect(control.every((p) => p.open_rate_percent === 0 && p.click_rate_percent === 0)).toBe(
      true
    );
    for (const point of control.slice(1, 7)) {
      expect(Math.abs(point.attach_rate_percent - 15)).toBeLessThanOrEqual(0.2);
    }
  });
});
