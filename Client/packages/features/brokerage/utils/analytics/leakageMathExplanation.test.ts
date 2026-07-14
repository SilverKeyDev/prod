import { describe, expect, it } from "vitest";

import { buildAncillaryData } from "packages/features/brokerage/utils/analytics/ancillaryTransforms";
import { buildLeakageMathExplanation } from "packages/features/brokerage/utils/analytics/leakageMathExplanation";
import { fallOffOpportunityDollars } from "packages/features/brokerage/utils/ancillaryAttachBenchmarks";
import { formatAncillaryDollars } from "packages/features/brokerage/utils/ancillaryServiceLabels";
import {
  MONTH_TRANSACTIONS,
  YEAR_TRANSACTIONS,
} from "packages/features/brokerage/utils/brokerageDemoVolumeAssumptions";
import {
  demoCampaignLeakageAlignedRecoveryDollars,
  demoCampaignYearRecoveryDollars,
  demoYearLeakageDollars,
  recoveryPercentOfLeakage,
} from "packages/features/brokerage/utils/campaigns/brokerageMathBridge";
import { CAMPAIGN_CATEGORIES_FIXTURE } from "packages/features/brokerage/utils/campaigns/campaignFixtures";
import {
  ANALYTICS_LEAKAGE_HREF,
  buildCampaignMathExplanation,
} from "packages/features/brokerage/utils/campaigns/campaignMathExplanation";
import { buildCampaignRevenueProjections } from "packages/features/brokerage/utils/campaigns/campaignRevenueProjections";
import { ROUTES } from "packages/navigation/types/routes";

/** Month attach opportunity-to-high at 1,854 closings. */
const MONTH_ATTACH_OPPORTUNITY = 37_375;
/** Month attach + fall-off keep-rate gap. */
const MONTH_OPPORTUNITY_WITH_FALL_OFF =
  MONTH_ATTACH_OPPORTUNITY + fallOffOpportunityDollars(MONTH_TRANSACTIONS);

describe("leakageMathExplanation", () => {
  it("uses gap-to-high opportunity with title 15% avg / 19% high and fall-off row", () => {
    const data = buildAncillaryData("month");
    const yearOpportunity = demoYearLeakageDollars();
    const recovery = demoCampaignLeakageAlignedRecoveryDollars();
    const explanation = buildLeakageMathExplanation(data, "month", {
      campaignRecoveryDollars: recovery,
      yearLeakageDollars: yearOpportunity,
    });

    expect(data.summary.total_leakage_dollars).toBe(MONTH_ATTACH_OPPORTUNITY);
    expect(data.summary.opportunity_vs_avg_dollars).toBe(0);
    expect(explanation.hero.value).toBe(formatAncillaryDollars(MONTH_OPPORTUNITY_WITH_FALL_OFF));
    expect(explanation.hero.label).toContain("this month");
    expect(explanation.hero.secondaryValue).toBe("At industry average");
    expect(explanation.formulaRows).toHaveLength(data.by_service.length + 1);
    expect(explanation.formulaTotal).toContain("Σ opportunity to high");

    const titleRow = explanation.formulaRows.find((row) => row.label.includes("Title"));
    expect(titleRow?.inputs).toContain("15%");
    expect(titleRow?.inputs).toContain("19%");
    expect(titleRow?.equation).toMatch(/\+4 pp/);

    const fallOffRow = explanation.formulaRows.find((row) => row.label.includes("Fall-Off"));
    expect(fallOffRow?.inputs).toContain("72%");
    expect(fallOffRow?.inputs).toContain("76%");
    expect(fallOffRow?.equation).toMatch(/saved closing/);

    expect(explanation.stats).toHaveLength(6);
    expect(explanation.snapshot?.opportunityToHigh).toBe(
      formatAncillaryDollars(MONTH_OPPORTUNITY_WITH_FALL_OFF)
    );
    expect(explanation.snapshot?.vsIndustryAvg).toBe("At industry average");
    expect(explanation.snapshot?.biggestLeak).toMatch(/· \$/);
    expect(explanation.snapshot?.closingsInPeriod).toBe(MONTH_TRANSACTIONS.toLocaleString());
    expect(explanation.snapshot?.behindIndustryAvg).toBe(false);
    expect(explanation.bridge.to).toBe(ROUTES.CAMPAIGNS);
    expect(explanation.bridge.label).toContain(
      String(recoveryPercentOfLeakage(recovery, yearOpportunity))
    );
  });

  it("scales opportunity with period", () => {
    const week = buildAncillaryData("week");
    const year = buildAncillaryData("year");
    expect(week.summary.opportunity_vs_high_dollars).toBeLessThan(
      year.summary.opportunity_vs_high_dollars
    );
    expect(buildLeakageMathExplanation(year, "year").hero.label).toContain("this year");
    expect(buildLeakageMathExplanation(week, "week").hero.label).toContain("this week");
  });
});

describe("campaignMathExplanation", () => {
  it("includes baseline→post inputs and keep-rate equation for fall-off", () => {
    const projection = buildCampaignRevenueProjections(
      CAMPAIGN_CATEGORIES_FIXTURE,
      YEAR_TRANSACTIONS
    );
    const yearLeakage = demoYearLeakageDollars();
    const explanation = buildCampaignMathExplanation(projection, {
      yearClosings: YEAR_TRANSACTIONS,
      yearLeakageDollars: yearLeakage,
    });

    expect(explanation.hero.value).toMatch(/\$/);
    expect(explanation.formulaRows).toHaveLength(projection.rows.length);
    expect(explanation.formulaTotal).toContain("Σ portfolio recovery");

    const titleRow = explanation.formulaRows.find((row) => row.label === "Title Insurance");
    expect(titleRow?.inputs).toMatch(/15% → 19%/);
    expect(titleRow?.equation).toMatch(/\/attach/);

    const fallOffRow = explanation.formulaRows.find((row) => row.label === "Transaction Fall-Off");
    expect(fallOffRow?.inputs).toMatch(/keep/);
    expect(fallOffRow?.equation).toMatch(/saved closing/);

    expect(explanation.stats.find((s) => s.label === "Year closings")?.value).toBe(
      YEAR_TRANSACTIONS.toLocaleString()
    );
    expect(explanation.bridge.to).toBe(ANALYTICS_LEAKAGE_HREF);
    expect(explanation.bridge.to).toBe("/dashboard?tab=leakage");
  });
});

describe("brokerageMathBridge", () => {
  it("aligned recovery stays under year opportunity-to-high including fall-off", () => {
    const aligned = demoCampaignLeakageAlignedRecoveryDollars();
    const portfolio = demoCampaignYearRecoveryDollars();
    const opportunity = demoYearLeakageDollars();
    expect(aligned).toBeGreaterThan(0);
    expect(portfolio).toBeGreaterThan(aligned);
    expect(opportunity).toBeGreaterThan(MONTH_OPPORTUNITY_WITH_FALL_OFF);
    expect(aligned).toBeLessThan(opportunity);
    expect(recoveryPercentOfLeakage(aligned, opportunity)).toBeGreaterThan(0);
    expect(recoveryPercentOfLeakage(aligned, opportunity)).toBeLessThan(100);
  });
});
