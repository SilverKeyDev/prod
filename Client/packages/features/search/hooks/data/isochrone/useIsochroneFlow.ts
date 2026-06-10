import { useCallback, useMemo } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import { log } from "packages/logger";

import { searchApi } from "@/features/search/api/search";
import type { SearchResult } from "@/features/search/types";
import { normalizeIsochroneApiData } from "@/features/search/utils/map/normalizeIsochroneApiData";

export function useIsochroneFlow(params: {
  env: { apiBaseUrl: string };
  googleMapRef: React.MutableRefObject<google.maps.Map | null>;
  renderIsochronePolygon: (data: Record<string, unknown>) => void;
  renderImportantLocationMarkers: (data: Record<string, unknown>) => Promise<void>;
  searchPropertiesInIsochrone: (
    isochroneData: Record<string, unknown>,
    userPrefs: Record<string, unknown>,
    setSearchStage: (s?: string) => void,
    setSearchResults: (r: SearchResult[]) => void,
    setIsSearching: (b: boolean) => void,
    setHasSearched: (b: boolean) => void,
    setCurrentPage: (n: number) => void,
    setShowPropertyModals: (b: boolean) => void,
    saveSearchResultsToLocalStorage: (r: SearchResult[]) => Promise<void>
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
  preferencesSubjectUserId?: string | null;
}): {
  primeIsochroneOverlay: () => Promise<void>;
  runIsochroneSearch: () => Promise<void>;
  fetchIsochroneForMapOnly: () => Promise<Record<string, unknown> | null>;
} {
  const queryClient = useQueryClient();
  const isoQueryKey = useMemo(
    () => queryKeys.search.isochrone(params.preferencesSubjectUserId),
    [params.preferencesSubjectUserId]
  );

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
      const response = await searchApi.getIsochrone({
        preferencesUserId: params.preferencesSubjectUserId ?? undefined,
      });

      if (response.success && response.data) {
        const data = response.data as Record<string, unknown>;
        queryClient.setQueryData(isoQueryKey, data);
        return data;
      } else {
        log.warn("SEARCH", "Invalid isochrone response structure", {
          success: response.success,
          hasData: !!response.data,
        });
        return null;
      }
    } catch (error: unknown) {
      const err = error as Error;
      log.error("ERRORS", "Error fetching isochrone polygon", {
        message: err.message,
        name: err.name,
      });
      return null;
    }
  }, [params, queryClient, isoQueryKey]);

  /** Fetch isochrone and update React Query cache only (no property search). */
  const fetchIsochroneDataOnly = useCallback(async (): Promise<Record<string, unknown> | null> => {
    try {
      const response = await searchApi.getIsochrone({
        preferencesUserId: params.preferencesSubjectUserId ?? undefined,
      });
      if (response.success && response.data) {
        const normalized = normalizeIsochroneApiData(response.data);
        queryClient.setQueryData(isoQueryKey, normalized);
        return normalized as unknown as Record<string, unknown>;
      }
      log.warn("SEARCH", "Isochrone API returned unsuccessful response (map overlay)", {
        success: response.success,
        hasData: !!response.data,
      });
      return null;
    } catch (error: unknown) {
      const err = error as Error;
      log.error("ERRORS", "Error fetching isochrone for map overlay", {
        message: err.message,
        name: err.name,
      });
      return null;
    }
  }, [queryClient, isoQueryKey, params.preferencesSubjectUserId]);

  // Property search within the isochrone polygon (explicit user action only)
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
        params.saveSearchResultsToLocalStorage
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
    ]
  );

  // Fetch isochrone polygon from backend
  const fetchIsochronePolygon = useCallback(async () => {
    params.setIsSearching(true);
    params.setSearchStage("Preparing search...");

    try {
      const response = await searchApi.getIsochrone({
        preferencesUserId: params.preferencesSubjectUserId ?? undefined,
      });

      if (response.success && response.data && typeof response.data === "object") {
        const isochroneData = response.data as Record<string, unknown>;
        queryClient.setQueryData(isoQueryKey, isochroneData);

        await handleSearchPropertiesInIsochrone(isochroneData);

        return isochroneData;
      } else {
        log.warn("SEARCH", "Isochrone API returned unsuccessful response", response);
        params.setIsSearching(false);
        params.setSearchStage("");
      }
    } catch (error: unknown) {
      const err = error as Error;
      log.error("ERRORS", "Error fetching isochrone polygon", {
        message: err.message,
        name: err.name,
      });
      params.setIsSearching(false);
      params.setSearchStage("");
    }
    return null;
  }, [handleSearchPropertiesInIsochrone, params, queryClient, isoQueryKey]);

  const primeIsochroneOverlay = useCallback(
    async () => {
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

      const data = await fetchIsochroneDataOnly();
      if (data) {
        params.renderIsochronePolygon(data);
        await params.renderImportantLocationMarkers(data);
      } else {
        log.warn("SEARCH", "No isochrone data received, polygon will not be displayed");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      fetchIsochroneDataOnly,
      params.renderIsochronePolygon,
      params.renderImportantLocationMarkers,
      params.cachedIsochroneData,
      params.fetchCachedIsochrone,
    ]
  );

  const runIsochroneSearch = useCallback(async () => {
    log.info("SEARCH", "Search begins", {});
    await fetchIsochronePolygon();
  }, [fetchIsochronePolygon]);

  return {
    primeIsochroneOverlay,
    runIsochroneSearch,
    fetchIsochroneForMapOnly,
  };
}
