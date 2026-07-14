/**
 * Brokerage analytics fixtures: targeted agent engagement (leakage coaching).
 * Agent transaction counts aligned with BROKERAGE_AGENTS_FIXTURE.closings (monthly).
 * Leakage dollars are monthly baselines (scale with PERIOD_SCALE in transforms).
 */

export const BROKERAGE_TARGETED_ENGAGEMENT_FIXTURE = {
  success: true,
  brokerage_org_id: "demo-brokerage-org-id",
  date_from: "2025-07-01T00:00:00+00:00",
  date_to: "2025-12-31T00:00:00+00:00",
  summary: {
    total_agents_analyzed: 8,
    agents_flagged: 4,
    estimated_recoverable_dollars: 5_727,
  },
  flagged_agents: [
    {
      agent_id: "AGT-0460",
      name: "Robin Pittman",
      office: "Downtown Office",
      total_transactions: 4,
      attach_rates: { title: 11, lending: 9, escrow: 14, home_warranty: 12 },
      quartile: "bottom",
      service_gaps: ["title", "lending", "home_warranty"],
      estimated_leakage_dollars: 1_554,
      suggested_action: "Low title attach: intro call with title rep",
      priority: "high" as const,
    },
    {
      agent_id: "AGT-0343",
      name: "Kristina Alexander",
      office: "East Office",
      total_transactions: 4,
      attach_rates: { title: 10, lending: 8, escrow: 12, home_warranty: 9 },
      quartile: "bottom",
      service_gaps: ["lending", "home_warranty"],
      estimated_leakage_dollars: 1_538,
      suggested_action: "Low lending attach: share preferred lender program",
      priority: "high" as const,
    },
    {
      agent_id: "AGT-0372",
      name: "Brittney Collins",
      office: "North Office",
      total_transactions: 4,
      // Stronger mortgage attach (good band) but still gaps vs brokerage average on warranty
      attach_rates: { title: 22, lending: 27, escrow: 16, home_warranty: 11 },
      quartile: "bottom",
      service_gaps: ["home_warranty"],
      estimated_leakage_dollars: 1_225,
      suggested_action: "Low warranty attach: add pre-offer warranty script",
      priority: "high" as const,
    },
    {
      agent_id: "AGT-0276",
      name: "John Martin",
      office: "West Office",
      total_transactions: 4,
      attach_rates: { title: 13, lending: 12, escrow: 15, home_warranty: 10 },
      quartile: "bottom",
      service_gaps: ["home_warranty", "title"],
      estimated_leakage_dollars: 1_410,
      suggested_action: "Low title attach: intro call with title rep",
      priority: "high" as const,
    },
  ],
  by_office: [
    { office: "Downtown Office", agents_flagged: 1, estimated_leakage_dollars: 1_554 },
    { office: "East Office", agents_flagged: 1, estimated_leakage_dollars: 1_538 },
    { office: "North Office", agents_flagged: 1, estimated_leakage_dollars: 1_225 },
    { office: "West Office", agents_flagged: 1, estimated_leakage_dollars: 1_410 },
  ],
  by_service_gap: [
    { service: "home_warranty", agents_with_gap: 4 },
    { service: "title", agents_with_gap: 2 },
    { service: "lending", agents_with_gap: 2 },
    { service: "escrow", agents_with_gap: 1 },
  ],
};

export type BrokerageTargetedEngagementFixture = typeof BROKERAGE_TARGETED_ENGAGEMENT_FIXTURE;
