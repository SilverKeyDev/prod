import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useAuthStore } from "../../../store/auth.slice";
import { queryKeys } from "../../../config/query/keys";
import { searchApi } from "../../../config/api/search/search";
import type { IsochroneData } from "../../../schemas/api";

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
export function useIsochroneData(): UseIsochroneDataReturn {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);

  // Check cache first when enabled becomes true (cache-first strategy)
  const shouldLoadData = useMemo(
    () => authReady && isAuthenticated,
    [authReady, isAuthenticated]
  );

  const {
    data: isochroneData,
    isLoading,
    error,
    refetch: refetchIsochrone,
  } = useQuery({
    queryKey: queryKeys.search.isochrone(),
    queryFn: async () => {
      const response = await searchApi.getIsochrone();
      if (response.success && response.data) {
        return response.data as IsochroneData;
      }
      throw new Error(response.error ?? "Failed to fetch isochrone data");
    },
    enabled: false, // Don't auto-fetch, use fetchIsochrone function instead
    // Use placeholderData to check cache reactively when enabled changes
    placeholderData: (previousValue) => {
      const cached = queryClient.getQueryData<IsochroneData>(
        queryKeys.search.isochrone()
      );
      return cached ?? previousValue ?? null;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for this long
    gcTime: 15 * 60 * 1000, // 15 minutes - keep in cache longer
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch if data exists
    refetchOnReconnect: false,
  });

  // Mutation to set isochrone data (updates cache)
  const setIsochroneDataMutation = useMutation({
    mutationFn: async (data: IsochroneData) => {
      // Update cache directly
      queryClient.setQueryData(queryKeys.search.isochrone(), data);
      return data;
    },
  });

  // Fetch isochrone data (checks cache first, then fetches if needed)
  const fetchIsochrone = useCallback(async () => {
    // Check cache first
    const cached = queryClient.getQueryData<IsochroneData>(
      queryKeys.search.isochrone()
    );
    if (cached) {
      return cached;
    }

    // If not in cache, fetch it
    if (shouldLoadData) {
      const result = await refetchIsochrone();
      return result.data ?? null;
    }

    return null;
  }, [queryClient, shouldLoadData, refetchIsochrone]);

  const clearIsochroneData = useCallback(() => {
    queryClient.setQueryData(queryKeys.search.isochrone(), null);
  }, [queryClient]);

  return {
    isochroneData: isochroneData ?? null,
    isLoading,
    error: error?.message ?? null,
    fetchIsochrone,
    clearIsochroneData,
  };
}
