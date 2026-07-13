/**
 * Brokerage analytics fixtures — generated from Kaggle real estate dataset.
 * Source: 50,122 real transactions across 500 agents, 50 offices.
 */

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
    {
      agent_id: "agent-27",
      name: "Dean Houston",
      total_deals: 137,
      cancelled: 8,
      fall_through_rate_percent: 5.8,
    },
    {
      agent_id: "agent-337",
      name: "Nicole Michael",
      total_deals: 128,
      cancelled: 5,
      fall_through_rate_percent: 3.9,
    },
    {
      agent_id: "agent-6",
      name: "Mark Parker PhD",
      total_deals: 126,
      cancelled: 4,
      fall_through_rate_percent: 3.2,
    },
    {
      agent_id: "agent-226",
      name: "Amber Edwards",
      total_deals: 126,
      cancelled: 8,
      fall_through_rate_percent: 6.3,
    },
    {
      agent_id: "agent-348",
      name: "Joe Taylor",
      total_deals: 125,
      cancelled: 11,
      fall_through_rate_percent: 8.8,
    },
    {
      agent_id: "agent-288",
      name: "Andrew Harris",
      total_deals: 124,
      cancelled: 7,
      fall_through_rate_percent: 5.6,
    },
  ],
  by_lender: [
    {
      lender_name: "Commonwealth Bank",
      total_deals: 3510,
      cancelled: 179,
      fall_through_rate_percent: 5.1,
    },
    { lender_name: "Westpac", total_deals: 3008, cancelled: 136, fall_through_rate_percent: 4.5 },
    { lender_name: "ANZ", total_deals: 2632, cancelled: 148, fall_through_rate_percent: 5.6 },
    { lender_name: "NAB", total_deals: 2131, cancelled: 93, fall_through_rate_percent: 4.4 },
    {
      lender_name: "Cash / Other",
      total_deals: 1253,
      cancelled: 62,
      fall_through_rate_percent: 4.9,
    },
  ],
  by_price_band: [
    { band: "Under $1M", total_deals: 7104, cancelled: 366, fall_through_rate_percent: 5.2 },
    { band: "$1M–$2M", total_deals: 14354, cancelled: 706, fall_through_rate_percent: 4.9 },
    { band: "$2M–$3M", total_deals: 14361, cancelled: 676, fall_through_rate_percent: 4.7 },
    { band: "$3M+", total_deals: 14303, cancelled: 695, fall_through_rate_percent: 4.9 },
  ],
  cycleTime: {
    avgContractToCloseDays: 38,
    medianContractToCloseDays: 34,
    timeInMilestone: [
      { stage: "Inspection", avgDays: 9 },
      { stage: "Financing", avgDays: 12 },
      { stage: "Appraisal", avgDays: 7 },
      { stage: "Title", avgDays: 6 },
      { stage: "Pending close", avgDays: 4 },
    ],
  },
};

export type BrokerageDealFailureFixture = typeof BROKERAGE_DEAL_FAILURE_FIXTURE;
