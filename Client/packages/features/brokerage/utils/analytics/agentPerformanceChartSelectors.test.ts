import { describe, expect, it } from "vitest";

import { buildBrokerageAgents } from "packages/features/brokerage/utils/analytics/overviewTransforms";
import { BROKERAGE_AGENTS_FIXTURE } from "packages/features/brokerage/utils/brokerageAnalyticsFixtures";

import {
  annualizeClosings,
  selectAgentClosingsDensity,
  selectAgentStatusDonut,
  selectBrokerageClosingsTrend,
  selectTopAgentsByClosings,
  selectTopAgentsByGciBars,
} from "./agentPerformanceChartSelectors";

describe("agentPerformanceChartSelectors", () => {
  const agents = buildBrokerageAgents("month");

  it("builds status donut from full roster", () => {
    const donut = selectAgentStatusDonut(agents);
    expect(donut).toHaveLength(3);
    expect(donut.reduce((s, d) => s + d.value, 0)).toBe(BROKERAGE_AGENTS_FIXTURE.length);
    expect(donut.find((d) => d.label === "Top Performer")?.value).toBe(
      BROKERAGE_AGENTS_FIXTURE.filter((a) => a.status === "top").length
    );
  });

  it("selects top agents by GCI in thousands", () => {
    const bars = selectTopAgentsByGciBars(agents, 10);
    expect(bars).toHaveLength(10);
    for (let i = 1; i < bars.length; i++) {
      expect(bars[i - 1]!.value).toBeGreaterThanOrEqual(bars[i]!.value);
    }
  });

  it("builds closings trend with period-aware length", () => {
    expect(selectBrokerageClosingsTrend(agents, "week")).toHaveLength(4);
    expect(selectBrokerageClosingsTrend(agents, "month")).toHaveLength(6);
    expect(selectBrokerageClosingsTrend(agents, "year")).toHaveLength(12);
    expect(selectBrokerageClosingsTrend(agents, "all")).toHaveLength(24);
    const year = selectBrokerageClosingsTrend(agents, "year");
    expect(year.every((p) => p.value >= 1)).toBe(true);
  });

  it("selects top 15 closings leaderboard", () => {
    const top = selectTopAgentsByClosings(agents, 15);
    expect(top).toHaveLength(15);
    expect(top[0]?.name).toBe("Kristina Alexander");
    for (let i = 1; i < top.length; i++) {
      const prev = top[i - 1]!;
      const cur = top[i]!;
      expect(prev.closings > cur.closings || prev.gci >= cur.gci).toBe(true);
    }
  });

  it("keeps all-period per-agent closings in a realistic range", () => {
    const allAgents = buildBrokerageAgents("all");
    const maxClosings = Math.max(...allAgents.map((a) => a.closings));
    expect(maxClosings).toBeLessThanOrEqual(120);
    expect(maxClosings).toBeGreaterThan(20);
  });

  it("annualizes closings to a year rate", () => {
    expect(annualizeClosings(1, "month")).toBe(12);
    expect(annualizeClosings(12, "year")).toBe(12);
    expect(annualizeClosings(24, "all")).toBe(12);
    expect(annualizeClosings(2, "month")).toBe(24);
  });

  it("builds a closings density curve peaked toward lower production", () => {
    const monthCurve = selectAgentClosingsDensity(agents, "month");
    expect(monthCurve.length).toBeGreaterThan(10);
    expect(monthCurve[0]?.label).toBe("0");
    expect(monthCurve.every((p) => p.value >= 0)).toBe(true);

    const peak = monthCurve.reduce((best, p) => (p.value > best.value ? p : best));
    expect(Number(peak.label)).toBeLessThanOrEqual(18);

    const yearAgents = buildBrokerageAgents("year");
    const yearCurve = selectAgentClosingsDensity(yearAgents, "year");
    const allAgents = buildBrokerageAgents("all");
    const allCurve = selectAgentClosingsDensity(allAgents, "all");
    expect(yearCurve.map((d) => d.value)).toEqual(monthCurve.map((d) => d.value));
    expect(allCurve.map((d) => d.value)).toEqual(monthCurve.map((d) => d.value));
  });

  it("returns a zero density curve for an empty roster", () => {
    const empty = selectAgentClosingsDensity([], "month");
    expect(empty.every((d) => d.value === 0)).toBe(true);
    expect(empty.length).toBeGreaterThan(10);
  });

  it("respects office-filtered agent subsets on density", () => {
    const office = agents[0]!.office;
    const scoped = agents.filter((a) => a.office === office);
    const full = selectAgentClosingsDensity(agents, "month");
    const scopedCurve = selectAgentClosingsDensity(scoped, "month");
    expect(scoped.length).toBeLessThan(agents.length);
    expect(scopedCurve).toHaveLength(full.length);
    const fullPeak = Math.max(...full.map((p) => p.value));
    const scopedPeak = Math.max(...scopedCurve.map((p) => p.value));
    expect(scopedPeak).toBeLessThan(fullPeak);
  });

  it("places density mass near synthetic low-production agents", () => {
    const base = agents[0]!;
    const synthetic = [
      { ...base, id: "a0", closings: 1 },
      { ...base, id: "a1", closings: 1 },
      { ...base, id: "a2", closings: 1 },
      { ...base, id: "a3", closings: 1 },
      { ...base, id: "a4", closings: 4 },
    ];
    // month ×12 → four agents at 12/yr, one at 48/yr
    const curve = selectAgentClosingsDensity(synthetic, "month");
    const at = (x: number) => curve.find((p) => p.label === String(x))?.value ?? 0;
    expect(at(12)).toBeGreaterThan(at(48));
    const peak = curve.reduce((best, p) => (p.value > best.value ? p : best));
    expect(Number(peak.label)).toBeLessThanOrEqual(18);
  });
});
