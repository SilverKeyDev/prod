// External libraries
import { useCallback } from "react";

// Internal config and utilities
import type { SearchResult } from "../../../../../packages/schemas/search";

// Internal features
// import { renderImportantLocationMarkers } from "@/features/search/lib/importantLocationRenderer";
// import { renderIsochronePolygon } from "@/features/search/lib/isochroneRenderer";
// import { searchPropertiesInIsochrone } from "@/features/search/services/propertySearch";

export function useIsochroneFlow(params: {
  env: { apiBaseUrl: string };
  googleMapRef: React.MutableRefObject<google.maps.Map | null>;
  renderIsochronePolygon: (data: Record<string, unknown>) => void;
  renderImportantLocationMarkers: (
    data: Record<string, unknown>,
  ) => Promise<void>;
  searchPropertiesInIsochrone: (
    isochroneData: Record<string, unknown>,
    userPrefs: Record<string, unknown>,
    setSearchStage: (s?: string) => void,
    setSearchResults: (r: SearchResult[]) => void,
    setIsSearching: (b: boolean) => void,
    setHasSearched: (b: boolean) => void,
    setCurrentPage: (n: number) => void,
    setShowPropertyModals: (b: boolean) => void,
    saveSearchResultsToLocalStorage: (r: SearchResult[]) => Promise<void>,
  ) => Promise<void>;
  setSearchStage: (s?: string) => void;
  setSearchResults: (r: SearchResult[]) => void;
  setIsSearching: (b: boolean) => void;
  setHasSearched: (b: boolean) => void;
  setCurrentPage: (n: number) => void;
  setShowPropertyModals: (b: boolean) => void;
  saveSearchResultsToLocalStorage: (r: SearchResult[]) => Promise<void>;
  mapFocusOnCurrentProperty: () => void;
}): {
  primeIsochroneOverlay: (hasResults: boolean) => Promise<void>;
  runIsochroneSearch: () => Promise<void>;
  fetchIsochroneForMapOnly: () => Promise<Record<string, unknown> | null>;
} {
  // Fetch isochrone polygon from backend for map population only (no property search)
  const fetchIsochroneForMapOnly = useCallback(async () => {
    try {
      // Auth is handled via HTTP-only cookies
      // Server will return 401 if not authenticated

      const { apiBaseUrl } = params.env;
      const base = apiBaseUrl || ""; // In dev, empty string uses Vite proxy
      const response = await fetch(`${base}/api/v1/search/isochrone`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include", // Send HTTP-only cookies
      });

      if (response.ok) {
        const data = (await response.json()) as unknown;

        if (
          data &&
          typeof data === "object" &&
          "success" in data &&
          data.success &&
          "data" in data &&
          data.data
        ) {
          return data.data as Record<string, unknown>;
        } else {
          if (console && typeof console.warn === "function") {
            console.warn("⚠️ Invalid isochrone response structure:", data);
          }
          return null;
        }
      } else {
        const errorText = await response.text();
        if (console && typeof console.error === "function") {
          console.error("❌ Isochrone API error:", response.status, errorText);
        }
        return null;
      }
    } catch (error: unknown) {
      const err = error as Error;
      if (console && typeof console.error === "function") {
        console.error("❌ Error fetching isochrone polygon:", {
          message: err.message,
          name: err.name,
          apiBaseUrl: params.env.apiBaseUrl,
        });
      }
      return null;
    }
  }, [params.env]);

  // Automatically search for properties within the isochrone polygon
  const handleSearchPropertiesInIsochrone = useCallback(
    async (isochroneData: unknown) => {
      // Backend now pulls user preferences from database, so we don't need to fetch them
      // Use the injected service function with safe casting
      const isoArg =
        isochroneData && typeof isochroneData === "object"
          ? (isochroneData as Record<string, unknown>)
          : {};
      // Pass empty object for userPreferences - backend will use database values
      const prefsArg = {};

      await params.searchPropertiesInIsochrone(
        isoArg,
        prefsArg,
        params.setSearchStage,
        params.setSearchResults,
        params.setIsSearching,
        params.setHasSearched,
        params.setCurrentPage,
        params.setShowPropertyModals,
        params.saveSearchResultsToLocalStorage,
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      params.setSearchStage,
      params.setSearchResults,
      params.setIsSearching,
      params.setHasSearched,
      params.setCurrentPage,
      params.setShowPropertyModals,
      params.saveSearchResultsToLocalStorage,
    ],
  );

  // Fetch isochrone polygon from backend
  const fetchIsochronePolygon = useCallback(async () => {
    // Set searching state immediately when search starts
    params.setIsSearching(true);
    params.setSearchStage("Preparing search...");
    
    try {
      // Auth is handled via HTTP-only cookies
      // Server will return 401 if not authenticated

      const { apiBaseUrl } = params.env;
      const base = apiBaseUrl || ""; // In dev, empty string uses Vite proxy
      const response = await fetch(`${base}/api/v1/search/isochrone`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include", // Send HTTP-only cookies
      });

      if (response.ok) {
        const data = (await response.json()) as unknown;
        if (!data || typeof data !== "object") {
          throw new Error("Invalid API response structure");
        }

        if (
          data &&
          typeof data === "object" &&
          "success" in data &&
          data.success &&
          "data" in data &&
          data.data &&
          typeof data.data === "object"
        ) {
          await handleSearchPropertiesInIsochrone(
            data.data as Record<string, unknown>,
          );

          return data.data as Record<string, unknown>;
        } else {
          console.warn(
            "⚠️ Isochrone API returned unsuccessful response:",
            data,
          );
          params.setIsSearching(false);
          params.setSearchStage("");
        }
      } else {
        console.warn(
          "⚠️ Isochrone API error:",
          response.status,
          response.statusText,
        );
        params.setIsSearching(false);
        params.setSearchStage("");
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.error("❌ Error fetching isochrone polygon:", {
        message: err.message,
        name: err.name,
        apiBaseUrl: params.env.apiBaseUrl,
      });
      params.setIsSearching(false);
      params.setSearchStage("");
    }
    return null;
  }, [handleSearchPropertiesInIsochrone, params.env, params.setIsSearching, params.setSearchStage]);

  const primeIsochroneOverlay = useCallback(
    async (hasResults: boolean) => {
      const fetcher = hasResults
        ? fetchIsochroneForMapOnly
        : fetchIsochronePolygon;
      const data = (await fetcher()) as unknown;
      if (data) {
        params.renderIsochronePolygon(data as Record<string, unknown>);
        await params.renderImportantLocationMarkers(
          data as Record<string, unknown>,
        );
      } else {
        if (console && typeof console.warn === "function") {
          console.warn(
            "⚠️ No isochrone data received, polygon will not be displayed",
          );
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      fetchIsochroneForMapOnly,
      fetchIsochronePolygon,
      params.renderIsochronePolygon,
      params.renderImportantLocationMarkers,
    ],
  );

  const runIsochroneSearch = useCallback(async () => {
    await fetchIsochronePolygon();
  }, [fetchIsochronePolygon]);

  return {
    primeIsochroneOverlay,
    runIsochroneSearch,
    fetchIsochroneForMapOnly,
  };
}
