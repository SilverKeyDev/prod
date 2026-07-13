import { describe, expect, it } from "vitest";

import { BROKERAGE_AGENTS_FIXTURE } from "packages/features/brokerage/utils/brokerageAnalyticsFixtures";

import { estimateCampaignReach, toggleCampaignAgentType } from "./campaignAudienceReach";
import { CAMPAIGN_CATEGORIES_FIXTURE } from "./campaignFixtures";

describe("campaignAudienceReach", () => {
  it("counts all agents when all is selected", () => {
    expect(estimateCampaignReach(["all"])).toBe(BROKERAGE_AGENTS_FIXTURE.length);
  });

  it("counts strong (top) agents only", () => {
    const strong = estimateCampaignReach(["strong"]);
    const topCount = BROKERAGE_AGENTS_FIXTURE.filter((a) => a.status === "top").length;
    expect(strong).toBe(topCount);
    expect(strong).toBeGreaterThan(0);
    expect(strong).toBeLessThan(BROKERAGE_AGENTS_FIXTURE.length);
  });

  it("unions multiple sales bands", () => {
    const lowAndStrong = estimateCampaignReach(["low_sales", "strong"]);
    const expected = BROKERAGE_AGENTS_FIXTURE.filter(
      (a) => a.status === "at_risk" || a.status === "top"
    ).length;
    expect(lowAndStrong).toBe(expected);
  });

  it("treats All as exclusive when toggled on", () => {
    expect(toggleCampaignAgentType(["low_sales"], "all")).toEqual(["all"]);
    expect(toggleCampaignAgentType(["all"], "medium")).toEqual(["medium"]);
  });
});

describe("campaignFixtures copy", () => {
  it("has no em-dashes in subjects, bodies, or insights", () => {
    for (const category of CAMPAIGN_CATEGORIES_FIXTURE) {
      for (const email of category.emails) {
        expect(email.subject).not.toMatch(/—/);
        expect(email.preview_body).not.toMatch(/—/);
      }
      for (const item of category.insights.what_worked) {
        expect(item).not.toMatch(/—/);
      }
      for (const item of category.insights.why_guesses) {
        expect(item).not.toMatch(/—/);
      }
    }
  });

  it("keeps insights to at most two bullets per column", () => {
    for (const category of CAMPAIGN_CATEGORIES_FIXTURE) {
      expect(category.insights.what_worked.length).toBeLessThanOrEqual(2);
      expect(category.insights.why_guesses.length).toBeLessThanOrEqual(2);
    }
  });
});
