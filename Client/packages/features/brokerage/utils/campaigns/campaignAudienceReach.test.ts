import { describe, expect, it } from "vitest";

import { BROKERAGE_AGENTS_FIXTURE } from "packages/features/brokerage/utils/brokerageAnalyticsFixtures";
import { DEMO_AGENT_COUNT } from "packages/features/brokerage/utils/brokerageDemoVolumeAssumptions";

import { estimateCampaignReach, toggleCampaignAgentType } from "./campaignAudienceReach";
import { CAMPAIGN_CATEGORIES_FIXTURE } from "./campaignFixtures";

describe("campaignAudienceReach", () => {
  it("counts all agents when all is selected", () => {
    expect(estimateCampaignReach(["all"])).toBe(DEMO_AGENT_COUNT);
  });

  it("counts strong (top) agents only", () => {
    const strong = estimateCampaignReach(["strong"]);
    const topCount = BROKERAGE_AGENTS_FIXTURE.filter((a) => a.status === "top").length;
    const expected = Math.max(
      1,
      Math.round((topCount / BROKERAGE_AGENTS_FIXTURE.length) * DEMO_AGENT_COUNT)
    );
    expect(strong).toBe(expected);
    expect(strong).toBeGreaterThan(0);
    expect(strong).toBeLessThan(DEMO_AGENT_COUNT);
  });

  it("unions multiple sales bands", () => {
    const lowAndStrong = estimateCampaignReach(["low_sales", "strong"]);
    const sampleMatch = BROKERAGE_AGENTS_FIXTURE.filter(
      (a) => a.status === "at_risk" || a.status === "top"
    ).length;
    const expected = Math.max(
      1,
      Math.round((sampleMatch / BROKERAGE_AGENTS_FIXTURE.length) * DEMO_AGENT_COUNT)
    );
    expect(lowAndStrong).toBe(expected);
  });

  it("treats All as exclusive when toggled on", () => {
    expect(toggleCampaignAgentType(["low_sales"], "all")).toEqual(["all"]);
    expect(toggleCampaignAgentType(["all"], "medium")).toEqual(["medium"]);
  });
});

describe("campaignFixtures copy", () => {
  it("has no em-dashes in subjects or bodies", () => {
    for (const category of CAMPAIGN_CATEGORIES_FIXTURE) {
      for (const email of category.emails) {
        if (email.is_control) continue;
        expect(email.subject).not.toMatch(/—/);
        expect(email.preview_body).not.toMatch(/—/);
        expect(email.headline).not.toMatch(/—/);
        expect(email.intro).not.toMatch(/—/);
        expect(email.cta_label).not.toMatch(/—/);
        for (const paragraph of email.body_paragraphs) {
          expect(paragraph).not.toMatch(/—/);
        }
      }
    }
  });
});
