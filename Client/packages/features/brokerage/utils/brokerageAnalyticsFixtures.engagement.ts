/**
 * Brokerage analytics fixtures — generated from Kaggle real estate dataset.
 * Source: 50,122 real transactions across 500 agents, 50 offices.
 */

export const BROKERAGE_TARGETED_ENGAGEMENT_FIXTURE = {
  success: true,
  brokerage_org_id: "demo-brokerage-org-id",
  date_from: "2025-07-01T00:00:00+00:00",
  date_to: "2025-12-31T00:00:00+00:00",
  summary: {
    total_agents_analyzed: 8,
    agents_flagged: 4,
    estimated_recoverable_dollars: 726215,
  },
  flagged_agents: [
    {
      agent_id: "agent-27",
      name: "Dean Houston",
      office: "Nelson-Hardin Realty",
      total_transactions: 137,
      attach_rates: { title: 49, lending: 62, escrow: 56, home_warranty: 50 },
      quartile: "bottom",
      service_gaps: ["home_warranty"],
      estimated_leakage_dollars: 86500,
      suggested_action: "Low title attach — intro call with title rep",
      priority: "high" as const,
    },
    {
      agent_id: "agent-337",
      name: "Nicole Michael",
      office: "Banks Inc Realty",
      total_transactions: 128,
      attach_rates: { title: 59, lending: 32, escrow: 66, home_warranty: 20 },
      quartile: "bottom",
      service_gaps: ["lending", "home_warranty"],
      estimated_leakage_dollars: 113000,
      suggested_action: "Low lending attach — share preferred lender program",
      priority: "high" as const,
    },
    {
      agent_id: "agent-6",
      name: "Mark Parker PhD",
      office: "Williams Ltd Realty",
      total_transactions: 126,
      attach_rates: { title: 72, lending: 60, escrow: 39, home_warranty: 38 },
      quartile: "bottom",
      service_gaps: ["home_warranty"],
      estimated_leakage_dollars: 67500,
      suggested_action: "Low title attach — intro call with title rep",
      priority: "high" as const,
    },
    {
      agent_id: "agent-226",
      name: "Amber Edwards",
      office: "Morris, Wells and Payne Realty",
      total_transactions: 126,
      attach_rates: { title: 72, lending: 45, escrow: 39, home_warranty: 33 },
      quartile: "bottom",
      service_gaps: ["home_warranty"],
      estimated_leakage_dollars: 86500,
      suggested_action: "Low title attach — intro call with title rep",
      priority: "high" as const,
    },
  ],
  by_office: [
    { office: "Nelson-Hardin Realty", agents_flagged: 2, estimated_leakage_dollars: 180000 },
    { office: "Banks Inc Realty", agents_flagged: 1, estimated_leakage_dollars: 95000 },
  ],
  by_service_gap: [
    { service: "lending", agents_with_gap: 3 },
    { service: "home_warranty", agents_with_gap: 3 },
    { service: "title", agents_with_gap: 2 },
    { service: "escrow", agents_with_gap: 1 },
  ],
};

export type BrokerageTargetedEngagementFixture = typeof BROKERAGE_TARGETED_ENGAGEMENT_FIXTURE;
