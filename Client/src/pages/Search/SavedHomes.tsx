import { useState, useEffect, useCallback } from "react";
import { favoriteHomesApi } from "../../lib/api";
import HomeCard from "../../components/cards/HomeCard";
import PageHeader from "../../components/ui/PageHeader";
import ErrorToast from "../../components/feedback/ErrorToast";
import { Search, RefreshCw, LayoutGrid, List } from "lucide-react";
import { useSavedHomes } from "../../context";
import { SavedHome } from "../../context/utils";
import PropertyDetailsModal from "../../components/modals/PropertyDetailsModal";
import KeyTurnLoader from "../../components/ui/KeyTurnLoader";

export default function SavedHomes() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);

  const { 
    savedHomes: homes, 
    loading, 
    error, 
    refreshSavedHomes 
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

  // Check if a home is saved
  const isHomeSaved = useCallback((homeId: string) => {
    return homes.some((home: SavedHome) => home.home_id === homeId);
  }, [homes]);

  // Save a home to favorites
  const saveHome = useCallback(async (home: SavedHome) => {
    try {
      const response = await favoriteHomesApi.addFavorite(home);
      
      if (response.success) {
        await refreshSavedHomes();
      } else {
        throw new Error(response.error || 'Failed to save home');
      }
    } catch (error) {
      console.error('Error saving home:', error);
    }
  }, [refreshSavedHomes]);

  // Remove a home from favorites
  const removeSavedHome = useCallback(async (homeId: string) => {
    try {
      const home = homes.find((h: SavedHome) => h.home_id === homeId);
      
      if (!home) {
        throw new Error('Home not found');
      }
      
      const response = await favoriteHomesApi.removeFavorite(home.address || home.home_id);
      
      if (response.success) {
        await refreshSavedHomes();
      } else {
        throw new Error(response.error || 'Failed to remove home');
      }
    } catch (error) {
      console.error('Error removing home:', error);
    }
  }, [homes, refreshSavedHomes]);


  // Check if a home is saved (for modal)
  const isHomeSavedForModal = useCallback((homeId: string) => {
    return homes.some((home: SavedHome) => 
      home.home_id === homeId || 
      home.id === homeId || 
      home.zpid === homeId ||
      home.zpid?.toString() === homeId ||
      home.address === homeId
    );
  }, [homes]);

  // Save home for modal - convert property to saved home format
  const saveHomeForModal = useCallback(async (property: any) => {
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
      description: property.description || property.address
    };
    await saveHome(homeToSave);
  }, [saveHome]);

  // Remove saved home for modal - handle different ID formats
  const removeSavedHomeForModal = useCallback(async (homeId: string) => {
    // Find the saved home by any matching ID format
    const sortedHomes = [...filteredHomes].sort((a: SavedHome, b: SavedHome) => {
      if (a.home_id === homeId) return -1;
      if (b.home_id === homeId) return 1;
      return 0;
    });
    const savedHome = sortedHomes.find((home: SavedHome) => 
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
  }, [homes, removeSavedHome]);

  const filteredHomes = homes.filter((h: SavedHome) => {
    return h.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.home_id.toLowerCase().includes(searchTerm.toLowerCase())
  });

  // overlay toast component
  const toastUI = error ? (
    <ErrorToast message={error} onClose={() => {}} />
  ) : null;

  return (
    <div className="min-h-screen bg-off-white">
      <PageHeader
        title="Saved Homes"
        subtitle="Your collection of favorite properties"
      />
      
      <div className="max-w-6xl mx-auto px-responsive-sm py-responsive-md">

      {/* Toolbar */}
      <div className="flex items-center gap-responsive-sm space-y-responsive-md">
        {/* Search - adjustable width */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 mobile-icon-xs" />
          <input
            type="text"
            placeholder="Search saved homes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 px-responsive-sm py-responsive-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brown/50 touch-friendly"
          />
        </div>

        {/* View toggle - fixed width - hidden on mobile */}
        <button
          onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          className="hidden sm:flex flex-shrink-0 space-responsive-xs border border-gray-300 rounded-lg hover:bg-gray-50 touch-friendly"
          title="Toggle view"
        >
          {viewMode === "grid" ? <List className="mobile-icon-sm" /> : <LayoutGrid className="mobile-icon-sm" />}
        </button>

        {/* Refresh - fixed width */}
        <button
          onClick={refresh}
          className={`flex-shrink-0 space-responsive-xs border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center touch-friendly ${
            refreshing || loading ? "cursor-not-allowed" : ""
          }`}
        >
          <RefreshCw
            className={`mobile-icon-sm ${refreshing || loading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Content */}
      {filteredHomes.length === 0 ? (
        loading ? (
          <div className="flex justify-center py-responsive-lg">
            <KeyTurnLoader message="Loading saved homes..." />
          </div>
        ) : (
          <p>You have no saved homes yet.</p>
        )
      ) : viewMode === "grid" ? (
        <div className="grid gap-responsive-sm sm:gap-responsive-md grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredHomes.map((home: SavedHome) => (
            <HomeCard 
              key={home.home_id} 
              home={home}
              isHomeSaved={isHomeSaved}
              onSave={saveHome}
              onRemove={removeSavedHome}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-responsive-sm mobile-container">
          {filteredHomes.map((home: SavedHome) => (
            <HomeCard 
              key={home.home_id} 
              home={home}
              isHomeSaved={isHomeSaved}
              onSave={saveHome}
              onRemove={removeSavedHome}
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
