import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import {
  Property,
  SearchQuery,
  SavedSearch,
  IsochroneData,
  BASE_URL,
} from "./utils";
import {
  fetchJson,
  createAuthHeaders,
  createAbortManager,
  isAbortError,
  getAuthToken,
  routeStartsWith,
} from "../lib/fetchUtils";
import { useAuth } from "./AuthContext";

/* =========================
   Types
   ========================= */

interface PropertySearchContextType {
  searchResults: Property[];
  searchHistory: SearchQuery[];
  savedSearches: SavedSearch[];
  isochrones: IsochroneData[];
  searchLoading: boolean;
  historyLoading: boolean;
  savedSearchesLoading: boolean;
  isochronesLoading: boolean;
  searchError: string | null;
  historyError: string | null;
  savedSearchesError: string | null;
  isochronesError: string | null;
  currentSearchQuery: SearchQuery | null;
  performSearch: (params: SearchQuery) => Promise<void>;
  saveSearch: (search: SearchQuery) => Promise<void>;
  deleteSearch: (searchId: string) => Promise<void>;
  refreshSearchHistory: () => Promise<void>;
  refreshSavedSearches: () => Promise<void>;
  refreshIsochrones: () => Promise<void>;
  clearSearchResults: () => void;
  generateIsochrone: (location: string, minutes: number) => Promise<void>;
}

/* =========================
   Context
   ========================= */

const PropertySearchContext = createContext<PropertySearchContextType | undefined>(undefined);

interface PropertySearchProviderProps {
  children: ReactNode;
}

export function PropertySearchProvider({ children }: PropertySearchProviderProps) {
  const { abortAll, withAbort } = useMemo(() => createAbortManager(), []);
  const { user, authReady } = useAuth();

  // Search results state
  const [searchResults, setSearchResults] = useState<Property[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [currentSearchQuery, setCurrentSearchQuery] = useState<SearchQuery | null>(null);

  // Search history state
  const [searchHistory, setSearchHistory] = useState<SearchQuery[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Saved searches state
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [savedSearchesLoading, setSavedSearchesLoading] = useState(false);
  const [savedSearchesError, setSavedSearchesError] = useState<string | null>(null);

  // Isochrones state
  const [isochrones, setIsochrones] = useState<IsochroneData[]>([]);
  const [isochronesLoading, setIsochronesLoading] = useState(false);
  const [isochronesError, setIsochronesError] = useState<string | null>(null);

  /* =========================
     Fetchers
     ========================= */

  const executeSearch = useCallback(async (params: SearchQuery, signal?: AbortSignal) => {
    const token = getAuthToken();
    if (!token) return;

    setSearchLoading(true);
    setSearchError(null);
    setCurrentSearchQuery(params);

    try {
      const json = await fetchJson<{ success: boolean; properties?: Property[]; error?: string }>(
        `${BASE_URL}/api/v1/search/properties`,
        {
          method: "POST",
          mode: "cors",
          headers: createAuthHeaders(token),
          credentials: "include",
          body: JSON.stringify(params),
          signal
        }
      );

      if (json.success && json.properties) {
        setSearchResults(json.properties);
      } else {
        throw new Error(json.error || "Failed to search properties");
      }
    } catch (e: any) {
      if (!isAbortError(e)) {
        console.error("Failed to search properties", e);
        setSearchError(e?.message ?? "Failed to search properties");
      }
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const fetchSearchHistory = useCallback(async (signal?: AbortSignal) => {
    const token = getAuthToken();
    if (!token) return;

    setHistoryLoading(true);
    setHistoryError(null);

    try {
      const json = await fetchJson<{ success: boolean; searches?: SearchQuery[]; error?: string }>(
        `${BASE_URL}/api/v1/search/history`,
        { 
          method: "GET", 
          mode: "cors", 
          headers: createAuthHeaders(token), 
          credentials: "include",
          signal,
          acceptStatuses: [404]
        }
      );

      if (json.success && json.searches) {
        setSearchHistory(json.searches.map(s => ({
          ...s,
          created_at: new Date(s.created_at)
        })));
      } else if (json === undefined) {
        // 404 response, treat as empty
        setSearchHistory([]);
      } else {
        throw new Error(json.error || "Failed to fetch search history");
      }
    } catch (e: any) {
      if (!isAbortError(e)) {
        console.error("Failed to fetch search history", e);
        setHistoryError(e?.message ?? "Failed to fetch search history");
        setSearchHistory([]); // Safe fallback
      }
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const fetchSavedSearches = useCallback(async (signal?: AbortSignal) => {
    const token = getAuthToken();
    if (!token) return;

    setSavedSearchesLoading(true);
    setSavedSearchesError(null);

    try {
      const json = await fetchJson<{ success: boolean; saved_searches?: SavedSearch[]; error?: string }>(
        `${BASE_URL}/api/v1/search/saved`,
        { 
          method: "GET", 
          mode: "cors", 
          headers: createAuthHeaders(token), 
          credentials: "include",
          signal,
          acceptStatuses: [404]
        }
      );

      if (json.success && json.saved_searches) {
        setSavedSearches(json.saved_searches.map(s => ({
          ...s,
          created_at: new Date(s.created_at),
          last_run: s.last_run ? new Date(s.last_run) : undefined,
          query: {
            ...s.query,
            created_at: new Date(s.query.created_at)
          }
        })));
      } else if (json === undefined) {
        // 404 response, treat as empty
        setSavedSearches([]);
      } else {
        throw new Error(json.error || "Failed to fetch saved searches");
      }
    } catch (e: any) {
      if (!isAbortError(e)) {
        console.error("Failed to fetch saved searches", e);
        setSavedSearchesError(e?.message ?? "Failed to fetch saved searches");
        setSavedSearches([]); // Safe fallback
      }
    } finally {
      setSavedSearchesLoading(false);
    }
  }, []);

  const fetchIsochrones = useCallback(async (signal?: AbortSignal) => {
    const token = getAuthToken();
    if (!token) return;

    setIsochronesLoading(true);
    setIsochronesError(null);

    try {
      const json = await fetchJson<{ success: boolean; isochrones?: IsochroneData[]; error?: string }>(
        `${BASE_URL}/api/v1/search/isochrones`,
        { 
          method: "GET", 
          mode: "cors", 
          headers: createAuthHeaders(token), 
          credentials: "include",
          signal,
          acceptStatuses: [404]
        }
      );

      if (json && json.success && json.isochrones) {
        setIsochrones(json.isochrones.map(i => ({
          ...i,
          created_at: new Date(i.created_at)
        })));
      } else if (json === undefined || json === null) {
        // 404 response or null response, treat as empty
        setIsochrones([]);
      } else {
        throw new Error((json && json.error) || "Failed to fetch isochrones");
      }
    } catch (e: any) {
      if (!isAbortError(e)) {
        console.error("Failed to fetch isochrones", e);
        setIsochronesError(e?.message ?? "Failed to fetch isochrones");
        setIsochrones([]); // Safe fallback
      }
    } finally {
      setIsochronesLoading(false);
    }
  }, []);

  const performSaveSearch = useCallback(async (search: SearchQuery, signal?: AbortSignal) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const json = await fetchJson<{ success: boolean; saved_search?: SavedSearch; error?: string }>(
        `${BASE_URL}/api/v1/search/save`,
        {
          method: "POST",
          mode: "cors",
          headers: createAuthHeaders(token),
          credentials: "include",
          body: JSON.stringify(search),
          signal
        }
      );

      if (json.success && json.saved_search) {
        const newSavedSearch = {
          ...json.saved_search,
          created_at: new Date(json.saved_search.created_at),
          last_run: json.saved_search.last_run ? new Date(json.saved_search.last_run) : undefined,
          query: {
            ...json.saved_search.query,
            created_at: new Date(json.saved_search.query.created_at)
          }
        };
        setSavedSearches(prev => [...prev, newSavedSearch]);
      } else {
        throw new Error(json.error || "Failed to save search");
      }
    } catch (e: any) {
      if (!isAbortError(e)) {
        console.error("Failed to save search", e);
        throw e;
      }
    }
  }, []);

  const performDeleteSearch = useCallback(async (searchId: string, signal?: AbortSignal) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const json = await fetchJson<{ success: boolean; error?: string }>(
        `${BASE_URL}/api/v1/search/saved/${searchId}`,
        {
          method: "DELETE",
          mode: "cors",
          headers: createAuthHeaders(token),
          credentials: "include",
          signal
        }
      );

      if (json.success) {
        setSavedSearches(prev => prev.filter(s => s.id !== searchId));
      } else {
        throw new Error(json.error || "Failed to delete search");
      }
    } catch (e: any) {
      if (!isAbortError(e)) {
        console.error("Failed to delete search", e);
        throw e;
      }
    }
  }, []);

  const performGenerateIsochrone = useCallback(async (location: string, minutes: number, signal?: AbortSignal) => {
    const token = getAuthToken();
    if (!token) return;

    setIsochronesLoading(true);
    setIsochronesError(null);

    try {
      const json = await fetchJson<{ success: boolean; isochrone?: IsochroneData; error?: string }>(
        `${BASE_URL}/api/v1/search/isochrone`,
        {
          method: "POST",
          mode: "cors",
          headers: createAuthHeaders(token),
          credentials: "include",
          body: JSON.stringify({ location, minutes }),
          signal
        }
      );

      if (json.success && json.isochrone) {
        const newIsochrone = {
          ...json.isochrone,
          created_at: new Date(json.isochrone.created_at)
        };
        setIsochrones(prev => [...prev, newIsochrone]);
      } else {
        throw new Error(json.error || "Failed to generate isochrone");
      }
    } catch (e: any) {
      if (!isAbortError(e)) {
        console.error("Failed to generate isochrone", e);
        setIsochronesError(e?.message ?? "Failed to generate isochrone");
      }
    } finally {
      setIsochronesLoading(false);
    }
  }, []);

  /* =========================
     Public functions
     ========================= */

  const performSearch = useCallback((params: SearchQuery) => 
    withAbort((s) => executeSearch(params, s)), 
    [withAbort, executeSearch]
  );

  const saveSearch = useCallback((search: SearchQuery) => 
    withAbort((s) => performSaveSearch(search, s)), 
    [withAbort, performSaveSearch]
  );

  const deleteSearch = useCallback((searchId: string) => 
    withAbort((s) => performDeleteSearch(searchId, s)), 
    [withAbort, performDeleteSearch]
  );

  const refreshSearchHistory = useCallback(() => 
    withAbort((s) => fetchSearchHistory(s)), 
    [withAbort, fetchSearchHistory]
  );

  const refreshSavedSearches = useCallback(() => 
    withAbort((s) => fetchSavedSearches(s)), 
    [withAbort, fetchSavedSearches]
  );

  const refreshIsochrones = useCallback(() => 
    withAbort((s) => fetchIsochrones(s)), 
    [withAbort, fetchIsochrones]
  );

  const generateIsochrone = useCallback((location: string, minutes: number) => 
    withAbort((s) => performGenerateIsochrone(location, minutes, s)), 
    [withAbort, performGenerateIsochrone]
  );

  const clearSearchResults = useCallback(() => {
    setSearchResults([]);
    setSearchError(null);
    setCurrentSearchQuery(null);
  }, []);

  /* =========================
     Effects
     ========================= */

  // Gate initial load based on auth readiness and relevant routes
  useEffect(() => {
    const enabled = authReady && !!user?.id && (
      routeStartsWith('/search') ||
      routeStartsWith('/properties')
    );
    
    if (enabled) {
      refreshSearchHistory();
      refreshSavedSearches();
      refreshIsochrones();
    }
  }, [authReady, user?.id, refreshSearchHistory, refreshSavedSearches, refreshIsochrones]);

  // Cross-tab auth changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "id_token") {
        if (e.newValue) {
          refreshSearchHistory();
          refreshSavedSearches();
          refreshIsochrones();
        } else {
          // Clear everything
          setSearchResults([]);
          setSearchHistory([]);
          setSavedSearches([]);
          setIsochrones([]);
          setCurrentSearchQuery(null);
          setSearchError(null);
          setHistoryError(null);
          setSavedSearchesError(null);
          setIsochronesError(null);
          abortAll();
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [refreshSearchHistory, refreshSavedSearches, refreshIsochrones, abortAll]);

  // Cleanup on unmount
  useEffect(() => () => abortAll(), [abortAll]);

  /* =========================
     Memoized value
     ========================= */

  const value = useMemo<PropertySearchContextType>(() => ({
    searchResults,
    searchHistory,
    savedSearches,
    isochrones,
    searchLoading,
    historyLoading,
    savedSearchesLoading,
    isochronesLoading,
    searchError,
    historyError,
    savedSearchesError,
    isochronesError,
    currentSearchQuery,
    performSearch,
    saveSearch,
    deleteSearch,
    refreshSearchHistory,
    refreshSavedSearches,
    refreshIsochrones,
    clearSearchResults,
    generateIsochrone,
  }), [
    searchResults, searchHistory, savedSearches, isochrones,
    searchLoading, historyLoading, savedSearchesLoading, isochronesLoading,
    searchError, historyError, savedSearchesError, isochronesError,
    currentSearchQuery, performSearch, saveSearch, deleteSearch,
    refreshSearchHistory, refreshSavedSearches, refreshIsochrones,
    clearSearchResults, generateIsochrone,
  ]);

  return <PropertySearchContext.Provider value={value}>{children}</PropertySearchContext.Provider>;
}

/* =========================
   Hook
   ========================= */

export function usePropertySearch() {
  const ctx = useContext(PropertySearchContext);
  if (!ctx) throw new Error("usePropertySearch must be used within a PropertySearchProvider");
  return ctx;
}
