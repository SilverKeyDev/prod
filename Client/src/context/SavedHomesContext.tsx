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
} from "../types";
import {
  getIdToken,
  mapHomeUniversalToSavedHome,
} from "./utils";
import { SearchResult } from "../types/search";
import {
  isAuthenticationError,
  handleAuthenticationError,
} from "../api/utils/index";
import { userApi } from "../api";

/* =========================
   Types
   ========================= */

interface SavedHomesContextType {
  savedHomes: SavedHome[];
  savedHomesLoading: boolean;
  savedHomesError: string | null;
  refreshSavedHomes: () => Promise<void>;
  saveHome: (property: SearchResult) => Promise<void>;
  removeSavedHome: (propertyId: string) => Promise<void>;
}

/* =========================
   Context
   ========================= */

export const SavedHomesContext = createContext<SavedHomesContextType | undefined>(
  undefined
);

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
      const response = await userApi.getFavoriteHomes();
      if (response.success) {
        const rawHomes = response.favorites || [];
        const homeObjects: SavedHome[] = rawHomes.map(
          mapHomeUniversalToSavedHome
        );
        setSavedHomes(homeObjects);
      } else {
        throw new Error(response.error || "Failed to load favorite homes");
      }
    } catch (e: any) {
      if (isAuthenticationError(e)) {
        handleAuthenticationError(e);
        return; // User will be redirected
      }
      console.error("Failed to fetch saved homes:", e);
      setSavedHomesError(e?.message ?? "Failed to fetch saved homes");
    } finally {
      setSavedHomesLoading(false);
    }
  }, []);

  /* =========================
     Public methods
     ========================= */

  const refreshSavedHomes = useCallback(
    () => fetchSavedHomes(),
    [fetchSavedHomes]
  );

  const saveHome = useCallback(
    async (property: SearchResult) => {
      try {
        const response = await userApi.addFavoriteHome({ home: property });
        if (response.success) {
          await refreshSavedHomes();
        } else {
          throw new Error(response.error || "Failed to save home");
        }
      } catch (error) {
        console.error("Error adding favorite:", error);
        throw error;
      }
    },
    [refreshSavedHomes]
  );

  const removeSavedHome = useCallback(
    async (propertyId: string) => {
      try {
        const property = savedHomes.find((home) => home.id === propertyId);
        if (!property) {
          console.error("Property not found");
          return;
        }
        if (!property.address) {
          console.error("Property address not found");
          return;
        }
        await userApi.removeFavoriteHome({ address: property.address });
        await refreshSavedHomes();
      } catch (error) {
        console.error("Error removing favorite:", error);
        throw error;
      }
    },
    [savedHomes, refreshSavedHomes]
  );

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

  const value = useMemo<SavedHomesContextType>(
    () => ({
      savedHomes,
      savedHomesLoading,
      savedHomesError,
      refreshSavedHomes,
      saveHome,
      removeSavedHome,
    }),
    [
      savedHomes,
      savedHomesLoading,
      savedHomesError,
      refreshSavedHomes,
      saveHome,
      removeSavedHome,
    ]
  );

  return (
    <SavedHomesContext.Provider value={value}>
      {children}
    </SavedHomesContext.Provider>
  );
}

/* =========================
   Hook
   ========================= */

export function useSavedHomes() {
  const ctx = useContext(SavedHomesContext);
  if (!ctx)
    throw new Error("useSavedHomes must be used within a SavedHomesProvider");
  return {
    savedHomes: ctx.savedHomes,
    loading: ctx.savedHomesLoading,
    error: ctx.savedHomesError,
    refreshSavedHomes: ctx.refreshSavedHomes,
    saveHome: ctx.saveHome,
    removeSavedHome: ctx.removeSavedHome,
  };
}
