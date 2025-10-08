// React imports
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// Components
import { CardCarousel } from "../components/cards/base";
import HomeCard, { type HomeDescription } from "../components/cards/HomeCard";
import ReportCard from "../components/cards/ReportCard";
import DeleteModal from "../components/modals/DeleteModal";
import PdfModal from "../components/modals/PdfModal";
import { NavigationButton } from "../components/ui";
// Core
import { reportApi } from "../../../packages/config/api";
import { useDocumentActions } from "../../../packages/hooks/data/useDocumentActions";
import { useReportsData } from "../../../packages/hooks/data/useReportsData";
import { useSavedHomesData } from "../../../packages/hooks/data/useSavedHomesData";
import type { Report } from "../../../packages/schemas";
import type { SavedHome } from "../../../packages/schemas/property";
import { useUIStore } from "../../../packages/store";
import type { UIState } from "../../../packages/store/ui.slice";
import { asError } from "../../../packages/utils/error";

export default function Dashboard() {
  const navigate = useNavigate();

  // Use saved homes data hook
  const {
    savedHomes,
    savedHomesLoading: favLoading,
    savedHomesError: favError,
    saveHome: saveHomeToContext,
    removeSavedHome: removeHomeFromContext,
  } = useSavedHomesData();

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

  // Delete modal and feedback states (matching PastReports)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<{
    id: string;
    s3Key: string | null | undefined;
  } | null>(null);
  const enqueueToast = useUIStore((s: UIState) => s.enqueueToast);

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

  // Helper function to check if a home is saved
  const isHomeSaved = (homeId: string): boolean => {
    return favoriteHomes.some((home) => home.home_id === homeId);
  };

  // Handle saving a home
  const handleSaveHome = async (property: unknown) => {
    try {
      await saveHomeToContext(property);
    } catch (error: unknown) {
      console.error("Error saving home:", error);
    }
  };

  // Handle removing a saved home
  const handleRemoveHome = async (homeId: string) => {
    try {
      await removeHomeFromContext(homeId);
    } catch (error: unknown) {
      console.error("Error removing home from favorites:", error);
    }
  };

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

    // Cleanup on unmount
    return () => {
      window.removeEventListener("reportGenerated", handleReportGenerated);
      // Clean up global function references
      delete (window as unknown as { pollForReportCompletion: unknown })
        .pollForReportCompletion;
    };
  }, [pollForReportCompletion, refreshReports]);

  return (
    <div className="-mt-8">
      {currentPdf && (
        <PdfModal
          currentPdf={currentPdf}
          currentReportAddress={currentDocumentName}
          reportId={currentDocumentId}
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

      {/* Dashboard Sections */}
      <div className="mx-4">
        {/* Favorite Homes */}
        <div className="my-8">
          <CardCarousel
            items={favoriteHomes}
            embeddedButton={
              <NavigationButton
                onClick={handleSavedHomesClick}
                size="md"
                arrowType="chevron"
              >
                Your Saved Homes
              </NavigationButton>
            }
            loading={favLoading}
            error={favError}
            emptyMessage="Save your first home today"
            renderItem={(home) => (
              <HomeCard
                home={home}
                isHomeSaved={isHomeSaved}
                onSave={handleSaveHome}
                onRemove={handleRemoveHome}
              />
            )}
            getItemKey={(home) => home.home_id}
            cardMinWidth={280}
            cardGap={16}
            infiniteLoop={false}
            ariaLabel="Saved homes carousel"
          />
        </div>

        {/* Recent Reports */}
        <div className="my-8">
          <CardCarousel<Report>
            items={reports}
            embeddedButton={
              <NavigationButton
                onClick={handleDocumentsClick}
                size="md"
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
            cardMinWidth={280}
            cardGap={16}
            infiniteLoop={false}
            ariaLabel="Recent reports carousel"
          />
        </div>
      </div>
    </div>
  );
}
