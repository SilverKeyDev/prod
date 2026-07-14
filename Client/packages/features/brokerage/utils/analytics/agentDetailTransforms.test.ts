import { describe, expect, it } from "vitest";

import { buildAgentDetailView } from "./agentDetailTransforms";

const PRIMARY_AGENT_ID = "AGT-0372"; // Brittney Collins — in engagement + ancillary + forensics
const ANCILLARY_ONLY_AGENT_ID = "AGT-0341"; // Robert Tate — ancillary/forensics, not engagement
const NO_COACHING_AGENT_ID = "AGT-0001"; // Beverly Hughes — roster only

describe("buildAgentDetailView", () => {
  it("returns null for unknown agent", () => {
    expect(buildAgentDetailView("unknown-agent")).toBeNull();
  });

  it("builds complete view for known agent", () => {
    const view = buildAgentDetailView(PRIMARY_AGENT_ID);
    expect(view).not.toBeNull();
    expect(view?.agent.name).toBe("Brittney Collins");
    expect(view?.agent.id).toBe(PRIMARY_AGENT_ID);
  });

  it("computes KPIs correctly", () => {
    const view = buildAgentDetailView(PRIMARY_AGENT_ID);
    expect(view?.kpis.totalClosings).toBe(4);
    expect(view?.kpis.totalVolume).toBe(682_843);
    expect(view?.kpis.totalGci).toBe(25_249);
    expect(view?.kpis.activeClients).toBe(11);
    expect(view?.kpis.momentum90d).toBe(78.1);
    expect(view?.kpis.stallStage).toBeNull();
  });

  it("joins ancillary opportunity data when available", () => {
    const view = buildAgentDetailView(PRIMARY_AGENT_ID);
    expect(view?.leakageAgent).not.toBeNull();
    expect(view?.leakageAgent?.name).toBe("Brittney Collins");
    // Above industry high on title + lending → $0 gap-to-high opportunity
    expect(view?.leakageAgent?.total_leakage_dollars).toBe(0);
    expect(view?.kpis.estimatedLeakage).toBe(0);
  });

  it("joins forensics data when available", () => {
    const view = buildAgentDetailView(PRIMARY_AGENT_ID);
    expect(view?.forensicsAgent).not.toBeNull();
    expect(view?.forensicsAgent?.fall_through_rate_percent).toBe(4.0);
    expect(view?.kpis.fallThroughRate).toBe(4.0);
  });

  it("joins retention data when available", () => {
    const view = buildAgentDetailView(PRIMARY_AGENT_ID);
    expect(view?.retentionAgent).not.toBeNull();
    expect(view?.retentionAgent?.risk_score).toBeDefined();
    expect(view?.retentionAgent?.factor_scores).toBeDefined();
    expect(view?.retentionAgent?.factor_scores.compensation).toBeGreaterThan(0);
  });

  it("joins engagement data when flagged", () => {
    const view = buildAgentDetailView(PRIMARY_AGENT_ID);
    expect(view?.engagementAgent).not.toBeNull();
    expect(view?.engagementAgent?.priority).toBe("high");
  });

  it("generates deterministic production series", () => {
    const view1 = buildAgentDetailView(PRIMARY_AGENT_ID);
    const view2 = buildAgentDetailView(PRIMARY_AGENT_ID);

    expect(view1?.productionSeries).toEqual(view2?.productionSeries);
    expect(view1?.productionSeries).toHaveLength(2);
    expect(view1?.productionSeries[0].name).toBe("Brittney Collins");
    expect(view1?.productionSeries[1].name).toBe("Brokerage Average");
    expect(view1?.productionSeries[0].values).toHaveLength(12);
  });

  it("computes peer benchmarks", () => {
    const view = buildAgentDetailView(PRIMARY_AGENT_ID);
    expect(view?.peerBenchmarks.closings.agent).toBe(4);
    expect(view?.peerBenchmarks.closings.brokerageAvg).toBeGreaterThan(0);
    expect(view?.peerBenchmarks.volume.agent).toBe(682_843);
    expect(view?.peerBenchmarks.gci.agent).toBe(25_249);
    expect(view?.peerBenchmarks.fallThroughRate.agent).toBe(4.0);
  });

  it("builds ancillary attach data with engagement priority", () => {
    const view = buildAgentDetailView(PRIMARY_AGENT_ID);
    expect(view?.ancillaryAttach.services).toHaveLength(4);
    expect(view?.ancillaryAttach.services[0].service).toBe("Title");
    expect(view?.ancillaryAttach.services[0].agentRate).toBe(22);
    expect(view?.ancillaryAttach.services[0].brokerageAvg).toBe(15);
    expect(view?.ancillaryAttach.totalLeakage).toBe(0);
  });

  it("falls back to ancillary data when engagement not available", () => {
    const view = buildAgentDetailView(ANCILLARY_ONLY_AGENT_ID);
    expect(view?.engagementAgent).toBeNull();
    expect(view?.ancillaryAttach.services).toHaveLength(2);
    expect(view?.ancillaryAttach.services.find((s) => s.service === "Title")).toBeDefined();
    expect(view?.ancillaryAttach.services.find((s) => s.service === "Lending")).toBeDefined();
  });

  it("builds forensics data", () => {
    const view = buildAgentDetailView(PRIMARY_AGENT_ID);
    expect(view?.forensicsData.fallThroughRate).toBe(4.0);
    expect(view?.forensicsData.cancelled).toBe(1);
    expect(view?.forensicsData.totalDeals).toBe(25);
    expect(view?.forensicsData.failureStages.length).toBeGreaterThan(0);
    expect(view?.forensicsData.failureStages[0].stage).toBe("Inspection");
  });

  it("handles agents with no ancillary/forensics data gracefully", () => {
    const view = buildAgentDetailView(NO_COACHING_AGENT_ID);
    expect(view).not.toBeNull();
    expect(view?.leakageAgent).toBeNull();
    expect(view?.forensicsAgent).toBeNull();
    expect(view?.kpis.estimatedLeakage).toBeNull();
    expect(view?.kpis.fallThroughRate).toBeNull();
  });

  it("ensures production series values are positive", () => {
    const view = buildAgentDetailView(PRIMARY_AGENT_ID);
    const allValues = view?.productionSeries.flatMap((s) => s.values) ?? [];
    expect(allValues.every((v) => v >= 1)).toBe(true);
  });
});
