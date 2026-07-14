/**
 * Build always-visible Campaigns header math explanation (formula + decision stats + bridge).
 */
import {
  formatLiftPp,
  formatSignedLiftPp,
} from "packages/features/brokerage/utils/analyticsFormat";
import { formatAncillaryDollars } from "packages/features/brokerage/utils/ancillaryServiceLabels";
import {
  DEMO_AGENT_COUNT,
  YEAR_TRANSACTIONS,
} from "packages/features/brokerage/utils/brokerageDemoVolumeAssumptions";
import {
  demoCampaignLeakageAlignedRecoveryDollars,
  demoYearLeakageDollars,
  recoveryPercentOfLeakage,
} from "packages/features/brokerage/utils/campaigns/brokerageMathBridge";
import type {
  CampaignRevenueProjectionRow,
  CampaignRevenueProjections,
} from "packages/features/brokerage/utils/campaigns/campaignRevenueProjections";
import type {
  QuantMathExplanation,
  QuantMathFormulaRow,
} from "packages/features/brokerage/utils/campaigns/quantMathExplanation";
import { DEFAULT_AUTHENTICATED_PATH } from "packages/navigation/types/routes";

/** Dashboard analytics shell; `/analytics` redirect drops query params. */
export const ANALYTICS_LEAKAGE_HREF = `${DEFAULT_AUTHENTICATED_PATH}?tab=leakage`;

export function formulaRowForCampaign(
  row: CampaignRevenueProjectionRow,
  yearClosings: number
): QuantMathFormulaRow {
  const lift = formatLiftPp(row.liftPp);
  if (row.categoryId === "transaction_fall_off") {
    return {
      label: row.label,
      equation: `${yearClosings.toLocaleString()} closings × ${lift} pp ÷ 100 × $${row.feeAssumption}/saved closing = ${formatAncillaryDollars(row.projectedDollars)}`,
      inputs: `${row.baselinePercent}% → ${row.postPercent}% keep (+${lift} pp) · $${row.feeAssumption}/saved closing`,
    };
  }
  return {
    label: row.label,
    equation: `${yearClosings.toLocaleString()} closings × ${lift} pp ÷ 100 × $${row.feeAssumption}/attach = ${formatAncillaryDollars(row.projectedDollars)}`,
    inputs: `${row.baselinePercent}% → ${row.postPercent}% (+${lift} pp) · $${row.feeAssumption}/attach`,
  };
}

export function buildCampaignMathExplanation(
  projection: CampaignRevenueProjections,
  options?: {
    yearClosings?: number;
    yearLeakageDollars?: number;
  }
): QuantMathExplanation {
  const yearClosings = options?.yearClosings ?? YEAR_TRANSACTIONS;
  const yearLeakage = options?.yearLeakageDollars ?? demoYearLeakageDollars();
  const recovery = projection.totalProjectedDollars;
  /** Bridge % uses leakage-aligned rows only so portfolio extras don't exceed opportunity. */
  const alignedRecovery = demoCampaignLeakageAlignedRecoveryDollars();
  const recoveryPct = recoveryPercentOfLeakage(alignedRecovery, yearLeakage);

  const ranked = [...projection.rows].sort((a, b) => b.projectedDollars - a.projectedDollars);
  const formulaRows: QuantMathFormulaRow[] = ranked.map((row) =>
    formulaRowForCampaign(row, yearClosings)
  );

  const incrementalAttaches = projection.rows.reduce(
    (sum, row) => sum + row.incrementalAttaches,
    0
  );
  const avgLiftPp =
    projection.rows.length > 0
      ? Math.round(
          (projection.rows.reduce((sum, row) => sum + row.liftPp, 0) / projection.rows.length) * 100
        ) / 100
      : 0;
  const dollarsPerAttach = incrementalAttaches > 0 ? Math.round(recovery / incrementalAttaches) : 0;
  const dollarsPerAgent = DEMO_AGENT_COUNT > 0 ? Math.round(recovery / DEMO_AGENT_COUNT) : 0;
  const top = ranked[0];

  return {
    hero: {
      label: "Projected recovery (12 months)",
      value: formatAncillaryDollars(recovery),
      secondaryLabel: "Leakage-aligned share of annual opportunity",
      secondaryValue: `${formatAncillaryDollars(alignedRecovery)} · ${recoveryPct}% (excludes HOI & Move Concierge)`,
    },
    formulaRows,
    formulaTotal: `Σ portfolio recovery = ${formatAncillaryDollars(recovery)}`,
    stats: [
      {
        label: "$/agent/year recovered",
        value: `$${dollarsPerAgent.toLocaleString()}`,
      },
      {
        label: "Year closings",
        value: yearClosings.toLocaleString(),
      },
      {
        label: "Incremental attaches",
        value: incrementalAttaches.toLocaleString(),
      },
      {
        label: "Top campaign",
        value: top ? `${top.label} · ${formatAncillaryDollars(top.projectedDollars)}` : "—",
      },
      {
        label: "Aligned % of opportunity",
        value: `${recoveryPct}%`,
      },
      {
        label: "Avg lift",
        value: `${formatSignedLiftPp(avgLiftPp)} pp`,
      },
      {
        label: "$/recovered attach",
        value: formatAncillaryDollars(dollarsPerAttach),
      },
    ],
    bridge: {
      label: `Addressable annual opportunity to high: ${formatAncillaryDollars(yearLeakage)} · aligned campaigns cover ${recoveryPct}% →`,
      to: ANALYTICS_LEAKAGE_HREF,
    },
  };
}
