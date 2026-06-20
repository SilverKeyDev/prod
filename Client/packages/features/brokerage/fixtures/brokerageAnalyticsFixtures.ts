/**
 * Dummy analytics fixtures for brokerage demo.
 * All data is synthetic — no PII.
 * Swap BROKERAGE_ANALYTICS_FIXTURE for real API response when SIL-202 lands.
 */

export const BROKERAGE_AGENTS_FIXTURE = [
  { id: "a1", name: "Sarah Johnson", activeClients: 8, closings: 3, stall: null, status: "top" },
  {
    id: "a2",
    name: "Marcus Williams",
    activeClients: 5,
    closings: 2,
    stall: "offer",
    status: "healthy",
  },
  { id: "a3", name: "Priya Patel", activeClients: 6, closings: 4, stall: null, status: "top" },
  {
    id: "a4",
    name: "James Chen",
    activeClients: 2,
    closings: 0,
    stall: "search",
    status: "at_risk",
  },
  {
    id: "a5",
    name: "Emily Rodriguez",
    activeClients: 4,
    closings: 1,
    stall: null,
    status: "healthy",
  },
  { id: "a6", name: "David Kim", activeClients: 7, closings: 2, stall: null, status: "healthy" },
  {
    id: "a7",
    name: "Aisha Thompson",
    activeClients: 1,
    closings: 0,
    stall: "search",
    status: "at_risk",
  },
  {
    id: "a8",
    name: "Robert Garcia",
    activeClients: 3,
    closings: 1,
    stall: "contract",
    status: "healthy",
  },
  { id: "a9", name: "Lisa Park", activeClients: 9, closings: 5, stall: null, status: "top" },
  {
    id: "a10",
    name: "Michael Brown",
    activeClients: 2,
    closings: 0,
    stall: "offer",
    status: "at_risk",
  },
] as const;

export const BROKERAGE_ANALYTICS_FIXTURE = {
  overview: {
    activeAgents: 10,
    openTransactions: 47,
    messagingSlaPercent: 82,
    atRiskCount: 3,
    closingsThisMonth: 18,
    closingsLastMonth: 14,
    activeClientsThisMonth: 38,
    activeClientsLastMonth: 31,
  },
  transactionFunnel: [
    { stage: "Search", count: 24, dropOffPercent: 0 },
    { stage: "Tour", count: 18, dropOffPercent: 25 },
    { stage: "Offer", count: 12, dropOffPercent: 33 },
    { stage: "Contract", count: 9, dropOffPercent: 25 },
    { stage: "Closing", count: 7, dropOffPercent: 22 },
  ],
  messagingActivity: [
    { label: "Mon", value: 24, displayValue: "24" },
    { label: "Tue", value: 31, displayValue: "31" },
    { label: "Wed", value: 28, displayValue: "28" },
    { label: "Thu", value: 42, displayValue: "42" },
    { label: "Fri", value: 38, displayValue: "38" },
    { label: "Sat", value: 15, displayValue: "15" },
    { label: "Sun", value: 9, displayValue: "9" },
  ],
  closingsTrend: [
    { label: "Jan", value: 8, displayValue: "8" },
    { label: "Feb", value: 11, displayValue: "11" },
    { label: "Mar", value: 9, displayValue: "9" },
    { label: "Apr", value: 14, displayValue: "14" },
    { label: "May", value: 12, displayValue: "12" },
    { label: "Jun", value: 18, displayValue: "18" },
  ],
  agentStatusBreakdown: [
    { label: "Top Performer", value: 3, color: "#22c55e" },
    { label: "Healthy", value: 4, color: "#3b82f6" },
    { label: "At Risk", value: 3, color: "#ef4444" },
  ],
};

export type BrokerageAnalyticsFixture = typeof BROKERAGE_ANALYTICS_FIXTURE;
export type BrokerageAgentFixture = (typeof BROKERAGE_AGENTS_FIXTURE)[number];

export const BROKERAGE_ANCILLARY_FIXTURE = {
  success: true,
  brokerage_org_id: "demo-brokerage-org-id",
  date_from: "2026-01-01T00:00:00+00:00",
  date_to: "2026-06-30T00:00:00+00:00",
  total_transactions: 72,
  summary: {
    total_leakage_dollars: 156400,
    avg_attach_rate_percent: 54.2,
  },
  by_service: [
    {
      service: "title",
      in_house_count: 45,
      outside_count: 27,
      attach_rate_percent: 62.5,
      leakage_dollars: 13500,
      fee_assumption: 500,
    },
    {
      service: "lending",
      in_house_count: 28,
      outside_count: 44,
      attach_rate_percent: 38.9,
      leakage_dollars: 44000,
      fee_assumption: 1000,
    },
    {
      service: "escrow",
      in_house_count: 38,
      outside_count: 34,
      attach_rate_percent: 52.8,
      leakage_dollars: 13600,
      fee_assumption: 400,
    },
    {
      service: "home_warranty",
      in_house_count: 31,
      outside_count: 41,
      attach_rate_percent: 43.1,
      leakage_dollars: 6150,
      fee_assumption: 150,
    },
  ],
  by_agent: [
    {
      agent_id: "agent-1",
      name: "Sarah Johnson",
      transactions: 12,
      title_attach: 75.0,
      lending_attach: 50.0,
      total_leakage_dollars: 8500,
    },
    {
      agent_id: "agent-2",
      name: "Marcus Williams",
      transactions: 8,
      title_attach: 37.5,
      lending_attach: 25.0,
      total_leakage_dollars: 14200,
    },
    {
      agent_id: "agent-3",
      name: "James Chen",
      transactions: 6,
      title_attach: 16.7,
      lending_attach: 16.7,
      total_leakage_dollars: 18900,
    },
    {
      agent_id: "agent-4",
      name: "Priya Patel",
      transactions: 11,
      title_attach: 81.8,
      lending_attach: 63.6,
      total_leakage_dollars: 4200,
    },
    {
      agent_id: "agent-5",
      name: "David Kim",
      transactions: 9,
      title_attach: 44.4,
      lending_attach: 33.3,
      total_leakage_dollars: 11800,
    },
  ],
};

export type BrokerageAncillaryFixture = typeof BROKERAGE_ANCILLARY_FIXTURE;