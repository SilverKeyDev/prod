import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";

import { userApi } from "../../config/api/user";
import { useFiltersQueryParams } from "../../config/query/adapters";
import { queryKeys } from "../../config/query/keys";
import { useAuth } from "../../contexts";
import type { SavedHome } from "../../schemas";

// Type definitions for Google Maps API
interface GoogleMapsGeocoder {
  geocode(request: { address: string }): Promise<{
    results: Array<{
      geometry: {
        location: {
          lat: number | (() => number);
          lng: number | (() => number);
        };
      };
    }>;
  }>;
}

interface WindowWithGoogle {
  google?: {
    maps?: {
      Geocoder?: new () => GoogleMapsGeocoder;
    };
  };
}

// Raw home data structure from API
interface RawHomeData {
  address?: string;
  price?: string;
  beds?: string;
  baths?: string;
  sqft?: string;
  lot_size?: string;
  image_url?: string;
  lat?: number | string;
  lng?: number | string;
  latitude?: number | string;
  longitude?: number | string;
  lon?: number | string;
  [key: string]: unknown;
}

// Property data structure for mutations
interface PropertyData {
  id?: string;
  home_id?: string;
  address?: string;
  price?: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  lotSize?: string;
  imageUrl?: string;
  image_url?: string;
  lat?: number;
  lng?: number;
  [key: string]: unknown;
}

/**
 * Map home data to SavedHome format
 */
const mapHomeUniversalToSavedHome = (
  home: unknown,
  index: number,
): SavedHome => {
  const homeData = home as {
    address?: string;
    price?: string;
    beds?: string;
    baths?: string;
    sqft?: string;
    lot_size?: string;
    image_url?: string;
    lat?: number | string;
    lng?: number | string;
    latitude?: number | string;
    longitude?: number | string;
    lon?: number | string;
    [key: string]: unknown;
  };

  // Normalize coordinates from multiple possible keys and string values
  const rawLat = homeData.lat ?? homeData.latitude;
  const rawLng = homeData.lng ?? homeData.longitude ?? homeData.lon;
  const latNum = typeof rawLat === "number" ? rawLat : Number(rawLat);
  const lngNum = typeof rawLng === "number" ? rawLng : Number(rawLng);
  const validLat = Number.isFinite(latNum) && latNum >= -90 && latNum <= 90;
  const validLng = Number.isFinite(lngNum) && lngNum >= -180 && lngNum <= 180;
  const lat = validLat ? latNum : undefined;
  const lng = validLng ? lngNum : undefined;

  return {
    home_id: homeData.address ?? `home_${index}_${Date.now()}`,
    description: homeData.address ?? "",
    address: homeData.address ?? "",
    price: homeData.price ?? "",
    bedrooms: (() => {
      const parsed = Number.parseInt(homeData.beds ?? "0");
      return isNaN(parsed) ? undefined : parsed;
    })(),
    bathrooms: (() => {
      const parsed = Number.parseInt(homeData.baths ?? "0");
      return isNaN(parsed) ? undefined : parsed;
    })(),
    sqft: (() => {
      const parsed = Number.parseInt(homeData.sqft ?? "0");
      return isNaN(parsed) ? undefined : parsed;
    })(),
    lot_size: homeData.lot_size ?? "",
    image_url: homeData.image_url ?? undefined,
    lat,
    lng,
  };
};

/**
 * Hook for managing saved homes data with React Query
 */
export const useSavedHomesData = () => {
  const queryClient = useQueryClient();
  const filters = useFiltersQueryParams();
  const { isAuthenticated, authReady } = useAuth();

  // Additional check to ensure access token is available
  // This prevents race conditions during login
  const hasAccessToken =
    typeof window !== "undefined" &&
    sessionStorage.getItem("access_token") !== null &&
    sessionStorage.getItem("access_token") !== "http-only-cookie-auth";

  // Saved homes query
  const {
    data: savedHomesData,
    isLoading: savedHomesLoading,
    error: savedHomesError,
    refetch: refetchSavedHomes,
  } = useQuery({
    queryKey: [...queryKeys.homes.favorites(), filters],
    queryFn: async () => {
      // Only log once per session to avoid spam
      if (!sessionStorage.getItem("saved_homes_fetch_logged")) {
        sessionStorage.setItem("saved_homes_fetch_logged", "true");
      }
      const response = await userApi.getFavoriteHomes();
      if (!response.success) {
        throw new Error(response.error ?? "Failed to load favorite homes");
      }
      const rawHomes = (response.favorites ?? []) as unknown as RawHomeData[];
      // Only log once per session to avoid spam
      if (!sessionStorage.getItem("saved_homes_loaded_logged")) {
        sessionStorage.setItem("saved_homes_loaded_logged", "true");
      }
      // Enrich with coordinates if missing (legacy behavior)
      const enriched = await Promise.all(
        rawHomes.map(async (home) => {
          const existingLat = home?.lat ?? home?.latitude;
          const existingLng = home?.lng ?? home?.longitude ?? home?.lon;
          const latNum =
            typeof existingLat === "number" ? existingLat : Number(existingLat);
          const lngNum =
            typeof existingLng === "number" ? existingLng : Number(existingLng);
          const hasValid =
            Number.isFinite(latNum) &&
            Number.isFinite(lngNum) &&
            latNum >= -90 &&
            latNum <= 90 &&
            lngNum >= -180 &&
            lngNum <= 180 &&
            !(latNum === 0 && lngNum === 0);

          if (hasValid) {
            return home;
          }

          try {
            const typedWindow = window as unknown as WindowWithGoogle;
            if (
              typeof window !== "undefined" &&
              typedWindow.google?.maps?.Geocoder &&
              home?.address
            ) {
              const geocoder = new typedWindow.google.maps.Geocoder();
              const result = await geocoder.geocode({ address: home.address });
              const location = result?.results?.[0]?.geometry?.location;
              if (location) {
                const lat =
                  typeof location.lat === "function"
                    ? location.lat()
                    : location.lat;
                const lng =
                  typeof location.lng === "function"
                    ? location.lng()
                    : location.lng;
                if (Number.isFinite(lat) && Number.isFinite(lng)) {
                  return { ...home, lat, lng };
                }
              }
            }
          } catch {
            // Silent fallback
          }

          // If geocoding unavailable or failed, return as-is (no 0,0)
          return home;
        }),
      );

      return enriched.map(mapHomeUniversalToSavedHome);
    },
    enabled: authReady && isAuthenticated && hasAccessToken,
    select: (data) => data,
    // Ensure proper deduplication
    staleTime: 3 * 60 * 1000, // 3 minutes - data is fresh for this long
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch if data exists
  });

  // Save home mutation
  const saveHomeMutation = useMutation({
    mutationFn: async (property: unknown) => {
      const response = await userApi.addFavoriteHome({ home: property });
      if (!response.success) {
        throw new Error(response.error ?? "Failed to save home");
      }
      return response;
    },
    onMutate: async (property: unknown) => {
      // Optimistic update - add the home to cache immediately
      const previousHomes = queryClient.getQueryData([
        ...queryKeys.homes.favorites(),
        filters,
      ]);

      // Convert property to SavedHome format for optimistic update
      const propertyData = property as PropertyData;
      const optimisticHome: SavedHome = {
        home_id:
          propertyData.id || propertyData.home_id || `temp_${Date.now()}`,
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
        [...queryKeys.homes.favorites(), filters],
        (old: SavedHome[] | undefined) => {
          if (!old) return [optimisticHome];
          // Check if home already exists to avoid duplicates
          const exists = old.some(
            (home) => home.home_id === optimisticHome.home_id,
          );
          return exists ? old : [...old, optimisticHome];
        },
      );

      return { previousHomes };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousHomes) {
        queryClient.setQueryData(
          [...queryKeys.homes.favorites(), filters],
          context.previousHomes,
        );
      }
    },
    onSuccess: () => {
      // Invalidate and refetch saved homes after successful save to ensure consistency
      void queryClient.invalidateQueries({ queryKey: queryKeys.homes.all });
    },
  });

  // Remove saved home mutation
  const removeSavedHomeMutation = useMutation({
    mutationFn: async ({
      address,
    }: {
      propertyId: string;
      address: string;
    }) => {
      const response = await userApi.removeFavoriteHome({ address });
      if (!response.success) {
        throw new Error(response.error ?? "Failed to remove home");
      }
      return response;
    },
    onMutate: ({ propertyId }) => {
      // Optimistic update - remove the home from cache
      const previousHomes = queryClient.getQueryData([
        ...queryKeys.homes.favorites(),
        filters,
      ]);
      queryClient.setQueryData(
        [...queryKeys.homes.favorites(), filters],
        (old: SavedHome[] | undefined) => {
          if (!old) return old;
          return old.filter((home) => home.home_id !== propertyId);
        },
      );
      return { previousHomes };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousHomes) {
        queryClient.setQueryData(
          [...queryKeys.homes.favorites(), filters],
          context.previousHomes,
        );
      }
    },
    onSettled: () => {
      // Always refetch after mutation settles
      void queryClient.invalidateQueries({
        queryKey: queryKeys.homes.favorites(),
      });
    },
  });

  // Handle cross-tab auth changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "id_token") {
        if (e.newValue) {
          // User logged in, refresh saved homes
          void queryClient.invalidateQueries({
            queryKey: queryKeys.homes.favorites(),
          });
        } else {
          // User logged out, clear data
          void queryClient.removeQueries({
            queryKey: queryKeys.homes.favorites(),
          });
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [queryClient]);

  // Public methods
  const refreshSavedHomes = useCallback(async () => {
    return await refetchSavedHomes();
  }, [refetchSavedHomes]);

  const saveHome = useCallback(
    async (property: unknown) => {
      return saveHomeMutation.mutateAsync(property);
    },
    [saveHomeMutation],
  );

  const removeSavedHome = useCallback(
    async (propertyId: string) => {
      // Find the home to get its address - use the same query key structure as the query
      const homes =
        queryClient.getQueryData<SavedHome[]>([
          ...queryKeys.homes.favorites(),
          filters,
        ]) ?? [];

      const home = homes.find((h) => h.home_id === propertyId);

      if (!home) {
        // Try to get data from any cached favorites query as fallback
        const allCachedData = queryClient.getQueriesData({
          queryKey: queryKeys.homes.favorites(),
        });

        // Look through all cached data to find the home
        for (const [, cachedHomes] of allCachedData) {
          if (Array.isArray(cachedHomes)) {
            const foundHome = cachedHomes.find(
              (h: SavedHome) => h.home_id === propertyId,
            );
            if (foundHome) {
              return removeSavedHomeMutation.mutateAsync({
                propertyId,
                address: foundHome.address,
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
    [removeSavedHomeMutation, queryClient, filters],
  );

  const isHomeSaved = useCallback(
    (propertyId: string) => {
      const homes =
        queryClient.getQueryData<SavedHome[]>([
          ...queryKeys.homes.favorites(),
          filters,
        ]) ?? [];
      return homes.some((home) => home.home_id === propertyId);
    },
    [queryClient, filters],
  );

  const getSavedHome = useCallback(
    (propertyId: string) => {
      const homes =
        queryClient.getQueryData<SavedHome[]>([
          ...queryKeys.homes.favorites(),
          filters,
        ]) ?? [];
      return homes.find((home) => home.home_id === propertyId);
    },
    [queryClient, filters],
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
