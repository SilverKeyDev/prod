// React imports
import { Download, Share, BarChart2, X, Settings } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";

import { Card } from "../../../components/layout";
import { Title, Subtitle } from "../../../components/ui";
import Button from "../../../components/ui/button/Button";
// Core
import { ALL_METRIC_KEYS, type Report } from "../../../../../packages/schemas";
// Components
import { ComparisonSpreadsheet, ManageRowsModal, type ComparisonRow } from ".";
import type { DocumentWithBody } from "../../../../../packages/schemas/google-maps";
import { reportsService } from "../../../../../packages/services";
import { secureClipboardCopy } from "../../../../../packages/services/security/clipboardSecurity";
import { captureError } from "../../../../../packages/services/security/errorReporting";
import { log } from "../../../../../packages/services/security/secureLogger";
import { useReportsStore, useUIStore } from "../../../../../packages/store";
import { formatFilenameToAddress } from "../../../../../packages/utils/address";

// Context imports

export default function CompareReportsPage() {
  // Use Reports store for reports management
  const compareReports = useReportsStore((s) => s.compareReports);

  // Backend now filters to only return standard ('detailed') reports
  // Extra client-side guard: filter out any comparison reports that may slip through
  const reports = (compareReports ?? []).filter((r) => {
    const address = (r?.address ?? "").toString();
    // Exclude filenames/addresses that look like comparison outputs
    return !/[_-]vs[_-]/i.test(address) && !/\svs\s/i.test(address);
  });

  const [selectedReports, setSelectedReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Only for comparison loading
  const enqueueToast = useUIStore((s) => s.enqueueToast);
  const [showRowModal, setShowRowModal] = useState(false);
  const [comparisonTable, setComparisonTable] = useState<ComparisonRow[]>([]);
  const [omittedRows, setOmittedRows] = useState<Set<string>>(new Set());
  const [manuallyEnabledRows, setManuallyEnabledRows] = useState<Set<string>>(
    new Set()
  );

  // Load comparison state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem("compareReportsState");
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

        const response = await reportsService.compareReports(
          selectedReports.map((r) => r.id),
          keys
        );

        if (
          response &&
          typeof response === "object" &&
          "success" in response &&
          response.success &&
          "table" in response &&
          Array.isArray(response.table)
        ) {
          const normalized = (response.table as unknown[])
            .filter(
              (item: unknown) => typeof item === "object" && item !== null
            )
            .map((row: unknown) => {
              const obj = row as Record<string, unknown>;
              if (!("Address" in obj) && typeof obj["address"] === "string") {
                obj["Address"] = obj["address"];
              }
              return obj as ComparisonRow;
            });
          setComparisonTable(normalized);
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
        log.error("COMPARE_REPORTS", "Comparison request failed", error);
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
    // No selection: clear table and exit quietly
    if (selectedReports.length === 0) {
      setComparisonTable([]);
      return;
    }

    const pdfKeys = selectedReports.map((r) => r.s3Key ?? "");
    // Simple transformation - use s3Key as jsonKey if available
    const jsonKeys = pdfKeys.filter((key) => key && key.length > 0);

    if (jsonKeys.length > 0) {
      void fetchComparison(jsonKeys);
    } else {
      // Only warn when user has selected reports but we cannot derive keys
      log.warn("COMPARE_REPORTS", "No s3 keys for selected reports", {
        selectedCount: selectedReports.length,
      });
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


  return (
    <div>
      <div className="overflow-x-auto">
        {/* Global toasts shown via ToastsPortal */}

        {/* Reports Selection */}
        <Card className="mb-8 sm:mb-8">
          <div className="mb-2 flex flex-col space-y-4 sm:mb-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="hidden sm:block">
              <Title size="md" className="font-medium">
                Your Property Reports
              </Title>
              <Subtitle size="xs" muted className="mb-2 mt-1">
                {selectedReports.length} of {reports.length} selected
              </Subtitle>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap sm:gap-3">
              <Button
                onClick={() => setSelectedReports([])}
                disabled={selectedReports.length === 0}
                variant="outline"
                size="sm"
                icon={<X />}
                className="w-full flex-1 sm:w-auto sm:flex-none"
              >
                Clear
              </Button>
              <Button
                onClick={exportToExcel}
                disabled={
                  selectedReports.length === 0 || comparisonTable.length === 0
                }
                variant="olive"
                size="sm"
                icon={<Download />}
                className="w-full flex-1 sm:w-auto sm:flex-none"
              >
                Export
              </Button>
              <Button
                onClick={shareCSV}
                disabled={
                  selectedReports.length === 0 || comparisonTable.length === 0
                }
                variant="filter"
                size="sm"
                icon={<Share />}
                className="w-full flex-1 sm:w-auto sm:flex-none"
              >
                Share
              </Button>
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
            <Button
              onClick={() => setShowRowModal(true)}
              variant="secondary"
              size="sm"
              icon={<Settings />}
              className="text-white"
            >
              Manage Rows
            </Button>
          </div>
        </Card>

        {/* Comparison Table */}
        <ComparisonSpreadsheet
          selectedReports={selectedReports}
          comparisonTable={comparisonTable}
          visibleMetrics={visibleMetrics}
          isLoading={isLoading}
        />

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
        <ManageRowsModal
          showRowModal={showRowModal}
          setShowRowModal={setShowRowModal}
          omittedRows={omittedRows}
          setOmittedRows={setOmittedRows}
          manuallyEnabledRows={manuallyEnabledRows}
          setManuallyEnabledRows={setManuallyEnabledRows}
          hasDataForAnyProperty={hasDataForAnyProperty}
          visibleMetrics={visibleMetrics}
        />
      </div>
    </div>
  );
}
