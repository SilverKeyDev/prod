import { describe, expect, it } from "vitest";

import { periodScale, TIME_PERIODS } from "packages/features/brokerage/utils/analyticsPeriod";

import { buildBrokerageAgents, buildBrokerageAnalyticsData } from "./useBrokerageAnalytics";

describe("buildBrokerageAnalyticsData period matrix", () => {
  it("scales closings and funnel counts with PERIOD_SCALE", () => {
    const month = buildBrokerageAnalyticsData("month");
    for (const period of TIME_PERIODS) {
      const data = buildBrokerageAnalyticsData(period);
      const scale = periodScale(period);
      expect(data.overview.closingsThisMonth).toBe(
        Math.round(month.overview.closingsThisMonth * scale)
      );
      expect(data.transactionFunnel[0]?.count).toBe(
        Math.round((month.transactionFunnel[0]?.count ?? 0) * scale)
      );
      expect(data.production.gci.closed).toBe(Math.round(month.production.gci.closed * scale));
    }
  });

  it("orders week < month < year <= all for closings", () => {
    const week = buildBrokerageAnalyticsData("week").overview.closingsThisMonth;
    const month = buildBrokerageAnalyticsData("month").overview.closingsThisMonth;
    const year = buildBrokerageAnalyticsData("year").overview.closingsThisMonth;
    const all = buildBrokerageAnalyticsData("all").overview.closingsThisMonth;
    expect(week).toBeLessThan(month);
    expect(month).toBeLessThan(year);
    expect(year).toBeLessThanOrEqual(all);
  });

  it("scales agent closings and volume", () => {
    const monthAgents = buildBrokerageAgents("month");
    const weekAgents = buildBrokerageAgents("week");
    expect(weekAgents[0]?.closings).toBeLessThan(monthAgents[0]?.closings ?? 0);
    expect(weekAgents[0]?.volumeDollars).toBeLessThan(monthAgents[0]?.volumeDollars ?? 0);
  });
});
