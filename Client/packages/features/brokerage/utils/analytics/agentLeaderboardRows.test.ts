import { describe, expect, it } from "vitest";

import type { BrokerageAnalyticsAgent } from "packages/features/brokerage/types/analytics";

import { buildAgentLeaderboardRows } from "./agentLeaderboardRows";

function agent(
  partial: Pick<BrokerageAnalyticsAgent, "id" | "name" | "closings" | "gci"> &
    Partial<BrokerageAnalyticsAgent>
): BrokerageAnalyticsAgent {
  return {
    office: "East Office",
    team: "Team A",
    activeClients: 1,
    volumeDollars: 100_000,
    momentum90dPercent: 0,
    stall: null,
    status: "healthy",
    ...partial,
  };
}

describe("buildAgentLeaderboardRows", () => {
  const agents = [
    agent({ id: "AGT-1", name: "Alpha", closings: 5, gci: 10_000 }),
    agent({ id: "AGT-2", name: "Beta", closings: 8, gci: 20_000 }),
    agent({ id: "AGT-3", name: "Gamma", closings: 3, gci: 5_000 }),
  ];

  const ancillary = [
    {
      agent_id: "AGT-1",
      title_attach: 20,
      lending_attach: 15,
      total_leakage_dollars: 4_000,
    },
    {
      agent_id: "AGT-3",
      title_attach: 10,
      lending_attach: 8,
      total_leakage_dollars: 9_000,
    },
  ];

  it("joins ancillary metrics by agent_id and nulls missing rows", () => {
    const rows = buildAgentLeaderboardRows(agents, ancillary, "closings");
    const byId = Object.fromEntries(rows.map((r) => [r.id, r]));

    expect(byId["AGT-1"]?.titleAttach).toBe(20);
    expect(byId["AGT-1"]?.lendingAttach).toBe(15);
    expect(byId["AGT-1"]?.totalOpportunityDollars).toBe(4_000);

    expect(byId["AGT-2"]?.titleAttach).toBeNull();
    expect(byId["AGT-2"]?.lendingAttach).toBeNull();
    expect(byId["AGT-2"]?.totalOpportunityDollars).toBeNull();

    expect(byId["AGT-3"]?.totalOpportunityDollars).toBe(9_000);
  });

  it("sorts by closings then gci by default", () => {
    const rows = buildAgentLeaderboardRows(agents, ancillary, "closings");
    expect(rows.map((r) => r.id)).toEqual(["AGT-2", "AGT-1", "AGT-3"]);
  });

  it("sorts by opportunity with missing opportunity last", () => {
    const rows = buildAgentLeaderboardRows(agents, ancillary, "opportunity");
    expect(rows.map((r) => r.id)).toEqual(["AGT-3", "AGT-1", "AGT-2"]);
  });
});
