import { useState, useEffect } from "react";
import { apiRequest } from "../lib/api";
import HomeCard, { HomeDescription } from "../components/HomeCard";
import DocumentCard from "../components/DocumentCard";
import PriceDropCard from "../components/PriceDropCard";
import NewMatchCard from "../components/NewMatchCard";
import TimelineProgress from "../components/TimelineProgress";
import KeyLogo from "../components/KeyLogo";

// Dummy data for recent price drops (will be fetched from backend later)
const priceDrops = [
  {
    address: "123 Maple St, Springfield, IL",
    oldPrice: 350000,
    newPrice: 330000,
    imageUrl: "https://placehold.co/600x400",
  },
  {
    address: "456 Oak Ave, Denver, CO",
    oldPrice: 525000,
    newPrice: 500000,
    imageUrl: "https://placehold.co/600x400",
  },
  {
    address: "789 Pine Rd, Austin, TX",
    oldPrice: 610000,
    newPrice: 585000,
    imageUrl: "https://placehold.co/600x400",
  },
];

// Dummy data for brand-new matches (homes newly on the market matching user prefs)
const newMatches = [
  {
    address: "15 Riverwalk Dr, Portland, OR",
    dateListed: "2025-08-05",
    matchScore: 94,
    reason: "Within your budget and close to preferred hiking spots.",
  },
  {
    address: "220 Sunrise Ln, Raleigh, NC",
    dateListed: "2025-08-06",
    matchScore: 89,
    reason:
      "Meets your 3-bed/2-bath requirement and has a large backyard for pets.",
  },
  {
    address: "88 Seaside Blvd, Santa Cruz, CA",
    dateListed: "2025-08-07",
    matchScore: 91,
    reason: "Short commute to work and excellent walkability score.",
  },
];

export default function UserDashboard() {
  // 🆕 Fetch favorite homes
  const [favoriteHomes, setFavoriteHomes] = useState<HomeDescription[]>([]);
  const [favLoading, setFavLoading] = useState(false);
  const [favError, setFavError] = useState<string | null>(null);

  // State for user documents (placeholder list)
  const [documents, _setDocuments] = useState<string[]>([]);

  useEffect(() => {
    const fetchFavs = async () => {
      setFavLoading(true);
      setFavError(null);
      const res = await apiRequest("/api/v1/user/favorite-homes");
      if (res.success) {
        if (res.favoriteHomes) {
          setFavoriteHomes(res.favoriteHomes as HomeDescription[]);
        } else if (Array.isArray(res.data)) {
          // Endpoint returned array of IDs only; treat as empty for now
          setFavoriteHomes([]);
        } else if (res.data?.favoriteHomes) {
          setFavoriteHomes(res.data.favoriteHomes as HomeDescription[]);
        } else {
          // Successful but no homes field -> none saved yet
          setFavoriteHomes([]);
        }
      } else {
        setFavError(res.error || "Failed to load favorite homes");
      }
      setFavLoading(false);
    };

    const fetchDocs = async () => {
      setFavLoading(true);
      setFavError(null);
      const res = await apiRequest("/api/v1/user/documents");
      if (res.success) {
        if (res.documents) {
          setFavoriteHomes(res.favoriteHomes as HomeDescription[]);
        } else if (Array.isArray(res.data)) {
          // Endpoint returned array of IDs only; treat as empty for now
          setFavoriteHomes([]);
        } else if (res.data?.favoriteHomes) {
          setFavoriteHomes(res.data.favoriteHomes as HomeDescription[]);
        } else {
          // Successful but no homes field -> none saved yet
          setFavoriteHomes([]);
        }
      } else {
        setFavError(res.error || "Failed to load favorite homes");
      }
      setFavLoading(false);
    };

    fetchFavs();
    fetchDocs();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Dashboard Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6 flex items-center gap-4">
        <KeyLogo className="w-50 h-10 shrink-0" />
        <div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-gray-600">
            All the tools you need for a seamless, agent-free buying experience.
          </p>
        </div>
      </div>

      {/* Timeline Progress */}
      <div className="mb-8">
        <TimelineProgress
          completedStepKey="search"
          currentStepKey="negotiate"
        />{" "}
        {/* TODO: dynamic */}
      </div>

      {/* Favorite Homes */}
      <div className="my-8">
        <h2 className="text-2xl font-semibold mb-4">Your Saved Homes</h2>
        {favLoading ? (
          <p>Loading...</p>
        ) : favError ? (
          <p className="text-gray-500">Save your first home today</p>
        ) : favoriteHomes.length === 0 ? (
          <p className="text-gray-500">Save your first home today</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {favoriteHomes.map((home) => (
              <HomeCard key={home.home_id} home={home} />
            ))}
          </div>
        )}
      </div>

      {/* Documents */}
      <div className="my-8">
        <h2 className="text-2xl font-semibold mb-4">Your Documents</h2>
        {favLoading ? (
          <p>Loading...</p>
        ) : favError ? (
          <p className="text-gray-500">Create your first document today</p>
        ) : documents.length === 0 ? (
          <p className="text-gray-500">Create your first document today</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
              <DocumentCard key={doc} doc={doc} />
            ))}
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="my-8 space-y-10">
        {/* Price Drops */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Recent Price Drops</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {priceDrops.map((pd) => (
              <PriceDropCard key={pd.address} item={pd} />
            ))}
          </div>
        </div>

        {/* New Matches */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">New Matches For You</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {newMatches.map((nm) => (
              <NewMatchCard key={nm.address} item={nm} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
