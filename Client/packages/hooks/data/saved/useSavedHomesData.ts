import { useCallback, useMemo } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { userApi } from "packages/config";
import { queryKeys } from "packages/config/query/keys";
import {
  findSavedHomeByIdOrAddress,
  isProcessedSavedHomeList,
} from "packages/features/saved/types/savedHomeUtils";
import { useAuthStore } from "packages/store";
import type { SavedHome } from "packages/types";
import { resolveApiResultErrorMessage } from "packages/utils/core/errorHandling";
// Direct type/util imports to avoid require cycle: saved barrel -> SavedFeature -> ... -> contexts
import { mapSavedHomeWireToSavedHome } from "packages/utils/transaction/saved";

import { fetchFavoriteHomesData } from "./favoriteHomesQuery";

/**
 * Hook for managing saved homes data with React Query
 * @param clientId - Optional client ID for agents to view client's saved homes
 */
export const useSavedHomesData = (clientId?: string) => {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);

  // Match reports hook: gate loading on auth readiness and authentication
  const shouldLoadData = useMemo(() => authReady && isAuthenticated, [authReady, isAuthenticated]);

  // Saved homes query
  const {
    data: savedHomesData,
    isLoading: savedHomesLoading,
    error: savedHomesError,
    refetch: refetchSavedHomes,
  } = useQuery({
    // Include clientId in query key for proper caching
    queryKey: queryKeys.homes.favorites(clientId),
    queryFn: () => fetchFavoriteHomesData(queryClient, clientId),
    enabled: Boolean(shouldLoadData),
    // Use placeholderData to provide cached data immediately when query becomes enabled
    placeholderData: (previousValue) => {
      const cached = queryClient.getQueryData(queryKeys.homes.favorites(clientId));
      if (cached && isProcessedSavedHomeList(cached)) return cached;
      if (cached && Array.isArray(cached) && cached.length > 0) {
        return cached.map((home: unknown, index: number) =>
          mapSavedHomeWireToSavedHome(home, index)
        );
      }
      return previousValue;
    },
    select: (data) => {
      if (!data) return [];
      if (isProcessedSavedHomeList(data)) return data;
      if (Array.isArray(data)) {
        return data.map((home: unknown, index: number) => mapSavedHomeWireToSavedHome(home, index));
      }
      return [];
    },
    // Ensure proper deduplication
    staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for this long
    gcTime: 15 * 60 * 1000, // 15 minutes - keep in cache longer
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch if data exists (matches reports)
    refetchOnReconnect: false, // Don't refetch on reconnect
  });

  // Save home mutation
  const saveHomeMutation = useMutation({
    mutationFn: async (property: unknown) => {
      const response = await userApi.addFavoriteHome({
        home: property,
        ...(clientId ? { client_id: clientId } : {}),
      });
      if (!response.success) {
        throw new Error(resolveApiResultErrorMessage(response, "Failed to save home"));
      }
      return response;
    },
    onMutate: async (property: unknown) => {
      // Optimistic update - add the home to cache immediately
      const previousHomes = queryClient.getQueryData<SavedHome[]>(
        queryKeys.homes.favorites(clientId)
      );

      const optimisticHome = mapSavedHomeWireToSavedHome(property, 0);

      queryClient.setQueryData(
        queryKeys.homes.favorites(clientId),
        (old: SavedHome[] | undefined) => {
          if (!old) return [optimisticHome];
          // Check if home already exists to avoid duplicates
          const exists = old.some((home) => home.home_id === optimisticHome.home_id);
          return exists ? old : [...old, optimisticHome];
        }
      );

      return { previousHomes };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousHomes) {
        queryClient.setQueryData(queryKeys.homes.favorites(clientId), context.previousHomes);
      }
    },
    onSuccess: () => {
      // Invalidate and refetch saved homes after successful save to ensure consistency
      void queryClient.invalidateQueries({ queryKey: queryKeys.homes.all });
    },
  });

  // Remove saved home mutation
  const removeSavedHomeMutation = useMutation({
    mutationFn: async ({ address }: { propertyId: string; address: string }) => {
      const response = await userApi.removeFavoriteHome({
        address,
        ...(clientId ? { client_id: clientId } : {}),
      });
      if (!response.success) {
        throw new Error(resolveApiResultErrorMessage(response, "Failed to remove home"));
      }
      return response;
    },
    onMutate: ({ propertyId }) => {
      // Optimistic update - remove the home from cache
      const previousHomes = queryClient.getQueryData<SavedHome[]>(
        queryKeys.homes.favorites(clientId)
      );
      queryClient.setQueryData(
        queryKeys.homes.favorites(clientId),
        (old: SavedHome[] | undefined) => {
          if (!old) return old;
          return old.filter((home) => home.home_id !== propertyId);
        }
      );
      return { previousHomes };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousHomes) {
        queryClient.setQueryData(queryKeys.homes.favorites(clientId), context.previousHomes);
      }
    },
    onSettled: () => {
      // Always refetch after mutation settles
      void queryClient.invalidateQueries({
        queryKey: queryKeys.homes.favorites(clientId),
      });
    },
  });

  // Note: Cross-tab auth changes are no longer tracked via sessionStorage tokens
  // Authentication state is managed via HTTP-only cookies
  // The AuthContext handles cross-tab auth changes via custom events if needed

  // Public methods
  const refreshSavedHomes = useCallback(async () => {
    return await refetchSavedHomes();
  }, [refetchSavedHomes]);

  const saveHome = useCallback(
    async (property: unknown) => {
      return saveHomeMutation.mutateAsync(property);
    },
    [saveHomeMutation]
  );

  const removeSavedHome = useCallback(
    async (propertyId: string, propertyAddress?: string) => {
      const homes =
        queryClient.getQueryData<SavedHome[]>(queryKeys.homes.favorites(clientId)) ?? [];
      const home = findSavedHomeByIdOrAddress(homes, propertyId, propertyAddress);

      if (!home) {
        const allCachedData = queryClient.getQueriesData({
          queryKey: queryKeys.homes.favorites(clientId),
        });
        for (const [, cachedHomes] of allCachedData) {
          if (Array.isArray(cachedHomes)) {
            const found = findSavedHomeByIdOrAddress(
              cachedHomes as SavedHome[],
              propertyId,
              propertyAddress
            );
            if (found) {
              return removeSavedHomeMutation.mutateAsync({
                propertyId,
                address: found.address || propertyAddress || propertyId,
              });
            }
          }
        }
        throw new Error(`Property not found. Looking for: ${propertyId}`);
      }

      if (!home.address) {
        throw new Error("Property address not found");
      }
      return removeSavedHomeMutation.mutateAsync({
        propertyId,
        address: home.address,
      });
    },
    [removeSavedHomeMutation, queryClient, clientId]
  );

  const isHomeSaved = useCallback(
    (propertyId: string, propertyAddress?: string) => {
      const homes =
        queryClient.getQueryData<SavedHome[]>(queryKeys.homes.favorites(clientId)) ?? [];
      return findSavedHomeByIdOrAddress(homes, propertyId, propertyAddress) !== undefined;
    },
    [queryClient, clientId]
  );

  const getSavedHome = useCallback(
    (propertyId: string) => {
      const homes =
        queryClient.getQueryData<SavedHome[]>(queryKeys.homes.favorites(clientId)) ?? [];
      return homes.find((home) => home.home_id === propertyId);
    },
    [queryClient, clientId]
  );

  return {
    // State
    savedHomes: savedHomesData ?? [],
    savedHomesLoading,
    savedHomesError: savedHomesError?.message ?? null,

    // Methods
    refreshSavedHomes,
    saveHome,
    removeSavedHome,
    isHomeSaved,
    getSavedHome,
  };
};
