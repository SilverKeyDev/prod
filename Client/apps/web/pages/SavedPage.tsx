import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";

import SavedLayout from "../app/layouts/SavedLayout";
import { PropertyCard } from "../components/cards";
import {
  CardHeartSave,
  CardViewDetailsButton,
  CardCompareCheckbox,
} from "../components/cards/base";
import PdfModal from "../components/modals/PdfModal";
import PropertyDetailsModal from "../components/modals/PropertyDetailsModal/PropertyDetailsModal";
import NegotiationModal from "../components/modals/NegotiationModal";
import { KeyTurnLoader } from "../components/ui";
import CompareFloatingBar from "../components/ui/CompareFloatingBar";
import { useDocumentActions } from "../../../packages/hooks/data/documents/useDocumentActions";
import { usePropertyDetails } from "../../../packages/hooks/data/search/usePropertyDetails";
import { useSavedHomesStoreIntegration } from "../../../packages/hooks/store/search/useSavedHomesStoreIntegration";
import type { SavedHome } from "../../../packages/schemas";
import { useUIStore } from "../../../packages/store";
import CompareHomesModal from "../components/modals/CompareHomesModal";
import ReportsSubViewNavigation, {
  ReportsSubView,
} from "../features/dashboard/ReportsSubViewNavigation";
import useMobile from "../../../packages/hooks/ui/useMobile";
import { ClientSelector } from "../components/ui";

type SavedHomesProps = {
  setMobileHeaderActions?: React.Dispatch<
    React.SetStateAction<React.ReactNode | null>
  >;
};

export default function SavedHomes({
  setMobileHeaderActions,
}: SavedHomesProps) {
  const location = useLocation();
  const isMobile = useMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [viewType, setViewType] = useState<"homes" | "reports">("homes");
  const [reportsSubView, setReportsSubView] =
    useState<ReportsSubView>("reports");
  const [selectedHomesForComparison, setSelectedHomesForComparison] = useState<
    Set<string>
  >(new Set());
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isNegotiationModalOpen, setIsNegotiationModalOpen] = useState(false);
  const [selectedHomeForNegotiation, setSelectedHomeForNegotiation] =
    useState<SavedHome | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const enqueueToast = useUIStore((s) => s.enqueueToast);

  // Use Zustand store for saved homes data (React Query integration)
  const {
    savedHomes: homes,
    savedHomesLoading: loading,
    savedHomesError: error,
    refreshSavedHomes,
  } = useSavedHomesStoreIntegration();

  // Use centralized document actions for reports
  const { currentPdf, currentDocumentId, currentDocumentName, closePdfModal } =
    useDocumentActions();

  // Use property details hook for unlock functionality
  const {
    selectedProperty,
    fetchPropertyDetails,
    clearSelectedProperty,
    isLoading: isLoadingPropertyDetails,
  } = usePropertyDetails();

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

  // Load selected homes from localStorage (only restore valid selections on initial load)
  useEffect(() => {
    if (homes.length > 0 && selectedHomesForComparison.size === 0) {
      const savedSelections = localStorage.getItem("compareHomesState");
      if (savedSelections) {
        try {
          const parsed = JSON.parse(savedSelections) as {
            selectedIds?: string[];
          };
          if (parsed.selectedIds && Array.isArray(parsed.selectedIds)) {
            // Only restore IDs that exist in the current homes list
            const validHomeIds = new Set(homes.map((h) => h.home_id));
            const validSelections = parsed.selectedIds.filter((id) =>
              validHomeIds.has(id)
            );
            if (validSelections.length > 0) {
              setSelectedHomesForComparison(new Set(validSelections));
            }
          }
        } catch {
          // Ignore parsing errors
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homes.length]);

  // Save selected homes to localStorage
  useEffect(() => {
    if (selectedHomesForComparison.size > 0) {
      const stateToSave = {
        selectedIds: Array.from(selectedHomesForComparison),
      };
      localStorage.setItem("compareHomesState", JSON.stringify(stateToSave));
    } else {
      // Clear localStorage if no selections
      localStorage.removeItem("compareHomesState");
    }
  }, [selectedHomesForComparison]);

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
    }
  }, [refreshSavedHomes, viewType]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    if (viewType === "homes") {
      await refreshSavedHomes();
    }
    setRefreshing(false);
  }, [viewType, refreshSavedHomes]);

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

  // Convert SavedHome to FavoriteHome format for negotiation
  const convertToFavoriteHome = useCallback((home: SavedHome) => {
    return {
      user_id: "",
      address: String(home.address || home.description || ""),
      beds: String(home.bedrooms ?? ""),
      baths: String(home.bathrooms ?? ""),
      sqft: String(home.sqft ?? ""),
      lot_size: typeof home.lot_size === "string" ? home.lot_size : "",
      price:
        typeof home.price === "string"
          ? home.price.startsWith("$")
            ? home.price
            : `$${home.price}`
          : typeof home.price === "number"
            ? `$${home.price.toLocaleString()}`
            : "",
      image_url: home.image_url || "",
      created_at: "",
      updated_at: "",
    };
  }, []);

  // Handle opening negotiation modal
  const handleOpenNegotiation = useCallback(
    (home: SavedHome) => {
      setSelectedHomeForNegotiation(home);
      setIsNegotiationModalOpen(true);
    },
    []
  );

  // Handle closing negotiation modal
  const handleCloseNegotiation = useCallback(() => {
    setIsNegotiationModalOpen(false);
    setSelectedHomeForNegotiation(null);
  }, []);

  // Comparison handlers
  const handleToggleHomeSelection = useCallback((homeId: string) => {
    setSelectedHomesForComparison((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(homeId)) {
        newSet.delete(homeId);
      } else {
        newSet.add(homeId);
      }
      return newSet;
    });
  }, []);

  const handleRemoveFromComparison = useCallback((homeId: string) => {
    setSelectedHomesForComparison((prev) => {
      const newSet = new Set(prev);
      newSet.delete(homeId);
      return newSet;
    });
  }, []);

  const handleClearComparison = useCallback(() => {
    setSelectedHomesForComparison(new Set());
  }, []);

  // Get selected homes data
  const selectedHomesData = homes.filter((home) =>
    selectedHomesForComparison.has(home.home_id)
  );

  const handleCompare = useCallback(() => {
    if (selectedHomesData.length >= 2) {
      setIsCompareModalOpen(true);
    }
  }, [selectedHomesData.length]);

  const filteredHomes = homes.filter((h: SavedHome) => {
    return (
      h.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.home_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Set mobile header actions with SavedLayout
  useEffect(() => {
    if (isMobile && setMobileHeaderActions) {
      setMobileHeaderActions(
        <div className="space-y-2">
          <div className="px-4">
            <ClientSelector
              selectedClientId={selectedClientId}
              onClientChange={setSelectedClientId}
            />
          </div>
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
            isLoading={loading}
            refreshTitle={
              viewType === "homes" ? "Refresh saved homes" : "Refresh reports"
            }
            rightText={
              viewType === "homes" ? `${filteredHomes.length} saved` : ""
            }
            viewType={viewType}
            onViewTypeChange={setViewType}
          />
        </div>
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
    filteredHomes.length,
    refresh,
    selectedClientId,
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
      <div
        className={`mt-4 lg:mt-0 space-y-responsive-lg ${
          viewType === "homes" && selectedHomesData.length >= 1
            ? "mb-[140px] sm:mb-[160px]"
            : "mb-responsive-lg"
        }`}
      >
        {/* Client Selector - Desktop */}
        {!isMobile && (
          <div className="mb-4">
            <ClientSelector
              selectedClientId={selectedClientId}
              onClientChange={setSelectedClientId}
            />
          </div>
        )}
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
            isLoading={loading}
            refreshTitle={
              viewType === "homes" ? "Refresh saved homes" : "Refresh reports"
            }
            rightText={
              viewType === "homes" ? `${filteredHomes.length} saved` : ""
            }
            viewType={viewType}
            onViewTypeChange={setViewType}
          />
        )}

        {/* Content */}
        {viewType === "homes" ? (
          filteredHomes.length === 0 ? (
            loading ? (
              <div className="py-responsive-lg flex justify-center">
                <KeyTurnLoader message="Loading saved homes..." />
              </div>
            ) : (
              <div className="py-responsive-lg text-center">
                <p className="text-responsive-sm text-gray-600">
                  You have no saved homes yet.
                </p>
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 gap-responsive-md sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredHomes.map((home: SavedHome) => {
                const isSelected = selectedHomesForComparison.has(home.home_id);
                return (
                  <div key={home.home_id} className="relative group">
                    <PropertyCard
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
                        <>
                          {/* Compare checkbox - top-left on image */}
                          <CardCompareCheckbox
                            isSelected={isSelected}
                            onToggle={() =>
                              handleToggleHomeSelection(home.home_id)
                            }
                            position="top-left"
                            size="sm"
                          />
                          {/* Heart save - top-right on image */}
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
                            position="top-right"
                            size="sm"
                          />
                        </>
                      }
                      bottomContent={
                        <div className="flex flex-col gap-2">
                          <CardViewDetailsButton
                            onClick={() => handleUnlockHome(home)}
                            size="sm"
                            variant="primary"
                            fullWidth
                            text="Unlock"
                          />
                          <CardViewDetailsButton
                            onClick={() => handleOpenNegotiation(home)}
                            size="sm"
                            variant="secondary"
                            fullWidth
                            text="Negotiate"
                          />
                        </div>
                      }
                    />
                  </div>
                );
              })}
            </div>
          )
        ) : null}

        {/* Property Details Modal */}
        {selectedProperty && (
          <PropertyDetailsModal
            property={selectedProperty}
            onClose={clearSelectedProperty}
            isLoading={isLoadingPropertyDetails}
          />
        )}

        {/* Compare Homes Modal */}
        <CompareHomesModal
          isOpen={isCompareModalOpen}
          onClose={() => setIsCompareModalOpen(false)}
          selectedHomes={selectedHomesData}
          onRemove={handleRemoveFromComparison}
          onAdd={handleToggleHomeSelection}
          allLikedHomes={homes}
        />

        {/* Negotiation Modal */}
        <NegotiationModal
          isOpen={isNegotiationModalOpen}
          onClose={handleCloseNegotiation}
          initialHome={
            selectedHomeForNegotiation
              ? convertToFavoriteHome(selectedHomeForNegotiation)
              : null
          }
        />

        {/* Compare Floating Bar - Show when viewing homes list and >= 1 selected */}
        {viewType === "homes" && selectedHomesData.length >= 1 && (
          <CompareFloatingBar
            selectedHomes={selectedHomesData}
            onCompare={handleCompare}
            onClear={handleClearComparison}
            onRemove={handleRemoveFromComparison}
          />
        )}
      </div>
    </div>
  );
}
