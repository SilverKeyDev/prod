import { useCallback, useMemo } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import { useAuthStore } from "packages/store";
import type { IsochroneData } from "packages/types/api";

import { searchApi } from "@/features/search/api/search";

export type UseIsochroneDataOptions = {
  preferencesSubjectUserId?: string | null;
  /** When true, do not auto-fetch isochrone (e.g. agents until explicit search). */
  skipInitialFetch?: boolean;
};

export type UseIsochroneDataReturn = {
  isochroneData: IsochroneData | null;
  isLoading: boolean;
  error: string | null;
  fetchIsochrone: () => Promise<IsochroneData | null>;
  clearIsochroneData: () => void;
};

/**
 * Hook for managing isochrone data with React Query
 * Caches isochrone data to enable instant loading when returning to SearchPage
 */
export function useIsochroneData(
  options?: UseIsochroneDataOptions,
): UseIsochroneDataReturn {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);
  const subjectId = options?.preferencesSubjectUserId ?? null;
  const skipInitialFetch = options?.skipInitialFetch ?? false;

  const authAllowsFetch = useMemo(
    () => authReady && isAuthenticated,
    [authReady, isAuthenticated],
  );

  const shouldAutoFetch = authAllowsFetch && !skipInitialFetch;

  const fetchIsochroneFromApi =
    useCallback(async (): Promise<IsochroneData> => {
      const response = await searchApi.getIsochrone({
        preferencesUserId: subjectId ?? undefined,
      });
      if (response.success && response.data) {
        return {
          ...response.data,
          center: {
            lat: response.data.center.lat,
            lng: response.data.center.lon,
          },
        } as IsochroneData;
      }
      throw new Error(response.error ?? "Failed to fetch isochrone data");
    }, [subjectId]);

  const {
    data: isochroneData,
    isLoading,
    error,
    refetch: refetchIsochrone,
  } = useQuery({
    queryKey: queryKeys.search.isochrone(subjectId),
    queryFn: fetchIsochroneFromApi,
    enabled: shouldAutoFetch, // Auto-fetch when authenticated (unless agent blank-slate)
    // Use placeholderData to provide cached data immediately when query becomes enabled
    placeholderData: (previousValue) => {
      const cached = queryClient.getQueryData<IsochroneData>(
        queryKeys.search.isochrone(subjectId),
      );
      return cached ?? previousValue;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for this long
    // Match search results: keep isochrone while SPA session navigates away from Search
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch if data exists (cached from initial load)
    refetchOnReconnect: false,
  });

  // Fetch isochrone data (checks cache first, then fetches if needed)
  const fetchIsochrone =
    useCallback(async (): Promise<IsochroneData | null> => {
      const key = queryKeys.search.isochrone(subjectId);
      const cached = queryClient.getQueryData<IsochroneData>(key);
      if (cached) {
        return cached;
      }

      if (!authAllowsFetch) {
        return null;
      }

      if (shouldAutoFetch) {
        const result = await refetchIsochrone();
        return result.data ?? null;
      }

      try {
        return await queryClient.fetchQuery({
          queryKey: key,
          queryFn: fetchIsochroneFromApi,
          staleTime: 5 * 60 * 1000,
        });
      } catch {
        return null;
      }
    }, [
      authAllowsFetch,
      fetchIsochroneFromApi,
      queryClient,
      refetchIsochrone,
      shouldAutoFetch,
      subjectId,
    ]);

  const clearIsochroneData = useCallback(() => {
    queryClient.setQueryData(queryKeys.search.isochrone(subjectId), null);
  }, [queryClient, subjectId]);

  return {
    isochroneData: isochroneData ?? null,
    isLoading,
    error: error?.message ?? null,
    fetchIsochrone,
    clearIsochroneData,
  };
}
