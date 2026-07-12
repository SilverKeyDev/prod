/**
 * Campaign revenue projections from dashboard ancillary volume × attach lift × fee.
 */
import {
  attachRateLiftPp,
  recoveredDollars,
} from "packages/features/brokerage/utils/ancillaryFees";
import type {
  CampaignCategoryId,
  CategoryCampaign,
  DashboardServiceKey,
} from "packages/features/brokerage/utils/campaigns/campaignFixtures";

export type MonthlyCumulativePoint = {
  month: number;
  cumulativeDollars: number;
};

export type CampaignRevenueProjectionRow = {
  categoryId: CampaignCategoryId;
  label: string;
  service?: DashboardServiceKey;
  liftPp: number;
  incrementalAttaches: number;
  projectedDollars: number;
  feeAssumption: number;
  monthlyCumulative: MonthlyCumulativePoint[];
};

export type CampaignRevenueProjections = {
  totalProjectedDollars: number;
  monthlyCumulative: MonthlyCumulativePoint[];
  rows: CampaignRevenueProjectionRow[];
};

export type CategoryAttachProjection = {
  baselinePercent: number;
  postPercent: number;
  liftPp: number;
};

/** Equal monthly run-rate cumulative series for a year dollar total. */
export function buildMonthlyCumulativeSeries(yearDollars: number): MonthlyCumulativePoint[] {
  const points: MonthlyCumulativePoint[] = [];
  for (let month = 1; month <= 12; month++) {
    points.push({
      month,
      cumulativeDollars: Math.round((yearDollars * month) / 12),
    });
  }
  return points;
}

/**
 * Attach-rate year projection for any category.
 * Prefers stored baseline/post; falls back to week-1 / week-8 weekly series.
 */
export function buildCategoryAttachProjection(
  category: CategoryCampaign
): CategoryAttachProjection {
  const weekly = category.performance_weekly;
  const baseline = category.baseline_attach_rate_percent ?? weekly[0]?.attach_rate_percent ?? 0;
  const post =
    category.post_attach_rate_percent ?? weekly[weekly.length - 1]?.attach_rate_percent ?? baseline;
  return {
    baselinePercent: baseline,
    postPercent: post,
    liftPp: attachRateLiftPp(baseline, post),
  };
}

export function buildCampaignRevenueProjections(
  categories: CategoryCampaign[],
  totalTransactions: number
): CampaignRevenueProjections {
  const rows: CampaignRevenueProjectionRow[] = [];

  for (const category of categories) {
    const {
      baseline_attach_rate_percent: baseline,
      post_attach_rate_percent: post,
      fee_assumption: fee,
    } = category;
    if (baseline == null || post == null || fee == null) continue;

    const liftPp = attachRateLiftPp(baseline, post);
    const incrementalAttaches = Math.round((totalTransactions * liftPp) / 100);
    const projectedDollars = recoveredDollars(incrementalAttaches, fee);

    rows.push({
      categoryId: category.id,
      label: category.label,
      ...(category.dashboard_service ? { service: category.dashboard_service } : {}),
      liftPp,
      incrementalAttaches,
      projectedDollars,
      feeAssumption: fee,
      monthlyCumulative: buildMonthlyCumulativeSeries(projectedDollars),
    });
  }

  const totalProjectedDollars = rows.reduce((sum, row) => sum + row.projectedDollars, 0);

  return {
    totalProjectedDollars,
    monthlyCumulative: buildMonthlyCumulativeSeries(totalProjectedDollars),
    rows,
  };
}
