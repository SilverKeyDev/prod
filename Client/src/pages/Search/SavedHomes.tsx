import { useState, useEffect, useCallback } from "react";
import { favoriteHomesApi } from "../../lib/api";
import HomeCard from "../../components/cards/HomeCard";
import PageHeader from "../../components/ui/PageHeader";
import ErrorToast from "../../components/feedback/ErrorToast";
import { Search, RefreshCw, LayoutGrid, List } from "lucide-react";
import { useData } from "../../contexts/DataContext";
import PropertyDetailsModal from "../../components/modals/PropertyDetailsModal";

export default function SavedHomes() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);

  // Use DataContext for centralized data management (dashboard pattern)
  const { 
    savedHomes: homes, 
    savedHomesLoading: loading, 
    savedHomesError: error, 
    refreshSavedHomes 
  } = useData();

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
    return homes.some(home => home.home_id === homeId);
  }, [homes]);

  // Save a home to favorites
  const saveHome = useCallback(async (home: any) => {
    try {
      console.log('Saving home to favorites:', home.home_id);
      const response = await favoriteHomesApi.addFavorite(home);
      
      if (response.success) {
        await refreshSavedHomes();
        console.log('Home saved to favorites successfully');
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
      console.log('Removing home from favorites:', homeId);
      const home = homes.find(h => h.home_id === homeId);
      
      if (!home) {
        throw new Error('Home not found');
      }
      
      const response = await favoriteHomesApi.removeFavorite(home.address || home.home_id);
      
      if (response.success) {
        await refreshSavedHomes();
        console.log('Home removed from favorites successfully');
      } else {
        throw new Error(response.error || 'Failed to remove home');
      }
    } catch (error) {
      console.error('Error removing home:', error);
    }
  }, [homes, refreshSavedHomes]);


  // Check if a home is saved (for modal)
  const isHomeSavedForModal = useCallback((homeId: string) => {
    return homes.some(home => 
      home.home_id === homeId || 
      home.id === homeId || 
      home.zpid === homeId ||
      home.zpid?.toString() === homeId ||
      home.home_id === homeId ||
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
    const savedHome = homes.find(home => 
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

  const filteredHomes = homes.filter(
    (h) =>
      h.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.home_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      
      <div className="max-w-6xl mx-auto p-6">

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search saved homes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brown/50"
          />
        </div>

        {/* View toggle */}
        <button
          onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          title="Toggle view"
        >
          {viewMode === "grid" ? <List size={18} /> : <LayoutGrid size={18} />}
        </button>

        {/* Refresh */}
        <button
          onClick={refresh}
          className={`p-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center ${
            refreshing || loading ? "cursor-not-allowed" : ""
          }`}
        >
          <RefreshCw
            className={refreshing || loading ? "animate-spin" : ""}
            size={18}
          />
        </button>
      </div>

      {/* Content */}
      {filteredHomes.length === 0 ? (
        loading ? (
          <p>Loading saved homes...</p>
        ) : (
          <p>You have no saved homes yet.</p>
        )
      ) : viewMode === "grid" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredHomes.map((home) => (
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
        <ul className="space-y-4">
          {filteredHomes.map((home) => (
            <HomeCard 
              key={home.home_id} 
              home={home}
              isHomeSaved={isHomeSaved}
              onSave={saveHome}
              onRemove={removeSavedHome}
            />
          ))}
        </ul>
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
