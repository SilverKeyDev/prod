import { describe, expect, it } from "vitest";

import type { SampleEmail } from "packages/features/brokerage/utils/campaigns/campaignFixtureBuilders";
import { CAMPAIGN_CATEGORIES_FIXTURE } from "packages/features/brokerage/utils/campaigns/campaignFixtures";
import { buildVariantRateComparisonSeries } from "packages/features/brokerage/utils/campaigns/campaignVariantRateComparison";

function stubEmail(variantKey: string, weeks: SampleEmail["performance_weekly"]): SampleEmail {
  return {
    id: `stub-${variantKey}`,
    variant_key: variantKey,
    subject: `Subject ${variantKey}`,
    preview_body: "Preview",
    headline: `Subject ${variantKey}`,
    intro: "Intro",
    body_paragraphs: ["Body"],
    cta_label: "Book",
    funnel: { sent: 100, opened: 40, clicked: 10, attached: 5 },
    is_winner: false,
    performance_weekly: weeks,
  };
}

describe("buildVariantRateComparisonSeries", () => {
  it("returns empty labels and series for no emails", () => {
    expect(buildVariantRateComparisonSeries([], "attach")).toEqual({
      labels: [],
      series: [],
      liftVsControlPp: null,
      winnerName: null,
    });
  });

  it("builds one series per variant with week labels and attach values", () => {
    const emails = [
      stubEmail("A", [
        { week: 1, open_rate_percent: 40, click_rate_percent: 8, attach_rate_percent: 10 },
        { week: 2, open_rate_percent: 42, click_rate_percent: 9, attach_rate_percent: 12 },
      ]),
      stubEmail("B", [
        { week: 1, open_rate_percent: 41, click_rate_percent: 10, attach_rate_percent: 11 },
        { week: 2, open_rate_percent: 44, click_rate_percent: 12, attach_rate_percent: 14 },
      ]),
    ];

    const result = buildVariantRateComparisonSeries(emails, "attach");

    expect(result.labels).toEqual(["W1", "W2"]);
    expect(result.series).toHaveLength(2);
    expect(result.series[0]).toMatchObject({
      name: "A",
      values: [10, 12],
    });
    expect(result.series[1]).toMatchObject({
      name: "B",
      values: [11, 14],
    });
    expect(result.series[0]?.color).toBeTruthy();
    expect(result.series[1]?.color).toBeTruthy();
    // Non-winners share one muted hue; winners/control get distinct encoding.
    expect(result.series[0]?.color).toBe(result.series[1]?.color);
  });

  it("selects open and click metric fields correctly", () => {
    const emails = [
      stubEmail("A", [
        { week: 1, open_rate_percent: 40, click_rate_percent: 8, attach_rate_percent: 10 },
      ]),
    ];

    expect(buildVariantRateComparisonSeries(emails, "open").series[0]?.values).toEqual([40]);
    expect(buildVariantRateComparisonSeries(emails, "click").series[0]?.values).toEqual([8]);
  });

  it("maps fixture title campaign to treatment + Control series", () => {
    const title = CAMPAIGN_CATEGORIES_FIXTURE.find((c) => c.id === "title_insurance")!;
    const result = buildVariantRateComparisonSeries(title.emails, "attach");

    expect(result.labels).toHaveLength(8);
    expect(result.series.map((s) => s.name)).toEqual(["A", "B", "C", "D", "Control"]);
    for (const series of result.series) {
      expect(series.values).toHaveLength(8);
    }
    const control = result.series.find((s) => s.name === "Control")!;
    const baseline = title.baseline_attach_rate_percent!;
    expect(control.values[0]).toBe(baseline);
    expect(control.values[7]).toBe(baseline);
    for (const value of control.values.slice(1, 7)) {
      expect(Math.abs(value - baseline)).toBeLessThanOrEqual(0.2);
    }
  });

  it("emphasizes winner vs control lift at last week", () => {
    const title = CAMPAIGN_CATEGORIES_FIXTURE.find((c) => c.id === "title_insurance")!;
    const result = buildVariantRateComparisonSeries(title.emails, "attach");
    expect(result.winnerName).toBeTruthy();
    expect(result.liftVsControlPp).not.toBeNull();
    const winner = result.series.find((s) => s.isWinner);
    expect(winner?.lineWidth).toBeGreaterThan(2);
    const control = result.series.find((s) => s.isControl);
    expect(control?.lineType).toBe("dashed");
    expect(winner?.endLabel).toMatch(/B \d/);
    const loser = result.series.find((s) => !s.isWinner && !s.isControl);
    expect(loser?.color).toBe(result.series.find((s) => s.name === "A")?.color);
  });

  it("omits Control from open/click series; keeps it on attach", () => {
    const title = CAMPAIGN_CATEGORIES_FIXTURE.find((c) => c.id === "title_insurance")!;
    const open = buildVariantRateComparisonSeries(title.emails, "open");
    const click = buildVariantRateComparisonSeries(title.emails, "click");
    const attach = buildVariantRateComparisonSeries(title.emails, "attach");
    const baseline = title.baseline_attach_rate_percent!;

    expect(open.series.map((s) => s.name)).toEqual(["A", "B", "C", "D"]);
    expect(click.series.map((s) => s.name)).toEqual(["A", "B", "C", "D"]);
    expect(open.liftVsControlPp).toBeNull();
    expect(click.liftVsControlPp).toBeNull();
    expect(attach.series.map((s) => s.name)).toEqual(["A", "B", "C", "D", "Control"]);
    const control = attach.series.find((s) => s.isControl)!;
    expect(control.values[0]).toBe(baseline);
    expect(control.values[7]).toBe(baseline);
    for (const value of control.values.slice(1, 7)) {
      expect(Math.abs(value - baseline)).toBeLessThanOrEqual(0.2);
    }
  });

  it("returns empty open/click when only Control is present", () => {
    const title = CAMPAIGN_CATEGORIES_FIXTURE.find((c) => c.id === "title_insurance")!;
    const controlEmail = title.emails.find((e) => e.is_control)!;
    expect(buildVariantRateComparisonSeries([controlEmail], "open")).toEqual({
      labels: [],
      series: [],
      liftVsControlPp: null,
      winnerName: null,
    });
    expect(buildVariantRateComparisonSeries([controlEmail], "click")).toEqual({
      labels: [],
      series: [],
      liftVsControlPp: null,
      winnerName: null,
    });
  });
});
