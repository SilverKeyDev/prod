/**
 * Pure chart-series selectors for brokerage analytics tabs.
 */
import type {
  BrokerageAnalyticsOverview,
  DealFailureForensics,
} from "packages/features/brokerage/types/analytics";

export type ChartBar = {
  label: string;
  value: number;
  /** Stage conversion or other annotation for bar labels/tooltips. */
  dataLabel?: string;
};

export type FunnelConversionChip = {
  from: string;
  to: string;
  conversionPercent: number;
};

export function selectFunnelBars(data: BrokerageAnalyticsOverview): ChartBar[] {
  const stages = data.transactionFunnel;
  return stages.map((s, i) => {
    const prev = i > 0 ? stages[i - 1] : null;
    const conv = prev && prev.count > 0 ? Math.round((s.count / prev.count) * 100) : null;
    return {
      label: s.stage,
      value: s.count,
      dataLabel: conv != null ? `${conv}%` : undefined,
    };
  });
}

/** Stage-to-stage conversion chips for funnel subtitles (Search→Tour 88%). */
export function selectFunnelConversions(data: BrokerageAnalyticsOverview): FunnelConversionChip[] {
  const stages = data.transactionFunnel;
  const chips: FunnelConversionChip[] = [];
  for (let i = 1; i < stages.length; i++) {
    const prev = stages[i - 1]!;
    const curr = stages[i]!;
    if (prev.count <= 0) continue;
    chips.push({
      from: prev.stage,
      to: curr.stage,
      conversionPercent: Math.round((curr.count / prev.count) * 100),
    });
  }
  return chips;
}

export function selectFunnelForecastBars(data: BrokerageAnalyticsOverview): ChartBar[] {
  return data.transactionFunnel.map((s) => ({
    label: s.stage,
    value: Math.round(s.weightedForecast / 1_000_000),
  }));
}

export function selectVolumeByStatusBars(data: BrokerageAnalyticsOverview): ChartBar[] {
  return data.production.volumeByStatus.map((row) => ({
    label: row.status === "closed" ? "Closed" : row.status === "pending" ? "Pending" : "Active",
    value: Math.round(row.volumeDollars / 1_000_000),
  }));
}

export function selectDonut(items: readonly { label: string; value: number }[]): ChartBar[] {
  return items.map((s) => ({ label: s.label, value: s.value }));
}

export function selectFailureTrendLine(data: DealFailureForensics): ChartBar[] {
  return data.trend.map((t) => ({ label: t.month, value: t.cancelled }));
}

export function selectFailureStageBars(data: DealFailureForensics): ChartBar[] {
  return data.by_stage.map((s) => ({ label: s.stage, value: s.count }));
}

export function selectMilestoneBars(data: DealFailureForensics): ChartBar[] {
  return data.cycleTime.timeInMilestone.map((m) => ({
    label: m.stage,
    value: m.avgDays,
  }));
}
