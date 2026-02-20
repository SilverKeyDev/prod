import { useCallback } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { log, LOG_CATEGORIES } from "logger";

import { searchApi } from "packages/config/api";
import { queryKeys } from "packages/config/query/keys";
import type { SearchResult } from "packages/schemas/search";

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
  cachedIsochroneData?: Record<string, unknown> | null;
  fetchCachedIsochrone?: () => Promise<Record<string, unknown> | null>;
}): {
  primeIsochroneOverlay: (hasResults: boolean) => Promise<void>;
  runIsochroneSearch: () => Promise<void>;
  fetchIsochroneForMapOnly: () => Promise<Record<string, unknown> | null>;
} {
  const queryClient = useQueryClient();

  // Fetch isochrone polygon from backend for map population only (no property search)
  const fetchIsochroneForMapOnly = useCallback(async () => {
    // Check cache first if available
    if (params.cachedIsochroneData) {
      return params.cachedIsochroneData;
    }

    // Try to fetch from cache via hook if available
    if (params.fetchCachedIsochrone) {
      const cached = await params.fetchCachedIsochrone();
      if (cached) {
        return cached;
      }
    }

    // If not in cache, fetch from API
    try {
      const response = await searchApi.getIsochrone();

      if (response.success && response.data) {
        const data = response.data as Record<string, unknown>;
        queryClient.setQueryData(queryKeys.search.isochrone(), data);
        return data;
      } else {
        log.warn(
          LOG_CATEGORIES.SEARCH,
          "Invalid isochrone response structure",
          {
            success: response.success,
            hasData: !!response.data,
          },
        );
        return null;
      }
    } catch (error: unknown) {
      const err = error as Error;
      log.error(LOG_CATEGORIES.ERRORS, "Error fetching isochrone polygon", {
        message: err.message,
        name: err.name,
      });
      return null;
    }
  }, [params, queryClient]);

  // Automatically search for properties within the isochrone polygon
  const handleSearchPropertiesInIsochrone = useCallback(
    async (isochroneData: unknown) => {
      const isoArg =
        isochroneData && typeof isochroneData === "object"
          ? (isochroneData as Record<string, unknown>)
          : {};
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
    params.setIsSearching(true);
    params.setSearchStage("Preparing search...");

    try {
      const response = await searchApi.getIsochrone();

      if (
        response.success &&
        response.data &&
        typeof response.data === "object"
      ) {
        const isochroneData = response.data as Record<string, unknown>;
        queryClient.setQueryData(queryKeys.search.isochrone(), isochroneData);

        await handleSearchPropertiesInIsochrone(isochroneData);

        return isochroneData;
      } else {
        log.warn(
          LOG_CATEGORIES.SEARCH,
          "Isochrone API returned unsuccessful response",
          response,
        );
        params.setIsSearching(false);
        params.setSearchStage("");
      }
    } catch (error: unknown) {
      const err = error as Error;
      log.error(LOG_CATEGORIES.ERRORS, "Error fetching isochrone polygon", {
        message: err.message,
        name: err.name,
      });
      params.setIsSearching(false);
      params.setSearchStage("");
    }
    return null;
  }, [handleSearchPropertiesInIsochrone, params, queryClient]);

  const primeIsochroneOverlay = useCallback(
    async (hasResults: boolean) => {
      if (params.cachedIsochroneData) {
        params.renderIsochronePolygon(params.cachedIsochroneData);
        await params.renderImportantLocationMarkers(params.cachedIsochroneData);
        return;
      }

      if (params.fetchCachedIsochrone) {
        const cached = await params.fetchCachedIsochrone();
        if (cached) {
          params.renderIsochronePolygon(cached);
          await params.renderImportantLocationMarkers(cached);
          return;
        }
      }

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
        log.warn(
          LOG_CATEGORIES.SEARCH,
          "No isochrone data received, polygon will not be displayed",
        );
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      fetchIsochroneForMapOnly,
      fetchIsochronePolygon,
      params.renderIsochronePolygon,
      params.renderImportantLocationMarkers,
      params.cachedIsochroneData,
      params.fetchCachedIsochrone,
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
