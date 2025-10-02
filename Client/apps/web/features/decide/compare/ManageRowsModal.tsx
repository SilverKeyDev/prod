import React from "react";
import { Check, X } from "lucide-react";
import { Title, Subtitle } from "../../../components/ui";
import { ALL_METRIC_KEYS } from "../../../../../packages/schemas";

type ComparisonRow = {
  metric: string;
  [key: string]: string | number | boolean;
};

interface ManageRowsModalProps {
  showRowModal: boolean;
  setShowRowModal: (show: boolean) => void;
  omittedRows: Set<string>;
  setOmittedRows: (rows: Set<string>) => void;
  manuallyEnabledRows: Set<string>;
  setManuallyEnabledRows: (rows: Set<string>) => void;
  hasDataForAnyProperty: (metric: string) => boolean;
  visibleMetrics: string[];
}

export function ManageRowsModal({
  showRowModal,
  setShowRowModal,
  omittedRows,
  setOmittedRows,
  manuallyEnabledRows,
  setManuallyEnabledRows,
  hasDataForAnyProperty,
  visibleMetrics,
}: ManageRowsModalProps) {
  if (!showRowModal) {
    return null;
  }

  return (
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
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
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
                        <span className="text-xs text-gray-500">
                          auto-hidden: no data
                        </span>
                      )}
                      {!hasData && manuallyEnabledRows.has(metric) && (
                        <span className="text-xs text-gray-500">
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
  );
}
