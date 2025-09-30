// External libraries
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

// Internal config and utilities
import { preferencesApi } from "../../../../../packages/config/api/preferences";
import type { SearchResult } from "../../../../../packages/schemas/search";
import {
  checkAuthAndRedirect,
  getAuthToken,
} from "../../../../../packages/utils/auth";
import { asError } from "../../../../../packages/utils/error";

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
  prefsApi: typeof preferencesApi;
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
} {
  const navigate = useNavigate();

  // Fetch isochrone polygon from backend for map population only (no property search)
  const fetchIsochroneForMapOnly = useCallback(async () => {
    try {
      // Auth is handled via HTTP-only cookies
      // Server will return 401 if not authenticated

      const { apiBaseUrl } = params.env;
      const response = await fetch(`${apiBaseUrl}/api/v1/search/isochrone`, {
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
      if (console && typeof console.error === "function") {
        console.error("❌ Error fetching isochrone polygon:", error);
      }
      return null;
    }
  }, [navigate, params.env]);

  // Automatically search for properties within the isochrone polygon
  const handleSearchPropertiesInIsochrone = useCallback(
    async (isochroneData: unknown) => {
      // Get user preferences for the search
      let userPrefs = {};
      try {
        const response = await preferencesApi.get();
        if (response.success && response.preferences) {
          userPrefs = response.preferences;
        }
      } catch (prefError: unknown) {
        const error = asError(prefError);
        if (console && typeof console.warn === "function") {
          console.warn(
            "⚠️ Could not fetch user preferences, using empty preferences:",
            error,
          );
        }
      }

      // Use the injected service function with safe casting
      const isoArg =
        isochroneData && typeof isochroneData === "object"
          ? (isochroneData as Record<string, unknown>)
          : {};
      const prefsArg =
        userPrefs && typeof userPrefs === "object"
          ? (userPrefs as Record<string, unknown>)
          : {};

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
    try {
      // Auth is handled via HTTP-only cookies
      // Server will return 401 if not authenticated

      const { apiBaseUrl } = params.env;
      const response = await fetch(`${apiBaseUrl}/api/v1/search/isochrone`, {
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
        }
      } else {
        console.warn(
          "⚠️ Isochrone API error:",
          response.status,
          response.statusText,
        );
      }
    } catch (error: unknown) {
      console.error("❌ Error fetching isochrone polygon:", error);
    }
    return null;
  }, [navigate, handleSearchPropertiesInIsochrone, params.env]);

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
  };
}
