import { MapPin } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

import SavedLayout, { type ViewMode } from "../../app/layouts/SavedLayout";
import ReportCard from "../../components/cards/ReportCard";
import DeleteModal from "../../components/modals/DeleteModal";
import PdfModal from "../../components/modals/PdfModal";
import { reportApi } from "../../core/config/api";
import { useDocumentActions } from "../../core/hooks/data/useDocumentActions";
import { useReportsData } from "../../core/hooks/data/useReportsData";
import useMobile from "../../core/hooks/ui/useMobile";
import type { Report } from "../../core/schemas";
import { useUIStore } from "../../core/store";
import { asError } from "../../core/utils/error";

export default function PastReports() {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Use reports data hook (same as Dashboard)
  const { reports, reportsLoading, refreshReports } = useReportsData();

  // Use centralized document actions
  const {
    loadingUrls,
    handleViewDocument,
    handleDownloadDocument,
    handleShareDocument,
    currentPdf,
    currentDocumentName,
    closePdfModal,
  } = useDocumentActions();

  // Note: Removed automatic refresh on mount to prevent infinite loops
  // Data will be loaded automatically by React Query when the component mounts

  // Handle refresh button click with loading state (using context)
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshReports();
    } catch (error: unknown) {
      console.error("Failed to refresh reports:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshReports]);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<{
    id: string;
    s3Key: string | null | undefined;
  } | null>(null);
  const enqueueToast = useUIStore((s) => s.enqueueToast);

  // Share individual report using centralized function (same as Dashboard)
  const handleShareReport = useCallback(
    async (report: Report) => {
      const result = await handleShareDocument(report.id, report.address);

      if (result.success)
        enqueueToast({ type: "success", message: result.message });
      else enqueueToast({ type: "error", message: result.message });
    },
    [handleShareDocument, enqueueToast]
  );

  const openDeleteModal = (
    reportId: string,
    s3Key: string | null | undefined
  ) => {
    setReportToDelete({ id: reportId, s3Key });
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setReportToDelete(null);
  };

  const handleDeleteReport = async (
    reportId: string,
    s3Key: string | null | undefined
  ) => {
    if (!reportId) {
      console.error("[DELETE] Error: No report ID provided");
      return;
    }

    try {
      if (!s3Key) {
        console.warn(
          "[DELETE] No S3 key provided, will only delete from in-memory storage"
        );
      }

      await reportApi.delete(reportId, s3Key ?? undefined);

      closeDeleteModal();
      enqueueToast({ type: "success", message: "Report deleted successfully" });

      // Refresh the reports list
      await refreshReports();
    } catch (error: unknown) {
      console.error("[DELETE] Error deleting report:", {
        error,
        reportId,
        s3Key,
        stack: error instanceof Error ? error.stack : "No stack trace",
      });

      enqueueToast({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to delete report",
      });
    }
  };

  const filteredReports = reports.filter((report: Report) =>
    report.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedReports = [...filteredReports].sort((a, b) => {
    // Sort by date, newest first
    return (
      new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    );
  });

  const pollForReportCompletion = useCallback(
    async (documentId: string) => {
      const pollInterval = 1000; // 1 second
      const maxAttempts = 120; // 10 minutes
      let attempts = 0;
      const startTime = Date.now();
      let consecutiveErrors = 0;
      const maxConsecutiveErrors = 5;

      const idToken = sessionStorage.getItem("id_token");
      if (!idToken) {
        console.error(`[PastReports] ❌ No auth token found`);
        return;
      }

      let lastReportSnapshot: string | null = null;

      // Step 1: Initial check
      try {
        const initialResponse = await reportApi.poll(documentId);

        if (!initialResponse.success) {
          console.error(`[PastReports] ❌ Poll failed:`, initialResponse.error);
          return;
        }

        const data = initialResponse;

        if (data.success && data.report) {
          lastReportSnapshot = JSON.stringify(data.report);

          if (
            data.report.status === "completed" ||
            data.report.status === "error"
          ) {
            await refreshReports();
            window.dispatchEvent(new CustomEvent("reportGenerated"));
            return;
          }
        } else if (data.success && !data.report) {
          lastReportSnapshot = null;
        } else {
          console.error(`[PastReports] ❌ Initial poll failed:`, data.error);
          return;
        }
      } catch (err: unknown) {
        const error = asError(err);
        console.error(`[PastReports] ❌ Error during initial poll:`, error);
        return;
      }

      // Step 2: Polling loop
      const pollForCompletion = async (): Promise<void> => {
        attempts++;
        const elapsedTime = Math.round((Date.now() - startTime) / 1000);

        try {
          const response = await reportApi.poll(documentId);

          if (!response.success) {
            consecutiveErrors++;
            console.error(
              `[PastReports] ❌ Poll error: ${response.error} (${consecutiveErrors}/${maxConsecutiveErrors})`
            );

            if (consecutiveErrors >= maxConsecutiveErrors) {
              console.error(
                `[PastReports] 🚫 Too many consecutive errors (${consecutiveErrors}), aborting poll`
              );
              return;
            }

            if (attempts < maxAttempts) {
              setTimeout(pollForCompletion, pollInterval);
            }
            return;
          }

          const data = response;
          consecutiveErrors = 0; // Reset error counter on success

          if (!data.success) {
            console.error(`[PastReports] ❌ Poll API error:`, data.error);
            if (attempts < maxAttempts) {
              setTimeout(pollForCompletion, pollInterval);
            }
            return;
          }

          // Handle case where report is not found (null)
          if (!data.report) {
            if (lastReportSnapshot !== null) {
              await refreshReports();
              window.dispatchEvent(new CustomEvent("reportGenerated"));
              return;
            }

            if (attempts < maxAttempts) {
              setTimeout(pollForCompletion, pollInterval);
            } else {
              console.warn(
                `[PastReports] ⚠️ TIMEOUT - Report never appeared after ${elapsedTime / 60} mins`
              );
            }
            return;
          }

          // Compare report snapshots for changes
          const currentReportSnapshot = JSON.stringify(data.report);
          const hasChanged = currentReportSnapshot !== lastReportSnapshot;

          // Check for completion or significant changes
          if (
            data.report.status === "completed" ||
            data.report.status === "error" ||
            hasChanged
          ) {
            await refreshReports();
            window.dispatchEvent(new CustomEvent("reportGenerated"));
            return;
          }

          // Update snapshot for next comparison
          lastReportSnapshot = currentReportSnapshot;

          if (attempts < maxAttempts) {
            setTimeout(pollForCompletion, pollInterval);
          } else {
            console.warn(
              `[PastReports] ⚠️ TIMEOUT after ${
                elapsedTime / 60
              } mins — Report still ${data.report.status}`
            );
          }
        } catch (error: unknown) {
          consecutiveErrors++;
          console.error(
            `[PastReports] ❌ Polling exception (${consecutiveErrors}/${maxConsecutiveErrors}):`,
            error
          );

          if (consecutiveErrors >= maxConsecutiveErrors) {
            console.error(
              `[PastReports] 🚫 Too many consecutive errors, aborting poll`
            );
            return;
          }

          if (attempts < maxAttempts) {
            setTimeout(pollForCompletion, pollInterval);
          }
        }
      };
      setTimeout(pollForCompletion, pollInterval);
    },
    [refreshReports]
  );

  useEffect(() => {
    // Event listener setup - data is already preloaded by context
    const handleReportGenerated = () => {
      void refreshReports();
    };

    window.addEventListener("reportGenerated", handleReportGenerated);

    // Expose refresh function globally for GenerateReportPage to call
    (
      window as unknown as { refreshPastReports: () => void }
    ).refreshPastReports = () => void handleRefresh();

    // Expose polling function globally for GenerateReportPage to call
    (
      window as unknown as {
        pollForReportCompletion: (documentId: string) => void;
      }
    ).pollForReportCompletion = (documentId: string) =>
      void pollForReportCompletion(documentId);

    // Cleanup on unmount
    return () => {
      window.removeEventListener("reportGenerated", handleReportGenerated);
      // Clean up global function references
      delete (window as unknown as { refreshPastReports?: () => void })
        .refreshPastReports;
      delete (
        window as unknown as {
          pollForReportCompletion?: (documentId: string) => void;
        }
      ).pollForReportCompletion;
    };
  }, [handleRefresh, pollForReportCompletion, refreshReports]);

  // Force grid mode on mobile
  const isSmallMobile = useMobile("(max-width: 640px)");

  useEffect(() => {
    if (isSmallMobile) {
      setViewMode("grid");
    }
  }, [isSmallMobile]);

  return (
    <div>
      {currentPdf && (
        <PdfModal
          currentPdf={currentPdf}
          currentReportAddress={currentDocumentName}
          onClose={closePdfModal}
        />
      )}
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={() =>
          reportToDelete &&
          handleDeleteReport(reportToDelete.id, reportToDelete.s3Key)
        }
      />
      {/* Global toasts shown via ToastsPortal */}

      <SavedLayout
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Filter by address"
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showViewToggle={true}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        isLoading={reportsLoading ?? isRefreshing}
        refreshTitle="Refresh reports"
        rightText={`${filteredReports.length} report${filteredReports.length !== 1 ? "s" : ""}`}
      />

      <div>
        {sortedReports.length === 0 ? (
          <div className="py-8 text-center sm:py-12">
            <MapPin className="mx-auto mb-3 h-8 w-8 text-black/40 sm:mb-4 sm:h-12 sm:w-12" />
            <h3 className="mb-2 text-base font-medium text-black sm:text-lg">
              No reports found
            </h3>
            <p className="px-4 text-sm text-black/60 sm:text-base">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Generate your first property report to get started"}
            </p>
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3"
                : "space-y-3 sm:space-y-4"
            }
          >
            {sortedReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                loadingUrls={loadingUrls}
                viewMode={viewMode}
                onView={handleViewDocument}
                onDownload={handleDownloadDocument}
                onShare={() => handleShareReport(report)}
                onDelete={openDeleteModal}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
