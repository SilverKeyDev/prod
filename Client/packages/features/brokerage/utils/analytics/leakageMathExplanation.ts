/**
 * Build always-visible Leakage math explanation (formula + decision stats).
 * Opportunity = gap to industry high + fall-off keep-rate gap.
 */
import type { AncillaryAnalytics } from "packages/features/brokerage/types/analytics";
import type { TimePeriod } from "packages/features/brokerage/utils/analyticsPeriod";
import {
  FALL_OFF_KEEP_BENCHMARK,
  fallOffOpportunityDollars,
} from "packages/features/brokerage/utils/ancillaryAttachBenchmarks";
import { attachRateLiftPp } from "packages/features/brokerage/utils/ancillaryFees";
import {
  ANCILLARY_SERVICE_LABELS,
  formatAncillaryDollars,
} from "packages/features/brokerage/utils/ancillaryServiceLabels";
import type {
  QuantMathExplanation,
  QuantMathFormulaRow,
} from "packages/features/brokerage/utils/analytics/quantMathExplanation";

const PERIOD_HERO_LABEL: Record<TimePeriod, string> = {
  week: "Opportunity to industry high (this week)",
  month: "Opportunity to industry high (this month)",
  year: "Opportunity to industry high (this year)",
  "5years": "Opportunity to industry high (5 years)",
  all: "Opportunity to industry high (all time)",
};

export function leakageHeroLabel(period: TimePeriod): string {
  return PERIOD_HERO_LABEL[period];
}

export function buildLeakageMathExplanation(
  data: AncillaryAnalytics,
  period: TimePeriod
): QuantMathExplanation {
  const attachOppHigh =
    data.summary.opportunity_vs_high_dollars ?? data.summary.total_leakage_dollars;
  const oppAvg = data.summary.opportunity_vs_avg_dollars ?? 0;
  const closings = data.total_transactions;
  const fallOffOpp = fallOffOpportunityDollars(closings);
  const oppHigh = attachOppHigh + fallOffOpp;

  const formulaRows: QuantMathFormulaRow[] = data.by_service.map((row) => {
    const label = ANCILLARY_SERVICE_LABELS[row.service] ?? row.service;
    const gapHighPp = attachRateLiftPp(row.attach_rate_percent, row.industry_high_percent);
    const gapAvgPp = Math.max(
      0,
      attachRateLiftPp(row.attach_rate_percent, row.industry_avg_percent)
    );
    const avgPart =
      row.opportunity_vs_avg_dollars > 0
        ? ` · vs avg +${gapAvgPp} pp = ${formatAncillaryDollars(row.opportunity_vs_avg_dollars)}`
        : " · at industry avg";
    return {
      label,
      equation: `+${gapHighPp} pp × ${closings.toLocaleString()} closings × $${row.fee_assumption}/attach = ${formatAncillaryDollars(row.opportunity_vs_high_dollars)}${avgPart}`,
      inputs: `${row.attach_rate_percent}% current · ${row.industry_avg_percent}% avg · ${row.industry_high_percent}% high · ${closings.toLocaleString()} closings`,
    };
  });

  const fallOffGapPp = attachRateLiftPp(
    FALL_OFF_KEEP_BENCHMARK.current,
    FALL_OFF_KEEP_BENCHMARK.industryHigh
  );
  formulaRows.push({
    label: "Transaction Fall-Off",
    equation: `+${fallOffGapPp} pp × ${closings.toLocaleString()} closings × $${FALL_OFF_KEEP_BENCHMARK.fee}/saved closing = ${formatAncillaryDollars(fallOffOpp)} · at industry avg`,
    inputs: `${FALL_OFF_KEEP_BENCHMARK.current}% keep · ${FALL_OFF_KEEP_BENCHMARK.industryAvg}% avg · ${FALL_OFF_KEEP_BENCHMARK.industryHigh}% high · ${closings.toLocaleString()} closings`,
  });

  const avgGapHighPp =
    data.by_service.length > 0
      ? Math.round(
          (data.by_service.reduce(
            (sum, row) =>
              sum +
              Math.max(0, attachRateLiftPp(row.attach_rate_percent, row.industry_high_percent)),
            0
          ) /
            data.by_service.length) *
            100
        ) / 100
      : 0;

  const dollarsPerClosing = closings > 0 ? Math.round(oppHigh / closings) : 0;

  type OppSlice = { label: string; dollars: number };
  const slices: OppSlice[] = [
    ...data.by_service.map((row) => ({
      label: ANCILLARY_SERVICE_LABELS[row.service] ?? row.service,
      dollars: row.opportunity_vs_high_dollars,
    })),
    { label: "Transaction Fall-Off", dollars: fallOffOpp },
  ];
  const topSlice = [...slices].sort((a, b) => b.dollars - a.dollars)[0];
  const topShare =
    topSlice && oppHigh > 0 ? Math.round((topSlice.dollars / oppHigh) * 1000) / 10 : 0;
  const vsAvgValue = formatAncillaryDollars(oppAvg);
  const biggestLeakValue = topSlice
    ? `${topSlice.label} · ${formatAncillaryDollars(topSlice.dollars)}`
    : "—";

  return {
    hero: {
      label: leakageHeroLabel(period),
      value: formatAncillaryDollars(oppHigh),
      secondaryLabel: "Opportunity vs industry average",
      secondaryValue: vsAvgValue,
    },
    formulaRows,
    formulaTotal: `Σ opportunity to high = ${formatAncillaryDollars(oppHigh)}`,
    stats: [
      {
        label: "Closings in period",
        value: closings.toLocaleString(),
      },
      {
        label: "Avg current attach",
        value: `${data.summary.avg_attach_rate_percent.toFixed(1)}%`,
      },
      {
        label: "Avg gap to high",
        value: `+${avgGapHighPp} pp`,
      },
      {
        label: "Top opportunity",
        value: `${topSlice?.label ?? "—"} · ${topShare}%`,
      },
      {
        label: "vs industry avg",
        value: vsAvgValue,
      },
      {
        label: "$/closing to high",
        value: formatAncillaryDollars(dollarsPerClosing),
      },
    ],
    /** Money-first KPIs for the Leakage Snapshot section (not the math-strip stats grid). */
    snapshot: {
      opportunityToHigh: formatAncillaryDollars(oppHigh),
      vsIndustryAvg: vsAvgValue,
      biggestLeak: biggestLeakValue,
      closingsInPeriod: closings.toLocaleString(),
      behindIndustryAvg: oppAvg > 0,
    },
  };
}
