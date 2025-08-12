import { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";
import HomeCard, { HomeDescription } from "../../components/HomeCard";

import ErrorToast from "../../components/ErrorToast";
import { Search, RefreshCw, LayoutGrid, List } from "lucide-react";
import MiniLogo from "../../components/MiniLogo";

export default function SavedHomes() {
  const [homes, setHomes] = useState<HomeDescription[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFavorites = async () => {
    setLoading(true);
    setError(null);
    const res = await apiRequest("/api/v1/user/favorite-homes");
    if (res.success && res.favoriteHomes) {
      setHomes(res.favoriteHomes as HomeDescription[]);
    } else if (res.success && Array.isArray(res.data)) {
      // fallback: endpoint returned array of IDs only
      setHomes([]);
    } else if (res.success && res.data?.favoriteHomes) {
      setHomes(res.data.favoriteHomes as HomeDescription[]);
    } else {
      setError(res.error || "Unable to load favorite homes.");
    }
    setLoading(false);
  };

  const refresh = async () => {
    setRefreshing(true);
    await fetchFavorites();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchFavorites();
    // Optionally expose refresh in dev
    // @ts-ignore
    window.refreshFavorites = refresh;
  }, []);

  const filteredHomes = homes.filter(
    (h) =>
      h.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.home_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // overlay toast component
  const toast = error ? (
    <ErrorToast message={error} onClose={() => setError(null)} />
  ) : null;

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex items-center gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm">
        <MiniLogo size="lg" />
        <div>
          <h1 className="text-2xl font-bold text-navy">Saved Homes</h1>
          <p className="text-navy/70">Your favorites all in one place</p>
        </div>
      </div>

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
          onClick={async () => {
            if (refreshing || loading) return;
            setRefreshing(true);
            await fetchFavorites();
            setRefreshing(false);
          }}
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
            <HomeCard key={home.home_id} home={home} />
          ))}
        </div>
      ) : (
        <ul className="space-y-4">
          {filteredHomes.map((home) => (
            <li
              key={home.home_id}
              className="flex items-center gap-4 border rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition"
            >
              <img
                src={home.image_url || "https://placehold.co/100x75"}
                alt={home.description || home.home_id}
                className="w-24 h-16 object-cover rounded-md flex-shrink-0"
              />
              <div className="flex-1">
                <h3 className="font-medium truncate" title={home.home_id}>
                  Home {home.home_id}
                </h3>
                {home.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {home.description}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {toast}
    </div>
  );
}
