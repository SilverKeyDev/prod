import { describe, expect, it } from "vitest";

import { TIME_PERIODS } from "packages/features/brokerage/utils/analyticsPeriod";

import { buildFailureData } from "./useDealFailureForensics";

describe("buildFailureData period matrix", () => {
  it("changes summary totals across all periods", () => {
    const totals = TIME_PERIODS.map(
      (period) => buildFailureData(period).summary.total_transactions
    );
    expect(new Set(totals).size).toBeGreaterThanOrEqual(4);
    expect(totals[0]).toBeLessThan(totals[1]!); // week < month
    expect(totals[1]).toBeLessThan(totals[2]!); // month < year
  });

  it("scales by_agent deal counts with period", () => {
    const week = buildFailureData("week").by_agent[0]?.total_deals ?? 0;
    const year = buildFailureData("year").by_agent[0]?.total_deals ?? 0;
    expect(week).toBeLessThan(year);
  });
});
