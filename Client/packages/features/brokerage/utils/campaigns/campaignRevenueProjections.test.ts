import { describe, expect, it } from "vitest";

import { buildAncillaryData } from "packages/features/brokerage/utils/analytics/ancillaryTransforms";
import { ANCILLARY_FEES } from "packages/features/brokerage/utils/ancillaryFees";
import {
  MONTH_TRANSACTIONS,
  YEAR_TRANSACTIONS,
} from "packages/features/brokerage/utils/brokerageDemoVolumeAssumptions";
import { CAMPAIGN_CATEGORIES_FIXTURE } from "packages/features/brokerage/utils/campaigns/campaignFixtures";
import {
  buildCampaignRevenueProjections,
  buildCategoryAttachProjection,
  buildMonthlyCumulativeSeries,
} from "packages/features/brokerage/utils/campaigns/campaignRevenueProjections";

describe("buildCampaignRevenueProjections", () => {
  it("projects all six campaigns from lift × volume × fee", () => {
    const totalTransactions = 1000;
    const result = buildCampaignRevenueProjections(CAMPAIGN_CATEGORIES_FIXTURE, totalTransactions);

    expect(result.rows.map((r) => r.categoryId)).toEqual([
      "title_insurance",
      "mortgage",
      "homeowners_insurance",
      "home_warranty",
      "move_concierge",
      "transaction_fall_off",
    ]);

    const title = result.rows.find((r) => r.categoryId === "title_insurance")!;
    expect(title.liftPp).toBeGreaterThan(0);
    expect(title.incrementalAttaches).toBe(Math.round((totalTransactions * title.liftPp) / 100));
    expect(title.projectedDollars).toBe(title.incrementalAttaches * ANCILLARY_FEES.title);
    expect(title.service).toBe("title");
    expect(title.feeAssumption).toBe(ANCILLARY_FEES.title);
    expect(title.monthlyCumulative).toHaveLength(12);

    const lending = result.rows.find((r) => r.categoryId === "mortgage")!;
    expect(lending.projectedDollars).toBe(lending.incrementalAttaches * ANCILLARY_FEES.lending);

    const homeowners = result.rows.find((r) => r.categoryId === "homeowners_insurance")!;
    expect(homeowners.projectedDollars).toBe(
      homeowners.incrementalAttaches * ANCILLARY_FEES.homeowners_insurance
    );
    expect(homeowners.feeAssumption).toBe(ANCILLARY_FEES.homeowners_insurance);

    const warranty = result.rows.find((r) => r.categoryId === "home_warranty")!;
    expect(warranty.projectedDollars).toBe(
      warranty.incrementalAttaches * ANCILLARY_FEES.home_warranty
    );

    const move = result.rows.find((r) => r.categoryId === "move_concierge")!;
    expect(move.projectedDollars).toBe(move.incrementalAttaches * ANCILLARY_FEES.move_concierge);
    expect(move.feeAssumption).toBe(ANCILLARY_FEES.move_concierge);

    const fallOff = result.rows.find((r) => r.categoryId === "transaction_fall_off")!;
    expect(fallOff.liftPp).toBe(4);
    expect(fallOff.projectedDollars).toBe(fallOff.incrementalAttaches * 400);
    expect(fallOff.feeAssumption).toBe(400);

    expect(result.totalProjectedDollars).toBe(
      result.rows.reduce((sum, row) => sum + row.projectedDollars, 0)
    );
    expect(result.monthlyCumulative).toHaveLength(12);
  });

  it("keeps Kaggle year volume and opportunity-to-high below old 100% framing", () => {
    const month = buildAncillaryData("month");
    const year = buildAncillaryData("year");
    expect(month.total_transactions).toBe(MONTH_TRANSACTIONS);
    expect(year.total_transactions).toBe(YEAR_TRANSACTIONS);
    expect(month.summary.total_leakage_dollars).toBe(58_650);
    expect(month.summary.opportunity_vs_avg_dollars).toBe(21_275);
    expect(year.summary.total_leakage_dollars).toBeGreaterThan(month.summary.total_leakage_dollars);
    // Far below former 100%-attach month total (~$894K)
    expect(year.summary.total_leakage_dollars).toBeLessThan(1_000_000);

    const result = buildCampaignRevenueProjections(CAMPAIGN_CATEGORIES_FIXTURE, YEAR_TRANSACTIONS);
    expect(result.rows).toHaveLength(6);
    expect(result.totalProjectedDollars).toBeGreaterThan(0);

    // Campaigns lift avg→high; brokerage current is below avg, so recovery matches that slice only
    const overlapIds = new Set(["title_insurance", "mortgage", "home_warranty"]);
    const overlapRecovery = result.rows
      .filter((r) => overlapIds.has(r.categoryId))
      .reduce((sum, r) => sum + r.projectedDollars, 0);
    const overlapOpportunityAvgToHigh = year.by_service
      .filter(
        (s) => s.service === "title" || s.service === "lending" || s.service === "home_warranty"
      )
      .reduce((sum, s) => sum + (s.opportunity_vs_high_dollars - s.opportunity_vs_avg_dollars), 0);
    expect(overlapRecovery).toBe(overlapOpportunityAvgToHigh);
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
    expect(hoi.baselinePercent).toBe(8);
    expect(hoi.postPercent).toBe(11);
    expect(hoi.liftPp).toBe(3);

    const mc = buildCategoryAttachProjection(move);
    expect(mc.baselinePercent).toBe(6);
    expect(mc.postPercent).toBe(9);
    expect(mc.liftPp).toBe(3);
  });
});
