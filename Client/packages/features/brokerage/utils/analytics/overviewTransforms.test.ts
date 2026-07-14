import { describe, expect, it } from "vitest";

import { selectFunnelBars, selectFunnelConversions } from "./chartSelectors";
import {
  applyOfficeFilterToOverview,
  buildBrokerageAnalyticsData,
  buildOverviewKpiExtras,
  closedSideRatePercent,
  officeClosingsShare,
} from "./overviewTransforms";

describe("selectFunnelConversions", () => {
  it("returns stage-to-stage conversion percents", () => {
    const data = buildBrokerageAnalyticsData("month");
    const chips = selectFunnelConversions(data);
    expect(chips.length).toBe(data.transactionFunnel.length - 1);
    expect(chips[0]?.from).toBe("Search");
    expect(chips[0]?.to).toBe("Tour");
    expect(chips[0]?.conversionPercent).toBe(
      Math.round((data.transactionFunnel[1]!.count / data.transactionFunnel[0]!.count) * 100)
    );
  });

  it("annotates funnel bars with conversion labels after first stage", () => {
    const data = buildBrokerageAnalyticsData("month");
    const bars = selectFunnelBars(data);
    expect(bars[0]?.dataLabel).toBeUndefined();
    expect(bars[1]?.dataLabel).toMatch(/%$/);
  });
});

describe("buildOverviewKpiExtras", () => {
  it("exposes prior volume and sparklines", () => {
    const data = buildBrokerageAnalyticsData("year");
    const extras = buildOverviewKpiExtras(data, "year");
    const closed =
      data.production.volumeByStatus.find((v) => v.status === "closed")?.volumeDollars ?? 0;
    expect(extras.closedVolumePrior).toBeLessThan(closed);
    expect(extras.closingsSparkline.length).toBeGreaterThan(2);
    expect(extras.volumeSparkline.length).toBe(extras.closingsSparkline.length);
  });
});

describe("applyOfficeFilterToOverview", () => {
  it("scopes production KPIs to the selected office rollup", () => {
    const all = buildBrokerageAnalyticsData("month");
    const office = all.production.officeRollups[0]!;
    const scoped = applyOfficeFilterToOverview(all, office.office);

    expect(scoped.production.officeRollups).toHaveLength(1);
    expect(scoped.production.officeRollups[0]?.office).toBe(office.office);
    expect(scoped.production.volumeByStatus.find((v) => v.status === "closed")?.volumeDollars).toBe(
      office.volumeClosed
    );
    expect(scoped.overview.closingsThisMonth).toBe(office.closings);
    expect(scoped.overview.closingsThisMonth).toBeLessThan(all.overview.closingsThisMonth);
  });

  it("returns unfiltered data when officeId is null", () => {
    const all = buildBrokerageAnalyticsData("year");
    expect(applyOfficeFilterToOverview(all, null)).toBe(all);
  });
});

describe("officeClosingsShare", () => {
  it("returns 1 for all offices and a fraction for one office", () => {
    const data = buildBrokerageAnalyticsData("month");
    const office = data.production.officeRollups[0]!;
    expect(officeClosingsShare(data.production.officeRollups, null)).toBe(1);
    const share = officeClosingsShare(data.production.officeRollups, office.office);
    expect(share).toBeGreaterThan(0);
    expect(share).toBeLessThan(1);
  });
});

describe("closedSideRatePercent", () => {
  it("reconciles per-side commission vs avg sale near 1.5%", () => {
    const data = buildBrokerageAnalyticsData("month");
    const closed =
      data.production.volumeByStatus.find((v) => v.status === "closed")?.volumeDollars ?? 0;
    const bothSides = closedSideRatePercent(closed, data.production.gci.closed);
    expect(bothSides).toBeGreaterThan(2.8);
    expect(bothSides).toBeLessThan(3.2);
    const perSide =
      (data.production.gci.avgCommissionPerSide / data.production.pricing.avgSalePrice) * 100;
    expect(perSide).toBeGreaterThan(1.4);
    expect(perSide).toBeLessThan(1.7);
  });
});
