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
