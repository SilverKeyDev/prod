import React from "react";
import { type ComparisonRow } from ".";

interface ComparisonSpreadsheetProps {
  selectedReports: Array<{ id: string; address: string }>;
  comparisonTable: ComparisonRow[];
  visibleMetrics: string[];
  isLoading?: boolean;
}

export function ComparisonSpreadsheet({
  selectedReports,
  comparisonTable,
  visibleMetrics,
  isLoading = false,
}: ComparisonSpreadsheetProps) {
  if (selectedReports.length === 0) {
    return null;
  }

  return (
    <div className="scrollbar-hide mt-responsive-md w-full overflow-x-auto rounded-lg border sm:mt-responsive-lg">
      <table
        className="w-full border-collapse text-xs sm:text-sm"
        style={{ tableLayout: "fixed" }}
      >
        <thead className="bg-beige/30">
          <tr>
            <th
              className="sticky left-0 bg-beige/30 px-responsive-sm py-responsive-sm text-left font-semibold text-black sm:px-4 sm:py-3"
              style={{ width: "25%" }}
            >
              Metric
            </th>
            {selectedReports.map((r) => {
              const colWidth =
                selectedReports.length >= 3
                  ? "min-w-[120px] sm:min-w-[140px]"
                  : "min-w-[150px] sm:min-w-[180px]";
              return (
                <th
                  key={r.id}
                  className={`px-responsive-sm py-responsive-sm text-left font-semibold text-black sm:px-4 sm:py-3 ${colWidth}`}
                >
                  <div className="truncate" title={r.address}>
                    {r.address}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {visibleMetrics.map((metric: string) => (
            <tr key={metric} className="odd:bg-beige/10 even:bg-white">
              <td
                className="sticky left-0 bg-white/80 px-responsive-sm py-responsive-sm font-medium text-black backdrop-blur sm:px-4"
                style={{ width: "25%" }}
              >
                {metric}
              </td>
              {selectedReports.map((r) => {
                const sanitize = (str: string) =>
                  (str ?? "").toLowerCase().replace(/\s+/g, "_");
                const row = comparisonTable.find(
                  (item: ComparisonRow) =>
                    sanitize(item.Address as string) === sanitize(r.address)
                );
                const value = row ? (row[metric] ?? "-") : "-";
                const colWidth =
                  selectedReports.length >= 3
                    ? "min-w-[120px] sm:min-w-[140px]"
                    : "min-w-[150px] sm:min-w-[180px]";
                return (
                  <td
                    key={r.id + metric}
                    className={`whitespace-pre-wrap px-responsive-sm py-responsive-sm text-black/90 sm:px-4 ${colWidth}`}
                  >
                    <div className="max-w-full overflow-hidden">{value}</div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
