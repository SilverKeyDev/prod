import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import SavedLayout from "../app/layouts/SavedLayout";
import { PropertyCard } from "../components/cards";
import ReportCard from "../components/cards/ReportCard";
import { CardHeartSave, CardViewDetailsButton } from "../components/cards/base";
import DeleteModal from "../components/modals/DeleteModal";
import PdfModal from "../components/modals/PdfModal";
import PropertyDetailsModal from "../components/modals/PropertyDetailsModal";
import { KeyTurnLoader } from "../components/ui";
import { userApi, reportApi } from "../../../packages/config/api";
import { useDocumentActions } from "../../../packages/hooks/data/useDocumentActions";
import type { SavedHome, Report } from "../../../packages/schemas";
import { useUIStore, useNegotiationStore } from "../../../packages/store";

export default function SavedHomes() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<SavedHome | null>(
    null
  );
  const [homes, setHomes] = useState<SavedHome[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState<"homes" | "reports">("homes");
  const enqueueToast = useUIStore((s) => s.enqueueToast);
  const { setSelectedHome } = useNegotiationStore();

  // Use centralized document actions for reports
  const {
    loadingUrls,
    handleViewDocument,
    handleDownloadDocument,
    handleShareDocument,
    currentPdf,
    currentDocumentName,
    closePdfModal,
  } = useDocumentActions();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<{
    id: string;
    s3Key: string | null | undefined;
  } | null>(null);

  // Fetch saved homes using userApi.getFavoriteHomes() - copied from Dashboard
  const fetchSavedHomes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await userApi.getFavoriteHomes();
      if (res.success) {
        // Backend returns { favorites: HomeUniversal[] } where each is an object
        const rawHomes = (Array.isArray(res.favorites)
          ? (res.favorites as unknown)
          : []) as unknown[] as Record<string, unknown>[];
        // Map HomeUniversal fields to SavedHome for compatibility
        const homeObjects: SavedHome[] = rawHomes.map(
          (home: Record<string, unknown>, index: number) => ({
            home_id: (home.address as string) ?? `home_${index}_${Date.now()}`,
            description: (home.address as string) ?? "",
            address: (home.address as string) ?? "",
            price: (home.price as string) ?? "",
            bedrooms: parseInt((home.beds as string) ?? "0") ?? 0,
            bathrooms: parseInt((home.baths as string) ?? "0") ?? 0,
            sqft: parseInt((home.sqft as string) ?? "0") ?? 0,
            lot_size: (home.lot_size as string) ?? "",
            image_url:
              typeof home.image_url === "string" ? home.image_url : undefined,
            lat: (home.lat as number) ?? 0,
            lng: (home.lng as number) ?? 0,
            // Any other HomeUniversal fields can be passed through
            ...home,
          })
        );
        setHomes(homeObjects);
      } else {
        void void setError(res.error ?? "Failed to load favorite homes");
      }
    } catch {
      void void setError("Failed to load favorite homes");
    }
    setLoading(false);
  }, []);

  // Fetch reports using reportApi.getAll()
  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reportApi.getAll();
      if (res.success && res.reports) {
        // Map ReportDocument[] to Report[]
        const mappedReports: Report[] = res.reports.map((doc) => {
          // Safely create date, fallback to current date if invalid
          let generatedAt: Date;
          try {
            generatedAt = doc.created_at
              ? new Date(doc.created_at)
              : new Date();
            // Check if the date is valid
            if (isNaN(generatedAt.getTime())) {
              generatedAt = new Date();
            }
          } catch {
            generatedAt = new Date();
          }

          return {
            id: doc.id,
            address: doc.primary_address ?? doc.filename ?? "",
            generatedAt,
            status: doc.status === "processed" ? "completed" : doc.status,
            pdfUrl: doc.file_path ?? null,
            s3Key: doc.file_path ?? null,
          };
        });
        setReports(mappedReports);
      } else {
        void void setError(res.error ?? "Failed to load reports");
      }
    } catch {
      void void setError("Failed to load reports");
    }
    setLoading(false);
  }, []);

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

  // Fetch data for current view
  useEffect(() => {
    if (viewType === "homes") {
      void fetchSavedHomes();
      // Optionally expose refresh in dev
      (
        window as unknown as { refreshFavorites?: () => void }
      ).refreshFavorites = () => void fetchSavedHomes();
    } else {
      void fetchReports();
    }
  }, [fetchSavedHomes, fetchReports, viewType]);

  const refresh = async () => {
    setRefreshing(true);
    if (viewType === "homes") {
      await fetchSavedHomes();
    } else {
      await fetchReports();
    }
    setRefreshing(false);
  };

  // Save a home to favorites - use exact same format as working Dashboard
  const saveHome = useCallback(async (home: SavedHome) => {
    try {
      await userApi.addFavoriteHome({ home });
      // Force refresh like Dashboard does
      window.location.reload();
    } catch (error: unknown) {
      console.error("Error saving home:", error);
    }
  }, []);

  // Remove a home from favorites - use exact same format as working Dashboard
  const removeSavedHome = useCallback(async (homeId: string) => {
    try {
      await userApi.removeFavoriteHome({ address: homeId });
      // Refresh the page like Dashboard does
      window.location.reload();
    } catch (error: unknown) {
      console.error("Error removing home from favorites:", error);
    }
  }, []);

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
      return homes.some(
        (home: SavedHome) =>
          (home.home_id === homeId ||
            home.id === homeId ||
            home.zpid === homeId ||
            home.zpid?.toString() === homeId) ??
          home.address === homeId
      );
    },
    [homes]
  );

  // Save home for modal - use exact same format as working Dashboard
  const saveHomeForModal = useCallback(async (property: SavedHome) => {
    try {
      await userApi.addFavoriteHome({ home: property });
      // Force refresh like Dashboard does
      window.location.reload();
    } catch (error: unknown) {
      console.error("Error saving home:", error);
    }
  }, []);

  // Remove saved home for modal - use exact same format as working Dashboard
  const removeSavedHomeForModal = useCallback(async (homeId: string) => {
    try {
      await userApi.removeFavoriteHome({ address: homeId });
      // Force refresh like Dashboard does
      window.location.reload();
    } catch (error: unknown) {
      console.error("Error removing home from favorites:", error);
    }
  }, []);

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
      await fetchReports();
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
        <SavedLayout
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder={
            viewType === "homes" ? "Search saved homes..." : "Filter by address"
          }
          onRefresh={refresh}
          isRefreshing={refreshing}
          isLoading={loading}
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
                  sqft={home.sqft}
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
                      onSave={() => saveHome(home)}
                      onRemove={() => removeSavedHome(home.home_id)}
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
        filteredReports.length === 0 ? (
          loading ? (
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
