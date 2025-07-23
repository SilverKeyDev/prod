import { useState, useEffect } from "react";

import { Check, Loader2, BarChart2, RefreshCw, Share } from "lucide-react";
import ErrorToast from "../components/ErrorToast";
import SuccessToast from "../components/SuccessToast";
import { useData } from "../contexts/DataContext";

// Custom scrollbar styles
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    margin-left: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f3f4f6;
    border-radius: 3px;
    margin-left: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #E8D5B560; /* Lighter brown with 60% opacity */
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #E8D5B580; /* Slightly darker on hover with 80% opacity */
  }
  .custom-scrollbar {
    padding-right: 8px;
  }
`;

interface Report {
  id: string;
  address: string;
  status: "generating" | "completed" | "error";
  pdfUrl?: string | null;
  s3Key?: string | null;
  // Add more report fields as needed
  price?: number;
  squareFootage?: number;
  yearBuilt?: number;
  propertyType?: string;
  estimatedValue?: number;
  neighborhoodScore?: number;
  schoolScore?: number;
  // Add more fields as needed
}

const METRIC_KEYS: string[] = [
  "Neighborhood Vibe",
  "Community Events",
  "Neighborhood Rating",
  "Crime Rating",
  "Accessibility Rating",
  "Wheelchair Friendly",
  "Development",
  "Gentrification",
  "Culture Rating",
  "Seasonal Trends",
  "Environmental Rating",
  "Air Quality",
  "Internet Speed",
  "Social Rating",
  "Income Level",
  "Religiosity",
  "Financial Rating",
  "Monthly Rent",
  "Commute",
  "Family Rating",
  "Family Notes",
  "Nightlife Score",
  "Dating Scene",
  "Pet Friendly",
  "Cell Service",
];

export default function CompareReportsPage() {
  // Use preloaded data from context
  const { compareReports, compareReportsError, refreshCompareReports } = useData();
  
  // Refresh data when page loads to ensure latest updates
  useEffect(() => {
    refreshCompareReports();
  }, [refreshCompareReports]);
  
  // Alias for compatibility with existing code
  const reports = compareReports;
  
  const [selectedReports, setSelectedReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Only for comparison loading
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [comparisonTable, setComparisonTable] = useState<any[]>([]);

  // Removed fetchReports - now using preloaded data from context
  // Helper to compare
  // Fetch comparison data whenever selection changes (2-5 selected)
  const fetchComparison = async (keys: string[]) => {
    if (keys.length === 0) {
      setToastMessage("Select a report to view");
      setShowError(true);
      return;
    }
    try {
      setIsLoading(true);
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const res = await fetch(`${baseUrl}/api/v1/report/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ s3Keys: keys }),
      });
      const json = await res.json();
      if (json.success) {
        console.log("Comparison table received:", json.table);
        setComparisonTable(json.table);
      } else {
        throw new Error(json.error || "Comparison failed");
      }
    } catch (error) {
      console.error(error);
      setToastMessage(
        error instanceof Error ? error.message : "Comparison failed"
      );
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Update comparison whenever selectedReports changes
  useEffect(() => {
    const toJsonKey = (key: string) => {
      if (!key) return "";

      // If it's already a JSON key, return it directly.
      if (key.endsWith(".json")) return key;

      // Otherwise, derive the JSON key from the PDF key.
      const baseName = key.replace(/^reports\//, "").replace(/\.pdf$/, "");

      return `reports/${baseName}.json`;
    };
    const keys = selectedReports.map((r) => toJsonKey(r.s3Key || ""));
    if (keys.length > 0) {
      fetchComparison(keys);
    } else {
      setComparisonTable([]);
    }
  }, [selectedReports]);

  // Data is already preloaded by context - no need to fetch

  const toggleReportSelection = (report: Report, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setSelectedReports((prev) => {
      const isSelected = prev.some((r) => r.id === report.id);
      if (isSelected) {
        return prev.filter((r) => r.id !== report.id);
      } else {
        return [...prev, report];
      }
    });
  };

  // Export comparison table to CSV
  const exportToExcel = () => {
    if (selectedReports.length === 0 || comparisonTable.length === 0) {
      setToastMessage("Select properties to export");
      setShowError(true);
      return;
    }
    const header = ["Metric", ...selectedReports.map((r) => r.address)];
    const sanitize = (str: string) =>
      (str || "").toLowerCase().replace(/\s+/g, "_");
    const rows = METRIC_KEYS.map((metric) => {
      const values = selectedReports.map((r) => {
        const row = comparisonTable.find(
          (item: any) => sanitize(item.Address) === sanitize(r.address)
        );
        return row ? (row as any)[metric] ?? "-" : "-";
      });
      return [metric, ...values];
    });
    const csvRows = [header, ...rows].map((r) =>
      r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
    );
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "property_comparison.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Share comparison CSV
  const shareCSV = async () => {
    if (selectedReports.length === 0 || comparisonTable.length === 0) {
      setToastMessage("Select properties to share");
      setShowError(true);
      return;
    }

    const header = ["Metric", ...selectedReports.map((r) => r.address)];
    const sanitize = (str: string) =>
      (str || "").toLowerCase().replace(/\s+/g, "_");
    const rows = METRIC_KEYS.map((metric) => {
      const values = selectedReports.map((r) => {
        const row = comparisonTable.find(
          (item: any) => sanitize(item.Address) === sanitize(r.address)
        );
        return row ? (row as any)[metric] ?? "-" : "-";
      });
      return [metric, ...values];
    });
    const csvRows = [header, ...rows].map((r) =>
      r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
    );
    const csvContent = csvRows.join("\n");

    if (navigator.share) {
      try {
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const file = new File([blob], "property_comparison.csv", {
          type: "text/csv",
        });
        await navigator.share({
          title: "Property Comparison Report",
          text: `Comparison of ${selectedReports.length} properties`,
          files: [file],
        });
        setToastMessage("CSV shared successfully");
        setShowSuccess(true);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Error sharing CSV:", error);
          // Fallback to copy link
          fallbackShareCSV(csvContent);
        }
      }
    } else {
      // Fallback for browsers without Web Share API
      fallbackShareCSV(csvContent);
    }
  };

  const fallbackShareCSV = (csvContent: string) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const shareText = `Property Comparison Report: ${url}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText).then(() => {
        setToastMessage("Share link copied to clipboard");
        setShowSuccess(true);
      }).catch(() => {
        setToastMessage("Unable to share CSV. Please use Export instead.");
        setShowError(true);
      });
    } else {
      setToastMessage("Sharing not supported. Please use Export instead.");
      setShowError(true);
    }
  };

  const refreshReports = async () => {
    try {
      await refreshCompareReports();
      setToastMessage("Reports refreshed successfully");
      setShowSuccess(true);
    } catch (error) {
      console.error("Failed to refresh reports:", error);
      setToastMessage(
        error instanceof Error ? error.message : "Failed to refresh reports"
      );
      setShowError(true);
    }
  };
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />
      <div className="max-w-7xl mx-auto mobile-padding py-6 sm:py-8">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-serif text-black mb-3 sm:mb-4 px-2">
          Compare Properties
        </h1>
        <p className="text-base sm:text-lg text-black/60 max-w-3xl mx-auto px-2">
          Select properties to compare their details side by side
        </p>
      </div>

      {/* Error Toast */}
      {showError && (
        <ErrorToast
          message={toastMessage || compareReportsError || "An error occurred"}
          onClose={() => setShowError(false)}
          duration={5000}
        />
      )}

      {/* Success Toast */}
      {showSuccess && (
        <SuccessToast
          message={toastMessage}
          onClose={() => setShowSuccess(false)}
          duration={3000}
        />
      )}

      {/* Reports Selection */}
      <div className="mobile-card mb-20 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
          <div>
            <h2 className="text-lg sm:text-xl font-medium text-black">
              Your Property Reports
            </h2>
            <p className="text-xs sm:text-sm text-black/60 mt-1">
              {selectedReports.length} of {reports.length} selected
            </p>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={exportToExcel}
              disabled={
                selectedReports.length === 0 || comparisonTable.length === 0
              }
              className="flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-olive hover:bg-olive-light rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-friendly"
            >
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">CSV</span>
            </button>
            <button
              onClick={shareCSV}
              disabled={
                selectedReports.length === 0 || comparisonTable.length === 0
              }
              className="flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-black bg-beige hover:bg-beige/80 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-friendly"
            >
              <Share className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Share CSV</span>
              <span className="sm:hidden">Share</span>
            </button>
            <button
              onClick={refreshReports}
              disabled={isLoading}
              className="flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-black bg-beige/30 hover:bg-beige/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-friendly"
            >
              <RefreshCw
                className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${
                  isLoading ? "animate-spin" : ""
                }`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-8 sm:py-12">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-black" />
          </div>
        ) : compareReportsError ? (
          <div className="text-center py-6 sm:py-8 text-black/60">
            <p className="text-sm sm:text-base">No reports yet</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <BarChart2 className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-black/30 mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-black mb-2">
              No reports found
            </h3>
            <p className="text-sm sm:text-base text-black/60 mb-4 sm:mb-6 px-4">
              Generate your first property report to get started
            </p>
          </div>
        ) : (
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 ${
              reports.length > 9 ? "overflow-y-auto custom-scrollbar" : ""
            }`}
            style={{
              ...(reports.length > 9 ? { maxHeight: "16rem" } : {}),
              ...(reports.length > 9 ? {
                scrollbarWidth: 'thin',
                scrollbarColor: '#E8D5B560 #f3f4f6'
              } : {})
            }}
          >
            {reports.map((report) => {
              const isSelected = selectedReports.some(
                (r) => r.id === report.id
              );
              return (
                <div
                  key={report.id}
                  onClick={(e) => toggleReportSelection(report, e)}
                  onMouseDown={(e) => e.preventDefault()} // Prevent focus/highlight on click
                  className={`p-3 sm:p-4 border-2 rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-200 select-none touch-manipulation ${
                    isSelected
                      ? "border-olive bg-olive/5 sm:ring-2 sm:ring-olive/30"
                      : "border-gray-200 hover:border-olive/50 hover:bg-olive/5"
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-1 min-w-0 pr-2 sm:pr-3">
                      <div className="flex-1 min-w-0 pr-2 sm:pr-3">
                        <h3
                          className="text-sm sm:text-base font-medium text-black leading-tight sm:leading-5 overflow-hidden"
                          title={report.address}
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical" as "vertical",
                            wordBreak: "break-word",
                            hyphens: "auto",
                          }}
                        >
                          {report.address.replace(/_/g, " ").slice(0, -18).trim()}
                        </h3>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {isSelected ? (
                        <div className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 rounded-full bg-olive flex items-center justify-center touch-manipulation select-none">
                          <Check className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 text-white" />
                        </div>
                      ) : (
                        <div className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 rounded-full border-2 border-navy/30 touch-manipulation select-none" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Comparison Table */}
      <div className="mt-6 sm:mt-10 w-full overflow-x-auto scrollbar-hide border rounded-lg">
        <table className="min-w-full text-xs border-collapse">
          <thead className="bg-beige/30">
            <tr>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-black sticky left-0 bg-beige/30 text-xs">
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
                    className={`px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-black text-xs ${colWidth}`}
                  >
                    <div className="truncate" title={r.address}>
                      {(() => {
                        const formattedAddress = r.address.replace(/_/g, " ");
                        return formattedAddress
                          .substring(0, formattedAddress.length - 18)
                          .trim();
                      })()}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {METRIC_KEYS.map((metric) => (
              <tr key={metric} className="even:bg-white odd:bg-beige/10">
                <td className="px-2 sm:px-4 py-2 font-medium text-black sticky left-0 bg-white/80 backdrop-blur text-xs">
                  {metric}
                </td>
                {selectedReports.map((r) => {
                  const sanitize = (str: string) =>
                    (str || "").toLowerCase().replace(/\s+/g, "_");
                  const row = comparisonTable.find(
                    (item: any) =>
                      sanitize(item.Address) === sanitize(r.address)
                  );
                  const value = row ? (row as any)[metric] ?? "-" : "-";
                  const colWidth =
                    selectedReports.length >= 3
                      ? "min-w-[120px] sm:min-w-[140px]"
                      : "min-w-[150px] sm:min-w-[180px]";
                  return (
                    <td
                      key={r.id + metric}
                      className={`px-2 sm:px-4 py-2 text-black/90 whitespace-pre-wrap text-xs ${colWidth}`}
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

      {/* Selection summary */}
      {true && (
        <div className="mt-6 text-center">
          <p className="text-black/70">
            {selectedReports.length}{" "}
            {selectedReports.length === 1 ? "property" : "properties"} selected
          </p>
          <button
            onClick={() => setSelectedReports([])}
            className="mt-1 sm:mt-2 text-sm text-black/70 hover:text-black underline py-0.5 sm:py-1 touch-friendly"
          >
            Clear selection
          </button>
        </div>
      )}
      </div>
    </>
  );
}
