/**
 * Pure chart-series selectors for brokerage analytics tabs.
 */
import type {
  BrokerageAnalyticsAgent,
  BrokerageAnalyticsOverview,
  DealFailureForensics,
} from "packages/features/brokerage/types/analytics";

export type ChartBar = { label: string; value: number };
export type ChartBarWithZ = ChartBar & { zScore: number };

export function selectFunnelBars(data: BrokerageAnalyticsOverview): ChartBar[] {
  return data.transactionFunnel.map((s) => ({ label: s.stage, value: s.count }));
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

export function selectAgentPerformanceBarsWithZ(
  agents: readonly BrokerageAnalyticsAgent[]
): ChartBarWithZ[] {
  const sorted = [...agents].sort((a, b) => b.closings - a.closings).slice(0, 8);
  const vals = sorted.map((a) => a.closings);
  if (vals.length === 0) return [];
  const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
  const std = Math.sqrt(vals.reduce((s, v) => s + (v - avg) ** 2, 0) / vals.length);
  return sorted.map((a) => ({
    label: a.name.split(" ")[0] ?? a.name,
    value: a.closings,
    zScore: std > 0 ? +((a.closings - avg) / std).toFixed(2) : 0,
  }));
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
