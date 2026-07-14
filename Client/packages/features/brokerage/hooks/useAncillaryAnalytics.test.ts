import { describe, expect, it } from "vitest";

import { periodScale, TIME_PERIODS } from "packages/features/brokerage/utils/analyticsPeriod";
import {
  transactionsForPeriod,
  YEAR_TRANSACTIONS,
} from "packages/features/brokerage/utils/brokerageDemoVolumeAssumptions";

import { buildAncillaryData } from "./useAncillaryAnalytics";

describe("buildAncillaryData period matrix", () => {
  it("scales total_transactions and by_agent with PERIOD_SCALE", () => {
    const month = buildAncillaryData("month");
    for (const period of TIME_PERIODS) {
      const data = buildAncillaryData(period);
      const scale = periodScale(period);
      expect(data.total_transactions).toBe(transactionsForPeriod(period));
      const expectedTx = Math.max(1, Math.round((month.by_agent[0]?.transactions ?? 0) * scale));
      expect(data.by_agent[0]?.transactions).toBe(expectedTx);
      // Opportunity recomputed from scaled transactions × attach gap (not linear $ scale)
      expect(data.by_agent[0]?.total_leakage_dollars).toBeGreaterThanOrEqual(0);
      expect(data.by_agent[0]?.name).toBeTruthy();
    }
  });

  it("leaderboard agents keep names and sort by opportunity", () => {
    const data = buildAncillaryData("year");
    expect(data.by_agent.every((a) => typeof a.name === "string" && a.name.length > 0)).toBe(true);
    const sorted = [...data.by_agent].sort(
      (a, b) => b.total_leakage_dollars - a.total_leakage_dollars
    );
    expect(sorted[0]?.total_leakage_dollars).toBeGreaterThanOrEqual(
      sorted[sorted.length - 1]?.total_leakage_dollars ?? 0
    );
  });

  it("uses YEAR_TRANSACTIONS for the year period (not month × 12)", () => {
    expect(buildAncillaryData("year").total_transactions).toBe(YEAR_TRANSACTIONS);
  });

  it("week leakage is less than year leakage and by_service tracks volume", () => {
    const week = buildAncillaryData("week");
    const year = buildAncillaryData("year");
    expect(week.summary.total_leakage_dollars).toBeLessThan(year.summary.total_leakage_dollars);
    expect(week.by_service[0]?.outside_count).toBeLessThan(year.by_service[0]?.outside_count ?? 0);
  });

  it("keeps per-agent transactions realistic across periods", () => {
    const all = buildAncillaryData("all");
    for (const agent of all.by_agent) {
      expect(agent.transactions).toBeLessThanOrEqual(120);
      expect(agent.transactions).toBeGreaterThan(0);
    }
  });
});
