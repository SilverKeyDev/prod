import { useState, useEffect } from "react";
import { apiRequest, favoriteHomesApi } from "../lib/api";
import DocumentCard, { DocumentData } from "../components/DocumentCard";
import MiniLogo from "../components/MiniLogo";
import Carousel from "../components/Carousel";
import TimelineChecklist from "../components/TimelineChecklist";
import HomeCard, { HomeDescription } from "../components/HomeCard";

/*import PriceDropCard from "../components/PriceDropCard";
import NewMatchCard from "../components/NewMatchCard";


// Dummy data for recent price drops (will be fetched from backend later)
const priceDrops = [

];

// Dummy data for brand-new matches (homes newly on the market matching user prefs)
const newMatches = [

]; */

export default function UserDashboard() {
  // 🆕 Fetch favorite homes
  const [favoriteHomes, setFavoriteHomes] = useState<HomeDescription[]>([]);
  const [favLoading, setFavLoading] = useState(false);
  const [favError, setFavError] = useState<string | null>(null);

  // State for user documents
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFavs = async () => {
      setFavLoading(true);
      setFavError(null);
      try {
        const res = await favoriteHomesApi.getFavorites();
        if (res.success) {
          // Backend returns { favorites: string[] } where strings are address names
          const addressStrings = res.favorites || [];
          // Convert address strings to HomeDescription objects with dummy data
          const homeObjects: HomeDescription[] = addressStrings.map(
            (address: string, index: number) => ({
              home_id: `home_${index}_${Date.now()}`,
              description: address, // The address string becomes the description
              address: address,
              price: "$0", // Dummy data
              bedrooms: 0,
              bathrooms: 0,
              sqft: 0,
              lat: 0,
              lng: 0,
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
    <div className="max-w-6xl mx-auto p-6">
      {/* Dashboard Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6 flex items-center gap-4">
        <MiniLogo className="w-50 h-10 shrink-0" />
        <div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-gray-600">
            All the tools you need for a seamless, agent-free buying experience.
          </p>
        </div>
      </div>

      {/* Timeline Progress */}
      <div className="mb-8">
        <TimelineChecklist variant="horizontal" completedStepKey="search" />{" "}
        {/* TODO: dynamic */}
      </div>

      {/* Favorite Homes */}
      <Carousel
        items={favoriteHomes}
        title="Your Saved Homes"
        loading={favLoading}
        error={favError}
        emptyMessage="Save your first home today"
        renderItem={(home) => <HomeCard home={home} />}
        getItemKey={(home) => home.home_id}
      />

      {/* Documents */}
      <Carousel
        items={documents}
        title="Your Documents"
        loading={docsLoading}
        error={docsError}
        emptyMessage="Create your first document today"
        renderItem={(doc) => (
          <DocumentCard
            doc={doc}
            onView={(doc) => {
              // TODO: Implement document viewing
              console.log("View document:", doc);
            }}
            onDownload={(doc) => {
              // TODO: Implement document download
              console.log("Download document:", doc);
            }}
          />
        )}
        getItemKey={(doc) => doc.id}
      />

      {/* Notifications */}
      {/* <div className="my-8 space-y-10">
        <Carousel
          items={priceDrops}
          title="Recent Price Drops"
          emptyMessage="No recent price drops"
          renderItem={(pd) => <PriceDropCard item={pd} />}
          getItemKey={(pd) => pd.address}
        />

        <Carousel
          items={newMatches}
          title="New Matches For You"
          emptyMessage="No new matches yet"
          renderItem={(nm) => <NewMatchCard item={nm} />}
          getItemKey={(nm) => nm.address}
        />
      </div> */}
    </div>
  );
}
