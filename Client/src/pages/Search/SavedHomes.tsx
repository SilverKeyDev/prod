import { useState, useEffect, useCallback } from "react";
import { favoriteHomesApi } from "../../lib/api";
import { PropertyCard } from "../../components/cards";
import {
  CardHeartSave,
  CardViewDetailsButton,
} from "../../components/cards/base";
import ErrorToast from "../../components/feedback/ErrorToast";
import { useSavedHomes } from "../../context";
import { SavedHome } from "../../context/utils";
import PropertyDetailsModal from "../../components/modals/PropertyDetailsModal";
import KeyTurnLoader from "../../components/ui/base/KeyTurnLoader";
import SavedLayout, { ViewMode } from "../../components/layout/SavedLayout";

export default function SavedHomes() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);

  const {
    savedHomes: homes,
    loading,
    error,
    refreshSavedHomes,
  } = useSavedHomes();

  // Refresh saved homes when page loads (dashboard pattern)
  useEffect(() => {
    refreshSavedHomes();
    // Optionally expose refresh in dev
    // @ts-ignore
    window.refreshFavorites = refreshSavedHomes;
  }, [refreshSavedHomes]);

  const refresh = async () => {
    setRefreshing(true);
    await refreshSavedHomes();
    setRefreshing(false);
  };

  // Save a home to favorites
  const saveHome = useCallback(
    async (home: SavedHome) => {
      try {
        const response = await favoriteHomesApi.addFavorite(home);

        if (response.success) {
          await refreshSavedHomes();
        } else {
          throw new Error(response.error || "Failed to save home");
        }
      } catch (error) {
        console.error("Error saving home:", error);
      }
    },
    [refreshSavedHomes]
  );

  // Remove a home from favorites
  const removeSavedHome = useCallback(
    async (homeId: string) => {
      try {
        const home = homes.find((h: SavedHome) => h.home_id === homeId);

        if (!home) {
          throw new Error("Home not found");
        }

        const response = await favoriteHomesApi.removeFavorite(
          home.address || home.home_id
        );

        if (response.success) {
          await refreshSavedHomes();
        } else {
          throw new Error(response.error || "Failed to remove home");
        }
      } catch (error) {
        console.error("Error removing home:", error);
      }
    },
    [homes, refreshSavedHomes]
  );

  // Check if a home is saved (for modal)
  const isHomeSavedForModal = useCallback(
    (homeId: string) => {
      return homes.some(
        (home: SavedHome) =>
          home.home_id === homeId ||
          home.id === homeId ||
          home.zpid === homeId ||
          home.zpid?.toString() === homeId ||
          home.address === homeId
      );
    },
    [homes]
  );

  // Save home for modal - convert property to saved home format
  const saveHomeForModal = useCallback(
    async (property: any) => {
      // Convert the property object to the format expected by saveHome
      const homeToSave = {
        ...property,
        home_id: property.id || property.zpid || property.home_id,
        address: property.address,
        price: property.price,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        sqft: property.sqft,
        lat: property.lat,
        lng: property.lng,
        image_url: property.images?.[0] || property.imageUrl,
        description: property.description || property.address,
      };
      await saveHome(homeToSave);
    },
    [saveHome]
  );

  // Remove saved home for modal - handle different ID formats
  const removeSavedHomeForModal = useCallback(
    async (homeId: string) => {
      // Find the saved home by any matching ID format
      const sortedHomes = [...filteredHomes].sort(
        (a: SavedHome, b: SavedHome) => {
          if (a.home_id === homeId) return -1;
          if (b.home_id === homeId) return 1;
          return 0;
        }
      );
      const savedHome = sortedHomes.find(
        (home: SavedHome) =>
          home.home_id === homeId ||
          home.id === homeId ||
          home.zpid === homeId ||
          home.zpid?.toString() === homeId ||
          home.address === homeId
      );

      if (savedHome) {
        await removeSavedHome(savedHome.home_id);
      } else {
        // Fallback: try to remove using the provided ID
        await removeSavedHome(homeId);
      }
    },
    [homes, removeSavedHome]
  );

  const filteredHomes = homes.filter((h: SavedHome) => {
    return (
      h.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.home_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // overlay toast component
  const toastUI = error ? (
    <ErrorToast message={error} onClose={() => {}} />
  ) : null;

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
            <div className="flex justify-center py-responsive-lg">
              <KeyTurnLoader message="Loading saved homes..." />
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">You have no saved homes yet.</p>
            </div>
          )
        ) : viewMode === "grid" ? (
          <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredHomes.map((home: SavedHome) => (
              <PropertyCard
                key={home.home_id}
                imageUrl={home.image_url}
                address={
                  typeof home.address === "string" ||
                  typeof home.address === "number"
                    ? home.address.toString()
                    : home.description || "[Invalid address]"
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
                lotSize={home.lot_size}
                pricePosition="below-address"
                cardType="searchpage"
                showScore={false}
                topContent={
                  <CardHeartSave
                    property={{
                      id: home.home_id,
                      address: home.address || home.description || "",
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
                    onClick={() =>
                      setSelectedProperty({
                        id: home.home_id,
                        address: home.address || home.description,
                        price: home.price,
                        bedrooms: home.bedrooms,
                        bathrooms: home.bathrooms,
                        sqft: home.sqft,
                        lat: home.lat,
                        lng: home.lng,
                        images: home.image_url ? [home.image_url] : [],
                      })
                    }
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
        ) : (
          <div className="space-y-6 mobile-container">
            {filteredHomes.map((home: SavedHome) => (
              <PropertyCard
                key={home.home_id}
                imageUrl={home.image_url}
                address={
                  typeof home.address === "string" ||
                  typeof home.address === "number"
                    ? home.address.toString()
                    : home.description || "[Invalid address]"
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
                lotSize={home.lot_size}
                pricePosition="below-address"
                cardType="searchpage"
                showScore={false}
                topContent={
                  <CardHeartSave
                    property={{
                      id: home.home_id,
                      address: home.address || home.description || "",
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
                    onClick={() =>
                      setSelectedProperty({
                        id: home.home_id,
                        address: home.address || home.description,
                        price: home.price,
                        bedrooms: home.bedrooms,
                        bathrooms: home.bathrooms,
                        sqft: home.sqft,
                        lat: home.lat,
                        lng: home.lng,
                        images: home.image_url ? [home.image_url] : [],
                      })
                    }
                    loading={false}
                    size="sm"
                    variant="primary"
                    fullWidth
                    text="View Details"
                  />
                }
              />
            ))}
          </div>
        )}
        {toastUI}

        {/* Property Details Modal */}
        <PropertyDetailsModal
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          isHomeSaved={isHomeSavedForModal}
          saveHome={saveHomeForModal}
          removeSavedHome={removeSavedHomeForModal}
        />
      </div>
    </div>
  );
}
