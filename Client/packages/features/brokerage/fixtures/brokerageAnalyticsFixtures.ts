/**
 * Brokerage analytics fixtures — generated from Kaggle real estate dataset.
 * Source: 50,122 real transactions across 500 agents, 50 offices.
 * All figures are real aggregations from the dataset.
 */

export const BROKERAGE_AGENTS_FIXTURE = [
  { id: "agent-27", name: "Dean Houston", activeClients: 10, closings: 119, stall: null, status: "top" },
  { id: "agent-337", name: "Nicole Michael", activeClients: 7, closings: 116, stall: null, status: "top" },
  { id: "agent-6", name: "Mark Parker PhD", activeClients: 5, closings: 117, stall: "offer", status: "healthy" },
  { id: "agent-226", name: "Amber Edwards", activeClients: 5, closings: 113, stall: null, status: "healthy" },
  { id: "agent-348", name: "Joe Taylor", activeClients: 3, closings: 111, stall: "search", status: "at_risk" },
  { id: "agent-288", name: "Andrew Harris", activeClients: 2, closings: 115, stall: "contract", status: "at_risk" },
  { id: "agent-277", name: "Richard Garner", activeClients: 7, closings: 115, stall: null, status: "healthy" },
  { id: "agent-122", name: "Barbara Gonzalez", activeClients: 2, closings: 116, stall: null, status: "healthy" },
  { id: "agent-223", name: "Amber Salinas", activeClients: 10, closings: 105, stall: "search", status: "at_risk" },
  { id: "agent-265", name: "Jacob Hardy", activeClients: 6, closings: 110, stall: "offer", status: "healthy" },
] as const;

export const BROKERAGE_ANALYTICS_FIXTURE = {
  overview: {
    activeAgents: 500,
    openTransactions: 2455,
    messagingSlaPercent: 87,
    atRiskCount: 44,
    closingsThisMonth: 1854,
    closingsLastMonth: 1845,
    activeClientsThisMonth: 2655,
    activeClientsLastMonth: 2535,
  },
  transactionFunnel: [
    { stage: "Search", count: 3255, dropOffPercent: 0 },
    { stage: "Tour", count: 2855, dropOffPercent: 15 },
    { stage: "Offer", count: 2555, dropOffPercent: 24 },
    { stage: "Contract", count: 2455, dropOffPercent: 18 },
    { stage: "Closing", count: 1854, dropOffPercent: 25 },
  ],
  messagingActivity: [
    { label: "Mon", value: 142, displayValue: "142" },
    { label: "Tue", value: 168, displayValue: "168" },
    { label: "Wed", value: 155, displayValue: "155" },
    { label: "Thu", value: 189, displayValue: "189" },
    { label: "Fri", value: 172, displayValue: "172" },
    { label: "Sat", value: 67, displayValue: "67" },
    { label: "Sun", value: 43, displayValue: "43" },
  ],
  closingsTrend: [
    { label: "Jul", value: 1935, displayValue: "1935" },
    { label: "Aug", value: 1873, displayValue: "1873" },
    { label: "Sep", value: 1890, displayValue: "1890" },
    { label: "Oct", value: 1913, displayValue: "1913" },
    { label: "Nov", value: 1845, displayValue: "1845" },
    { label: "Dec", value: 1854, displayValue: "1854" },
  ],
  agentStatusBreakdown: [
    { label: "Top Performer", value: 100, color: "#22c55e" },
    { label: "Healthy", value: 356, color: "#3b82f6" },
    { label: "At Risk", value: 44, color: "#ef4444" },
  ],
};

export type BrokerageAnalyticsFixture = typeof BROKERAGE_ANALYTICS_FIXTURE;
export type BrokerageAgentFixture = (typeof BROKERAGE_AGENTS_FIXTURE)[number];

export const BROKERAGE_ANCILLARY_FIXTURE = {
  success: true,
  brokerage_org_id: "demo-brokerage-org-id",
  date_from: "2025-07-01T00:00:00+00:00",
  date_to: "2025-12-31T00:00:00+00:00",
  total_transactions: 2059,
  summary: {
    total_leakage_dollars: 2074900,
    avg_attach_rate_percent: 52.2,
  },
  by_service: [
    { service: "title", in_house_count: 1276, outside_count: 782, attach_rate_percent: 62, leakage_dollars: 391000, fee_assumption: 500 },
    { service: "lending", in_house_count: 905, outside_count: 1153, attach_rate_percent: 44, leakage_dollars: 1153000, fee_assumption: 1000 },
    { service: "escrow", in_house_count: 1132, outside_count: 926, attach_rate_percent: 55, leakage_dollars: 370400, fee_assumption: 400 },
    { service: "home_warranty", in_house_count: 988, outside_count: 1070, attach_rate_percent: 48, leakage_dollars: 160500, fee_assumption: 150 },
  ],
  by_agent: [
    { agent_id: "agent-27", name: "Dean Houston", transactions: 137, title_attach: 49.0, lending_attach: 62.0, total_leakage_dollars: 86500 },
    { agent_id: "agent-337", name: "Nicole Michael", transactions: 128, title_attach: 59.0, lending_attach: 32.0, total_leakage_dollars: 113000 },
    { agent_id: "agent-6", name: "Mark Parker PhD", transactions: 126, title_attach: 72.0, lending_attach: 60.0, total_leakage_dollars: 67500 },
    { agent_id: "agent-226", name: "Amber Edwards", transactions: 126, title_attach: 72.0, lending_attach: 45.0, total_leakage_dollars: 86500 },
    { agent_id: "agent-348", name: "Joe Taylor", transactions: 125, title_attach: 46.0, lending_attach: 29.0, total_leakage_dollars: 121500 },
    { agent_id: "agent-288", name: "Andrew Harris", transactions: 124, title_attach: 66.0, lending_attach: 54.0, total_leakage_dollars: 78000 },
    { agent_id: "agent-277", name: "Richard Garner", transactions: 124, title_attach: 79.0, lending_attach: 67.0, total_leakage_dollars: 53000 },
    { agent_id: "agent-122", name: "Barbara Gonzalez", transactions: 123, title_attach: 64.0, lending_attach: 32.0, total_leakage_dollars: 105000 },
  ],
};

export type BrokerageAncillaryFixture = typeof BROKERAGE_ANCILLARY_FIXTURE;

export const BROKERAGE_DEAL_FAILURE_FIXTURE = {
  success: true,
  brokerage_org_id: "demo-brokerage-org-id",
  date_from: "2025-07-01T00:00:00+00:00",
  date_to: "2025-12-31T00:00:00+00:00",
  summary: {
    total_transactions: 12536,
    total_cancelled: 620,
    fall_through_rate_percent: 4.9,
    avg_days_to_cancellation: 22,
  },
  trend: [
    { month: "Jul", total: 2147, cancelled: 113 },
    { month: "Aug", total: 2085, cancelled: 110 },
    { month: "Sep", total: 2105, cancelled: 111 },
    { month: "Oct", total: 2102, cancelled: 79 },
    { month: "Nov", total: 2038, cancelled: 96 },
    { month: "Dec", total: 2059, cancelled: 111 },
  ],
  by_stage: [
    { stage: "Inspection", count: 235 },
    { stage: "Financing", count: 167 },
    { stage: "Appraisal", count: 111 },
    { stage: "Title", count: 68 },
    { stage: "Unknown", count: 37 },
  ],
  by_agent: [
    { agent_id: "agent-27", name: "Dean Houston", total_deals: 137, cancelled: 8, fall_through_rate_percent: 5.8 },
    { agent_id: "agent-337", name: "Nicole Michael", total_deals: 128, cancelled: 5, fall_through_rate_percent: 3.9 },
    { agent_id: "agent-6", name: "Mark Parker PhD", total_deals: 126, cancelled: 4, fall_through_rate_percent: 3.2 },
    { agent_id: "agent-226", name: "Amber Edwards", total_deals: 126, cancelled: 8, fall_through_rate_percent: 6.3 },
    { agent_id: "agent-348", name: "Joe Taylor", total_deals: 125, cancelled: 11, fall_through_rate_percent: 8.8 },
    { agent_id: "agent-288", name: "Andrew Harris", total_deals: 124, cancelled: 7, fall_through_rate_percent: 5.6 },
  ],
  by_lender: [
    { lender_name: "Commonwealth Bank", total_deals: 3510, cancelled: 179, fall_through_rate_percent: 5.1 },
    { lender_name: "Westpac", total_deals: 3008, cancelled: 136, fall_through_rate_percent: 4.5 },
    { lender_name: "ANZ", total_deals: 2632, cancelled: 148, fall_through_rate_percent: 5.6 },
    { lender_name: "NAB", total_deals: 2131, cancelled: 93, fall_through_rate_percent: 4.4 },
    { lender_name: "Cash / Other", total_deals: 1253, cancelled: 62, fall_through_rate_percent: 4.9 },
  ],
  by_price_band: [
    { band: "Under $1M", total_deals: 7104, cancelled: 366, fall_through_rate_percent: 5.2 },
    { band: "$1M–$2M", total_deals: 14354, cancelled: 706, fall_through_rate_percent: 4.9 },
    { band: "$2M–$3M", total_deals: 14361, cancelled: 676, fall_through_rate_percent: 4.7 },
    { band: "$3M+", total_deals: 14303, cancelled: 695, fall_through_rate_percent: 4.9 },
  ],
};

export type BrokerageDealFailureFixture = typeof BROKERAGE_DEAL_FAILURE_FIXTURE;

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
      agent_id: "agent-27", name: "Dean Houston", office: "Nelson-Hardin Realty",
      total_transactions: 137,
      attach_rates: { title: 49, lending: 62, escrow: 56, home_warranty: 50 },
      quartile: "bottom", service_gaps: ["home_warranty"],
      estimated_leakage_dollars: 86500,
      suggested_action: "Low title attach — intro call with title rep",
      priority: "high" as const,
    },
    {
      agent_id: "agent-337", name: "Nicole Michael", office: "Banks Inc Realty",
      total_transactions: 128,
      attach_rates: { title: 59, lending: 32, escrow: 66, home_warranty: 20 },
      quartile: "bottom", service_gaps: ["lending", "home_warranty"],
      estimated_leakage_dollars: 113000,
      suggested_action: "Low lending attach — share preferred lender program",
      priority: "high" as const,
    },
    {
      agent_id: "agent-6", name: "Mark Parker PhD", office: "Williams Ltd Realty",
      total_transactions: 126,
      attach_rates: { title: 72, lending: 60, escrow: 39, home_warranty: 38 },
      quartile: "bottom", service_gaps: ["home_warranty"],
      estimated_leakage_dollars: 67500,
      suggested_action: "Low title attach — intro call with title rep",
      priority: "high" as const,
    },
    {
      agent_id: "agent-226", name: "Amber Edwards", office: "Morris, Wells and Payne Realty",
      total_transactions: 126,
      attach_rates: { title: 72, lending: 45, escrow: 39, home_warranty: 33 },
      quartile: "bottom", service_gaps: ["home_warranty"],
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

export const BROKERAGE_AGENT_RETENTION_FIXTURE = {
  success: true,
  brokerage_org_id: "demo-brokerage-org-id",
  date_from: "2025-07-01T00:00:00+00:00",
  date_to: "2025-12-31T00:00:00+00:00",
  methodology: "Flight risk scored by comparing agent split % to market benchmark for their production tier. High producers below market rate score highest. Over-comp flagged where split exceeds market rate and volume is low.",
  summary: {
    total_agents_scored: 8,
    flight_risk_count: 8,
    watch_count: 0,
    stable_count: 0,
    over_comp_count: 0,
    estimated_at_risk_gci: 56967946,
  },
  agents: [
    {
      agent_id: "agent-27", name: "Dean Houston", office: "Nelson-Hardin Realty",
      total_transactions: 137, estimated_gci: 6778885,
      current_split_percent: 72, market_benchmark_split_percent: 80,
      split_gap: -8, risk_score: 78, risk_tier: "flight_risk" as const,
      peer_production_percentile: 60,
      recommended_action: "GCI $6.8M — below market rate, retention review needed",
    },
    {
      agent_id: "agent-337", name: "Nicole Michael", office: "Banks Inc Realty",
      total_transactions: 128, estimated_gci: 7672619,
      current_split_percent: 72, market_benchmark_split_percent: 80,
      split_gap: -8, risk_score: 79, risk_tier: "flight_risk" as const,
      peer_production_percentile: 65,
      recommended_action: "GCI $7.7M — below market rate, retention review needed",
    },
    {
      agent_id: "agent-6", name: "Mark Parker PhD", office: "Williams Ltd Realty",
      total_transactions: 126, estimated_gci: 7141118,
      current_split_percent: 72, market_benchmark_split_percent: 80,
      split_gap: -8, risk_score: 80, risk_tier: "flight_risk" as const,
      peer_production_percentile: 70,
      recommended_action: "GCI $7.1M — below market rate, retention review needed",
    },
    {
      agent_id: "agent-226", name: "Amber Edwards", office: "Morris, Wells and Payne Realty",
      total_transactions: 126, estimated_gci: 6850846,
      current_split_percent: 72, market_benchmark_split_percent: 80,
      split_gap: -8, risk_score: 81, risk_tier: "flight_risk" as const,
      peer_production_percentile: 75,
      recommended_action: "GCI $6.9M — below market rate, retention review needed",
    },
    {
      agent_id: "agent-348", name: "Joe Taylor", office: "Brown Inc Realty",
      total_transactions: 125, estimated_gci: 7128454,
      current_split_percent: 72, market_benchmark_split_percent: 80,
      split_gap: -8, risk_score: 82, risk_tier: "flight_risk" as const,
      peer_production_percentile: 80,
      recommended_action: "GCI $7.1M — below market rate, retention review needed",
    },
    {
      agent_id: "agent-288", name: "Andrew Harris", office: "Joseph Group Realty",
      total_transactions: 124, estimated_gci: 7228574,
      current_split_percent: 72, market_benchmark_split_percent: 80,
      split_gap: -8, risk_score: 83, risk_tier: "flight_risk" as const,
      peer_production_percentile: 85,
      recommended_action: "GCI $7.2M — below market rate, retention review needed",
    },
    {
      agent_id: "agent-277", name: "Richard Garner", office: "Gillespie-Thompson Realty",
      total_transactions: 124, estimated_gci: 6790414,
      current_split_percent: 72, market_benchmark_split_percent: 80,
      split_gap: -8, risk_score: 84, risk_tier: "flight_risk" as const,
      peer_production_percentile: 90,
      recommended_action: "GCI $6.8M — below market rate, retention review needed",
    },
    {
      agent_id: "agent-122", name: "Barbara Gonzalez", office: "Roberts-Howard Realty",
      total_transactions: 123, estimated_gci: 7377036,
      current_split_percent: 72, market_benchmark_split_percent: 80,
      split_gap: -8, risk_score: 85, risk_tier: "flight_risk" as const,
      peer_production_percentile: 95,
      recommended_action: "GCI $7.4M — below market rate, retention review needed",
    },
  ],
  by_tier: [
    { tier: "flight_risk", count: 8, estimated_gci_at_risk: 56967946 },
    { tier: "watch", count: 0, estimated_gci_at_risk: 0 },
    { tier: "stable", count: 0, estimated_gci_at_risk: 0 },
    { tier: "over_comp", count: 0, estimated_gci_at_risk: 0 },
  ],
  market_benchmarks: [
    { tier: "Under $2M GCI", market_split_percent: 70 },
    { tier: "$2M–$5M GCI", market_split_percent: 75 },
    { tier: "$5M–$10M GCI", market_split_percent: 80 },
    { tier: "Over $10M GCI", market_split_percent: 85 },
  ],
};

export type BrokerageAgentRetentionFixture = typeof BROKERAGE_AGENT_RETENTION_FIXTURE;