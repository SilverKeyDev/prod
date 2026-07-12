import { describe, expect, it } from "vitest";

import { ANCILLARY_FEES } from "packages/features/brokerage/utils/ancillaryFees";
import { BROKERAGE_ANCILLARY_FIXTURE } from "packages/features/brokerage/utils/brokerageAnalyticsFixtures";
import { CAMPAIGN_CATEGORIES_FIXTURE } from "packages/features/brokerage/utils/campaigns/campaignFixtures";

describe("campaignFixtures category parity", () => {
  it("exposes five categories with emails, weekly series, and insights", () => {
    expect(CAMPAIGN_CATEGORIES_FIXTURE).toHaveLength(5);
    for (const category of CAMPAIGN_CATEGORIES_FIXTURE) {
      expect(category.emails.length).toBeGreaterThanOrEqual(2);
      expect(category.performance_weekly.length).toBe(8);
      expect(category.insights.what_worked.length).toBeGreaterThan(0);
      expect(category.insights.what_worked.length).toBeLessThanOrEqual(2);
      expect(category.insights.why_guesses.length).toBeGreaterThan(0);
      expect(category.insights.why_guesses.length).toBeLessThanOrEqual(2);
    }
  });

  it("overlapping categories match dashboard ancillary baselines and fees", () => {
    const mapped = CAMPAIGN_CATEGORIES_FIXTURE.filter((c) => c.dashboard_service);
    expect(mapped.map((c) => c.dashboard_service).sort()).toEqual(
      ["home_warranty", "lending", "title"].sort()
    );

    for (const category of mapped) {
      const service = category.dashboard_service!;
      const row = BROKERAGE_ANCILLARY_FIXTURE.by_service.find((s) => s.service === service);
      expect(row).toBeTruthy();
      expect(category.baseline_attach_rate_percent).toBe(row!.attach_rate_percent);
      expect(category.fee_assumption).toBe(ANCILLARY_FEES[service]);
      expect(category.performance_weekly[0]?.attach_rate_percent).toBe(
        category.baseline_attach_rate_percent
      );
    }
  });

  it("campaign-only categories have demo fees without dashboard_service", () => {
    const campaignOnly = CAMPAIGN_CATEGORIES_FIXTURE.filter((c) => !c.dashboard_service);
    expect(campaignOnly.map((c) => c.id).sort()).toEqual(
      ["homeowners_insurance", "move_concierge"].sort()
    );
    const homeowners = campaignOnly.find((c) => c.id === "homeowners_insurance")!;
    const move = campaignOnly.find((c) => c.id === "move_concierge")!;
    expect(homeowners.baseline_attach_rate_percent).toBe(41);
    expect(homeowners.post_attach_rate_percent).toBe(47);
    expect(homeowners.fee_assumption).toBe(200);
    expect(move.baseline_attach_rate_percent).toBe(35);
    expect(move.post_attach_rate_percent).toBe(44);
    expect(move.fee_assumption).toBe(75);
  });
});
