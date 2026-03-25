import type {
  CompareHomesComparisonField,
  CompareHomesPropertyDetails,
} from "packages/features/compare/types/compareHomes";
import { secureClipboardCopy } from "packages/services/security/clipboardSecurity";
import { createBlob, createFile, getDocument, getNavigator } from "packages/utils/platform";

export function generateCSVContent(
  comparisonData: CompareHomesPropertyDetails[],
  comparisonFields: CompareHomesComparisonField[]
): string {
  const headers = ["Property", "Address", ...comparisonFields.map((f) => f.label)];
  const rows = comparisonData.map((home) => [
    home.id,
    home.address,
    ...comparisonFields.map((field) => field.getValue(home)),
  ]);

  const csvRows = [headers, ...rows].map((r) =>
    r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
  );
  return csvRows.join("\n");
}

export async function exportToCSV(
  csvContent: string,
  onSuccess: () => void,
  onError: (message: string) => void
) {
  try {
    const blob = createBlob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const doc = getDocument();
    if (!doc) {
      onError("Failed to export comparison");
      return;
    }
    const link = doc.createElement("a");
    link.href = url;
    link.setAttribute("download", "homes_comparison.csv");
    doc.body.appendChild(link);
    link.click();
    doc.body.removeChild(link);
    onSuccess();
  } catch {
    onError("Failed to export comparison");
  }
}

export async function shareCSV(
  csvContent: string,
  propertyCount: number,
  onSuccess: (message: string) => void,
  onError: (message: string) => void
) {
  const nav = getNavigator();
  if (nav?.share) {
    try {
      const blob = createBlob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const file = createFile([blob], "homes_comparison.csv", {
        type: "text/csv",
      });
      await nav.share({
        title: "Homes Comparison",
        text: `Comparison of ${propertyCount} properties`,
        files: [file],
      });
      onSuccess("CSV shared successfully");
    } catch (error: unknown) {
      if ((error as Error).name !== "AbortError") {
        const success = await secureClipboardCopy(csvContent);
        if (success) {
          onSuccess("Comparison data copied to clipboard");
        } else {
          onError("Unable to share comparison");
        }
      }
    }
  } else {
    const success = await secureClipboardCopy(csvContent);
    if (success) {
      onSuccess("Comparison data copied to clipboard");
    } else {
      onError("Unable to share comparison");
    }
  }
}
