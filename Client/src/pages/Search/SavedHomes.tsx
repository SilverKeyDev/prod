import { useState, useCallback, useEffect } from "react";

import SavedLayout, { type ViewMode } from "../../app/layouts/SavedLayout";
import { PropertyCard } from "../../components/cards";
import {
  CardHeartSave,
  CardViewDetailsButton,
} from "../../components/cards/base";
import ModalPortal from "../../components/modals/ModalPortal";
import PropertyDetailsModal from "../../components/modals/PropertyDetailsModal";
import { KeyTurnLoader } from "../../components/ui";
import {
  usePropertyDetails,
  type Property,
} from "../../core/hooks/data/usePropertyDetails";
import { useSavedHomesStoreIntegration } from "../../core/hooks/store/useSavedHomesStoreIntegration";
import type { SavedHome } from "../../core/schemas";
import { useUIStore } from "../../core/store";

export default function SavedHomes() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const enqueueToast = useUIStore((s) => s.enqueueToast);

  // Property details hook for unlock functionality (exactly like Dashboard)
  const {
    isLoading: propertyDetailsLoading,
    selectedProperty,
    fetchPropertyDetails,
    clearSelectedProperty,
  } = usePropertyDetails();

  // Use saved homes store integration hook
  const {
    savedHomes: homes,
    savedHomesLoading: loading,
    savedHomesError: error,
    refreshSavedHomes,
    removeSavedHome,
    saveHome,
  } = useSavedHomesStoreIntegration();

  const refresh = async () => {
    setRefreshing(true);
    await refreshSavedHomes();
    setRefreshing(false);
  };

  // Remove a home from favorites using store integration hook
  const handleRemoveSavedHome = useCallback(
    async (homeId: string) => {
      try {
        await removeSavedHome(homeId);
        enqueueToast({
          type: "success",
          message: "Home removed from favorites",
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

  // Convert SavedHome to Property format for API call (exactly like Dashboard)
  const convertToProperty = useCallback((home: SavedHome): Property => {
    // Add defensive programming for required fields
    if (!home?.home_id) {
      console.error("convertToProperty: Invalid home provided", home);
      throw new Error("Invalid home data provided to convertToProperty");
    }

    const lat = home.lat ?? 37.7749;
    const lng = home.lng ?? -122.4194;

    return {
      id: home.home_id,
      address: home.address ?? home.description ?? home.home_id,
      price:
        typeof home.price === "string"
          ? home.price
          : typeof home.price === "number"
            ? `$${home.price.toLocaleString()}`
            : "Price not available",
      bedrooms: home.bedrooms ?? 0,
      bathrooms: home.bathrooms ?? 0,
      sqft: home.sqft ?? 0,
      lat,
      lng,
      latitude: lat,
      longitude: lng,
      images: home.image_url ? [home.image_url] : undefined,
    };
  }, []);

  // Handle Unlock button click (exactly like Dashboard)
  const handleViewDetails = useCallback(
    async (home: SavedHome) => {
      const propertyData = convertToProperty(home);
      // Use address instead of zpid for SavedHomes
      await fetchPropertyDetails(propertyData);
    },
    [convertToProperty, fetchPropertyDetails]
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

  // Modal functions for property details (exactly like Dashboard)
  const saveHomeForModal = async (
    property: Property | import("../../core/schemas/search").SearchResult
  ) => {
    // Convert Property back to SavedHome format for saveHome
    const asAny = property as any;
    const savedHome: SavedHome = {
      home_id: asAny.id,
      address: asAny.address,
      price:
        typeof asAny.price === "number"
          ? `$${asAny.price.toLocaleString()}`
          : asAny.price,
      bedrooms: asAny.bedrooms,
      bathrooms: asAny.bathrooms,
      sqft: asAny.sqft,
      lat: asAny.lat ?? asAny.latitude,
      lng: asAny.lng ?? asAny.longitude,
      image_url: asAny.images?.[0] ?? asAny.imageUrl,
    };
    await saveHome(savedHome);
  };
  const removeSavedHomeForModal = async (propertyId: string) => {
    await handleRemoveSavedHome(propertyId);
  };

  const filteredHomes = homes.filter((h: SavedHome) => {
    return (
      h.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.home_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // overlay toast component
  useEffect(() => {
    if (error) enqueueToast({ type: "error", message: error });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  return (
    <div>
      <div className="space-y-8">
        <SavedLayout
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search saved homes..."
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          showViewToggle={false}
          onRefresh={refresh}
          isRefreshing={refreshing}
          isLoading={loading}
          refreshTitle="Refresh saved homes"
          rightText={`${filteredHomes.length} saved`}
        />

        {/* Content */}
        {filteredHomes.length === 0 ? (
          loading ? (
            <div className="py-responsive-lg flex justify-center">
              <KeyTurnLoader message="Loading saved homes..." />
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-gray-600">You have no saved homes yet.</p>
            </div>
          )
        ) : viewMode === "grid" ? (
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
                  typeof home.lot_size === "string" ? home.lot_size : undefined
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
                    onRemove={() => handleRemoveSavedHome(home.home_id)}
                    size="sm"
                  />
                }
                bottomContent={
                  <CardViewDetailsButton
                    onClick={() => handleViewDetails(home)}
                    loading={propertyDetailsLoading}
                    size="sm"
                    variant="primary"
                    fullWidth
                    text="Unlock"
                  />
                }
              />
            ))}
          </div>
        ) : (
          <div className="mobile-container space-y-6">
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
                  typeof home.lot_size === "string" ? home.lot_size : undefined
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
                    onRemove={() => handleRemoveSavedHome(home.home_id)}
                    size="sm"
                  />
                }
                bottomContent={
                  <CardViewDetailsButton
                    onClick={() => handleViewDetails(home)}
                    loading={propertyDetailsLoading}
                    size="sm"
                    variant="primary"
                    fullWidth
                    text="Unlock"
                  />
                }
              />
            ))}
          </div>
        )}
        {/* Global toasts shown via ToastsPortal */}

        {/* Property Details Modal - exactly like Dashboard */}
        {selectedProperty && (
          <ModalPortal>
            <PropertyDetailsModal
              property={selectedProperty}
              onClose={clearSelectedProperty}
              isHomeSaved={isHomeSavedForModal}
              saveHome={saveHomeForModal}
              removeSavedHome={removeSavedHomeForModal}
            />
          </ModalPortal>
        )}
      </div>
    </div>
  );
}
