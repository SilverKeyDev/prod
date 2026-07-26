import { describe, expect, it } from "vitest";

import { buildAncillaryData } from "packages/features/brokerage/utils/analytics/ancillaryTransforms";
import { buildLeakageMathExplanation } from "packages/features/brokerage/utils/analytics/leakageMathExplanation";
import { fallOffOpportunityDollars } from "packages/features/brokerage/utils/ancillaryAttachBenchmarks";
import { formatAncillaryDollars } from "packages/features/brokerage/utils/ancillaryServiceLabels";
import { MONTH_TRANSACTIONS } from "packages/features/brokerage/utils/brokerageDemoVolumeAssumptions";

/** Month attach opportunity-to-high at 1,854 closings (current 2 pp below avg). */
const MONTH_ATTACH_OPPORTUNITY = 58_650;
/** Month attach opportunity vs industry avg. */
const MONTH_OPPORTUNITY_VS_AVG = 21_275;
/** Month attach + fall-off keep-rate gap. */
const MONTH_OPPORTUNITY_WITH_FALL_OFF =
  MONTH_ATTACH_OPPORTUNITY + fallOffOpportunityDollars(MONTH_TRANSACTIONS);

describe("leakageMathExplanation", () => {
  it("uses gap-to-high opportunity with title 13% current / 15% avg / 19% high and fall-off row", () => {
    const data = buildAncillaryData("month");
    const explanation = buildLeakageMathExplanation(data, "month");

    expect(data.summary.total_leakage_dollars).toBe(MONTH_ATTACH_OPPORTUNITY);
    expect(data.summary.opportunity_vs_avg_dollars).toBe(MONTH_OPPORTUNITY_VS_AVG);
    expect(explanation.hero.value).toBe(formatAncillaryDollars(MONTH_OPPORTUNITY_WITH_FALL_OFF));
    expect(explanation.hero.label).toContain("this month");
    expect(explanation.hero.secondaryLabel).toBe("Opportunity vs industry average");
    expect(explanation.hero.secondaryValue).toBe(formatAncillaryDollars(MONTH_OPPORTUNITY_VS_AVG));
    expect(explanation.formulaRows).toHaveLength(data.by_service.length + 1);
    expect(explanation.formulaTotal).toContain("Σ opportunity to high");

    const titleRow = explanation.formulaRows.find((row) => row.label.includes("Title"));
    expect(titleRow?.inputs).toContain("13%");
    expect(titleRow?.inputs).toContain("15%");
    expect(titleRow?.inputs).toContain("19%");
    expect(titleRow?.equation).toMatch(/\+6 pp/);
    expect(titleRow?.equation).toMatch(/vs avg/);

    const fallOffRow = explanation.formulaRows.find((row) => row.label.includes("Fall-Off"));
    expect(fallOffRow?.inputs).toContain("72%");
    expect(fallOffRow?.inputs).toContain("76%");
    expect(fallOffRow?.equation).toMatch(/saved closing/);

    expect(explanation.stats).toHaveLength(6);
    expect(explanation.snapshot?.opportunityToHigh).toBe(
      formatAncillaryDollars(MONTH_OPPORTUNITY_WITH_FALL_OFF)
    );
    expect(explanation.snapshot?.vsIndustryAvg).toBe(
      formatAncillaryDollars(MONTH_OPPORTUNITY_VS_AVG)
    );
    expect(explanation.snapshot?.biggestLeak).toMatch(/· \$/);
    expect(explanation.snapshot?.closingsInPeriod).toBe(MONTH_TRANSACTIONS.toLocaleString());
    expect(explanation.snapshot?.behindIndustryAvg).toBe(true);
    expect(explanation.bridge).toBeUndefined();
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
