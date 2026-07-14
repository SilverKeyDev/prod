/**
 * Builds multi-series chart payloads comparing campaign email variants
 * on a single engagement rate (attach / open / click) over weeks.
 */
import { color } from "packages/design-tokens";
import type { SampleEmail } from "packages/features/brokerage/utils/campaigns/campaignFixtureBuilders";
import { isControlEmail } from "packages/features/brokerage/utils/campaigns/campaignFixtureBuilders";

export type VariantRateMetric = "attach" | "open" | "click";

export type VariantRateSeries = {
  name: string;
  values: number[];
  color: string;
  /** Override default stroke width (2). */
  lineWidth?: number;
  /** Larger symbols for emphasized series (e.g. winner). */
  symbolSize?: number;
  /** Dashed stroke for control / holdout. */
  lineType?: "solid" | "dashed";
  isWinner?: boolean;
  isControl?: boolean;
  /** End-of-series label for chart (variant + final %). */
  endLabel?: string;
};

export type VariantRateComparison = {
  labels: string[];
  series: VariantRateSeries[];
  /** Winner vs control at last week (pp), when both exist. */
  liftVsControlPp: number | null;
  winnerName: string | null;
};

const METRIC_FIELD: Record<VariantRateMetric, keyof SampleEmail["performance_weekly"][number]> = {
  attach: "attach_rate_percent",
  open: "open_rate_percent",
  click: "click_rate_percent",
};

const CONTROL_CHART_COLOR = color("chart.muted-6");
const WINNER_CHART_COLOR = color("gold.DEFAULT");
/** Single muted hue for non-winner treatments (collapse palette). */
const LOSER_CHART_COLOR = `${color("chart.muted-4")}99`;

function weekLabelsFromEmails(emails: SampleEmail[]): string[] {
  const firstWithWeeks = emails.find((email) => email.performance_weekly.length > 0);
  if (!firstWithWeeks) return [];
  return firstWithWeeks.performance_weekly.map((point) => `W${point.week}`);
}

function lastValue(values: number[]): number {
  return values[values.length - 1] ?? 0;
}

/**
 * One series per variant for the given rate metric.
 * Returns empty labels/series when there are no emails.
 * Winner series uses gold + thicker stroke; control dashed muted; losers one low-opacity hue.
 * Open/click omit control — holdout has no email, so those rates are not comparable.
 */
export function buildVariantRateComparisonSeries(
  emails: SampleEmail[],
  metric: VariantRateMetric
): VariantRateComparison {
  if (emails.length === 0) {
    return { labels: [], series: [], liftVsControlPp: null, winnerName: null };
  }

  const chartEmails =
    metric === "open" || metric === "click"
      ? emails.filter((email) => !isControlEmail(email))
      : emails;

  if (chartEmails.length === 0) {
    return { labels: [], series: [], liftVsControlPp: null, winnerName: null };
  }

  const field = METRIC_FIELD[metric];
  const labels = weekLabelsFromEmails(chartEmails);

  const series: VariantRateSeries[] = chartEmails.map((email) => {
    const isControl = isControlEmail(email);
    const isWinner = Boolean(email.is_winner);
    const values = email.performance_weekly.map((point) => {
      const value = point[field];
      return typeof value === "number" ? value : 0;
    });
    let seriesColor: string;
    if (isControl) {
      seriesColor = CONTROL_CHART_COLOR;
    } else if (isWinner) {
      seriesColor = WINNER_CHART_COLOR;
    } else {
      seriesColor = LOSER_CHART_COLOR;
    }
    const final = lastValue(values);
    return {
      name: email.variant_key,
      values,
      color: seriesColor,
      lineWidth: isWinner ? 3.5 : isControl ? 1.5 : 1.25,
      symbolSize: isWinner ? 7 : isControl ? 4 : 3,
      lineType: isControl ? "dashed" : "solid",
      isWinner,
      isControl,
      endLabel: `${email.variant_key} ${final}%`,
    };
  });

  const winner = series.find((s) => s.isWinner);
  const control = series.find((s) => s.isControl);
  const liftVsControlPp =
    winner && control
      ? Math.round((lastValue(winner.values) - lastValue(control.values)) * 10) / 10
      : null;

  return {
    labels,
    series,
    liftVsControlPp,
    winnerName: winner?.name ?? null,
  };
}
