// React imports
import {
  Download,
  Share,
  BarChart2,
  Check,
  X,
  RefreshCw,
  Settings,
} from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";

import { Card } from "../../components/format";
import { Title, Subtitle } from "../../components/ui";
// Core
import { ALL_METRIC_KEYS, type Report } from "../../core/schemas";
type ComparisonRow = {
  Address: string;
  [key: string]: string | number | boolean;
};
import type { DocumentWithBody } from "../../core/schemas/google-maps";
import { reportsService } from "../../core/services";
import { secureClipboardCopy } from "../../core/services/security/clipboardSecurity";
import { captureError } from "../../core/services/security/errorReporting";
import { log } from "../../core/services/security/secureLogger";
import { useUIStore } from "../../core/store";
import { useReportsStoreIntegration } from "../../core/hooks/store/useReportsStoreIntegration";
import { formatFilenameToAddress } from "../../core/utils/address";

// Context imports

export default function CompareReportsPage() {
  // Use Reports integration hook for reports management
  const { compareReports, refreshCompareReports } =
    useReportsStoreIntegration();

  // Refresh data when page loads to ensure latest updates
  useEffect(() => {
    void refreshCompareReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Backend now filters to only return standard ('detailed') reports
  const reports = compareReports ?? [];

  const [selectedReports, setSelectedReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Only for comparison loading
  const enqueueToast = useUIStore((s) => s.enqueueToast);
  const [showRowModal, setShowRowModal] = useState(false);
  const [comparisonTable, setComparisonTable] = useState<ComparisonRow[]>([]);
  const [omittedRows, setOmittedRows] = useState<Set<string>>(new Set());
  const [manuallyEnabledRows, setManuallyEnabledRows] = useState<Set<string>>(
    new Set()
  );

  // Load comparison state from sessionStorage on mount (temporary wizard state)
  useEffect(() => {
    const savedState = sessionStorage.getItem("compareReportsState");
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState) as Record<string, unknown>;
        // Type-safe parsing with proper type guards
        if (
          "selectedReports" in parsed &&
          parsed.selectedReports &&
          Array.isArray(parsed.selectedReports)
        ) {
          setSelectedReports(parsed.selectedReports as Report[]);
        }
        if (
          "omittedRows" in parsed &&
          parsed.omittedRows &&
          Array.isArray(parsed.omittedRows)
        ) {
          const omittedRowsArray = (parsed.omittedRows as unknown[]).filter(
            (item: unknown): item is string => typeof item === "string"
          );
          setOmittedRows(new Set<string>(omittedRowsArray));
        }
        if (
          parsed &&
          typeof parsed === "object" &&
          "manuallyEnabledRows" in parsed &&
          parsed.manuallyEnabledRows &&
          Array.isArray(parsed.manuallyEnabledRows)
        ) {
          const manuallyEnabledRowsArray = (
            parsed.manuallyEnabledRows as unknown[]
          ).filter((item: unknown): item is string => typeof item === "string");
          setManuallyEnabledRows(new Set<string>(manuallyEnabledRowsArray));
        }
      } catch {
        console.warn("Invalid compare reports state data");
      }
    }
  }, []);

  // Save comparison state to sessionStorage when it changes (temporary wizard state)
  useEffect(() => {
    const stateToSave = {
      selectedReports,
      omittedRows: Array.from(omittedRows),
      manuallyEnabledRows: Array.from(manuallyEnabledRows),
    };
    sessionStorage.setItem("compareReportsState", JSON.stringify(stateToSave));
  }, [selectedReports, omittedRows, manuallyEnabledRows]);

  // Helper function to check if a row has any data for selected properties
  const hasDataForAnyProperty = (metric: string) => {
    if (selectedReports.length === 0 || comparisonTable.length === 0) {
      return false;
    }

    return selectedReports.some((report) => {
      const sanitize = (str: string) =>
        (str ?? "").toLowerCase().replace(/\s+/g, "_");
      const row = comparisonTable.find(
        (item: ComparisonRow) =>
          sanitize(item.Address as string) === sanitize(report.address)
      );
      const value = row ? row[metric] : null;
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
    (metric) => !allOmittedRows.has(metric)
  );

  // Removed fetchReports - now using preloaded data from context
  // Helper to compare
  // Fetch comparison data whenever selection changes (2-5 selected)
  const fetchComparison = useCallback(
    async (keys: string[]) => {
      if (keys.length === 0) {
        enqueueToast({ type: "error", message: "Select a report to view" });
        return;
      }

      // Simple validation - check if we have valid keys
      if (!keys || keys.length === 0) {
        enqueueToast({
          type: "error",
          message: "Invalid report keys provided",
        });
        return;
      }

      try {
        setIsLoading(true);
        // Normalize keys to JSON before sending
        const toJsonKey = (maybePdfKey: string): string => {
          const key = (maybePdfKey || "").replace(/^\/+/, "");
          if (!key) return key;
          const parts = key.split("/");
          if (parts.length >= 4 && parts[1] === "reports") {
            const userId = parts[0];
            const reportType = parts[2];
            const filename = parts[3];
            const base = filename.endsWith(".pdf")
              ? filename.slice(0, -4)
              : filename;
            return `${userId}/json/${reportType}/${base}.json`;
          }
          return key.endsWith(".pdf") ? key.slice(0, -4) + ".json" : key;
        };

        const normalized = keys.filter(Boolean).map(toJsonKey);

        const response = await reportsService.compareReports(
          selectedReports.map((r) => r.id),
          normalized
        );

        if (
          response &&
          typeof response === "object" &&
          "success" in response &&
          response.success &&
          "table" in response &&
          Array.isArray(response.table)
        ) {
          setComparisonTable(response.table as ComparisonRow[]);
        } else {
          const errorMessage =
            response &&
            typeof response === "object" &&
            "error" in response &&
            typeof response.error === "string"
              ? response.error
              : "Comparison failed";
          throw new Error(errorMessage);
        }
      } catch (error: unknown) {
        console.error(error);
        enqueueToast({
          type: "error",
          message: error instanceof Error ? error.message : "Comparison failed",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [selectedReports, enqueueToast]
  );

  // Update comparison whenever selectedReports changes
  useEffect(() => {
    const pdfKeys = selectedReports.map((r) => r.s3Key ?? "");
    // Simple transformation - use s3Key as jsonKey if available
    const jsonKeys = pdfKeys.filter((key) => key && key.length > 0);

    if (jsonKeys.length > 0) {
      void fetchComparison(jsonKeys);
    } else {
      setComparisonTable([]);
    }
  }, [selectedReports, fetchComparison]);

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
      enqueueToast({ type: "error", message: "Select properties to export" });
      return;
    }
    const header = ["Metric", ...selectedReports.map((r) => r.address)];
    const sanitize = (str: string) =>
      (str ?? "").toLowerCase().replace(/\s+/g, "_");
    const rows = visibleMetrics.map((metric: string) => {
      const values = selectedReports.map((r) => {
        const row = comparisonTable.find(
          (item: ComparisonRow) =>
            sanitize(item.Address as string) === sanitize(r.address)
        );
        return row ? ((row[metric] as string | number) ?? "-") : "-";
      });
      return [metric, ...values];
    });
    const csvRows = [header, ...rows].map((r) =>
      r
        .map((v: string | number) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "property_comparison.csv");
    (document as DocumentWithBody).body.appendChild(link);
    link.click();
    (document as DocumentWithBody).body.removeChild(link);
  };

  // Share comparison CSV
  const shareCSV = async () => {
    if (selectedReports.length === 0 || comparisonTable.length === 0) {
      enqueueToast({ type: "error", message: "Select properties to share" });
      return;
    }

    const header = ["Metric", ...selectedReports.map((r) => r.address)];
    const sanitize = (str: string) =>
      (str ?? "").toLowerCase().replace(/\s+/g, "_");
    const rows = visibleMetrics.map((metric: string) => {
      const values = selectedReports.map((r) => {
        const row = comparisonTable.find(
          (item: ComparisonRow) =>
            sanitize(item.Address as string) === sanitize(r.address)
        );
        return row ? ((row[metric] as string | number) ?? "-") : "-";
      });
      return [metric, ...values];
    });
    const csvRows = [header, ...rows].map((r) =>
      r
        .map((v: string | number) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
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
        enqueueToast({ type: "success", message: "CSV shared successfully" });
      } catch (error: unknown) {
        if ((error as Error).name !== "AbortError") {
          console.error("Error sharing CSV:", error);
          // Fallback to copy link
          void fallbackShareCSV(csvContent);
        }
      }
    } else {
      // Fallback for browsers without Web Share API
      void fallbackShareCSV(csvContent);
    }
  };

  const fallbackShareCSV = async (csvContent: string) => {
    try {
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const shareText = `Property Comparison Report: ${url}`;

      const success = await secureClipboardCopy(shareText);
      if (success) {
        log.info("COMPARE_REPORTS", "CSV share link copied to clipboard");
        enqueueToast({
          type: "success",
          message: "Share link copied to clipboard",
        });
      } else {
        enqueueToast({
          type: "error",
          message: "Unable to share CSV. Please use Export instead.",
        });
      }
    } catch (error: unknown) {
      log.error("COMPARE_REPORTS", "Failed to share CSV", error);
      const err = error instanceof Error ? error : new Error(String(error));
      captureError(err, { context: "fallbackShareCSV" });
      enqueueToast({
        type: "error",
        message: "Unable to share CSV. Please use Export instead.",
      });
    }
  };

  const refreshReportsData = () => {
    try {
      setIsLoading(true);
      // TODO: Implement actual report fetching when context is available
      void enqueueToast({
        type: "success",
        message: "Reports refreshed successfully",
      });
    } catch (error: unknown) {
      console.error("❌ Failed to refresh reports:", error);
      void enqueueToast({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to refresh reports",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="overflow-x-auto">
        {/* Global toasts shown via ToastsPortal */}

        {/* Reports Selection */}
        <Card className="mb-20 sm:mb-8">
          <div className="mb-3 flex flex-col space-y-6 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="hidden sm:block">
              <Title size="md" className="font-medium">
                Your Property Reports
              </Title>
              <Subtitle size="xs" muted className="mb-2 mt-1">
                {selectedReports.length} of {reports.length} selected
              </Subtitle>
            </div>
            <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start sm:gap-3"></div>
            <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start sm:gap-3">
              <button
                onClick={() => setSelectedReports([])}
                disabled={selectedReports.length === 0}
                className="touch-friendly flex items-center justify-center rounded-lg border border-gray-300 bg-gray-100 px-2 py-1.5 text-xs font-medium text-black/70 transition-colors hover:border-gray-400 hover:bg-gray-200 disabled:cursor-not-allowed disabled:border-transparent disabled:bg-gray-200 disabled:text-gray-500 sm:justify-start sm:px-3 sm:py-2 sm:text-sm"
              >
                <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="ml-2 text-xs font-normal tracking-tight sm:text-sm">
                  Clear
                </span>
              </button>
              <button
                onClick={exportToExcel}
                disabled={
                  selectedReports.length === 0 || comparisonTable.length === 0
                }
                className="touch-friendly flex items-center justify-center rounded-lg bg-olive px-2 py-1.5 text-xs font-medium text-white transition-colors hover:bg-olive-light disabled:cursor-not-allowed disabled:opacity-50 sm:justify-start sm:px-3 sm:py-2 sm:text-sm"
              >
                <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="ml-2 text-xs sm:text-sm">Export</span>
              </button>
              <button
                onClick={shareCSV}
                disabled={
                  selectedReports.length === 0 || comparisonTable.length === 0
                }
                className="touch-friendly flex items-center justify-center rounded-lg bg-beige px-2 py-1.5 text-xs font-medium text-gray-100 transition-colors hover:bg-beige/80 disabled:cursor-not-allowed disabled:opacity-50 sm:justify-start sm:px-3 sm:py-2 sm:text-sm"
              >
                <Share className="h-4 w-4" />
                <span className="ml-2 text-xs sm:text-sm">Share</span>
              </button>
              <button
                onClick={refreshReportsData}
                disabled={isLoading}
                className="touch-friendly flex items-center justify-center rounded-lg bg-beige/30 px-2 py-1.5 text-xs font-medium text-black/70 transition-colors hover:bg-beige/50 disabled:cursor-not-allowed disabled:opacity-50 sm:justify-start sm:px-3 sm:py-2 sm:text-sm"
              >
                {isLoading ? (
                  <RefreshCw className="h-3 w-3 animate-spin sm:h-3.5 sm:w-3.5" />
                ) : (
                  <RefreshCw className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                )}
                {!isLoading && (
                  <span className="ml-2 text-xs sm:text-sm">Refresh</span>
                )}
              </button>
            </div>
          </div>

          {reports.length === 0 ? (
            <div className="py-responsive-lg text-center">
              <BarChart2 className="mobile-icon-lg space-y-responsive-sm mx-auto text-black/30" />
              <Title size="sm" className="space-y-responsive-xs font-medium">
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
              className={`gap-responsive-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${
                reports.length > 9 ? "custom-scrollbar overflow-y-auto" : ""
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
                  (r) => r.id === report.id
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
                    className={`cursor-pointer touch-manipulation select-none rounded-xl border-2 p-2 transition-all duration-200 sm:p-3 ${
                      isLoading
                        ? "cursor-wait opacity-50"
                        : isSelected
                          ? "border-olive bg-olive/5 sm:ring-2 sm:ring-olive/30"
                          : "border-gray-200 hover:border-olive/50 hover:bg-olive/5"
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="min-w-0 flex-1 pr-2">
                          <h3
                            className="overflow-hidden text-xs font-medium leading-tight text-black sm:text-sm"
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
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
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
              className="px-responsive-sm py-responsive-xs text-responsive-sm touch-friendly flex items-center rounded-lg bg-brown font-medium text-white transition-colors hover:bg-brown/80"
            >
              <Settings className="mr-2 h-4 w-4" />
              <span className="text-sm font-normal tracking-tight">
                Manage Rows
              </span>
            </button>
          </div>
        </Card>

        {/* Comparison Table */}
        {selectedReports.length > 0 && (
          <div className="scrollbar-hide mt-6 w-full overflow-x-auto rounded-lg border sm:mt-10">
            <table
              className="w-full border-collapse text-xs"
              style={{ tableLayout: "fixed" }}
            >
              <thead className="bg-beige/30">
                <tr>
                  <th
                    className="sticky left-0 bg-beige/30 px-2 py-2 text-left text-xs font-semibold text-black sm:px-4 sm:py-3"
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
                        className={`px-2 py-2 text-left text-xs font-semibold text-black sm:px-4 sm:py-3 ${colWidth}`}
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
                  <tr key={metric} className="odd:bg-beige/10 even:bg-white">
                    <td
                      className="sticky left-0 bg-white/80 px-2 py-2 text-xs font-medium text-black backdrop-blur sm:px-4"
                      style={{ width: "25%" }}
                    >
                      {metric}
                    </td>
                    {selectedReports.map((r) => {
                      const sanitize = (str: string) =>
                        (str ?? "").toLowerCase().replace(/\s+/g, "_");
                      const row = comparisonTable.find(
                        (item: ComparisonRow) =>
                          sanitize(item.Address as string) ===
                          sanitize(r.address)
                      );
                      const value = row ? (row[metric] ?? "-") : "-";
                      const colWidth =
                        selectedReports.length >= 3
                          ? "min-w-[120px] sm:min-w-[140px]"
                          : "min-w-[150px] sm:min-w-[180px]";
                      return (
                        <td
                          key={r.id + metric}
                          className={`whitespace-pre-wrap px-2 py-2 text-xs text-black/90 sm:px-4 ${colWidth}`}
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
              className="touch-friendly mt-1 py-0.5 text-sm font-normal tracking-tight text-black/70 underline hover:text-black sm:mt-2 sm:py-1"
            >
              Clear selection
            </button>
          </div>
        )}

        {/* Row Management Modal */}
        {showRowModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-gray-200 p-6">
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
                  className="rounded-lg p-2 transition-colors hover:bg-gray-100"
                >
                  <X className="h-5 w-5 text-black/60" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-hidden p-6">
                {/* Quick Actions */}
                <div className="mb-6 flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setOmittedRows(new Set());
                      setManuallyEnabledRows(new Set(ALL_METRIC_KEYS));
                    }}
                    className="rounded-lg bg-olive px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-olive-light"
                  >
                    Show All ({ALL_METRIC_KEYS.length})
                  </button>
                  <button
                    onClick={() => {
                      setOmittedRows(new Set(ALL_METRIC_KEYS));
                      setManuallyEnabledRows(new Set());
                    }}
                    className="rounded-lg bg-beige px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-beige/80"
                  >
                    Hide All
                  </button>
                  <button
                    onClick={() => {
                      setOmittedRows(new Set());
                      setManuallyEnabledRows(new Set());
                    }}
                    className="rounded-lg bg-brown px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brown/80"
                  >
                    Auto-Hide Empty
                  </button>
                  <div className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-black/60">
                    Showing: {visibleMetrics.length} / {ALL_METRIC_KEYS.length}{" "}
                    metrics
                  </div>
                </div>

                {/* Metrics List */}
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <div className="custom-scrollbar max-h-96 overflow-y-auto">
                    {ALL_METRIC_KEYS.map((metric, index) => {
                      const isManuallyOmitted = omittedRows.has(metric);
                      const isAutoOmitted =
                        !hasDataForAnyProperty(metric) &&
                        !manuallyEnabledRows.has(metric);
                      const isOmitted = isManuallyOmitted ?? isAutoOmitted;
                      const hasData = hasDataForAnyProperty(metric);

                      return (
                        <label
                          key={metric}
                          className={`flex cursor-pointer items-center space-x-3 p-4 transition-colors hover:bg-beige/20 ${
                            index !== ALL_METRIC_KEYS.length - 1
                              ? "border-b border-gray-100"
                              : ""
                          }`}
                        >
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={!isOmitted}
                              onChange={(
                                e: React.ChangeEvent<HTMLInputElement>
                              ) => {
                                if (e.target.checked) {
                                  // Enable the row
                                  const newOmittedRows = new Set(omittedRows);
                                  newOmittedRows.delete(metric);
                                  setOmittedRows(newOmittedRows);

                                  // If it was auto-omitted, mark as manually enabled
                                  if (!hasData) {
                                    const newManuallyEnabled = new Set(
                                      manuallyEnabledRows
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
                                    manuallyEnabledRows
                                  );
                                  newManuallyEnabled.delete(metric);
                                  setManuallyEnabledRows(newManuallyEnabled);
                                }
                              }}
                              className="sr-only"
                            />
                            <div
                              className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-all duration-200 ${
                                !isOmitted
                                  ? "border-brown bg-brown text-white shadow-sm"
                                  : "border-beige bg-white hover:border-brown/50"
                              }`}
                            >
                              {!isOmitted && (
                                <Check className="h-3 w-3 fill-current" />
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
                              <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                                auto-hidden: no data
                              </span>
                            )}
                            {!hasData && manuallyEnabledRows.has(metric) && (
                              <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
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
