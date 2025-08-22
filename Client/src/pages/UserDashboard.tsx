import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, favoriteHomesApi } from "../lib/api";
import DocumentCard, { DocumentData } from "../components/cards/DocumentCard";
import Carousel from "../components/ui/Carousel";
import TimelineChecklist from "../components/ui/TimelineChecklist";
import HomeCard, { HomeDescription } from "../components/cards/HomeCard";
import PageHeader from "../components/ui/PageHeader";

/*import PriceDropCard from "../components/PriceDropCard";
import NewMatchCard from "../components/NewMatchCard";
*/

export default function UserDashboard() {
  const navigate = useNavigate();
  // 🆕 Fetch favorite homes
  const [favoriteHomes, setFavoriteHomes] = useState<HomeDescription[]>([]);
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [favLoading, setFavLoading] = useState(true);
  const [docsLoading, setDocsLoading] = useState(true);
  const [favError, setFavError] = useState<string | null>(null);
  const [docsError, setDocsError] = useState<string | null>(null);

  // Helper function to check if a home is saved
  const isHomeSaved = (homeId: string): boolean => {
    return favoriteHomes.some((home) => home.home_id === homeId);
  };

  // Handle saving a home
  const handleSaveHome = async (property: any) => {
    try {
      await favoriteHomesApi.addFavorite(property);
      // Refresh the saved homes list - we'll trigger a re-fetch via useEffect
      window.location.reload();
    } catch (error) {
      console.error("Error saving home:", error);
    }
  };

  // Handle removing a saved home
  const handleRemoveHome = async (homeId: string) => {
    try {
      await favoriteHomesApi.removeFavorite(homeId);
      // Update local state by removing the home
      setFavoriteHomes((prev) =>
        prev.filter((home) => home.home_id !== homeId)
      );
    } catch (error) {
      console.error("Error removing home from favorites:", error);
    }
  };

  // Navigation handlers
  const handleSavedHomesClick = () => {
    navigate("/dashboard/search");
  };

  const handleDocumentsClick = () => {
    navigate("/dashboard/reports");
  };

  useEffect(() => {
    const fetchFavs = async () => {
      setFavLoading(true);
      setFavError(null);
      try {
        const res = await favoriteHomesApi.getFavorites();
        if (res.success) {
          // Backend returns { favorites: HomeUniversal[] } where each is an object
          const rawHomes = res.favorites || [];
          // Map HomeUniversal fields to HomeDescription for HomeCard
          const homeObjects: HomeDescription[] = rawHomes.map(
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
            })
          );
          setFavoriteHomes(homeObjects);
        } else {
          setFavError(res.error || "Failed to load favorite homes");
        }
      } catch (error) {
        setFavError("Failed to load favorite homes");
      }
      setFavLoading(false);
    };

    const fetchDocs = async () => {
      setDocsLoading(true);
      setDocsError(null);
      const res = await apiRequest("/api/v1/report/documents");
      if (res.success) {
        if (res.documents) {
          setDocuments(res.documents as DocumentData[]);
        } else {
          // Successful but no documents field -> none saved yet
          setDocuments([]);
        }
      } else {
        setDocsError(res.error || "Failed to load documents");
      }
      setDocsLoading(false);
    };

    fetchFavs();
    fetchDocs();
  }, []);

  return (
    <div className="min-h-screen bg-off-white">
      <PageHeader
        title="Dashboard"
        subtitle="All the tools you need for a seamless purchasing experience."
      />

      <div className="max-w-6xl mx-auto p-6">
        {/* Timeline Progress */}
        <div className="mb-8">
          <TimelineChecklist variant="horizontal" completedStepKey="search" />{" "}
          {/* TODO: dynamic */}
        </div>

        {/* Favorite Homes */}
        <div className="mt-12">
          <Carousel
            items={favoriteHomes}
            title={
              <button
                className="text-2xl font-semibold underline text-gray-600 hover:text-gray-500 transition-colors cursor-pointer"
                onClick={handleSavedHomesClick}
                title="Click to view all saved homes"
              >
                Your Saved Homes
              </button>
            }
            loading={favLoading}
            error={favError}
            emptyMessage="Save your first home today"
            renderItem={(home) => (
              <HomeCard
                home={home}
                isHomeSaved={isHomeSaved}
                onSave={handleSaveHome}
                onRemove={handleRemoveHome}
              />
            )}
            getItemKey={(home) => home.home_id}
          />
        </div>

        {/* Documents */}
        <div className="my-8">
          <Carousel
            items={documents}
            title={
              <button
                className="text-2xl font-semibold underline text-gray-600 hover:text-gray-500 transition-colors cursor-pointer"
                onClick={handleDocumentsClick}
                title="Click to view all documents"
              >
                Your Documents
              </button>
            }
            loading={docsLoading}
            error={docsError}
            emptyMessage="Create your first document today"
            renderItem={(doc) => {
              return (
                <DocumentCard
                  doc={doc}
                />
              );
            }}
            getItemKey={(doc) => doc.id}
          />
        </div>
      </div>
    </div>
  );
}
