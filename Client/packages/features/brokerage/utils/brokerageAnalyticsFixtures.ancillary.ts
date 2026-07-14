/**
 * Brokerage analytics fixtures — demo ancillary / leakage.
 * Volume: Kaggle closings via brokerageDemoVolumeAssumptions (~1,854/month).
 * Attach: shared ANCILLARY_ATTACH_BENCHMARKS (current = industry avg; high = campaign posts).
 * Opportunity dollars = gap to industry high (not gap to 100% attach).
 * by_agent.transactions aligned with BROKERAGE_AGENTS_FIXTURE.closings (monthly baselines).
 */

import {
  ANCILLARY_ATTACH_BENCHMARKS,
  ANCILLARY_ATTACH_RATES,
  type LeakageBenchmarkService,
  opportunityDollars,
  opportunityDollarsPrecise,
} from "packages/features/brokerage/utils/ancillaryAttachBenchmarks";
import { ANCILLARY_FEES } from "packages/features/brokerage/utils/ancillaryFees";
import { MONTH_TRANSACTIONS } from "packages/features/brokerage/utils/brokerageDemoVolumeAssumptions";

export { ANCILLARY_ATTACH_RATES };

function serviceRow(service: LeakageBenchmarkService) {
  const bench = ANCILLARY_ATTACH_BENCHMARKS[service];
  const t = MONTH_TRANSACTIONS;
  const rate = bench.current;
  const in_house_count = Math.round((t * rate) / 100);
  const outside_count = Math.round(t * (1 - rate / 100));
  const opportunity_vs_avg_dollars = opportunityDollars(t, rate, bench.industryAvg, bench.fee);
  const opportunity_vs_high_dollars = opportunityDollars(t, rate, bench.industryHigh, bench.fee);
  return {
    service,
    in_house_count,
    outside_count,
    attach_rate_percent: rate,
    industry_avg_percent: bench.industryAvg,
    industry_high_percent: bench.industryHigh,
    /** @deprecated Prefer opportunity_vs_high_dollars — kept as primary opportunity alias. */
    leakage_dollars: opportunity_vs_high_dollars,
    opportunity_vs_avg_dollars,
    opportunity_vs_high_dollars,
    fee_assumption: bench.fee,
  };
}

/** Agent opportunity vs industry high for title + lending only. */
function agentTitleLendingOpportunity(
  transactions: number,
  titleAttach: number,
  lendingAttach: number
): number {
  return (
    opportunityDollarsPrecise(
      transactions,
      titleAttach,
      ANCILLARY_ATTACH_BENCHMARKS.title.industryHigh,
      ANCILLARY_FEES.title
    ) +
    opportunityDollarsPrecise(
      transactions,
      lendingAttach,
      ANCILLARY_ATTACH_BENCHMARKS.lending.industryHigh,
      ANCILLARY_FEES.lending
    )
  );
}

const by_service = [
  serviceRow("title"),
  serviceRow("lending"),
  serviceRow("escrow"),
  serviceRow("home_warranty"),
] as const;

const total_opportunity_vs_high = by_service.reduce(
  (sum, row) => sum + row.opportunity_vs_high_dollars,
  0
);
const total_opportunity_vs_avg = by_service.reduce(
  (sum, row) => sum + row.opportunity_vs_avg_dollars,
  0
);
const avg_attach_rate_percent =
  Math.round(
    ((ANCILLARY_ATTACH_RATES.title +
      ANCILLARY_ATTACH_RATES.lending +
      ANCILLARY_ATTACH_RATES.escrow +
      ANCILLARY_ATTACH_RATES.home_warranty) /
      4) *
      10
  ) / 10;

const by_agent_seed = [
  {
    agent_id: "AGT-0460",
    name: "Robin Pittman",
    transactions: 4,
    title_attach: 11.0,
    lending_attach: 9.0,
  },
  {
    agent_id: "AGT-0343",
    name: "Kristina Alexander",
    transactions: 4,
    title_attach: 10.0,
    lending_attach: 8.0,
  },
  {
    agent_id: "AGT-0372",
    name: "Brittney Collins",
    transactions: 4,
    title_attach: 22.0,
    lending_attach: 27.0,
  },
  {
    agent_id: "AGT-0276",
    name: "John Martin",
    transactions: 4,
    title_attach: 13.0,
    lending_attach: 12.0,
  },
  {
    agent_id: "AGT-0323",
    name: "Sara Spencer",
    transactions: 4,
    title_attach: 9.0,
    lending_attach: 7.0,
  },
  {
    agent_id: "AGT-0341",
    name: "Robert Tate",
    transactions: 4,
    title_attach: 18.0,
    lending_attach: 20.0,
  },
  {
    agent_id: "AGT-0014",
    name: "Janet Patrick",
    transactions: 4,
    title_attach: 24.0,
    lending_attach: 28.0,
  },
  {
    agent_id: "AGT-0053",
    name: "Hector Dyer",
    transactions: 4,
    title_attach: 12.0,
    lending_attach: 10.0,
  },
] as const;

export const BROKERAGE_ANCILLARY_FIXTURE = {
  success: true,
  brokerage_org_id: "demo-brokerage-org-id",
  date_from: "2025-07-01T00:00:00+00:00",
  date_to: "2025-12-31T00:00:00+00:00",
  total_transactions: MONTH_TRANSACTIONS,
  summary: {
    /** Primary opportunity = sum of gap-to-industry-high dollars (not 100% attach). */
    total_leakage_dollars: total_opportunity_vs_high,
    opportunity_vs_avg_dollars: total_opportunity_vs_avg,
    opportunity_vs_high_dollars: total_opportunity_vs_high,
    avg_attach_rate_percent,
  },
  by_service: [...by_service],
  by_agent: by_agent_seed.map((agent) => ({
    ...agent,
    total_leakage_dollars: agentTitleLendingOpportunity(
      agent.transactions,
      agent.title_attach,
      agent.lending_attach
    ),
  })),
};

export type BrokerageAncillaryFixture = typeof BROKERAGE_ANCILLARY_FIXTURE;
