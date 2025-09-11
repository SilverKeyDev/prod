import { useState, useEffect, useCallback } from "react";
import { userApi } from "../../api";
import { PropertyCard } from "../../components/cards";
import {
  CardHeartSave,
  CardViewDetailsButton,
} from "../../components/cards/base";
import ErrorToast from "../../components/feedback/ErrorToast";
import { SavedHome } from "../../types";
import PropertyDetailsModal from "../../components/modals/PropertyDetailsModal";
import { KeyTurnLoader } from "../../components/ui";
import SavedLayout, { ViewMode } from "../../app/layouts//SavedLayout";

export default function SavedHomes() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [homes, setHomes] = useState<SavedHome[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch saved homes using userApi.getFavoriteHomes() - copied from Dashboard
  const fetchSavedHomes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await userApi.getFavoriteHomes();
      if (res.success) {
        // Backend returns { favorites: HomeUniversal[] } where each is an object
        const rawHomes = res.favorites || [];
        // Map HomeUniversal fields to SavedHome for compatibility
        const homeObjects: SavedHome[] = rawHomes.map(
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
          }),
        );
        setHomes(homeObjects);
      } else {
        setError(res.error || "Failed to load favorite homes");
      }
    } catch (error) {
      setError("Failed to load favorite homes");
    }
    setLoading(false);
  }, []);

  // Load saved homes when page loads
  useEffect(() => {
    fetchSavedHomes();
    // Optionally expose refresh in dev
    // @ts-expect-error
    window.refreshFavorites = fetchSavedHomes;
  }, [fetchSavedHomes]);

  const refresh = async () => {
    setRefreshing(true);
    await fetchSavedHomes();
    setRefreshing(false);
  };

  // Save a home to favorites - use exact same format as working Dashboard
  const saveHome = useCallback(async (home: SavedHome) => {
    try {
      await userApi.addFavoriteHome({ home });
      // Force refresh like Dashboard does
      window.location.reload();
    } catch (error) {
      console.error("Error saving home:", error);
    }
  }, []);

  // Remove a home from favorites - use exact same format as working Dashboard
  const removeSavedHome = useCallback(async (homeId: string) => {
    try {
      await userApi.removeFavoriteHome({ address: homeId });
      // Refresh the page like Dashboard does
      window.location.reload();
    } catch (error) {
      console.error("Error removing home from favorites:", error);
    }
  }, []);

  // Check if a home is saved (for modal)
  const isHomeSavedForModal = useCallback(
    (homeId: string) => {
      return homes.some(
        (home: SavedHome) =>
          home.home_id === homeId ||
          home.id === homeId ||
          home.zpid === homeId ||
          home.zpid?.toString() === homeId ||
          home.address === homeId,
      );
    },
    [homes],
  );

  // Save home for modal - use exact same format as working Dashboard
  const saveHomeForModal = useCallback(async (property: unknown) => {
    try {
      await userApi.addFavoriteHome({ home: property });
      // Force refresh like Dashboard does
      window.location.reload();
    } catch (error) {
      console.error("Error saving home:", error);
    }
  }, []);

  // Remove saved home for modal - use exact same format as working Dashboard
  const removeSavedHomeForModal = useCallback(async (homeId: string) => {
    try {
      await userApi.removeFavoriteHome({ address: homeId });
      // Force refresh like Dashboard does
      window.location.reload();
    } catch (error) {
      console.error("Error removing home from favorites:", error);
    }
  }, []);

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
                id={home.home_id}
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
                id={home.home_id}
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
