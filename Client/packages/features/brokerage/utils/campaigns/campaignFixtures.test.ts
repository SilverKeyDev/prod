import { describe, expect, it } from "vitest";

import { ANCILLARY_FEES } from "packages/features/brokerage/utils/ancillaryFees";
import { BROKERAGE_ANCILLARY_FIXTURE } from "packages/features/brokerage/utils/brokerageAnalyticsFixtures";
import {
  bodyFieldsFromPreview,
  buildCustomCampaignCategory,
  CAMPAIGN_CATEGORIES_FIXTURE,
  CAMPAIGN_TEMPLATES,
  formatCampaignWindow,
  getCampaignTemplateSeed,
} from "packages/features/brokerage/utils/campaigns/campaignFixtures";

describe("campaignFixtures category parity", () => {
  it("exposes six categories with emails and weekly series", () => {
    expect(CAMPAIGN_CATEGORIES_FIXTURE).toHaveLength(6);
    for (const category of CAMPAIGN_CATEGORIES_FIXTURE) {
      expect(category.emails.length).toBeGreaterThanOrEqual(4);
      expect(category.emails.some((e) => e.is_winner)).toBe(true);
      for (const email of category.emails) {
        expect(email.headline.length).toBeGreaterThan(0);
        expect(email.intro.length).toBeGreaterThan(0);
        expect(email.cta_label.length).toBeGreaterThan(0);
        expect(Array.isArray(email.body_paragraphs)).toBe(true);
        expect(email.performance_weekly).toHaveLength(8);
        for (const point of email.performance_weekly) {
          expect(point.open_rate_percent).toBeTypeOf("number");
          expect(point.click_rate_percent).toBeTypeOf("number");
          expect(point.attach_rate_percent).toBeTypeOf("number");
        }
      }
      expect(category.performance_weekly.length).toBe(8);
      expect(category).not.toHaveProperty("insights");
    }
  });

  it("seeds A–D + Control on title and mortgage and A–C + Control on other categories", () => {
    const title = CAMPAIGN_CATEGORIES_FIXTURE.find((c) => c.id === "title_insurance")!;
    const mortgage = CAMPAIGN_CATEGORIES_FIXTURE.find((c) => c.id === "mortgage")!;
    expect(title.emails.map((e) => e.variant_key)).toEqual(["A", "B", "C", "D", "Control"]);
    expect(mortgage.emails.map((e) => e.variant_key)).toEqual(["A", "B", "C", "D", "Control"]);
    for (const category of CAMPAIGN_CATEGORIES_FIXTURE.filter(
      (c) => c.id !== "title_insurance" && c.id !== "mortgage"
    )) {
      expect(category.emails.map((e) => e.variant_key)).toEqual(["A", "B", "C", "Control"]);
    }
  });

  it("ends every category with a Control holdout (no email rates)", () => {
    for (const category of CAMPAIGN_CATEGORIES_FIXTURE) {
      const last = category.emails[category.emails.length - 1]!;
      expect(last.is_control).toBe(true);
      expect(last.variant_key).toBe("Control");
      expect(last.funnel.sent).toBe(0);
      expect(last.funnel.opened).toBe(0);
      expect(last.funnel.clicked).toBe(0);
      const baseline = category.baseline_attach_rate_percent!;
      for (const point of last.performance_weekly) {
        expect(point.open_rate_percent).toBe(0);
        expect(point.click_rate_percent).toBe(0);
        if (point.week === 1 || point.week === 8) {
          expect(point.attach_rate_percent).toBe(baseline);
        } else {
          expect(Math.abs(point.attach_rate_percent - baseline)).toBeLessThanOrEqual(0.2);
        }
      }
    }
  });

  it("overlapping categories match dashboard ancillary baselines, highs, and fees", () => {
    const mapped = CAMPAIGN_CATEGORIES_FIXTURE.filter((c) => c.dashboard_service);
    expect(mapped.map((c) => c.dashboard_service).sort()).toEqual(
      ["home_warranty", "lending", "title"].sort()
    );

    for (const category of mapped) {
      const service = category.dashboard_service!;
      const row = BROKERAGE_ANCILLARY_FIXTURE.by_service.find((s) => s.service === service);
      expect(row).toBeTruthy();
      expect(category.baseline_attach_rate_percent).toBe(row!.attach_rate_percent);
      expect(category.baseline_attach_rate_percent).toBe(row!.industry_avg_percent);
      expect(category.post_attach_rate_percent).toBe(row!.industry_high_percent);
      expect(category.fee_assumption).toBe(ANCILLARY_FEES[service]);
      expect(category.performance_weekly[0]?.attach_rate_percent).toBe(
        category.baseline_attach_rate_percent
      );
    }
  });

  it("campaign-only categories have demo fees without dashboard_service", () => {
    const campaignOnly = CAMPAIGN_CATEGORIES_FIXTURE.filter((c) => !c.dashboard_service);
    expect(campaignOnly.map((c) => c.id).sort()).toEqual(
      ["homeowners_insurance", "move_concierge", "transaction_fall_off"].sort()
    );
    const homeowners = campaignOnly.find((c) => c.id === "homeowners_insurance")!;
    const move = campaignOnly.find((c) => c.id === "move_concierge")!;
    const fallOff = campaignOnly.find((c) => c.id === "transaction_fall_off")!;
    expect(homeowners.baseline_attach_rate_percent).toBe(8);
    expect(homeowners.post_attach_rate_percent).toBe(11);
    expect(homeowners.fee_assumption).toBe(ANCILLARY_FEES.homeowners_insurance);
    expect(move.baseline_attach_rate_percent).toBe(6);
    expect(move.post_attach_rate_percent).toBe(9);
    expect(move.fee_assumption).toBe(ANCILLARY_FEES.move_concierge);
    expect(fallOff.baseline_attach_rate_percent).toBe(72);
    expect(fallOff.post_attach_rate_percent).toBe(76);
    expect(fallOff.fee_assumption).toBe(400);
  });

  it("exposes a template catalog covering every built-in seed", () => {
    expect(CAMPAIGN_TEMPLATES.map((t) => t.id).sort()).toEqual(
      CAMPAIGN_CATEGORIES_FIXTURE.map((c) => c.id).sort()
    );
    for (const template of CAMPAIGN_TEMPLATES) {
      const seed = getCampaignTemplateSeed(template.id);
      expect(seed.id).toBe(template.id);
      expect(seed.label).toBe(template.label);
    }
  });

  it("builds custom campaigns with null fees and a Control holdout", () => {
    const custom = buildCustomCampaignCategory("Deal Rescue", "Chase missing packets.");
    expect(custom.id.startsWith("custom_")).toBe(true);
    expect(custom.label).toBe("Deal Rescue");
    expect(custom.description).toBe("Chase missing packets.");
    expect(custom.status).toBe("draft");
    expect(custom.cadence).toBe("weekly");
    expect(custom.defaultAgentTypes).toEqual(["all"]);
    expect(custom.emails).toHaveLength(1);
    expect(custom.emails[0]?.is_control).toBe(true);
    expect(custom.emails[0]?.variant_key).toBe("Control");
    expect(custom.fee_assumption).toBeNull();
    expect(custom.baseline_attach_rate_percent).toBeNull();
    expect(custom).not.toHaveProperty("insights");
  });

  it("formats campaign window text from startedAt and cadence", () => {
    expect(formatCampaignWindow("2026-01-01", "weekly")).toBe("Started Jan 2026 · weekly cadence");
    expect(formatCampaignWindow("2026-03-15", "biweekly")).toBe(
      "Started Mar 2026 · biweekly cadence"
    );
    expect(formatCampaignWindow(undefined, "monthly")).toBe("monthly cadence");
  });

  it("built-in fixtures include running status and weekly cadence defaults", () => {
    for (const category of CAMPAIGN_CATEGORIES_FIXTURE) {
      expect(category.status).toBe("running");
      expect(category.cadence).toBe("weekly");
      expect(category.startedAt).toBe("2026-01-01");
      expect(category.defaultScheduleMode).toBe("now");
      expect(category.defaultAgentTypes).toEqual(["all"]);
    }
  });

  it("splits preview bodies into intro and paragraphs", () => {
    expect(bodyFieldsFromPreview("Only intro")).toEqual({
      intro: "Only intro",
      body_paragraphs: [],
    });
    expect(bodyFieldsFromPreview("Intro line.\n\nMore detail.\n\nCTA note.")).toEqual({
      intro: "Intro line.",
      body_paragraphs: ["More detail.", "CTA note."],
    });
  });
});
