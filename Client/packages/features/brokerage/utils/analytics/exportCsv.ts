/**
 * Shared CSV download helper for brokerage analytics panels.
 */
import { createBlob, getDocument } from "packages/utils/core/platform";

export function exportAnalyticsCsv(
  filename: string,
  headers: string[],
  rows: (string | number)[][]
): void {
  const lines = rows.map((row) => row.join(","));
  const csv = [headers.join(","), ...lines].join("\n");
  const doc = getDocument();
  if (!doc) return;
  const blob = createBlob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = doc.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
