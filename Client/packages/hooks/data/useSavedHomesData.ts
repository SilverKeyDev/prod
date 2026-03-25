import { useCallback, useMemo } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getEnv, userApi } from "packages/config";
import { queryKeys } from "packages/config/query/keys";
// Direct type/util imports to avoid require cycle: saved barrel -> SavedFeature -> ... -> contexts
import type { PropertyData, RawHomeData } from "packages/features/saved/types/savedHomeMappers";
import { mapHomeUniversalToSavedHome } from "packages/features/saved/types/savedHomeMappers";
import {
  findSavedHomeByIdOrAddress,
  isProcessedSavedHomeList,
} from "packages/features/saved/types/savedHomeUtils";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useAuthStore } from "packages/store";
import type { SavedHome } from "packages/types";
import { getWindow } from "packages/utils/platform";
import { getSessionStorage } from "packages/utils/storage/platformStorage";

interface WindowWithGoogle {
  google?: {
    maps?: {
      Geocoder?: new () => {
        geocode: (req: { address: string }) => Promise<{
          results?: Array<{
            geometry?: {
              location?: {
                lat: number | (() => number);
                lng: number | (() => number);
              };
            };
          }>;
        }>;
      };
    };
  };
}

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
    queryFn: async () => {
      // Check cache first - if we have processed SavedHome[] data, return it
      const cached = queryClient.getQueryData<SavedHome[]>(queryKeys.homes.favorites(clientId));
      if (cached && Array.isArray(cached) && cached.length > 0) {
        // Check if it's already processed (has home_id and other SavedHome properties)
        const isProcessed = cached.every(
          (home) => home && typeof home === "object" && "home_id" in home && "address" in home
        );
        if (isProcessed) {
          // Data is already processed, return it directly
          return cached;
        }
      }

      const sess = getSessionStorage();
      // Only log once per session to avoid spam
      if (!sess.getItem("saved_homes_fetch_logged")) {
        sess.setItem("saved_homes_fetch_logged", "true");
      }
      const response = await userApi.getFavoriteHomes(clientId);
      if (!response.success) {
        throw new Error(response.error ?? "Failed to load favorite homes");
      }
      const rawHomes = (response.favorites ?? []) as unknown as RawHomeData[];
      const isDev = getEnv().isDevelopment;
      log.info(
        LOG_CATEGORIES.MAP_RENDERING,
        "🗺️ [SAVED HOMES] Loaded raw favorite homes from API",
        {
          environment: isDev ? "DEVELOPMENT" : "PRODUCTION",
          rawCount: rawHomes.length,
          sample: rawHomes.slice(0, 3).map((home, i) => ({
            index: i,
            id: (home as RawHomeData).id,
            address: (home as RawHomeData).address,
            lat: (home as RawHomeData).lat ?? home.latitude,
            lng: (home as RawHomeData).lng ?? home.longitude ?? home.lon,
          })),
        }
      );
      // Only log once per session to avoid spam
      if (!sess.getItem("saved_homes_loaded_logged")) {
        sess.setItem("saved_homes_loaded_logged", "true");
      }
      // Enrich with coordinates if missing (legacy behavior)
      const enriched = await Promise.all(
        rawHomes.map(async (home, index) => {
          const existingLat = home?.lat ?? home?.latitude;
          const existingLng = home?.lng ?? home?.longitude ?? home?.lon;
          const latNum = typeof existingLat === "number" ? existingLat : Number(existingLat);
          const lngNum = typeof existingLng === "number" ? existingLng : Number(existingLng);
          const hasValid =
            Number.isFinite(latNum) &&
            Number.isFinite(lngNum) &&
            latNum >= -90 &&
            latNum <= 90 &&
            lngNum >= -180 &&
            lngNum <= 180 &&
            !(latNum === 0 && lngNum === 0);

          if (hasValid) {
            log.debug(
              LOG_CATEGORIES.MAP_RENDERING,
              "🗺️ [SAVED HOMES] Using existing valid coordinates for saved home",
              {
                index,
                address: home.address,
                lat: existingLat,
                lng: existingLng,
              }
            );
            return home;
          }

          try {
            const win = getWindow() as unknown as WindowWithGoogle | null;
            if (win?.google?.maps?.Geocoder && home?.address) {
              const geocoder = new win.google.maps.Geocoder();
              const result = await geocoder.geocode({ address: home.address });
              const location = result?.results?.[0]?.geometry?.location;
              if (location) {
                const lat = typeof location.lat === "function" ? location.lat() : location.lat;
                const lng = typeof location.lng === "function" ? location.lng() : location.lng;
                if (Number.isFinite(lat) && Number.isFinite(lng)) {
                  log.debug(
                    LOG_CATEGORIES.MAP_RENDERING,
                    "🗺️ [SAVED HOMES] Geocoded coordinates for saved home",
                    {
                      address: home.address,
                      lat,
                      lng,
                    }
                  );
                  return { ...home, lat, lng };
                }
              }
            }
          } catch {
            // Silent fallback
          }

          // If geocoding unavailable or failed, return as-is (no 0,0)
          return home;
        })
      );

      return enriched.map(mapHomeUniversalToSavedHome);
    },
    enabled: shouldLoadData,
    // Use placeholderData to provide cached data immediately when query becomes enabled
    placeholderData: (previousValue) => {
      const cached = queryClient.getQueryData(queryKeys.homes.favorites(clientId));
      if (cached && isProcessedSavedHomeList(cached)) return cached;
      if (cached && Array.isArray(cached) && cached.length > 0) {
        return cached.map((home: unknown, index: number) =>
          mapHomeUniversalToSavedHome(home, index)
        );
      }
      return previousValue;
    },
    select: (data) => {
      if (!data) return [];
      if (isProcessedSavedHomeList(data)) return data;
      if (Array.isArray(data)) {
        return data.map((home: unknown, index: number) => mapHomeUniversalToSavedHome(home, index));
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
        throw new Error(response.error ?? "Failed to save home");
      }
      return response;
    },
    onMutate: async (property: unknown) => {
      // Optimistic update - add the home to cache immediately
      const previousHomes = queryClient.getQueryData<SavedHome[]>(
        queryKeys.homes.favorites(clientId)
      );

      // Convert property to SavedHome format for optimistic update
      const propertyData = property as PropertyData;
      const optimisticHome: SavedHome = {
        home_id: propertyData.id || propertyData.home_id || `temp_${Date.now()}`,
        description: propertyData.address || "",
        address: propertyData.address || "",
        price: propertyData.price || "",
        bedrooms: propertyData.bedrooms || 0,
        bathrooms: propertyData.bathrooms || 0,
        sqft: propertyData.sqft || 0,
        lot_size: propertyData.lotSize || "",
        image_url: propertyData.imageUrl || propertyData.image_url,
        lat: propertyData.lat || 0,
        lng: propertyData.lng || 0,
      };

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
        throw new Error(response.error ?? "Failed to remove home");
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
