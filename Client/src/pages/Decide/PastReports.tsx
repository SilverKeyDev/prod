import { useState, useEffect, useCallback } from "react";
import { MapPin } from "lucide-react";
import SavedLayout, { ViewMode } from "../../components/layout/SavedLayout";
import ErrorToast from "../../components/feedback/ErrorToast";
import SuccessToast from "../../components/feedback/SuccessToast";
import DeleteModal from "../../components/modals/DeleteModal";
import { useReports } from "../../context";
import { Report } from "../../context/utils";
import { useDocumentActions } from "../../hooks/useDocumentActions";
import PdfModal from "../../components/modals/PdfModal";
import ReportCard from "../../components/cards/ReportCard";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function PastReports() {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Use preloaded data from context
  const { reports, loading: reportsLoading, refreshReports } = useReports();

  // Debug: Log the actual report data structure
  useEffect(() => {}, [reports]);

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

  // Refresh data when page loads to ensure latest updates
  useEffect(() => {
    refreshReports();
  }, [refreshReports]);

  // Handle refresh button click with loading state
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshReports();
    } finally {
      setIsRefreshing(false);
    }
  };

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<{
    id: string;
    s3Key: string | null | undefined;
  } | null>(null);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Share individual report using centralized function
  const handleShareReport = useCallback(
    async (report: Report) => {
      const result = await handleShareDocument(report.address);

      if (result.success) {
        setSuccessMessage(result.message);
        setShowSuccess(true);
      } else {
        setErrorMessage(result.message);
        setShowError(true);
      }
    },
    [handleShareDocument]
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
      // Prepare the S3 key
      let processedS3Key = s3Key;
      if (s3Key) {
        if (s3Key.startsWith("http")) {
          try {
            const url = new URL(s3Key);
            processedS3Key = url.pathname.substring(1); // Remove leading slash
          } catch (e) {
            console.warn(`[DELETE] Failed to parse URL ${s3Key}:`, e);
          }
        } else {
          processedS3Key = s3Key;
        }
      } else {
        console.warn(
          "[DELETE] No S3 key provided, will only delete from in-memory storage"
        );
      }

      const baseUrl = API_BASE_URL || "";
      const endpoint = `${baseUrl}/api/v1/report/${reportId}`;

      const res = await fetch(endpoint, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ s3Key: processedS3Key }),
      });

      const responseData = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          responseData.error || `HTTP error! status: ${res.status}`
        );
      }

      closeDeleteModal();
      setSuccessMessage("Report deleted successfully");
      setShowSuccess(true);

      // Refresh the reports list
      await refreshReports();
    } catch (error) {
      console.error("[DELETE] Error deleting report:", {
        error,
        reportId,
        s3Key,
        stack: error instanceof Error ? error.stack : "No stack trace",
      });

      setErrorMessage(
        error instanceof Error ? error.message : "Failed to delete report"
      );
      setShowError(true);
    }
  };

  const filteredReports = reports.filter((report: Report) =>
    report.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedReports = [...filteredReports].sort((a, b) => {
    // Sort by date, newest first
    return b.generatedAt.getTime() - a.generatedAt.getTime();
  });

  const pollForReportCompletion = useCallback(
    async (documentId: string) => {
      const pollInterval = 1000; // 1 second
      const maxAttempts = 120; // 10 minutes
      let attempts = 0;
      const startTime = Date.now();
      let consecutiveErrors = 0;
      const maxConsecutiveErrors = 5;

      const idToken = localStorage.getItem("id_token");
      if (!idToken) {
        console.error(`[PastReports] ❌ No auth token found`);
        return;
      }

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      let lastReportSnapshot: string | null = null;

      // Step 1: Initial check
      try {
        const initialResponse = await fetch(
          `${apiBaseUrl}/api/v1/report/poll/${documentId}`,
          {
            method: "GET",
            mode: "cors",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${idToken}`,
            },
            credentials: "include",
          }
        );

        if (!initialResponse.ok) {
          console.error(
            `[PastReports] ❌ Initial poll failed with status: ${initialResponse.status}`
          );
          return;
        }

        const initialData = await initialResponse.json();

        if (initialData.success && initialData.report) {
          lastReportSnapshot = JSON.stringify(initialData.report);

          if (
            initialData.report.status === "completed" ||
            initialData.report.status === "error"
          ) {
            await handleRefresh();
            window.dispatchEvent(new CustomEvent("reportGenerated"));
            return;
          }
        } else if (initialData.success && !initialData.report) {
          lastReportSnapshot = null;
          lastReportSnapshot = null;
        } else {
          console.error(
            `[PastReports] ❌ Initial poll failed:`,
            initialData.error
          );
          return;
        }
      } catch (err) {
        console.error(`[PastReports] ❌ Error during initial poll:`, err);
        return;
      }

      // Step 2: Polling loop
      const pollForCompletion = async (): Promise<void> => {
        attempts++;
        const elapsedTime = Math.round((Date.now() - startTime) / 1000);

        try {
          const response = await fetch(
            `${apiBaseUrl}/api/v1/report/poll/${documentId}`,
            {
              method: "GET",
              mode: "cors",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${idToken}`,
              },
              credentials: "include",
            }
          );

          if (!response.ok) {
            consecutiveErrors++;
            console.error(
              `[PastReports] ❌ Poll error: ${response.status} ${response.statusText} (${consecutiveErrors}/${maxConsecutiveErrors})`
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

          const data = await response.json();
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
              await handleRefresh();
              window.dispatchEvent(new CustomEvent("reportGenerated"));
              return;
            }

            if (attempts < maxAttempts) {
              setTimeout(pollForCompletion, pollInterval);
            } else {
              console.warn(
                `[PastReports] ⚠️ TIMEOUT - Report never appeared after ${
                  elapsedTime / 60
                } mins`
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
            await handleRefresh();
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
        } catch (error) {
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
      refreshReports();
    };

    window.addEventListener("reportGenerated", handleReportGenerated);

    // Expose refresh function globally for GenerateReportPage to call
    (window as any).refreshPastReports = handleRefresh;

    // Expose polling function globally for GenerateReportPage to call
    (window as any).pollForReportCompletion = pollForReportCompletion;

    // Cleanup on unmount
    return () => {
      window.removeEventListener("reportGenerated", handleReportGenerated);
      // Clean up global function references
      delete (window as any).refreshPastReports;
      delete (window as any).pollForReportCompletion;
    };
  }, [handleRefresh, pollForReportCompletion]);

  // Force grid mode on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        // sm breakpoint
        setViewMode("grid");
      }
    };

    // Set initial state
    handleResize();

    // Listen for window resize
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="mobile-padding">
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
      {showError && (
        <ErrorToast
          message={errorMessage}
          onClose={() => setShowError(false)}
          duration={5000}
        />
      )}
      {showSuccess && (
        <SuccessToast
          message={successMessage}
          onClose={() => setShowSuccess(false)}
          duration={3000}
        />
      )}

      <SavedLayout
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Filter by address"
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showViewToggle={true}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        isLoading={reportsLoading}
        refreshTitle="Refresh reports"
        rightText={`${filteredReports.length} report${
          filteredReports.length !== 1 ? "s" : ""
        }`}
      />

      <div>
        {sortedReports.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <MapPin className="h-8 w-8 sm:h-12 sm:w-12 text-black/40 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-black mb-2">
              No reports found
            </h3>
            <p className="text-sm sm:text-base text-black/60 px-4">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Generate your first property report to get started"}
            </p>
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
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
