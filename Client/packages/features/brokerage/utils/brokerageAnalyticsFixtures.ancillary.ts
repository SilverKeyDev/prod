/**
 * Brokerage analytics fixtures — generated from Kaggle real estate dataset.
 * Source: 50,122 real transactions across 500 agents, 50 offices.
 */

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
    {
      service: "title",
      in_house_count: 1276,
      outside_count: 782,
      attach_rate_percent: 62,
      leakage_dollars: 391000,
      fee_assumption: 500,
    },
    {
      service: "lending",
      in_house_count: 905,
      outside_count: 1153,
      attach_rate_percent: 44,
      leakage_dollars: 1153000,
      fee_assumption: 1000,
    },
    {
      service: "escrow",
      in_house_count: 1132,
      outside_count: 926,
      attach_rate_percent: 55,
      leakage_dollars: 370400,
      fee_assumption: 400,
    },
    {
      service: "home_warranty",
      in_house_count: 988,
      outside_count: 1070,
      attach_rate_percent: 48,
      leakage_dollars: 160500,
      fee_assumption: 150,
    },
  ],
  by_agent: [
    {
      agent_id: "agent-27",
      name: "Dean Houston",
      transactions: 137,
      title_attach: 49.0,
      lending_attach: 62.0,
      total_leakage_dollars: 86500,
    },
    {
      agent_id: "agent-337",
      name: "Nicole Michael",
      transactions: 128,
      title_attach: 59.0,
      lending_attach: 32.0,
      total_leakage_dollars: 113000,
    },
    {
      agent_id: "agent-6",
      name: "Mark Parker PhD",
      transactions: 126,
      title_attach: 72.0,
      lending_attach: 60.0,
      total_leakage_dollars: 67500,
    },
    {
      agent_id: "agent-226",
      name: "Amber Edwards",
      transactions: 126,
      title_attach: 72.0,
      lending_attach: 45.0,
      total_leakage_dollars: 86500,
    },
    {
      agent_id: "agent-348",
      name: "Joe Taylor",
      transactions: 125,
      title_attach: 46.0,
      lending_attach: 29.0,
      total_leakage_dollars: 121500,
    },
    {
      agent_id: "agent-288",
      name: "Andrew Harris",
      transactions: 124,
      title_attach: 66.0,
      lending_attach: 54.0,
      total_leakage_dollars: 78000,
    },
    {
      agent_id: "agent-277",
      name: "Richard Garner",
      transactions: 124,
      title_attach: 79.0,
      lending_attach: 67.0,
      total_leakage_dollars: 53000,
    },
    {
      agent_id: "agent-122",
      name: "Barbara Gonzalez",
      transactions: 123,
      title_attach: 64.0,
      lending_attach: 32.0,
      total_leakage_dollars: 105000,
    },
  ],
};

export type BrokerageAncillaryFixture = typeof BROKERAGE_ANCILLARY_FIXTURE;
