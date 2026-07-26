/**
 * Pure ancillary analytics transforms (fixture-backed).
 * Service opportunity = gap to industry avg / high (campaign benchmarks), not gap to 100%.
 * Agent Total opportunity = gap to industry avg (title + lending), precise dollars.
 */
import type { AncillaryAnalytics } from "packages/features/brokerage/types/analytics";
import { periodScale, type TimePeriod } from "packages/features/brokerage/utils/analyticsPeriod";
import {
  ANCILLARY_ATTACH_BENCHMARKS,
  type LeakageBenchmarkService,
  opportunityDollars,
  opportunityDollarsPrecise,
} from "packages/features/brokerage/utils/ancillaryAttachBenchmarks";
import { ANCILLARY_SERVICE_ORDER } from "packages/features/brokerage/utils/ancillaryFees";
import { BROKERAGE_ANCILLARY_FIXTURE } from "packages/features/brokerage/utils/brokerageAnalyticsFixtures";
import { transactionsForPeriod } from "packages/features/brokerage/utils/brokerageDemoVolumeAssumptions";

/** Agent coaching dollars: attach gap vs industry avg (precise — small tx must not round to $0). */
function agentOpportunityDollars(
  transactions: number,
  titleAttach: number,
  lendingAttach: number
): number {
  const title = ANCILLARY_ATTACH_BENCHMARKS.title;
  const lending = ANCILLARY_ATTACH_BENCHMARKS.lending;
  return (
    opportunityDollarsPrecise(transactions, titleAttach, title.industryAvg, title.fee) +
    opportunityDollarsPrecise(transactions, lendingAttach, lending.industryAvg, lending.fee)
  );
}

export function buildAncillaryData(period: TimePeriod): AncillaryAnalytics {
  const base = BROKERAGE_ANCILLARY_FIXTURE;
  const scale = periodScale(period);
  const t = transactionsForPeriod(period);

  const by_service = ANCILLARY_SERVICE_ORDER.map((svc) => {
    const service = svc as LeakageBenchmarkService;
    const bench = ANCILLARY_ATTACH_BENCHMARKS[service];
    const rate = bench.current;
    const opportunity_vs_avg_dollars = opportunityDollars(t, rate, bench.industryAvg, bench.fee);
    const opportunity_vs_high_dollars = opportunityDollars(t, rate, bench.industryHigh, bench.fee);
    return {
      service,
      in_house_count: Math.round((t * rate) / 100),
      outside_count: Math.round(t * (1 - rate / 100)),
      attach_rate_percent: rate,
      industry_avg_percent: bench.industryAvg,
      industry_high_percent: bench.industryHigh,
      leakage_dollars: opportunity_vs_high_dollars,
      opportunity_vs_avg_dollars,
      opportunity_vs_high_dollars,
      fee_assumption: bench.fee,
    };
  });

  const opportunity_vs_high = by_service.reduce((s, sv) => s + sv.opportunity_vs_high_dollars, 0);
  const opportunity_vs_avg = by_service.reduce((s, sv) => s + sv.opportunity_vs_avg_dollars, 0);

  const by_agent = base.by_agent.map((agent) => {
    const transactions = Math.max(1, Math.round(agent.transactions * scale));
    return {
      ...agent,
      transactions,
      total_leakage_dollars: agentOpportunityDollars(
        transactions,
        agent.title_attach,
        agent.lending_attach
      ),
    };
  });

  return {
    ...base,
    total_transactions: t,
    summary: {
      total_leakage_dollars: opportunity_vs_high,
      opportunity_vs_avg_dollars: opportunity_vs_avg,
      opportunity_vs_high_dollars: opportunity_vs_high,
      avg_attach_rate_percent: base.summary.avg_attach_rate_percent,
    },
    by_service,
    by_agent,
  };
}
