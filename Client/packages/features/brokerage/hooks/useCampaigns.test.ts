import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useCampaignCategories } from "packages/features/brokerage/hooks/useCampaigns";
import { CAMPAIGN_CATEGORIES_FIXTURE } from "packages/features/brokerage/utils/campaigns/campaignFixtures";

describe("useCampaignCategories", () => {
  it("starts with all fixture categories", () => {
    const { result } = renderHook(() => useCampaignCategories());
    expect(result.current.categories).toHaveLength(CAMPAIGN_CATEGORIES_FIXTURE.length);
    expect(result.current.sectionIds).toContain("transaction_fall_off");
  });

  it("does not duplicate a template that is already active", () => {
    const { result } = renderHook(() => useCampaignCategories());
    let outcome: { added: boolean; categoryId: string } | undefined;
    act(() => {
      outcome = result.current.addTemplateCampaign("title_insurance");
    });
    expect(outcome).toEqual({ added: false, categoryId: "title_insurance" });
    expect(result.current.categories).toHaveLength(CAMPAIGN_CATEGORIES_FIXTURE.length);
    expect(result.current.statusMessage).toBeNull();
  });

  it("adds a custom campaign with a Control holdout and null fees", () => {
    const { result } = renderHook(() => useCampaignCategories());
    let customId = "";
    act(() => {
      customId = result.current.addCustomCampaign("Packet Nudges", "Send forms in 48 hours.");
    });
    expect(customId.startsWith("custom_")).toBe(true);
    expect(result.current.statusMessage).toBe("Campaign added");
    const custom = result.current.categories.find((c) => c.id === customId);
    expect(custom?.label).toBe("Packet Nudges");
    expect(custom?.emails).toHaveLength(1);
    expect(custom?.emails[0]?.is_control).toBe(true);
    expect(custom?.fee_assumption).toBeNull();
  });

  it("adds a variant before Control and keeps Control last", () => {
    const { result } = renderHook(() => useCampaignCategories());
    act(() => {
      result.current.addVariant("title_insurance", {
        subject: "New subject",
        preview_body: "First paragraph.\n\nSecond paragraph.",
        scheduleMode: "now",
        agentTypes: ["medium"],
      });
    });
    const title = result.current.categories.find((c) => c.id === "title_insurance");
    const keys = title?.emails.map((e) => e.variant_key);
    expect(keys?.at(-1)).toBe("Control");
    const added = title?.emails.find((e) => e.subject === "New subject");
    expect(added?.variant_key).toBe("E");
    expect(added?.headline).toBe("New subject");
    expect(added?.intro).toBe("First paragraph.");
    expect(added?.body_paragraphs).toEqual(["Second paragraph."]);
    expect(added?.cta_label).toBe("Book intro");
    expect(added?.performance_weekly).toHaveLength(8);
    expect(added?.performance_weekly[0]?.click_rate_percent).toBeTypeOf("number");
    expect(result.current.statusMessage).toBe("Queued");
  });

  it("removes and re-includes the Control holdout", () => {
    const { result } = renderHook(() => useCampaignCategories());
    expect(
      result.current.categories
        .find((c) => c.id === "title_insurance")
        ?.emails.some((e) => e.is_control)
    ).toBe(true);

    act(() => {
      result.current.removeControl("title_insurance");
    });
    expect(
      result.current.categories
        .find((c) => c.id === "title_insurance")
        ?.emails.some((e) => e.is_control)
    ).toBe(false);
    expect(result.current.statusMessage).toBe("Control group removed");

    act(() => {
      result.current.includeControl("title_insurance");
    });
    const title = result.current.categories.find((c) => c.id === "title_insurance");
    expect(title?.emails.at(-1)?.is_control).toBe(true);
    expect(title?.emails.at(-1)?.variant_key).toBe("Control");
    expect(result.current.statusMessage).toBe("Control group included");
  });

  it("updates an existing variant content fields", () => {
    const { result } = renderHook(() => useCampaignCategories());
    const original = result.current.categories
      .find((c) => c.id === "title_insurance")
      ?.emails.find((e) => e.id === "title-email-a");
    expect(original).toBeTruthy();

    act(() => {
      result.current.updateVariant("title_insurance", "title-email-a", {
        subject: "Updated subject",
        preview_body: "Updated intro.\n\nUpdated detail.",
        bookingLink: "https://calendly.com/demo",
        ctaLabel: "Book now",
      });
    });

    const updated = result.current.categories
      .find((c) => c.id === "title_insurance")
      ?.emails.find((e) => e.id === "title-email-a");
    expect(updated?.subject).toBe("Updated subject");
    expect(updated?.headline).toBe("Updated subject");
    expect(updated?.intro).toBe("Updated intro.");
    expect(updated?.body_paragraphs).toEqual(["Updated detail."]);
    expect(updated?.cta_label).toBe("Book now");
    expect(updated?.booking_link).toBe("https://calendly.com/demo");
    expect(updated?.variant_key).toBe(original?.variant_key);
    expect(updated?.funnel).toEqual(original?.funnel);
    expect(updated?.is_winner).toBe(original?.is_winner);
    expect(result.current.statusMessage).toBe("Variant updated");
  });

  it("updates campaign settings including goals and audience defaults", () => {
    const { result } = renderHook(() => useCampaignCategories());
    let customId = "";
    act(() => {
      customId = result.current.addCustomCampaign("Packet Nudges", "Send forms in 48 hours.");
    });
    const custom = result.current.categories.find((c) => c.id === customId);
    expect(custom?.description).toBe("Send forms in 48 hours.");
    expect(custom?.status).toBe("draft");

    act(() => {
      result.current.updateCampaignSettings(customId as `custom_${string}`, {
        label: "Packet Nudges Pro",
        description: "Updated description",
        status: "running",
        cadence: "biweekly",
        startedAt: "2026-03-01",
        defaultScheduleMode: "later",
        defaultScheduledDate: "2026-03-15",
        defaultScheduledTime: "09:30",
        defaultAgentTypes: ["low_sales", "medium"],
        baseline_attach_rate_percent: 10,
        post_attach_rate_percent: 14,
        fee_assumption: 250,
        dashboard_service: "title",
      });
    });

    const updated = result.current.categories.find((c) => c.id === customId);
    expect(updated?.label).toBe("Packet Nudges Pro");
    expect(updated?.description).toBe("Updated description");
    expect(updated?.status).toBe("running");
    expect(updated?.cadence).toBe("biweekly");
    expect(updated?.startedAt).toBe("2026-03-01");
    expect(updated?.defaultScheduleMode).toBe("later");
    expect(updated?.defaultScheduledDate).toBe("2026-03-15");
    expect(updated?.defaultScheduledTime).toBe("09:30");
    expect(updated?.defaultAgentTypes).toEqual(["low_sales", "medium"]);
    expect(updated?.baseline_attach_rate_percent).toBe(10);
    expect(updated?.post_attach_rate_percent).toBe(14);
    expect(updated?.fee_assumption).toBe(250);
    expect(updated?.dashboard_service).toBe("title");
    expect(result.current.statusMessage).toBe("Settings updated");
  });
});
