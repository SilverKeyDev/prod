// React imports
import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

// Components
import { CardCarousel } from "../components/cards/base";
import HomeCard, { type HomeDescription } from "../components/cards/HomeCard";
import ReportCard from "../components/cards/ReportCard";
import DeleteModal from "../components/modals/DeleteModal";
import PdfModal from "../components/modals/PdfModal";
import { NavigationButton } from "../components/ui";
import Toggle from "../components/ui/form/Toggle";
// import { Calendar } from "../features/dashboard/calendar";
// Core
import { reportApi, userApi } from "../../../packages/config/api";
import { useDocumentActions } from "../../../packages/hooks/data/useDocumentActions";
import { useReportsData } from "../../../packages/hooks/data/useReportsData";
import { useUserData } from "../../../packages/hooks/data/useUserData";
import { useSavedHomesStoreIntegration } from "../../../packages/hooks/store/useSavedHomesStoreIntegration";
import type { Report } from "../../../packages/schemas";
import type { SavedHome } from "../../../packages/schemas/property";
import { useUIStore } from "../../../packages/store";
import type { UIState } from "../../../packages/store/ui.slice";
import { asError } from "../../../packages/utils/error";

export default function Dashboard() {
  const navigate = useNavigate();

  // Use user data hook for closing mode
  const { userProfile, refreshUserProfile } = useUserData();
  const [isUpdatingClosingMode, setIsUpdatingClosingMode] = useState(false);

  // Use saved homes data hook
  const {
    savedHomes,
    savedHomesLoading: favLoading,
    savedHomesError: favError,
  } = useSavedHomesStoreIntegration();

  // Convert SavedHome[] to HomeDescription[] for HomeCard compatibility
  const favoriteHomes: HomeDescription[] = savedHomes.map(
    (home: SavedHome) => ({
      home_id: home.home_id,
      description: home.description,
      address: home.address,
      price: home.price,
      bedrooms: home.bedrooms,
      bathrooms: home.bathrooms,
      sqft: home.sqft && home.sqft > 0 ? home.sqft : undefined,
      lot_size:
        typeof home.lot_size === "string" || typeof home.lot_size === "number"
          ? (home.lot_size as string | number)
          : undefined,
      image_url: home.image_url,
      lat: home.lat,
      lng: home.lng,
    })
  );

  // Use reports data hook
  const { reports, reportsLoading, refreshReports } = useReportsData();

  // Sort reports: generating first, then completed, then error
  const sortedReports = useMemo(() => {
    const statusPriority = {
      generating: 1,
      completed: 2,
      error: 3,
    };

    return [...reports].sort((a, b) => {
      const statusA = statusPriority[a.status] || 99;
      const statusB = statusPriority[b.status] || 99;
      if (statusA !== statusB) {
        return statusA - statusB;
      }
      // If status is the same, sort by date (most recent first)
      return b.generatedAt.getTime() - a.generatedAt.getTime();
    });
  }, [reports]);

  // Delete modal and feedback states (matching PastReports)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<{
    id: string;
    s3Key: string | null | undefined;
  } | null>(null);
  const enqueueToast = useUIStore((s: UIState) => s.enqueueToast);

  // Handle closing mode toggle
  const handleClosingModeToggle = useCallback(
    async (checked: boolean) => {
      if (isUpdatingClosingMode) return;

      setIsUpdatingClosingMode(true);
      try {
        const response = await userApi.updateClosingMode(checked);
        if (response.success) {
          await refreshUserProfile();
          enqueueToast({
            type: "success",
            message: `Closing mode ${checked ? "enabled" : "disabled"}`,
          });
        } else {
          enqueueToast({
            type: "error",
            message: response.error ?? "Failed to update closing mode",
          });
        }
      } catch (error: unknown) {
        const err = asError(error);
        enqueueToast({
          type: "error",
          message: err.message ?? "Failed to update closing mode",
        });
      } finally {
        setIsUpdatingClosingMode(false);
      }
    },
    [isUpdatingClosingMode, refreshUserProfile, enqueueToast]
  );

  // Use centralized document actions
  const {
    loadingUrls,
    handleViewDocument,
    handleDownloadDocument,
    handleShareDocument,
    currentPdf,
    currentDocumentId,
    currentDocumentName,
    closePdfModal,
  } = useDocumentActions();

  // Navigation handlers
  const handleSavedHomesClick = () => {
    navigate("/saved?view=homes");
  };

  const handleDocumentsClick = () => {
    navigate("/saved?view=reports");
  };

  useEffect(() => {
    // Refresh reports when dashboard loads
    void refreshReports();
  }, [refreshReports]);

  // Share individual report using centralized function
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

  // Polling functionality (matching PastReports)
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
        console.error(`[Dashboard] ❌ No auth token found`);
        return;
      }

      let lastReportSnapshot: string | null = null;

      // Step 1: Initial check
      try {
        const initialData = await reportApi.poll(documentId);

        if (initialData.success && initialData.report) {
          lastReportSnapshot = JSON.stringify(initialData.report);

          if (
            initialData.report.status === "completed" ||
            initialData.report.status === "error"
          ) {
            await refreshReports();
            window.dispatchEvent(new CustomEvent("reportGenerated"));
            return;
          }
        } else if (initialData.success && !initialData.report) {
          lastReportSnapshot = null;
        } else {
          console.error(
            `[Dashboard] ❌ Initial poll failed: No report data received`
          );
          return;
        }
      } catch (err: unknown) {
        const error = asError(err);
        console.error(`[Dashboard] ❌ Error during initial poll:`, error);
        return;
      }

      // Step 2: Polling loop
      const pollForCompletion = async (): Promise<void> => {
        attempts++;
        const elapsedTime = Math.round((Date.now() - startTime) / 1000);

        try {
          const data = await reportApi.poll(documentId);

          if (!data.success) {
            consecutiveErrors++;
            console.error(
              `[Dashboard] ❌ Poll error: API returned unsuccessful response (${consecutiveErrors}/${maxConsecutiveErrors})`
            );

            if (consecutiveErrors >= maxConsecutiveErrors) {
              console.error(
                `[Dashboard] 🚫 Too many consecutive errors (${consecutiveErrors}), aborting poll`
              );
              return;
            }

            if (attempts < maxAttempts) {
              setTimeout(pollForCompletion, pollInterval);
            }
            return;
          }
          consecutiveErrors = 0; // Reset error counter on success

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
                `[Dashboard] ⚠️ TIMEOUT - Report never appeared after ${elapsedTime / 60} mins`
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
              `[Dashboard] ⚠️ TIMEOUT after ${
                elapsedTime / 60
              } mins — Report still ${data.report.status}`
            );
          }
        } catch (error: unknown) {
          consecutiveErrors++;
          console.error(
            `[Dashboard] ❌ Polling exception (${consecutiveErrors}/${maxConsecutiveErrors}):`,
            error
          );

          if (consecutiveErrors >= maxConsecutiveErrors) {
            console.error(
              `[Dashboard] 🚫 Too many consecutive errors, aborting poll`
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

  // Event listeners and global function exposure (matching PastReports)
  useEffect(() => {
    // Event listener setup - data is already preloaded by context
    const handleReportGenerated = () => {
      void refreshReports();
    };

    window.addEventListener("reportGenerated", handleReportGenerated);

    // Expose polling function globally for GenerateReportPage to call
    (
      window as unknown as { pollForReportCompletion: unknown }
    ).pollForReportCompletion = pollForReportCompletion;

    // Expose refresh function for GenerateReportPage auto-refresh
    (
      window as unknown as {
        refreshReportsAfterGenerate?: () => Promise<unknown>;
      }
    ).refreshReportsAfterGenerate = refreshReports;

    // Cleanup on unmount
    return () => {
      window.removeEventListener("reportGenerated", handleReportGenerated);
      // Clean up global function references
      delete (window as unknown as { pollForReportCompletion: unknown })
        .pollForReportCompletion;
      delete (
        window as unknown as {
          refreshReportsAfterGenerate?: () => Promise<unknown>;
        }
      ).refreshReportsAfterGenerate;
    };
  }, [pollForReportCompletion, refreshReports]);

  return (
    <div className="-mt-16">
      <PdfModal
        currentPdf={currentPdf}
        currentReportAddress={currentDocumentName}
        reportId={currentDocumentId}
        onClose={closePdfModal}
      />
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={() =>
          reportToDelete &&
          handleDeleteReport(reportToDelete.id, reportToDelete.s3Key)
        }
      />

      {/* Dashboard Sections */}
      <div className="mx-4">
        {/* Closing Mode Toggle */}
        {userProfile && (
          <div className="my-6 flex items-center justify-center">
            <div className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 shadow-md">
              <Toggle
                checked={userProfile.is_closing_mode ?? false}
                onChange={handleClosingModeToggle}
                label="Closing Mode"
                disabled={isUpdatingClosingMode}
                size="md"
              />
            </div>
          </div>
        )}

        {/* Favorite Homes */}
        <div className="my-8">
          <CardCarousel
            items={favoriteHomes}
            embeddedButton={
              <NavigationButton
                onClick={handleSavedHomesClick}
                size="sm"
                arrowType="chevron"
              >
                Your Saved Homes
              </NavigationButton>
            }
            loading={favLoading}
            error={favError}
            emptyMessage="Save your first home today"
            renderItem={(home) => <HomeCard home={home} />}
            getItemKey={(home) => home.home_id}
            cardMinWidth={240}
            cardGap={12}
            infiniteLoop={false}
            ariaLabel="Saved homes carousel"
          />
        </div>

        {/* Recent Reports */}
        <div className="my-8">
          <CardCarousel<Report>
            items={sortedReports}
            embeddedButton={
              <NavigationButton
                onClick={handleDocumentsClick}
                size="sm"
                arrowType="chevron"
              >
                Your Reports
              </NavigationButton>
            }
            loading={reportsLoading}
            error={null}
            emptyMessage="Generate your first property report to get started"
            renderItem={(report: Report) => (
              <ReportCard
                report={report}
                loadingUrls={loadingUrls}
                viewMode="grid"
                onView={handleViewDocument}
                onDownload={handleDownloadDocument}
                onShare={() => handleShareReport(report)}
                onDelete={openDeleteModal}
              />
            )}
            getItemKey={(report: Report) => report.id}
            cardMinWidth={240}
            cardGap={12}
            infiniteLoop={false}
            ariaLabel="Recent reports carousel"
          />
        </div>

        {/* Calendar */}
        {/* <div className="my-8">
          <Calendar />
        </div> */}
      </div>
    </div>
  );
}
