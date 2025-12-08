import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import SavedLayout from "../app/layouts/SavedLayout";
import { PropertyCard } from "../components/cards";
import ReportCard from "../components/cards/ReportCard";
import { CardHeartSave, CardViewDetailsButton } from "../components/cards/base";
import DeleteModal from "../components/modals/DeleteModal";
import PdfModal from "../components/modals/PdfModal";
import PropertyDetailsModal from "../components/modals/PropertyDetailsModal";
import { KeyTurnLoader } from "../components/ui";
import GenerateReportPage from "../features/decide/generate/GenerateReport";
import { reportApi } from "../../../packages/config/api";
import { useDocumentActions } from "../../../packages/hooks/data/useDocumentActions";
import { usePropertyDetails } from "../../../packages/hooks/data/usePropertyDetails";
import { useReportsData } from "../../../packages/hooks/data/useReportsData";
import { useSavedHomesStoreIntegration } from "../../../packages/hooks/store/useSavedHomesStoreIntegration";
import type { SavedHome, Report } from "../../../packages/schemas";
import { useUIStore } from "../../../packages/store";
import CompareReportsPage from "../features/decide/compare/CompareReportsPage";
import AIAssistant from "../features/decide/aiAssistant/AIAssistant";
import ReportsSubViewNavigation from "../features/decide/ReportsSubViewNavigation";
import useMobile from "../../../packages/hooks/ui/useMobile";

type SavedHomesProps = {
  setMobileHeaderActions?: React.Dispatch<
    React.SetStateAction<React.ReactNode | null>
  >;
};

export default function SavedHomes({
  setMobileHeaderActions,
}: SavedHomesProps = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [viewType, setViewType] = useState<"homes" | "reports">("homes");
  const [reportsSubView, setReportsSubView] = useState<
    "reports" | "compare" | "chatbot"
  >("reports");
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const enqueueToast = useUIStore((s) => s.enqueueToast);

  // Use Zustand store for saved homes data (React Query integration)
  const {
    savedHomes: homes,
    savedHomesLoading: loading,
    savedHomesError: error,
    refreshSavedHomes,
  } = useSavedHomesStoreIntegration();

  // Use reports data hook (same as Dashboard)
  const { reports, reportsLoading, refreshReports } = useReportsData();

  // Use centralized document actions for reports
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

  // Use property details hook for unlock functionality
  const { selectedProperty, fetchPropertyDetails, clearSelectedProperty } =
    usePropertyDetails();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<{
    id: string;
    s3Key: string | null | undefined;
  } | null>(null);

  // Load data when page loads or view type changes
  useEffect(() => {
    // Initialize from query param on first render
    const params = new URLSearchParams(location.search);
    const viewParam = params.get("view");
    if (viewParam === "reports" || viewParam === "homes") {
      setViewType(viewParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Monitor comparison mode state from localStorage
  useEffect(() => {
    const checkComparisonMode = () => {
      try {
        const savedState = localStorage.getItem("generateReportState");
        if (savedState) {
          const parsed = JSON.parse(savedState) as {
            reportType?: string;
          };
          setIsComparisonMode(parsed.reportType === "comparison");
        }
      } catch {
        // Ignore parsing errors
      }
    };

    // Check initially
    checkComparisonMode();

    // Listen for storage changes (when GenerateReportPage updates localStorage)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "generateReportState") {
        checkComparisonMode();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Also poll periodically to catch changes from same tab
    const interval = setInterval(checkComparisonMode, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Keep URL in sync when viewType changes (no query params)
  // useEffect(() => {
  //   const params = new URLSearchParams(location.search);
  //   const current = params.get("view");
  //   if (current !== viewType) {
  //     params.set("view", viewType);
  //     navigate(
  //       { pathname: "/saved", search: params.toString() },
  //       { replace: true }
  //     );
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [viewType]);

  // Reset reports subview when switching to homes
  useEffect(() => {
    if (viewType === "homes") setReportsSubView("reports");
  }, [viewType]);

  // Fetch data for current view
  useEffect(() => {
    if (viewType === "homes") {
      // Optionally expose refresh in dev
      (
        window as unknown as { refreshFavorites?: () => void }
      ).refreshFavorites = refreshSavedHomes;
    } else if (viewType === "reports") {
      // Expose refreshReports for GenerateReportPage to call (mobile + desktop)
      (
        window as unknown as {
          refreshReportsAfterGenerate?: () => Promise<unknown>;
        }
      ).refreshReportsAfterGenerate = refreshReports;
    }
    // Reports are automatically loaded by useReportsData hook
  }, [refreshSavedHomes, refreshReports, viewType]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    if (viewType === "homes") {
      await refreshSavedHomes();
    } else {
      await refreshReports();
    }
    setRefreshing(false);
  }, [viewType, refreshSavedHomes, refreshReports]);

  // Polling interval ref for report generation
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clear polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Handle report generation - auto-refresh reports list
  const handleReportGenerated = useCallback(
    async (documentId: string) => {
      console.log(
        `[SavedPage] Report generation started for document ID: ${documentId}`
      );

      // Clear any existing polling interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }

      // Initial refresh after 0.5 seconds
      setTimeout(async () => {
        console.log("[SavedPage] Initial refresh after report generation");
        await refreshReports();
      }, 500);

      // Set up periodic polling every 30 seconds
      pollingIntervalRef.current = setInterval(async () => {
        console.log("[SavedPage] Periodic refresh for pending report");
        await refreshReports();

        // Check if the report is now complete
        // This will be checked in the next interval cycle
      }, 30000); // 30 seconds

      // Stop polling after 10 minutes (reports typically take ~5 minutes)
      setTimeout(() => {
        if (pollingIntervalRef.current) {
          console.log("[SavedPage] Stopping periodic refresh after 10 minutes");
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }, 600000); // 10 minutes
    },
    [refreshReports]
  );

  // Handle unlocking a home - opens PropertyDetailsModal
  const handleUnlockHome = useCallback(
    async (home: SavedHome) => {
      // Convert SavedHome to Property format for the hook
      const propertyData = {
        id: home.home_id,
        address: String(home.address || home.description || ""),
        price:
          typeof home.price === "string"
            ? home.price.startsWith("$")
              ? home.price
              : `$${home.price}`
            : typeof home.price === "number"
              ? `$${home.price.toLocaleString()}`
              : "Price not available",
        bedrooms: home.bedrooms ?? 0,
        bathrooms: home.bathrooms ?? 0,
        sqft: home.sqft ?? 0,
        lat: home.lat ?? 0,
        lng: home.lng ?? 0,
        latitude: home.lat ?? 0,
        longitude: home.lng ?? 0,
        images: home.image_url ? [home.image_url] : undefined,
      };

      // Fetch property details and open modal
      await fetchPropertyDetails(propertyData);
    },
    [fetchPropertyDetails]
  );

  const filteredHomes = homes.filter((h: SavedHome) => {
    return (
      h.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.home_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Sort reports: generating first, then completed, then error
  const statusPriority = {
    generating: 1,
    completed: 2,
    error: 3,
  };

  const filteredReports = reports
    .filter((r: Report) =>
      r.address?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const statusA = statusPriority[a.status] || 99;
      const statusB = statusPriority[b.status] || 99;
      if (statusA !== statusB) {
        return statusA - statusB;
      }
      // If status is the same, sort by date (most recent first)
      return b.generatedAt.getTime() - a.generatedAt.getTime();
    });

  // Handle report actions
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

  // Set mobile header actions with SavedLayout
  useEffect(() => {
    if (isMobile && setMobileHeaderActions) {
      setMobileHeaderActions(
        <SavedLayout
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder={
            viewType === "homes" ? "Search saved homes..." : "Filter by address"
          }
          showSearch={viewType !== "reports"}
          leftContent={
            viewType === "reports" ? (
              <ReportsSubViewNavigation
                currentView={reportsSubView}
                onViewChange={setReportsSubView}
              />
            ) : null
          }
          onRefresh={refresh}
          isRefreshing={refreshing}
          isLoading={viewType === "homes" ? loading : reportsLoading}
          refreshTitle={
            viewType === "homes" ? "Refresh saved homes" : "Refresh reports"
          }
          rightText={
            viewType === "homes"
              ? `${filteredHomes.length} saved`
              : `${filteredReports.length} report${filteredReports.length !== 1 ? "s" : ""}`
          }
          viewType={viewType}
          onViewTypeChange={setViewType}
        />
      );
    } else if (setMobileHeaderActions) {
      setMobileHeaderActions(null);
    }
  }, [
    isMobile,
    setMobileHeaderActions,
    searchTerm,
    viewType,
    reportsSubView,
    refreshing,
    loading,
    reportsLoading,
    filteredHomes.length,
    filteredReports.length,
    refresh,
  ]);

  // overlay toast component
  useEffect(() => {
    if (error) enqueueToast({ type: "error", message: error });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  return (
    <div>
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
      <div className="space-y-8">
        {/* SavedLayout - Only show on desktop (mobile shows in topbar) */}
        {!isMobile && (
          <SavedLayout
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder={
              viewType === "homes"
                ? "Search saved homes..."
                : "Filter by address"
            }
            showSearch={viewType !== "reports"}
            leftContent={
              viewType === "reports" ? (
                <ReportsSubViewNavigation
                  currentView={reportsSubView}
                  onViewChange={setReportsSubView}
                />
              ) : null
            }
            onRefresh={refresh}
            isRefreshing={refreshing}
            isLoading={viewType === "homes" ? loading : reportsLoading}
            refreshTitle={
              viewType === "homes" ? "Refresh saved homes" : "Refresh reports"
            }
            rightText={
              viewType === "homes"
                ? `${filteredHomes.length} saved`
                : `${filteredReports.length} home${filteredReports.length !== 1 ? "s" : ""}`
            }
            viewType={viewType}
            onViewTypeChange={setViewType}
          />
        )}

        {/* Generate Report Component - Show only when Reports button is selected */}
        {viewType === "reports" && reportsSubView === "reports" && (
          <div className={`mb-6 ${isComparisonMode ? "-mt-16" : ""}`}>
            <GenerateReportPage onReportGenerated={handleReportGenerated} />
          </div>
        )}

        {/* Content */}
        {viewType === "homes" ? (
          filteredHomes.length === 0 ? (
            loading ? (
              <div className="py-responsive-lg flex justify-center">
                <KeyTurnLoader message="Loading saved homes..." />
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-gray-600">You have no saved homes yet.</p>
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredHomes.map((home: SavedHome) => (
                <PropertyCard
                  key={home.home_id}
                  id={home.home_id}
                  imageUrl={home.image_url}
                  address={
                    typeof home.address === "string" ||
                    typeof home.address === "number"
                      ? home.address.toString()
                      : (home.description ?? "[Invalid address]")
                  }
                  price={
                    typeof home.price === "string" ||
                    typeof home.price === "number"
                      ? home.price.toString()
                      : "[Invalid price]"
                  }
                  bedrooms={home.bedrooms}
                  bathrooms={home.bathrooms}
                  sqft={home.sqft && home.sqft > 0 ? home.sqft : undefined}
                  lotSize={
                    typeof home.lot_size === "string"
                      ? home.lot_size
                      : undefined
                  }
                  pricePosition="below-address"
                  cardType="searchpage"
                  showScore={false}
                  topContent={
                    <CardHeartSave
                      property={{
                        id: home.home_id,
                        address: home.address ?? home.description ?? "",
                        price:
                          typeof home.price === "string" ||
                          typeof home.price === "number"
                            ? String(home.price)
                            : "",
                        bedrooms: home.bedrooms ?? 0,
                        bathrooms: home.bathrooms ?? 0,
                        sqft: home.sqft ?? 0,
                        lat: home.lat ?? 0,
                        lng: home.lng ?? 0,
                        images: home.image_url ? [home.image_url] : [],
                      }}
                      size="sm"
                    />
                  }
                  bottomContent={
                    <CardViewDetailsButton
                      onClick={() => handleUnlockHome(home)}
                      size="sm"
                      variant="primary"
                      fullWidth
                      text="Unlock"
                    />
                  }
                />
              ))}
            </div>
          )
        ) : /* Reports View */
        reportsSubView === "compare" ? (
          <CompareReportsPage />
        ) : reportsSubView === "chatbot" ? (
          <AIAssistant />
        ) : filteredReports.length === 0 ? (
          reportsLoading ? (
            <div className="py-responsive-lg flex justify-center">
              <KeyTurnLoader message="Loading reports..." />
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-gray-600">
                {searchTerm
                  ? "No reports found matching your search"
                  : "You have no reports yet."}
              </p>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {filteredReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                loadingUrls={loadingUrls}
                viewMode="grid"
                onView={handleViewDocument}
                onDownload={handleDownloadDocument}
                onShare={() => handleShareReport(report)}
                onDelete={openDeleteModal}
              />
            ))}
          </div>
        )}
        {/* Global toasts shown via ToastsPortal */}

        {/* Property Details Modal */}
        {selectedProperty && (
          <PropertyDetailsModal
            property={selectedProperty}
            onClose={clearSelectedProperty}
          />
        )}
      </div>
    </div>
  );
}
