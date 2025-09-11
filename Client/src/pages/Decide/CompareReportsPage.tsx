// React imports
import React, { useState, useEffect } from "react";

// Third-party UI icons
import {
  Download,
  Share,
  BarChart2,
  Check,
  X,
  RefreshCw,
  Settings,
} from "lucide-react";

// Services
import { ReportComparisonService } from "../../services";

// Types
import { Report, ALL_METRIC_KEYS } from "../../types";

// UI Components
import { Title, Subtitle } from "../../components/ui";
import { Card } from "../../components/layout";

// Feedback components
import ErrorToast from "../../components/feedback/ErrorToast";
import SuccessToast from "../../components/feedback/SuccessToast";

// Utility functions
import { secureClipboardCopy } from "../../lib/security/clipboardSecurity";
import { log } from "../../lib/security/secureLogger";
import { captureError } from "../../lib/security/errorReporting";
import { formatFilenameToAddress } from "../../lib/addressFormat";

// Context imports
import { useCompareReports } from "../../context/ReportsContext";

export default function CompareReportsPage() {
  // Use Reports context for reports management
  const { compareReports, refreshCompareReports } = useCompareReports();

  // Refresh data when page loads to ensure latest updates
  useEffect(() => {
    refreshCompareReports();
  }, [refreshCompareReports]);

  // Backend now filters to only return standard ('detailed') reports
  const reports = compareReports || [];

  const [selectedReports, setSelectedReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Only for comparison loading
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showRowModal, setShowRowModal] = useState(false);
  const [comparisonTable, setComparisonTable] = useState<any[]>([]);
  const [omittedRows, setOmittedRows] = useState<Set<string>>(new Set());
  const [manuallyEnabledRows, setManuallyEnabledRows] = useState<Set<string>>(
    new Set(),
  );

  // Load comparison state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem("compareReportsState");
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.selectedReports) {
          setSelectedReports(parsed.selectedReports);
        }
        if (parsed.omittedRows) {
          setOmittedRows(new Set(parsed.omittedRows));
        }
        if (parsed.manuallyEnabledRows) {
          setManuallyEnabledRows(new Set(parsed.manuallyEnabledRows));
        }
      } catch (e) {
        console.warn("Invalid compare reports state data");
      }
    }
  }, []);

  // Save comparison state to localStorage when it changes
  useEffect(() => {
    const stateToSave = {
      selectedReports,
      omittedRows: Array.from(omittedRows),
      manuallyEnabledRows: Array.from(manuallyEnabledRows),
    };
    localStorage.setItem("compareReportsState", JSON.stringify(stateToSave));
  }, [selectedReports, omittedRows, manuallyEnabledRows]);

  // Helper function to check if a row has any data for selected properties
  const hasDataForAnyProperty = (metric: string) => {
    if (selectedReports.length === 0 || comparisonTable.length === 0) {
      return false;
    }

    return selectedReports.some((report) => {
      const sanitize = (str: string) =>
        (str || "").toLowerCase().replace(/\s+/g, "_");
      const row = comparisonTable.find(
        (item: unknown) => sanitize(item.Address) === sanitize(report.address),
      );
      const value = row ? (row as any)[metric] : null;
      // Consider a row to have data if it's not null, undefined, empty string, or just "-"
      return (
        value != null &&
        value !== "" &&
        value !== "-" &&
        String(value).trim() !== ""
      );
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
    (metric) => !allOmittedRows.has(metric),
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

    // Validate keys before proceeding
    if (!ReportComparisonService.validateComparisonKeys(keys)) {
      setToastMessage("Invalid report keys provided");
      setShowError(true);
      return;
    }

    try {
      setIsLoading(true);
      const response = await ReportComparisonService.compareReports(
        keys,
        selectedReports.map((r) => r.id),
      );

      if (response.success && response.table) {
        setComparisonTable(response.table);
      } else {
        throw new Error(response.error || "Comparison failed");
      }
    } catch (error) {
      console.error(error);
      setToastMessage(
        error instanceof Error ? error.message : "Comparison failed",
      );
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Update comparison whenever selectedReports changes
  useEffect(() => {
    const pdfKeys = selectedReports.map((r) => r.s3Key || "");
    const jsonKeys = ReportComparisonService.transformToJsonKeys(pdfKeys);

    if (jsonKeys.length > 0) {
      fetchComparison(jsonKeys);
    } else {
      setComparisonTable([]);
    }
  }, [selectedReports]);

  // Data is already preloaded by context - no need to fetch

  const toggleReportSelection = (report: Report, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Set loading state when toggling selection since it triggers comparison fetch
    setIsLoading(true);

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
          (item: unknown) => sanitize(item.Address) === sanitize(r.address),
        );
        return row ? ((row as any)[metric] ?? "-") : "-";
      });
      return [metric, ...values];
    });
    const csvRows = [header, ...rows].map((r) =>
      r.map((v: unknown) => `"${String(v).replace(/"/g, '""')}"`).join(","),
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
          (item: unknown) => sanitize(item.Address) === sanitize(r.address),
        );
        return row ? ((row as any)[metric] ?? "-") : "-";
      });
      return [metric, ...values];
    });
    const csvRows = [header, ...rows].map((r) =>
      r.map((v: unknown) => `"${String(v).replace(/"/g, '""')}"`).join(","),
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

  const fallbackShareCSV = async (csvContent: string) => {
    try {
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const shareText = `Property Comparison Report: ${url}`;

      const success = await secureClipboardCopy(shareText, "csv-share");
      if (success) {
        log.info("COMPARE_REPORTS", "CSV share link copied to clipboard");
        setToastMessage("Share link copied to clipboard");
        setShowSuccess(true);
      } else {
        setToastMessage("Unable to share CSV. Please use Export instead.");
        setShowError(true);
      }
    } catch (error) {
      log.error("COMPARE_REPORTS", "Failed to share CSV", error);
      captureError(error, { context: "fallbackShareCSV" });
      setToastMessage("Unable to share CSV. Please use Export instead.");
      setShowError(true);
    }
  };

  const refreshReportsData = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement actual report fetching when context is available
      setToastMessage("Reports refreshed successfully");
      setShowSuccess(true);
    } catch (error) {
      console.error("❌ Failed to refresh reports:", error);

      setToastMessage(
        error instanceof Error ? error.message : "Failed to refresh reports",
      );
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="overflow-x-auto">
        {/* Error Toast */}
        {showError && (
          <ErrorToast
            message={toastMessage || "An error occurred"}
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
        <Card className="mb-20 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-6 sm:space-y-0 mb-3">
            <div className="hidden sm:block">
              <Title size="md" className="font-medium">
                Your Property Reports
              </Title>
              <Subtitle size="xs" muted className="mt-1 mb-2">
                {selectedReports.length} of {reports.length} selected
              </Subtitle>
            </div>
            <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-2 sm:gap-3"></div>
            <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-2 sm:gap-3">
              <button
                onClick={() => setSelectedReports([])}
                disabled={selectedReports.length === 0}
                className="flex items-center justify-center sm:justify-start px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-black/70 bg-gray-100 border border-gray-300 hover:bg-gray-200 hover:border-gray-400 rounded-lg transition-colors disabled:bg-gray-200 disabled:text-gray-500 disabled:border-transparent disabled:cursor-not-allowed touch-friendly"
              >
                <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="ml-2 text-xs sm:text-sm font-normal tracking-tight">
                  Clear
                </span>
              </button>
              <button
                onClick={exportToExcel}
                disabled={
                  selectedReports.length === 0 || comparisonTable.length === 0
                }
                className="flex items-center justify-center sm:justify-start px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-olive hover:bg-olive-light rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-friendly"
              >
                <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="ml-2 text-xs sm:text-sm">Export</span>
              </button>
              <button
                onClick={shareCSV}
                disabled={
                  selectedReports.length === 0 || comparisonTable.length === 0
                }
                className="flex items-center justify-center sm:justify-start px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-100 bg-beige hover:bg-beige/80 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-friendly"
              >
                <Share className="w-4 h-4" />
                <span className="ml-2 text-xs sm:text-sm">Share</span>
              </button>
              <button
                onClick={refreshReportsData}
                disabled={isLoading}
                className="flex items-center justify-center sm:justify-start px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-black/70 bg-beige/30 hover:bg-beige/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-friendly"
              >
                {isLoading ? (
                  <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                )}
                {!isLoading && (
                  <span className="ml-2 text-xs sm:text-sm">Refresh</span>
                )}
              </button>
            </div>
          </div>

          {reports.length === 0 ? (
            <div className="text-center py-responsive-lg">
              <BarChart2 className="mobile-icon-lg mx-auto text-black/30 space-y-responsive-sm" />
              <Title size="sm" className="font-medium space-y-responsive-xs">
                No reports found
              </Title>
              <Subtitle
                size="sm"
                muted
                className="space-y-responsive-sm px-responsive-sm"
              >
                Generate your first property report to get started
              </Subtitle>
            </div>
          ) : (
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-responsive-sm ${
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
              {reports.map((report: Report) => {
                const isSelected = selectedReports.some(
                  (r) => r.id === report.id,
                );
                return (
                  <div
                    key={report.id}
                    onClick={(e) => {
                      if (!isLoading) {
                        toggleReportSelection(report, e);
                      }
                    }}
                    onMouseDown={(e) => e.preventDefault()} // Prevent focus/highlight on click
                    className={`p-2 sm:p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 select-none touch-manipulation ${
                      isLoading
                        ? "opacity-50 cursor-wait"
                        : isSelected
                          ? "border-olive bg-olive/5 sm:ring-2 sm:ring-olive/30"
                          : "border-gray-200 hover:border-olive/50 hover:bg-olive/5"
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex-1 min-w-0 pr-2">
                          <h3
                            className="text-xs sm:text-sm font-medium text-black leading-tight overflow-hidden"
                            title={report.address}
                            style={{
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical" as const,
                              wordBreak: "break-word",
                              hyphens: "auto",
                            }}
                          >
                            {formatFilenameToAddress(report.address)}
                          </h3>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Row Omission Controls Button */}
        <Card className="mb-6 mt-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
            <div>
              <Title size="md" className="font-medium">
                Customize Comparison
              </Title>
              <Subtitle size="sm" muted className="mt-1">
                Showing {visibleMetrics.length} of {ALL_METRIC_KEYS.length}{" "}
                metrics
              </Subtitle>
            </div>
            <button
              onClick={() => setShowRowModal(true)}
              className="flex items-center px-responsive-sm py-responsive-xs text-responsive-sm font-medium text-white bg-brown hover:bg-brown/80 rounded-lg transition-colors touch-friendly"
            >
              <Settings className="h-4 w-4 mr-2" />
              <span className="text-sm font-normal tracking-tight">
                Manage Rows
              </span>
            </button>
          </div>
        </Card>

        {/* Comparison Table */}
        {selectedReports.length > 0 && (
          <div className="mt-6 sm:mt-10 w-full overflow-x-auto scrollbar-hide border rounded-lg">
            <table
              className="w-full text-xs border-collapse"
              style={{ tableLayout: "fixed" }}
            >
              <thead className="bg-beige/30">
                <tr>
                  <th
                    className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-black sticky left-0 bg-beige/30 text-xs"
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
                        className={`px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-black text-xs ${colWidth}`}
                      >
                        <div className="truncate" title={r.address}>
                          {formatFilenameToAddress(r.address)}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {visibleMetrics.map((metric: string) => (
                  <tr key={metric} className="even:bg-white odd:bg-beige/10">
                    <td
                      className="px-2 sm:px-4 py-2 font-medium text-black sticky left-0 bg-white/80 backdrop-blur text-xs"
                      style={{ width: "25%" }}
                    >
                      {metric}
                    </td>
                    {selectedReports.map((r) => {
                      const sanitize = (str: string) =>
                        (str || "").toLowerCase().replace(/\s+/g, "_");
                      const row = comparisonTable.find(
                        (item: unknown) =>
                          sanitize(item.Address) === sanitize(r.address),
                      );
                      const value = row ? ((row as any)[metric] ?? "-") : "-";
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
              className="mt-1 sm:mt-2 text-sm text-black/70 hover:text-black underline py-0.5 sm:py-1 touch-friendly font-normal tracking-tight"
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
                  <Title size="md" className="font-semibold">
                    Manage Comparison Rows
                  </Title>
                  <Subtitle size="xs" muted className="mt-1">
                    Select which metrics to include in your comparison table
                  </Subtitle>
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
                    Showing: {visibleMetrics.length} / {ALL_METRIC_KEYS.length}{" "}
                    metrics
                  </div>
                </div>

                {/* Metrics List */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="max-h-96 overflow-y-auto custom-scrollbar">
                    {ALL_METRIC_KEYS.map((metric, index) => {
                      const isManuallyOmitted = omittedRows.has(metric);
                      const isAutoOmitted =
                        !hasDataForAnyProperty(metric) &&
                        !manuallyEnabledRows.has(metric);
                      const isOmitted = isManuallyOmitted || isAutoOmitted;
                      const hasData = hasDataForAnyProperty(metric);

                      return (
                        <label
                          key={metric}
                          className={`flex items-center space-x-3 p-4 cursor-pointer transition-colors hover:bg-beige/20 ${
                            index !== ALL_METRIC_KEYS.length - 1
                              ? "border-b border-gray-100"
                              : ""
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
                                    const newManuallyEnabled = new Set(
                                      manuallyEnabledRows,
                                    );
                                    newManuallyEnabled.add(metric);
                                    setManuallyEnabledRows(newManuallyEnabled);
                                  }
                                } else {
                                  // Disable the row
                                  const newOmittedRows = new Set(omittedRows);
                                  newOmittedRows.add(metric);
                                  setOmittedRows(newOmittedRows);

                                  // Remove from manually enabled if it was there
                                  const newManuallyEnabled = new Set(
                                    manuallyEnabledRows,
                                  );
                                  newManuallyEnabled.delete(metric);
                                  setManuallyEnabledRows(newManuallyEnabled);
                                }
                              }}
                              className="sr-only"
                            />
                            <div
                              className={`w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center ${
                                !isOmitted
                                  ? "bg-brown border-brown text-white shadow-sm"
                                  : "border-beige hover:border-brown/50 bg-white"
                              }`}
                            >
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
