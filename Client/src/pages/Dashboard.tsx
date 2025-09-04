import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { favoriteHomesApi } from "../lib/api";
import ReportCard from "../components/cards/ReportCard";
import { useReports } from "../context";
import { Report } from "../context/utils";
import HomeCard, { HomeDescription } from "../components/cards/HomeCard";
import NavigationButton from "../components/ui/base/NavigationButton";
import { useDocumentActions } from "../hooks/useDocumentActions";
import PdfModal from "../components/modals/PdfModal";
import { CardCarousel } from "../components/cards/base";
import TimelineChecklist from "../components/ui/dashboard/DashboardButtonHeader";
import ErrorToast from "../components/feedback/ErrorToast";
import SuccessToast from "../components/feedback/SuccessToast";
import DeleteModal from "../components/modals/DeleteModal";

export default function Dashboard() {
  const navigate = useNavigate();
  // 🆕 Fetch favorite homes
  const [favoriteHomes, setFavoriteHomes] = useState<HomeDescription[]>([]);
  const [favLoading, setFavLoading] = useState(true);
  const [favError, setFavError] = useState<string | null>(null);

  // Use preloaded report data from context
  const { reports, loading: reportsLoading, refreshReports } = useReports();

  // Delete modal and feedback states (matching PastReports)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<{
    id: string;
    s3Key: string | null | undefined;
  } | null>(null);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

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

  // Helper function to check if a home is saved
  const isHomeSaved = (homeId: string): boolean => {
    return favoriteHomes.some((home) => home.home_id === homeId);
  };

  // Handle saving a home
  const handleSaveHome = async (property: any) => {
    try {
      await favoriteHomesApi.addFavorite(property);
      // Refresh the saved homes list - we'll trigger a re-fetch via useEffect
      window.location.reload();
    } catch (error) {
      console.error("Error saving home:", error);
    }
  };

  // Handle removing a saved home
  const handleRemoveHome = async (homeId: string) => {
    try {
      await favoriteHomesApi.removeFavorite(homeId);
      // Update local state by removing the home
      setFavoriteHomes((prev) =>
        prev.filter((home) => home.home_id !== homeId)
      );
    } catch (error) {
      console.error("Error removing home from favorites:", error);
    }
  };

  // Navigation handlers
  const handleSavedHomesClick = () => {
    navigate("/saved");
  };

  const handleDocumentsClick = () => {
    navigate("/reports");
  };

  useEffect(() => {
    const fetchFavs = async () => {
      setFavLoading(true);
      setFavError(null);
      try {
        const res = await favoriteHomesApi.getFavorites();
        if (res.success) {
          // Backend returns { favorites: HomeUniversal[] } where each is an object
          const rawHomes = res.favorites || [];
          // Map HomeUniversal fields to HomeDescription for HomeCard
          const homeObjects: HomeDescription[] = rawHomes.map(
            (home: any, index: number) => ({
              home_id: home.address || `home_${index}_${Date.now()}`,
              description: home.address || "",
              address: home.address || "",
              price: home.price || "",
              bedrooms: parseInt(home.beds) || 0,
              bathrooms: parseInt(home.baths) || 0,
              sqft: parseInt(home.sqft) || 0,
              lot_size: home.lot_size || "",
              image_url: home.image_url || undefined,
              lat: home.lat || 0,
              lng: home.lng || 0,
              // Any other HomeUniversal fields can be passed through
              ...home,
            })
          );
          setFavoriteHomes(homeObjects);
        } else {
          setFavError(res.error || "Failed to load favorite homes");
        }
      } catch (error) {
        setFavError("Failed to load favorite homes");
      }
      setFavLoading(false);
    };

    fetchFavs();
    // Refresh reports when dashboard loads
    refreshReports();
  }, [refreshReports]);

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

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
            `[Dashboard] ❌ Initial poll failed with status: ${initialResponse.status}`
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
            await refreshReports();
            window.dispatchEvent(new CustomEvent("reportGenerated"));
            return;
          }
        } else if (initialData.success && !initialData.report) {
          lastReportSnapshot = null;
        } else {
          console.error(
            `[Dashboard] ❌ Initial poll failed:`,
            initialData.error
          );
          return;
        }
      } catch (err) {
        console.error(`[Dashboard] ❌ Error during initial poll:`, err);
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
              `[Dashboard] ❌ Poll error: ${response.status} ${response.statusText} (${consecutiveErrors}/${maxConsecutiveErrors})`
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

          const data = await response.json();
          consecutiveErrors = 0; // Reset error counter on success

          if (!data.success) {
            console.error(`[Dashboard] ❌ Poll API error:`, data.error);
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
                `[Dashboard] ⚠️ TIMEOUT - Report never appeared after ${
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
        } catch (error) {
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
      refreshReports();
    };

    window.addEventListener("reportGenerated", handleReportGenerated);

    // Expose polling function globally for GenerateReportPage to call
    (window as any).pollForReportCompletion = pollForReportCompletion;

    // Cleanup on unmount
    return () => {
      window.removeEventListener("reportGenerated", handleReportGenerated);
      // Clean up global function references
      delete (window as any).pollForReportCompletion;
    };
  }, [pollForReportCompletion]);

  return (
    <div className="-mt-8">
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
      {/* Timeline Progress - Full Width (hidden on mobile) */}
      <div className="hidden lg:block mb-8 -mx-4 sm:-mx-6 lg:-mx-8">
        <TimelineChecklist variant="horizontal" completedStepKey="search" />
      </div>

      {/* Favorite Homes */}
      <div className="mt-12">
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
          minCardWidth={320}
          maxCardWidth={400}
          cardGap={16}
          renderItem={(home) => (
            <HomeCard
              home={home}
              isHomeSaved={isHomeSaved}
              onSave={handleSaveHome}
              onRemove={handleRemoveHome}
            />
          )}
          getItemKey={(home) => home.home_id}
        />
      </div>

      {/* Recent Reports */}
      <div className="my-8">
        <CardCarousel
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
          minCardWidth={320}
          maxCardWidth={400}
          renderItem={(report) => (
            <div>
              <ReportCard
                report={report}
                loadingUrls={loadingUrls}
                viewMode="grid"
                onView={handleViewDocument}
                onDownload={handleDownloadDocument}
                onShare={() => handleShareReport(report)}
                onDelete={openDeleteModal}
              />
            </div>
          )}
          getItemKey={(report) => report.id}
        />
      </div>
    </div>
  );
}
