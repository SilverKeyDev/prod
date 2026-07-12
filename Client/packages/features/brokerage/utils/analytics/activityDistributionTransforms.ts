/**
 * Activity distribution series for Deal Forensics (fixture-backed).
 */
import {
  MONTH_DISTRIBUTION,
  WEEK_HEATMAP_DATA,
  WEEK_HEATMAP_X_LABELS,
  WEEK_HEATMAP_Y_LABELS,
  YEAR_DISTRIBUTION,
} from "packages/features/brokerage/utils/activityDistributionFixtures";
import { periodScale, type TimePeriod } from "packages/features/brokerage/utils/analyticsPeriod";

function scaleBars(
  rows: { label: string; value: number }[],
  scale: number
): { label: string; value: number }[] {
  return rows.map((row) => ({
    ...row,
    value: Math.max(0, Math.round(row.value * scale)),
  }));
}

function scaleHeatmap(
  data: { x: number; y: number; value: number }[],
  scale: number
): { x: number; y: number; value: number }[] {
  return data.map((cell) => ({
    ...cell,
    value: Math.max(0, Math.round(cell.value * scale)),
  }));
}

export type ActivityDistributionData = {
  weekHeatmap: { x: number; y: number; value: number }[];
  monthBars: { label: string; value: number }[];
  yearBars: { label: string; value: number }[];
  showWeek: boolean;
  showMonth: boolean;
  showYear: boolean;
  weekXLabels: typeof WEEK_HEATMAP_X_LABELS;
  weekYLabels: typeof WEEK_HEATMAP_Y_LABELS;
};

export function buildActivityDistribution(period: TimePeriod): ActivityDistributionData {
  const scale = periodScale(period);
  return {
    weekHeatmap: scaleHeatmap(WEEK_HEATMAP_DATA, scale),
    monthBars: scaleBars(MONTH_DISTRIBUTION, scale),
    yearBars: scaleBars(YEAR_DISTRIBUTION, scale),
    showWeek: period === "week" || period === "5years" || period === "all",
    showMonth: period === "month" || period === "5years" || period === "all",
    showYear: period === "year" || period === "5years" || period === "all",
    weekXLabels: WEEK_HEATMAP_X_LABELS,
    weekYLabels: WEEK_HEATMAP_Y_LABELS,
  };
}
