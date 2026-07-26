/**
 * Map NL query result rows into AnalyticsDataTable / AnalyticsBarChart shapes (SIL-323).
 */

import type { NlQueryResponse } from "packages/features/brokerage/api/nlQuery";
import type { AnalyticsTableColumn } from "packages/features/brokerage/components/analytics/AnalyticsDataTable";
import type { BarDataPoint } from "packages/features/brokerage/components/charts/AnalyticsBarChart";

export type NlQueryRow = Record<string, unknown>;
export function buildNlTableColumns(columns: string[]): AnalyticsTableColumn<NlQueryRow>[] {
  return columns.map((key) => ({
    key,
    header: key,
    render: (row) => String(row[key] ?? "—"),
  }));
}

function isNumeric(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Bar chart when viz_hint is bar and we can find a label + numeric value column.
 * Otherwise return null (table-only).
 */
export function selectNlBarSeries(
  result: Pick<NlQueryResponse, "viz_hint" | "columns" | "rows">
): BarDataPoint[] | null {
  if (result.viz_hint !== "bar" || result.rows.length === 0 || result.columns.length < 2) {
    return null;
  }
  const sample = result.rows[0] ?? {};
  const labelKey = result.columns.find((c) => !isNumeric(sample[c])) ?? result.columns[0];
  const valueKey =
    result.columns.find((c) => c !== labelKey && isNumeric(sample[c])) ??
    result.columns.find((c) => c !== labelKey);
  if (!labelKey || !valueKey) return null;
  const points: BarDataPoint[] = [];
  for (const row of result.rows) {
    const raw = row[valueKey];
    const value = isNumeric(raw) ? raw : Number(raw);
    if (!Number.isFinite(value)) continue;
    points.push({ label: String(row[labelKey] ?? "—"), value });
  }
  return points.length > 0 ? points : null;
}
