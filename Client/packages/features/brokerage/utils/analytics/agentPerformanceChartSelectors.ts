/**
 * Chart selectors for the Agents tab performance gallery.
 */
import type { DonutSlice, LineDataPoint } from "packages/features/brokerage/components/charts";
import type { BrokerageAnalyticsAgent } from "packages/features/brokerage/types/analytics";
import type { TimePeriod } from "packages/features/brokerage/utils/analyticsPeriod";
import { periodScale } from "packages/features/brokerage/utils/analyticsPeriod";

import type { ChartBar } from "./chartSelectors";

/** X-axis step (closings/yr) for the Snapshot density curve. */
const CLOSING_DENSITY_STEP = 2;
/** Default right edge when the roster is empty or tightly clustered. */
const CLOSING_DENSITY_X_MAX_DEFAULT = 48;

/** Convert period-scaled closings to an annual rate. */
export function annualizeClosings(closings: number, period: TimePeriod): number {
  const scale = periodScale(period);
  if (scale <= 0) return 0;
  return Math.round((closings * 12) / scale);
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function shortAgentLabel(name: string): string {
  const first = name.split(/\s+/)[0] ?? name;
  return first.length > 10 ? `${first.slice(0, 9)}…` : first;
}

export function selectAgentStatusDonut(agents: readonly BrokerageAnalyticsAgent[]): DonutSlice[] {
  let top = 0;
  let healthy = 0;
  let atRisk = 0;
  for (const agent of agents) {
    if (agent.status === "top") top += 1;
    else if (agent.status === "at_risk") atRisk += 1;
    else healthy += 1;
  }
  return [
    { label: "Top Performer", value: top },
    { label: "Healthy", value: healthy },
    { label: "At Risk", value: atRisk },
  ];
}

export function selectTopAgentsByGciBars(
  agents: readonly BrokerageAnalyticsAgent[],
  limit = 10
): ChartBar[] {
  return [...agents]
    .sort((a, b) => b.gci - a.gci || b.closings - a.closings)
    .slice(0, limit)
    .map((agent) => ({
      label: shortAgentLabel(agent.name),
      value: Math.round(agent.gci / 1_000),
    }));
}

/** Month count for the closings trend line by selected period. */
function trendMonthCount(period: TimePeriod): number {
  if (period === "week") return 4;
  if (period === "month") return 6;
  if (period === "year") return 12;
  return 24;
}

/**
 * Deterministic brokerage closings trend from the period-scaled roster total.
 * Distributes total closings across months with a mild seasonal wave.
 */
export function selectBrokerageClosingsTrend(
  agents: readonly BrokerageAnalyticsAgent[],
  period: TimePeriod
): LineDataPoint[] {
  const totalClosings = agents.reduce((sum, agent) => sum + agent.closings, 0);
  const months = trendMonthCount(period);
  if (months === 0 || totalClosings === 0) return [];

  const weights = Array.from({ length: months }, (_, i) => {
    const seasonal = 1 + 0.18 * Math.sin((i / months) * Math.PI * 2 - 0.4);
    return Math.max(0.55, seasonal);
  });
  const weightSum = weights.reduce((s, w) => s + w, 0);

  return weights.map((weight, i) => {
    const label =
      months <= 12 ? MONTH_LABELS[i % 12]! : `${MONTH_LABELS[i % 12]!}${i >= 12 ? " Y2" : ""}`;
    return {
      label,
      value: Math.max(1, Math.round((totalClosings * weight) / weightSum)),
    };
  });
}

export function selectTopAgentsByClosings(
  agents: readonly BrokerageAnalyticsAgent[],
  limit = 15
): BrokerageAnalyticsAgent[] {
  return [...agents]
    .sort((a, b) => b.closings - a.closings || b.gci - a.gci || a.name.localeCompare(b.name))
    .slice(0, limit);
}

/**
 * Gaussian KDE of annualized closings for the Snapshot density area curve.
 * Y values are count-density (agents per closings/yr) so the shape reads as a
 * distribution without squashing the long tail the way a treemap does.
 */
export function selectAgentClosingsDensity(
  agents: readonly BrokerageAnalyticsAgent[],
  period: TimePeriod
): LineDataPoint[] {
  const annuals = agents.map((agent) => annualizeClosings(agent.closings, period));
  const maxObserved = annuals.length > 0 ? Math.max(...annuals) : 0;
  const xMax = Math.max(
    CLOSING_DENSITY_X_MAX_DEFAULT,
    Math.ceil(maxObserved / 6) * 6 + CLOSING_DENSITY_STEP * 3
  );
  const grid: number[] = [];
  for (let x = 0; x <= xMax; x += CLOSING_DENSITY_STEP) {
    grid.push(x);
  }

  if (annuals.length === 0) {
    return grid.map((x) => ({ label: String(x), value: 0 }));
  }

  const n = annuals.length;
  const mean = annuals.reduce((sum, v) => sum + v, 0) / n;
  const variance = annuals.reduce((sum, v) => sum + (v - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance);
  // Silverman's rule of thumb; floor keeps peaks readable on discrete demo clusters.
  const bandwidth = Math.max(2.5, 1.06 * std * n ** -0.2);
  const invNorm = 1 / (bandwidth * Math.sqrt(2 * Math.PI));

  return grid.map((x) => {
    let kernelSum = 0;
    for (const v of annuals) {
      const z = (x - v) / bandwidth;
      kernelSum += Math.exp(-0.5 * z * z);
    }
    // f̂(x) * n → agents per closings/yr
    const countDensity = kernelSum * invNorm;
    return {
      label: String(x),
      value: Math.round(countDensity * 100) / 100,
    };
  });
}
