import { useState, useEffect, useCallback } from "react";
import { favoriteHomesApi } from "../../lib/api";
import HomeCard from "../../components/HomeCard";
import PageHeader from "../../components/PageHeader";
import ErrorToast from "../../components/ErrorToast";
import { Search, RefreshCw, LayoutGrid, List } from "lucide-react";
import { useData } from "../../contexts/DataContext";
import { getPropertyDetailsByAddress } from "../../hooks/searchAddress";
import PropertyDetailsModal from "../../components/PropertyDetailsModal";

export default function SavedHomes() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [loadingHomeId, setLoadingHomeId] = useState<string | null>(null);

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

  // Handle viewing property details - fetch additional data from backend
  const handleViewPropertyDetails = useCallback(async (home: any) => {
    console.log("🔍 ===== VIEW DETAILS CLICKED =====");
    console.log("🔍 Timestamp:", new Date().toISOString());
    console.log(
      "🔍 Property data received:",
      JSON.stringify(home, null, 2)
    );
    console.log("🔍 Property address:", home.address);
    console.log(
      "🔍 getPropertyDetailsByAddress function available:",
      typeof getPropertyDetailsByAddress
    );

    // Set loading state for this specific home
    setLoadingHomeId(home.home_id || home.id);

    try {
      console.log("🔍 Step 1: Starting detailed property information fetch...");
      console.log("🔍 Home data structure:", {
        home_id: home.home_id,
        id: home.id,
        address: home.address,
        zpid: home.zpid
      });
      
      // Determine the best parameter to use - prioritize zpid, then id, then home_id, then address
      let zpidToUse = null;
      let addressToUse = null;
      
      // Try to find a valid zpid (numeric value)
      if (home.zpid && !isNaN(Number(home.zpid))) {
        zpidToUse = home.zpid;
      } else if (home.id && !isNaN(Number(home.id))) {
        zpidToUse = home.id;
      } else if (home.home_id && !isNaN(Number(home.home_id))) {
        zpidToUse = home.home_id;
      }
      
      // Use address as fallback if no valid zpid
      if (home.address && typeof home.address === 'string' && home.address.trim()) {
        addressToUse = home.address.trim();
      }
      
      console.log(
        "🔍 About to call getPropertyDetailsByAddress with zpid:",
        zpidToUse,
        "for address:",
        addressToUse
      );
      
      // Ensure we have at least one valid parameter
      if (!zpidToUse && !addressToUse) {
        throw new Error("No valid zpid or address found in saved home data");
      }

      // Call the searchAddress function to get detailed property information
      const detailedPropertyData = await getPropertyDetailsByAddress(
        zpidToUse, // Use best available zpid for exact match
        addressToUse // Fallback address if zpid fails
      );

      console.log("✅ Step 2: Successfully received detailed property data");
      console.log("✅ Detailed data type:", typeof detailedPropertyData);
      console.log(
        "✅ Detailed data keys:",
        detailedPropertyData
          ? Object.keys(detailedPropertyData)
          : "null/undefined"
      );
      console.log(
        "✅ Full detailed data:",
        JSON.stringify(detailedPropertyData, null, 2)
      );

      // Update the selected property with the detailed data if available
      console.log("🔄 Step 3: Merging property data...");
      const enhancedProperty = {
        ...home,
        id: home.home_id, // Ensure id field is set for modal compatibility
        ...detailedPropertyData, // Merge detailed data with existing property data
      };

      console.log("🔄 Enhanced property keys:", Object.keys(enhancedProperty));
      console.log("🔄 Enhanced property sample fields:");
      console.log("  - address:", enhancedProperty.address);
      console.log("  - price:", enhancedProperty.price);
      console.log("  - yearBuilt:", enhancedProperty.yearBuilt);
      console.log("  - taxAnnualAmount:", enhancedProperty.taxAnnualAmount);
      console.log("  - listed_by:", !!enhancedProperty.listed_by);
      console.log("  - schools:", enhancedProperty.schools?.length || 0);

      console.log("🔄 Step 4: Setting selected property in state...");
      setSelectedProperty(enhancedProperty);
      console.log("✅ ===== VIEW DETAILS COMPLETED SUCCESSFULLY =====");
    } catch (error) {
      console.error("❌ ===== VIEW DETAILS FAILED =====");
      console.error("❌ Error fetching property details:", error);
      console.error("❌ Error type:", typeof error);
      console.error("❌ Error message:", (error as Error).message);
      console.error("❌ Error stack:", (error as Error).stack);

      // Fallback: use the original property data without detailed information
      console.log("🔄 Using fallback: setting original property data");
      const fallbackProperty = {
        ...home,
        id: home.home_id // Ensure id field is set for modal compatibility
      };
      setSelectedProperty(fallbackProperty);
      console.log("⚠️ ===== VIEW DETAILS COMPLETED WITH FALLBACK =====");
    } finally {
      // Clear loading state regardless of success or failure
      setLoadingHomeId(null);
    }
  }, []);

  // Check if a home is saved (for modal)
  const isHomeSavedForModal = useCallback((homeId: string) => {
    return homes.some(home => home.home_id === homeId || home.id === homeId);
  }, [homes]);

  // Save home for modal
  const saveHomeForModal = useCallback(async (property: any) => {
    await saveHome(property);
  }, [saveHome]);

  // Remove saved home for modal
  const removeSavedHomeForModal = useCallback(async (homeId: string) => {
    await removeSavedHome(homeId);
  }, [removeSavedHome]);

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
              onViewDetails={handleViewPropertyDetails}
              isLoadingDetails={loadingHomeId === (home.home_id || home.id)}
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
              onViewDetails={handleViewPropertyDetails}
              isLoadingDetails={loadingHomeId === (home.home_id || home.id)}
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
