import { describe, expect, it } from "vitest";

import { buildAncillaryData } from "packages/features/brokerage/utils/analytics/ancillaryTransforms";
import { CAMPAIGN_CATEGORIES_FIXTURE } from "packages/features/brokerage/utils/campaigns/campaignFixtures";
import {
  buildCampaignRevenueProjections,
  buildCategoryAttachProjection,
  buildMonthlyCumulativeSeries,
} from "packages/features/brokerage/utils/campaigns/campaignRevenueProjections";

describe("buildCampaignRevenueProjections", () => {
  it("projects all five campaigns from lift × volume × fee", () => {
    const totalTransactions = 1000;
    const result = buildCampaignRevenueProjections(CAMPAIGN_CATEGORIES_FIXTURE, totalTransactions);

    expect(result.rows.map((r) => r.categoryId)).toEqual([
      "title_insurance",
      "mortgage",
      "homeowners_insurance",
      "home_warranty",
      "move_concierge",
    ]);

    const title = result.rows.find((r) => r.categoryId === "title_insurance")!;
    expect(title.liftPp).toBeGreaterThan(0);
    expect(title.incrementalAttaches).toBe(Math.round((totalTransactions * title.liftPp) / 100));
    expect(title.projectedDollars).toBe(title.incrementalAttaches * 500);
    expect(title.service).toBe("title");
    expect(title.feeAssumption).toBe(500);
    expect(title.monthlyCumulative).toHaveLength(12);

    const lending = result.rows.find((r) => r.categoryId === "mortgage")!;
    expect(lending.projectedDollars).toBe(lending.incrementalAttaches * 1000);

    const homeowners = result.rows.find((r) => r.categoryId === "homeowners_insurance")!;
    expect(homeowners.projectedDollars).toBe(homeowners.incrementalAttaches * 200);
    expect(homeowners.feeAssumption).toBe(200);

    const warranty = result.rows.find((r) => r.categoryId === "home_warranty")!;
    expect(warranty.projectedDollars).toBe(warranty.incrementalAttaches * 150);

    const move = result.rows.find((r) => r.categoryId === "move_concierge")!;
    expect(move.projectedDollars).toBe(move.incrementalAttaches * 75);
    expect(move.feeAssumption).toBe(75);

    expect(result.totalProjectedDollars).toBe(
      result.rows.reduce((sum, row) => sum + row.projectedDollars, 0)
    );
    expect(result.monthlyCumulative).toHaveLength(12);
  });

  it("aligns with year ancillary transaction volume (month × 12)", () => {
    const month = buildAncillaryData("month");
    const year = buildAncillaryData("year");
    expect(year.total_transactions).toBe(Math.round(month.total_transactions * 12));

    const result = buildCampaignRevenueProjections(
      CAMPAIGN_CATEGORIES_FIXTURE,
      year.total_transactions
    );
    expect(result.totalProjectedDollars).toBeGreaterThan(0);
    expect(result.rows).toHaveLength(5);
    expect(result.totalProjectedDollars).toBe(
      result.rows.reduce((sum, row) => sum + row.projectedDollars, 0)
    );
  });
});

describe("buildMonthlyCumulativeSeries", () => {
  it("month 12 equals year total and month 6 is approximately half", () => {
    const yearDollars = 120_000;
    const series = buildMonthlyCumulativeSeries(yearDollars);
    expect(series).toHaveLength(12);
    expect(series[11]?.cumulativeDollars).toBe(yearDollars);
    expect(series[5]?.cumulativeDollars).toBe(60_000);
    expect(series[0]?.cumulativeDollars).toBe(10_000);
  });
});

describe("buildCategoryAttachProjection", () => {
  it("uses stored baseline/post when present", () => {
    const title = CAMPAIGN_CATEGORIES_FIXTURE.find((c) => c.id === "title_insurance")!;
    const proj = buildCategoryAttachProjection(title);
    expect(proj.baselinePercent).toBe(title.baseline_attach_rate_percent);
    expect(proj.postPercent).toBe(title.post_attach_rate_percent);
    expect(proj.liftPp).toBeGreaterThan(0);
  });

  it("uses stored rates for homeowners and MoveConcierge", () => {
    const homeowners = CAMPAIGN_CATEGORIES_FIXTURE.find((c) => c.id === "homeowners_insurance")!;
    const move = CAMPAIGN_CATEGORIES_FIXTURE.find((c) => c.id === "move_concierge")!;

    const hoi = buildCategoryAttachProjection(homeowners);
    expect(hoi.baselinePercent).toBe(41);
    expect(hoi.postPercent).toBe(47);
    expect(hoi.liftPp).toBe(6);

    const mc = buildCategoryAttachProjection(move);
    expect(mc.baselinePercent).toBe(35);
    expect(mc.postPercent).toBe(44);
    expect(mc.liftPp).toBe(9);
  });
});
