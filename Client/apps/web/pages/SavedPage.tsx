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
import { useReportsData } from "../../../packages/hooks/data/useReportsData";
import { useSavedHomesData } from "../../../packages/hooks/data/useSavedHomesData";
import type { SavedHome, Report } from "../../../packages/schemas";
import { useUIStore, useNegotiationStore } from "../../../packages/store";
import CompareReportsPage from "../features/decide/compare/CompareReportsPage";
import AIAssistant from "../features/decide/aiAssistant/AIAssistant";
import Button from "../components/ui/button/Button";
import { BarChart2, Bot, FileText } from "lucide-react";
import useMobile from "../../../packages/hooks/ui/useMobile";

export default function SavedHomes() {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<SavedHome | null>(
    null
  );
  const [viewType, setViewType] = useState<"homes" | "reports">("reports");
  const [reportsSubView, setReportsSubView] = useState<
    "reports" | "compare" | "chatbot"
  >("reports");
  const enqueueToast = useUIStore((s) => s.enqueueToast);
  const { setSelectedHome } = useNegotiationStore();

  // Use Zustand store for saved homes data (React Query integration)
  const {
    savedHomes: homes,
    savedHomesLoading: loading,
    savedHomesError: error,
    refreshSavedHomes,
    saveHome,
    removeSavedHome,
    isHomeSaved,
  } = useSavedHomesData();

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

  // Keep URL in sync when viewType changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const current = params.get("view");
    if (current !== viewType) {
      params.set("view", viewType);
      navigate(
        { pathname: "/saved", search: params.toString() },
        { replace: true }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewType]);

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

  const refresh = async () => {
    setRefreshing(true);
    if (viewType === "homes") {
      await refreshSavedHomes();
    } else {
      await refreshReports();
    }
    setRefreshing(false);
  };

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

  // Handle unlocking a home and saving to negotiation store
  const handleUnlockHome = useCallback(
    (home: SavedHome) => {
      // Convert SavedHome to the format expected by negotiation store
      const negotiationHome = {
        user_id: String(home.home_id || home.id || home.zpid?.toString() || ""),
        address: String(home.address || home.description || ""),
        beds: home.bedrooms || 0,
        baths: home.bathrooms || 0,
        sqft: home.sqft || 0,
        lot_size: String(home.lot_size || ""),
        price: String(home.price || ""),
        image_url: String(home.image_url || ""),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Save to negotiation store
      setSelectedHome(negotiationHome);

      // Show success message
      enqueueToast({
        type: "success",
        message: `Selected ${home.address || home.description} for negotiation`,
      });
    },
    [setSelectedHome, enqueueToast]
  );

  // Check if a home is saved (for modal)
  const isHomeSavedForModal = useCallback(
    (homeId: string) => {
      return isHomeSaved(homeId);
    },
    [isHomeSaved]
  );

  // Save home for modal - use Zustand hook
  const saveHomeForModal = useCallback(
    async (property: SavedHome) => {
      try {
        await saveHome(property);
        enqueueToast({
          type: "success",
          message: `Saved ${property.address}`,
        });
      } catch (error: unknown) {
        console.error("Error saving home:", error);
        enqueueToast({
          type: "error",
          message: "Failed to save home",
        });
      }
    },
    [saveHome, enqueueToast]
  );

  // Remove saved home for modal - use Zustand hook
  const removeSavedHomeForModal = useCallback(
    async (homeId: string) => {
      try {
        await removeSavedHome(homeId);
        enqueueToast({
          type: "success",
          message: "Removed from favorites",
        });
      } catch (error: unknown) {
        console.error("Error removing home from favorites:", error);
        enqueueToast({
          type: "error",
          message: "Failed to remove home from favorites",
        });
      }
    },
    [removeSavedHome, enqueueToast]
  );

  const filteredHomes = homes.filter((h: SavedHome) => {
    return (
      h.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.home_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const filteredReports = reports.filter((r: Report) =>
    r.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        {/* Generate Report Component - Show on desktop when reports view is active */}
        {viewType === "reports" && !isMobile && (
          <div className="mb-6">
            <GenerateReportPage onReportGenerated={handleReportGenerated} />
          </div>
        )}

        <SavedLayout
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder={
            viewType === "homes" ? "Search saved homes..." : "Filter by address"
          }
          showSearch={viewType !== "reports"}
          leftContent={
            viewType === "reports" ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<FileText />}
                  hideTextBelow="md"
                  onClick={() => setReportsSubView("reports")}
                  className={
                    reportsSubView === "reports"
                      ? "bg-gold text-white"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }
                >
                  Reports
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<BarChart2 />}
                  hideTextBelow="md"
                  onClick={() => setReportsSubView("compare")}
                  className={
                    reportsSubView === "compare"
                      ? "bg-gold text-white"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }
                >
                  Compare
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Bot />}
                  hideTextBelow="md"
                  onClick={() => setReportsSubView("chatbot")}
                  className={
                    reportsSubView === "chatbot"
                      ? "bg-gold text-white"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }
                >
                  Chatbot
                </Button>
              </div>
            ) : null
          }
          onRefresh={refresh}
          isRefreshing={refreshing}
          isLoading={viewType === "homes" ? loading : reportsLoading}
          refreshTitle={
            viewType === "homes" ? "Refresh saved homes" : "Refresh reports"
          }
          rightText={
            isMobile
              ? ""
              : viewType === "homes"
                ? `${filteredHomes.length} saved`
                : `${filteredReports.length} report${filteredReports.length !== 1 ? "s" : ""}`
          }
          viewType={viewType}
          onViewTypeChange={setViewType}
        />

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
                        price: home.price,
                        bedrooms: home.bedrooms,
                        bathrooms: home.bathrooms,
                        sqft: home.sqft,
                        lat: home.lat,
                        lng: home.lng,
                        images: home.image_url ? [home.image_url] : [],
                      }}
                      isSaved={true}
                      onSave={() => void saveHome(home)}
                      onRemove={() => void removeSavedHome(home.home_id)}
                      size="sm"
                    />
                  }
                  bottomContent={
                    <CardViewDetailsButton
                      onClick={() => handleUnlockHome(home)}
                      loading={false}
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
        <PropertyDetailsModal
          property={
            selectedProperty
              ? ({
                  id: selectedProperty.home_id,
                  address: selectedProperty.address ?? "",
                  price: String(selectedProperty.price ?? ""),
                  bedrooms: selectedProperty.bedrooms ?? 0,
                  bathrooms: selectedProperty.bathrooms ?? 0,
                  sqft: selectedProperty.sqft ?? 0,
                  lat: selectedProperty.lat ?? 0,
                  lng: selectedProperty.lng ?? 0,
                  latitude: selectedProperty.lat ?? 0,
                  longitude: selectedProperty.lng ?? 0,
                  images: selectedProperty.image_url
                    ? [selectedProperty.image_url]
                    : [],
                } as import("../../../packages/hooks/data/usePropertyDetails").Property)
              : null
          }
          onClose={() => setSelectedProperty(null)}
          isHomeSaved={isHomeSavedForModal}
          saveHome={async (property) => {
            type PropertyWithId =
              import("../../../packages/hooks/data/usePropertyDetails").Property & {
                home_id?: string;
                image_url?: string;
              };
            const prop = property as PropertyWithId;
            const mapped: SavedHome = {
              home_id: prop.id ?? prop.home_id ?? "",
              address: prop.address,
              price: prop.price,
              bedrooms: prop.bedrooms,
              bathrooms: prop.bathrooms,
              sqft: prop.sqft,
              lat: prop.lat,
              lng: prop.lng,
              image_url: Array.isArray(prop.images)
                ? prop.images[0]
                : prop.image_url,
            };
            await saveHomeForModal(mapped);
          }}
          removeSavedHome={removeSavedHomeForModal}
        />
      </div>
    </div>
  );
}
