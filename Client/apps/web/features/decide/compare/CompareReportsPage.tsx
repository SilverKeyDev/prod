// React imports
import { Download, Share, BarChart2, X, Settings } from "lucide-react";
import React, { useState, useEffect, useCallback, useMemo } from "react";

import { Card } from "../../../components/layout";
import { Title, Subtitle } from "../../../components/ui";
import Button from "../../../components/ui/button/Button";
// Core
import { ALL_METRIC_KEYS } from "../../../../../packages/schemas";
import type { SavedHome } from "../../../../../packages/schemas";
// Components
import { ComparisonSpreadsheet, ManageRowsModal, type ComparisonRow } from ".";
import type { DocumentWithBody } from "../../../../../packages/schemas/google-maps";
import { secureClipboardCopy } from "../../../../../packages/services/security/clipboardSecurity";
import { captureError } from "../../../../../packages/services/security/errorReporting";
import { log } from "../../../../../packages/services/security/secureLogger";
import { useUIStore } from "../../../../../packages/store";
import { useSavedHomesStoreIntegration } from "../../../../../packages/hooks/store/useSavedHomesStoreIntegration";

// Context imports

type HomeUniversalData = {
  id?: string;
  address?: string;
  price?: string;
  beds?: string;
  baths?: string;
  sqft?: string;
  lot_size?: string;
  property_type?: string;
  year_built?: string;
  score?: number;
  property_analysis?: Record<string, unknown>;
  commute_data?: Record<string, unknown>;
  features?: Record<string, unknown> | unknown[];
  zillow_url?: string;
  [key: string]: unknown;
};

export default function CompareReportsPage() {
  // Use saved homes store instead of reports
  const { savedHomes: homes, savedHomesLoading: loading } =
    useSavedHomesStoreIntegration();

  const [selectedHomes, setSelectedHomes] = useState<SavedHome[]>([]);
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
    const savedState = localStorage.getItem("compareHomesState");
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState) as Record<string, unknown>;
        if (
          "selectedHomeIds" in parsed &&
          parsed.selectedHomeIds &&
          Array.isArray(parsed.selectedHomeIds)
        ) {
          const selectedIds = parsed.selectedHomeIds as string[];
          const selected = homes.filter((h) => selectedIds.includes(h.home_id));
          setSelectedHomes(selected);
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
        console.warn("Invalid compare homes state data");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save comparison state to localStorage when it changes
  useEffect(() => {
    const stateToSave = {
      selectedHomeIds: selectedHomes.map((h) => h.home_id),
      omittedRows: Array.from(omittedRows),
      manuallyEnabledRows: Array.from(manuallyEnabledRows),
    };
    localStorage.setItem("compareHomesState", JSON.stringify(stateToSave));
  }, [selectedHomes, omittedRows, manuallyEnabledRows]);

  // Build comparison table from home_universal data
  const buildComparisonTable = useCallback(
    (selected: SavedHome[]): ComparisonRow[] => {
      return selected.map((home) => {
        const homeData = home as unknown as HomeUniversalData;
        const row: ComparisonRow = {
          Address: home.address ?? home.description ?? "Unknown",
        };

        // Basic property data
        row["Price"] = homeData.price ?? "-";
        row["Bedrooms"] = homeData.beds ?? home.bedrooms?.toString() ?? "-";
        row["Bathrooms"] = homeData.baths ?? home.bathrooms?.toString() ?? "-";
        row["Living Area"] = homeData.sqft ?? home.sqft?.toString() ?? "-";
        row["Property Type"] = homeData.property_type ?? "-";
        row["Zillow URL"] = homeData.zillow_url ?? "-";

        // Extract from property_analysis JSON
        if (
          homeData.property_analysis &&
          typeof homeData.property_analysis === "object"
        ) {
          const analysis = homeData.property_analysis as Record<
            string,
            unknown
          >;
          // Map common analysis fields to metrics
          if (analysis.neighborhood_vibe)
            row["Neighborhood Vibe"] = String(analysis.neighborhood_vibe);
          if (analysis.local_culture)
            row["Local Culture"] = String(analysis.local_culture);
          if (analysis.crime_rating)
            row["Crime Rating"] = String(analysis.crime_rating);
          if (analysis.safety_rating)
            row["Safety Rating"] = String(analysis.safety_rating);
          if (analysis.family_rating)
            row["Family Rating"] = String(analysis.family_rating);
          if (analysis.nightlife_rating)
            row["Nightlife Rating"] = String(analysis.nightlife_rating);
          if (analysis.environmental_rating)
            row["Environmental Rating"] = String(analysis.environmental_rating);
          if (analysis.financial_rating)
            row["Financial Rating"] = String(analysis.financial_rating);
          // Add more mappings as needed
        }

        // Extract from commute_data JSON
        if (
          homeData.commute_data &&
          typeof homeData.commute_data === "object"
        ) {
          const commute = homeData.commute_data as Record<string, unknown>;
          if (commute.public_transport)
            row["Public Transport"] = String(commute.public_transport);
          if (commute.traffic) row["Traffic"] = String(commute.traffic);
          if (commute.walkability)
            row["Walkability"] = String(commute.walkability);
        }

        // Extract from features JSON
        if (homeData.features) {
          if (Array.isArray(homeData.features)) {
            row["Property Features"] = homeData.features.join(", ");
          } else if (typeof homeData.features === "object") {
            const features = homeData.features as Record<string, unknown>;
            if (features.pet_friendly !== undefined)
              row["Pet Friendly"] = String(features.pet_friendly);
            if (features.parking) row["Parking"] = String(features.parking);
          }
        }

        return row;
      });
    },
    []
  );

  // Update comparison table when selected homes change
  useEffect(() => {
    if (selectedHomes.length === 0) {
      setComparisonTable([]);
      return;
    }

    setIsLoading(true);
    try {
      const table = buildComparisonTable(selectedHomes);
      setComparisonTable(table);
    } catch (error: unknown) {
      log.error("COMPARE_HOMES", "Failed to build comparison table", error);
      enqueueToast({
        type: "error",
        message: "Failed to build comparison table",
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedHomes, buildComparisonTable, enqueueToast]);

  // Helper function to check if a row has any data for selected properties
  const hasDataForAnyProperty = (metric: string) => {
    if (selectedHomes.length === 0 || comparisonTable.length === 0) {
      return false;
    }

    return selectedHomes.some((home) => {
      const sanitize = (str: string) =>
        (str ?? "").toLowerCase().replace(/\s+/g, "_");
      const address = home.address ?? home.description ?? "";
      const row = comparisonTable.find(
        (item: ComparisonRow) =>
          sanitize(item.Address as string) === sanitize(address)
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

  const toggleHomeSelection = (home: SavedHome, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setSelectedHomes((prev) => {
      const isSelected = prev.some((h) => h.home_id === home.home_id);
      if (isSelected) {
        return prev.filter((h) => h.home_id !== home.home_id);
      } else {
        return [...prev, home];
      }
    });
  };

  // Export comparison table to CSV
  const exportToExcel = () => {
    if (selectedHomes.length === 0 || comparisonTable.length === 0) {
      enqueueToast({ type: "error", message: "Select properties to export" });
      return;
    }
    const header = [
      "Metric",
      ...selectedHomes.map((h) => h.address ?? h.description ?? "Unknown"),
    ];
    const sanitize = (str: string) =>
      (str ?? "").toLowerCase().replace(/\s+/g, "_");
    const rows = visibleMetrics.map((metric: string) => {
      const values = selectedHomes.map((h) => {
        const address = h.address ?? h.description ?? "";
        const row = comparisonTable.find(
          (item: ComparisonRow) =>
            sanitize(item.Address as string) === sanitize(address)
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
    if (selectedHomes.length === 0 || comparisonTable.length === 0) {
      enqueueToast({ type: "error", message: "Select properties to share" });
      return;
    }

    const header = [
      "Metric",
      ...selectedHomes.map((h) => h.address ?? h.description ?? "Unknown"),
    ];
    const sanitize = (str: string) =>
      (str ?? "").toLowerCase().replace(/\s+/g, "_");
    const rows = visibleMetrics.map((metric: string) => {
      const values = selectedHomes.map((h) => {
        const address = h.address ?? h.description ?? "";
        const row = comparisonTable.find(
          (item: ComparisonRow) =>
            sanitize(item.Address as string) === sanitize(address)
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
          text: `Comparison of ${selectedHomes.length} properties`,
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

        {/* Homes Selection */}
        <Card className="mb-responsive-lg">
          <div className="mb-responsive-sm flex flex-col space-y-responsive-sm sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="hidden sm:block">
              <Title size="md" className="font-medium">
                Your Saved Homes
              </Title>
              <Subtitle size="xs" muted className="mb-responsive-xs mt-1">
                {selectedHomes.length} of {homes.length} selected
              </Subtitle>
            </div>
            <div className="flex w-full flex-wrap items-center gap-responsive-sm sm:w-auto sm:flex-nowrap">
              <Button
                onClick={() => setSelectedHomes([])}
                disabled={selectedHomes.length === 0}
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
                  selectedHomes.length === 0 || comparisonTable.length === 0
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
                  selectedHomes.length === 0 || comparisonTable.length === 0
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

          {loading ? (
            <div className="py-responsive-lg text-center">
              <BarChart2 className="mobile-icon-lg space-y-responsive-sm mx-auto text-black/30 animate-pulse" />
              <Title size="sm" className="space-y-responsive-xs font-medium">
                Loading homes...
              </Title>
            </div>
          ) : homes.length === 0 ? (
            <div className="py-responsive-lg text-center">
              <BarChart2 className="mobile-icon-lg space-y-responsive-sm mx-auto text-black/30" />
              <Title size="sm" className="space-y-responsive-xs font-medium">
                No saved homes found
              </Title>
              <Subtitle
                size="sm"
                muted
                className="space-y-responsive-sm px-responsive-sm"
              >
                Save homes to compare them
              </Subtitle>
            </div>
          ) : (
            <div
              className={`gap-responsive-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${
                homes.length > 9 ? "custom-scrollbar overflow-y-auto" : ""
              }`}
              style={{
                ...(homes.length > 9 ? { maxHeight: "16rem" } : {}),
                ...(homes.length > 9
                  ? {
                      scrollbarWidth: "thin",
                      scrollbarColor: "#E8D5B560 #f3f4f6",
                    }
                  : {}),
              }}
            >
              {homes.map((home: SavedHome) => {
                const isSelected = selectedHomes.some(
                  (h) => h.home_id === home.home_id
                );
                const address =
                  home.address ?? home.description ?? "Unknown Address";
                return (
                  <div
                    key={home.home_id}
                    onClick={(e) => {
                      if (!isLoading) {
                        toggleHomeSelection(home, e);
                      }
                    }}
                    onMouseDown={(e) => e.preventDefault()} // Prevent focus/highlight on click
                    className={`touch-friendly cursor-pointer select-none rounded-xl border-2 p-responsive-sm transition-all duration-200 ${
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
                            title={address}
                            style={{
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical" as const,
                              wordBreak: "break-word",
                              hyphens: "auto",
                            }}
                          >
                            {address}
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
        <Card className="mb-responsive-md mt-responsive-lg">
          <div className="flex flex-col space-y-responsive-sm sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
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
          selectedReports={selectedHomes.map((h) => ({
            id: h.home_id,
            address: h.address ?? h.description ?? "Unknown",
          }))}
          comparisonTable={comparisonTable}
          visibleMetrics={visibleMetrics}
          isLoading={isLoading}
        />

        {/* Selection summary */}
        {selectedHomes.length > 0 && (
          <div className="mt-responsive-md text-center">
            <p className="text-responsive-sm text-black/70">
              {selectedHomes.length}{" "}
              {selectedHomes.length === 1 ? "property" : "properties"} selected
            </p>
            <button
              onClick={() => setSelectedHomes([])}
              className="touch-friendly mt-responsive-xs py-responsive-xs text-responsive-sm font-normal tracking-tight text-black/70 underline hover:text-black"
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
