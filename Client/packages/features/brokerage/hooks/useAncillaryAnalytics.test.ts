import { describe, expect, it } from "vitest";

import { periodScale, TIME_PERIODS } from "packages/features/brokerage/utils/analyticsPeriod";

import { buildAncillaryData } from "./useAncillaryAnalytics";

describe("buildAncillaryData period matrix", () => {
  it("scales total_transactions and by_agent with PERIOD_SCALE", () => {
    const month = buildAncillaryData("month");
    for (const period of TIME_PERIODS) {
      const data = buildAncillaryData(period);
      const scale = periodScale(period);
      expect(data.total_transactions).toBe(Math.round(month.total_transactions * scale));
      expect(data.by_agent[0]?.transactions).toBe(
        Math.round((month.by_agent[0]?.transactions ?? 0) * scale)
      );
      expect(data.by_agent[0]?.total_leakage_dollars).toBe(
        Math.round((month.by_agent[0]?.total_leakage_dollars ?? 0) * scale)
      );
    }
  });

  it("week leakage is less than year leakage and by_service tracks volume", () => {
    const week = buildAncillaryData("week");
    const year = buildAncillaryData("year");
    expect(week.summary.total_leakage_dollars).toBeLessThan(year.summary.total_leakage_dollars);
    expect(week.by_service[0]?.outside_count).toBeLessThan(year.by_service[0]?.outside_count ?? 0);
  });
});
