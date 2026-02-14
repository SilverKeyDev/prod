import { secureClipboardCopy } from "../../../../../packages/services/security/clipboardSecurity";
import type { PropertyDetails, ComparisonField } from "./types";

export function generateCSVContent(
  comparisonData: PropertyDetails[],
  comparisonFields: ComparisonField[],
): string {
  const headers = [
    "Property",
    "Address",
    ...comparisonFields.map((f) => f.label),
  ];
  const rows = comparisonData.map((home) => [
    home.id,
    home.address,
    ...comparisonFields.map((field) => field.getValue(home)),
  ]);

  const csvRows = [headers, ...rows].map((r) =>
    r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
  );
  return csvRows.join("\n");
}

export async function exportToCSV(
  csvContent: string,
  onSuccess: () => void,
  onError: (message: string) => void,
) {
  try {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "homes_comparison.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onSuccess();
  } catch (error) {
    onError("Failed to export comparison");
  }
}

export async function shareCSV(
  csvContent: string,
  propertyCount: number,
  onSuccess: (message: string) => void,
  onError: (message: string) => void,
) {
  if (navigator.share) {
    try {
      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const file = new File([blob], "homes_comparison.csv", {
        type: "text/csv",
      });
      await navigator.share({
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
