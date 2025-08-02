import { useState, useEffect } from "react";

import { Check, Loader2, BarChart2, RefreshCw, Share, Settings, X, Download } from "lucide-react";
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

const ALL_METRIC_KEYS: string[] = [
  // Neighborhood Overview
  "Local Culture",
  "Neighborhood Vibe",
  "Known For",
  "Community Events",
  "What People Love",
  "Things to Watch Out For",
  "Population Total",
  "Neighborhood Rating",
  "LGBTQ Representation",

  // Demographics
  "Age Distribution",
  "Lifestyle DNA",

  // Safety
  "Crime Rating",
  "Places to Watch Out For",
  "Police Presence",
  "Safety Rating",

  // Culture and Events
  "Local Events",
  "Seasonal Trends",
  "Community Engagement",
  "Culture Rating",

  // Social Character
  "Income Level",
  "Religiosity",
  "Cultural Tone",
  "Social Rating",

  // Local Amenities - Restaurants
  "Restaurant 1 Name",
  "Restaurant 1 Vibe",
  "Restaurant 1 What to Try",
  "Restaurant 2 Name",
  "Restaurant 2 Vibe",
  "Restaurant 2 What to Try",
  "Restaurant 3 Name",
  "Restaurant 3 Vibe",
  "Restaurant 3 What to Try",

  // Local Amenities - Activities
  "Activity 1 Name",
  "Activity 1 Description",
  "Activity 2 Name",
  "Activity 2 Description",
  "Activity 3 Name",
  "Activity 3 Description",

  // Local Amenities - Parks
  "Park 1 Name",
  "Park 1 Features",
  "Park 2 Name",
  "Park 2 Features",
  "Park 3 Name",
  "Park 3 Features",

  // Local Amenities - Stores
  "Thrift Store Name",
  "Thrift Store Type",
  "Thrift Store Vibe",
  "Grocery Store Name",
  "Grocery Store Type",
  "Grocery Store Vibe",
  "Late Night Restaurant Name",
  "Late Night Restaurant Type",
  "Late Night Restaurant Vibe",

  // Commute
  "Commute Times",
  "Public Transport",
  "Traffic",
  "Walkability",

  // Family Friendly
  "Lots of Kids",
  "Great for Families",
  "Family Rating",

  // Nightlife and Dating
  "Nightlife Rating",
  "Nightlife Score",
  "Best Spots",
  "Dating Scene",
  "Tinder Popularity",
  "Hinge Popularity",

  // Development
  "Upcoming Changes",
  "Zoning or Construction",
  "Gentrification Signs",
  "Vacancy or Decay",

  // Environment and Utilities
  "Air Quality",
  "Noise Pollution",
  "Light Pollution",
  "Water Quality",
  "Electric Costs",
  "Gas Costs",
  "Water Costs",
  "Internet Speed",
  "Environmental Rating",

  // Financial Information
  "Monthly Payment",
  "Property Taxes",
  "Value Assessment",
  "Investment Potential",
  "Financial Rating",

  // Schools (Elementary)
  "Elementary Known For",

  // Schools (Middle)
  "Middle Known For",

  // Schools (High)
  "High Known For",

  // Extra Tips
  "Parking",
  "Pet Friendly",
  "Cell Service Quality",
  "Other Notable Tips",
];

export default function CompareReportsPage() {
  // Use preloaded data from context
  const { compareReports, compareReportsError, refreshCompareReports } =
    useData();

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
  const [showRowModal, setShowRowModal] = useState(false);
  const [comparisonTable, setComparisonTable] = useState<any[]>([]);
  const [omittedRows, setOmittedRows] = useState<Set<string>>(new Set());
  const [manuallyEnabledRows, setManuallyEnabledRows] = useState<Set<string>>(new Set());

  // Helper function to check if a row has any data for selected properties
  const hasDataForAnyProperty = (metric: string) => {
    if (selectedReports.length === 0 || comparisonTable.length === 0) {
      return false;
    }
    
    return selectedReports.some((report) => {
      const sanitize = (str: string) => (str || "").toLowerCase().replace(/\s+/g, "_");
      const row = comparisonTable.find(
        (item: any) => sanitize(item.Address) === sanitize(report.address)
      );
      const value = row ? (row as any)[metric] : null;
      // Consider a row to have data if it's not null, undefined, empty string, or just "-"
      return value != null && value !== "" && value !== "-" && String(value).trim() !== "";
    });
  };

  // Auto-omit rows that have no data unless manually enabled
  const getAutoOmittedRows = () => {
    const autoOmitted = new Set<string>();
    ALL_METRIC_KEYS.forEach((metric) => {
      if (!hasDataForAnyProperty(metric) && !manuallyEnabledRows.has(metric)) {
        autoOmitted.add(metric);
      }
    });
    return autoOmitted;
  };

  // Combine manually omitted rows with auto-omitted rows
  const allOmittedRows = new Set([...omittedRows, ...getAutoOmittedRows()]);

  // Get visible metrics (all metrics minus omitted ones)
  const visibleMetrics = ALL_METRIC_KEYS.filter(
    (metric) => !allOmittedRows.has(metric)
  );

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
    const rows = visibleMetrics.map((metric: string) => {
      const values = selectedReports.map((r) => {
        const row = comparisonTable.find(
          (item: any) => sanitize(item.Address) === sanitize(r.address)
        );
        return row ? (row as any)[metric] ?? "-" : "-";
      });
      return [metric, ...values];
    });
    const csvRows = [header, ...rows].map((r) =>
      r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(",")
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
    const rows = visibleMetrics.map((metric: string) => {
      const values = selectedReports.map((r) => {
        const row = comparisonTable.find(
          (item: any) => sanitize(item.Address) === sanitize(r.address)
        );
        return row ? (row as any)[metric] ?? "-" : "-";
      });
      return [metric, ...values];
    });
    const csvRows = [header, ...rows].map((r) =>
      r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(",")
    );
    const csvContent = csvRows.join("\n");

    if (navigator.share) {
      try {
        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
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
      navigator.clipboard
        .writeText(shareText)
        .then(() => {
          setToastMessage("Share link copied to clipboard");
          setShowSuccess(true);
        })
        .catch(() => {
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
                  onClick={() => setSelectedReports([])}
                  disabled={selectedReports.length === 0}
                  className="flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-black/70 bg-gray-100 border border-gray-300 hover:bg-gray-200 hover:border-gray-400 rounded-lg transition-colors disabled:bg-gray-200 disabled:text-gray-500 disabled:border-transparent disabled:cursor-not-allowed touch-friendly"
                >
                <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Clear</span>
              </button>
              <button
                onClick={exportToExcel}
                disabled={
                  selectedReports.length === 0 || comparisonTable.length === 0
                }
                className="flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-olive hover:bg-olive-light rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-friendly"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
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
                ...(reports.length > 9
                  ? {
                      scrollbarWidth: "thin",
                      scrollbarColor: "#E8D5B560 #f3f4f6",
                    }
                  : {}),
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
                            {report.address
                              .replace(/_/g, " ")
                              .slice(0, -18)
                              .trim()}
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

        {/* Row Omission Controls Button */}
        <div className="mobile-card mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
            <div>
              <h3 className="text-lg font-medium text-black mb-1">
                Customize Comparison
              </h3>
              <p className="text-sm text-black/60">
                Showing {visibleMetrics.length} of {ALL_METRIC_KEYS.length} metrics
              </p>
            </div>
            <button
              onClick={() => setShowRowModal(true)}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-brown hover:bg-brown/80 rounded-lg transition-colors touch-friendly"
            >
              <Settings className="h-4 w-4 mr-2" />
              Manage Rows
            </button>
          </div>
        </div>

        {/* Comparison Table */}
        {selectedReports.length > 0 && (
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
              {visibleMetrics.map((metric: string) => (
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
                        <div className="max-w-full overflow-hidden">
                          {value}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}

        {/* Selection summary */}
        {selectedReports.length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-black/70">
              {selectedReports.length}{" "}
              {selectedReports.length === 1 ? "property" : "properties"}{" "}
              selected
            </p>
            <button
              onClick={() => setSelectedReports([])}
              className="mt-1 sm:mt-2 text-sm text-black/70 hover:text-black underline py-0.5 sm:py-1 touch-friendly"
            >
              Clear selection
            </button>
          </div>
        )}

        {/* Row Management Modal */}
        {showRowModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-xl font-semibold text-black">
                    Manage Comparison Rows
                  </h2>
                  <p className="text-sm text-black/60 mt-1">
                    Select which metrics to include in your comparison table
                  </p>
                </div>
                <button
                  onClick={() => setShowRowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-black/60" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-hidden p-6">
                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <button
                    onClick={() => {
                      setOmittedRows(new Set());
                      setManuallyEnabledRows(new Set(ALL_METRIC_KEYS));
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-olive hover:bg-olive-light rounded-lg transition-colors"
                  >
                    Show All ({ALL_METRIC_KEYS.length})
                  </button>
                  <button
                    onClick={() => {
                      setOmittedRows(new Set(ALL_METRIC_KEYS));
                      setManuallyEnabledRows(new Set());
                    }}
                    className="px-4 py-2 text-sm font-medium text-black bg-beige hover:bg-beige/80 rounded-lg transition-colors"
                  >
                    Hide All
                  </button>
                  <button
                    onClick={() => {
                      setOmittedRows(new Set());
                      setManuallyEnabledRows(new Set());
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-brown hover:bg-brown/80 rounded-lg transition-colors"
                  >
                    Auto-Hide Empty
                  </button>
                  <div className="px-4 py-2 text-sm text-black/60 bg-gray-100 rounded-lg">
                    Showing: {visibleMetrics.length} / {ALL_METRIC_KEYS.length} metrics
                  </div>
                </div>

                {/* Metrics List */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="max-h-96 overflow-y-auto custom-scrollbar">
                    {ALL_METRIC_KEYS.map((metric, index) => {
                      const isManuallyOmitted = omittedRows.has(metric);
                      const isAutoOmitted = !hasDataForAnyProperty(metric) && !manuallyEnabledRows.has(metric);
                      const isOmitted = isManuallyOmitted || isAutoOmitted;
                      const hasData = hasDataForAnyProperty(metric);
                      
                      return (
                        <label
                          key={metric}
                          className={`flex items-center space-x-3 p-4 cursor-pointer transition-colors hover:bg-beige/20 ${
                            index !== ALL_METRIC_KEYS.length - 1 ? 'border-b border-gray-100' : ''
                          }`}
                        >
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={!isOmitted}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  // Enable the row
                                  const newOmittedRows = new Set(omittedRows);
                                  newOmittedRows.delete(metric);
                                  setOmittedRows(newOmittedRows);
                                  
                                  // If it was auto-omitted, mark as manually enabled
                                  if (!hasData) {
                                    const newManuallyEnabled = new Set(manuallyEnabledRows);
                                    newManuallyEnabled.add(metric);
                                    setManuallyEnabledRows(newManuallyEnabled);
                                  }
                                } else {
                                  // Disable the row
                                  const newOmittedRows = new Set(omittedRows);
                                  newOmittedRows.add(metric);
                                  setOmittedRows(newOmittedRows);
                                  
                                  // Remove from manually enabled if it was there
                                  const newManuallyEnabled = new Set(manuallyEnabledRows);
                                  newManuallyEnabled.delete(metric);
                                  setManuallyEnabledRows(newManuallyEnabled);
                                }
                              }}
                              className="sr-only"
                            />
                            <div className={`w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center ${
                              !isOmitted
                                ? 'bg-brown border-brown text-white shadow-sm'
                                : 'border-beige hover:border-brown/50 bg-white'
                            }`}>
                              {!isOmitted && (
                                <Check className="w-3 h-3 fill-current" />
                              )}
                            </div>
                          </div>
                          <div className="flex-1">
                            <span
                              className={`text-sm font-medium transition-colors ${
                                isOmitted
                                  ? "text-black/40 line-through"
                                  : "text-black"
                              }`}
                            >
                              {metric}
                            </span>
                            {isAutoOmitted && (
                              <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full ml-2">
                                auto-hidden: no data
                              </span>
                            )}
                            {!hasData && manuallyEnabledRows.has(metric) && (
                              <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full ml-2">
                                manually enabled
                              </span>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowRowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-black bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowRowModal(false);
                    setToastMessage(`Updated comparison to show ${visibleMetrics.length} metrics`);
                    setShowSuccess(true);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-brown hover:bg-brown/80 rounded-lg transition-colors"
                >
                  Apply Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
