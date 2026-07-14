import { describe, expect, it } from "vitest";

import { CAMPAIGN_CATEGORIES_FIXTURE } from "packages/features/brokerage/utils/campaigns/campaignFixtures";
import { buildSuggestedNextVariant } from "packages/features/brokerage/utils/campaigns/campaignSuggestedNext";
import { buildVariantRateComparisonSeries } from "packages/features/brokerage/utils/campaigns/campaignVariantRateComparison";

describe("buildSuggestedNextVariant", () => {
  it("returns null without a winner", () => {
    expect(buildSuggestedNextVariant([], null)).toBeNull();
  });

  it("derives copy from title winner lift without changing emails", () => {
    const title = CAMPAIGN_CATEGORIES_FIXTURE.find((c) => c.id === "title_insurance")!;
    const before = title.emails.map((e) => e.subject);
    const { liftVsControlPp } = buildVariantRateComparisonSeries(title.emails, "attach");
    const suggestion = buildSuggestedNextVariant(title.emails, liftVsControlPp);
    expect(suggestion?.title).toBe("Suggested next variant");
    expect(suggestion?.reason).toMatch(/B is ahead/);
    expect(title.emails.map((e) => e.subject)).toEqual(before);
  });
});
