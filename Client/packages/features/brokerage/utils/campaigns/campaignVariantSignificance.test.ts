import { describe, expect, it } from "vitest";

import { CAMPAIGN_CATEGORIES_FIXTURE } from "packages/features/brokerage/utils/campaigns/campaignFixtures";
import {
  buildVariantSignificance,
  significanceFromZ,
  twoProportionZ,
  weeklyRateConfidenceBounds,
} from "packages/features/brokerage/utils/campaigns/campaignVariantSignificance";

describe("campaignVariantSignificance", () => {
  it("returns null z when trials are zero", () => {
    expect(twoProportionZ(5, 0, 3, 100)).toBeNull();
  });

  it("flags |z| >= 1.96 as 95% conf", () => {
    expect(significanceFromZ(2.1).label).toBe("95% conf reached");
    expect(significanceFromZ(1.5).label).toBe("Collecting data");
    expect(significanceFromZ(null).label).toBe("Collecting data");
  });

  it("builds per-variant chips for title fixture without changing funnel counts", () => {
    const title = CAMPAIGN_CATEGORIES_FIXTURE.find((c) => c.id === "title_insurance")!;
    const before = title.emails.map((e) => ({ ...e.funnel }));
    const result = buildVariantSignificance(title.emails);
    expect(result.length).toBe(title.emails.length);
    expect(result.find((r) => r.variantKey === "Control")?.label).toBe("Holdout arm");
    const winner = result.find((r) => r.variantKey === "B");
    expect(winner?.zScore).not.toBeNull();
    expect(winner?.label).toMatch(/95% conf|Collecting data/);
    expect(title.emails.map((e) => e.funnel)).toEqual(before);
  });

  it("derives display bands around rates without mutating centers", () => {
    const rates = [15, 16, 17];
    const bands = weeklyRateConfidenceBounds(rates, 500);
    expect(bands).toHaveLength(3);
    for (let i = 0; i < rates.length; i++) {
      expect(bands[i]!.loBound).toBeLessThanOrEqual(rates[i]!);
      expect(bands[i]!.hiBound).toBeGreaterThanOrEqual(rates[i]!);
    }
  });
});
