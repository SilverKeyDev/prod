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
  SavedHome,
  getIdToken,
  favoriteHomesApi,
  mapHomeUniversalToSavedHome,
} from "./utils";

/* =========================
   Types
   ========================= */

interface SavedHomesContextType {
  savedHomes: SavedHome[];
  savedHomesLoading: boolean;
  savedHomesError: string | null;
  refreshSavedHomes: () => Promise<void>;
}

/* =========================
   Context
   ========================= */

const SavedHomesContext = createContext<SavedHomesContextType | undefined>(undefined);

interface SavedHomesProviderProps {
  children: ReactNode;
}

export function SavedHomesProvider({ children }: SavedHomesProviderProps) {
  const [savedHomes, setSavedHomes] = useState<SavedHome[]>([]);
  const [savedHomesLoading, setSavedHomesLoading] = useState(false);
  const [savedHomesError, setSavedHomesError] = useState<string | null>(null);

  /* =========================
     Fetcher
     ========================= */

  const fetchSavedHomes = useCallback(async () => {
    const token = getIdToken();
    if (!token) return;
    
    setSavedHomesLoading(true);
    setSavedHomesError(null);
    
    try {
      const response = await favoriteHomesApi.getFavorites();
      if (response.success) {
        const rawHomes = response.favorites || [];
        const homeObjects: SavedHome[] = rawHomes.map(mapHomeUniversalToSavedHome);
        setSavedHomes(homeObjects);
      } else {
        throw new Error(response.error || "Failed to load favorite homes");
      }
    } catch (e: any) {
      console.error("Failed to fetch saved homes:", e);
      setSavedHomesError(e?.message ?? "Failed to fetch saved homes");
    } finally {
      setSavedHomesLoading(false);
    }
  }, []);

  /* =========================
     Public refresh function
     ========================= */

  const refreshSavedHomes = useCallback(() => fetchSavedHomes(), [fetchSavedHomes]);

  /* =========================
     Effects
     ========================= */

  // Initial load when authenticated
  useEffect(() => {
    const token = getIdToken();
    if (token) {
      refreshSavedHomes();
    }
  }, [refreshSavedHomes]);

  // Cross-tab auth changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "id_token") {
        if (e.newValue) {
          refreshSavedHomes();
        } else {
          // Clear everything
          setSavedHomes([]);
          setSavedHomesError(null);
        }
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [refreshSavedHomes]);

  /* =========================
     Memoized value
     ========================= */

  const value = useMemo<SavedHomesContextType>(() => ({
    savedHomes,
    savedHomesLoading,
    savedHomesError,
    refreshSavedHomes,
  }), [savedHomes, savedHomesLoading, savedHomesError, refreshSavedHomes]);

  return <SavedHomesContext.Provider value={value}>{children}</SavedHomesContext.Provider>;
}

/* =========================
   Hook
   ========================= */

export function useSavedHomes() {
  const ctx = useContext(SavedHomesContext);
  if (!ctx) throw new Error("useSavedHomes must be used within a SavedHomesProvider");
  return {
    savedHomes: ctx.savedHomes,
    loading: ctx.savedHomesLoading,
    error: ctx.savedHomesError,
    refreshSavedHomes: ctx.refreshSavedHomes,
  };
}
