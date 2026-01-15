import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import { userApi } from "../../../config/api";
import { queryKeys } from "../../../config/query/keys";
import { useAuthStore } from "../../../store/auth.slice";
import type { SavedHome } from "../../../schemas";

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
    id?: string; // Backend UUID
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
      const rawSqft = homeData.sqft ?? "";
      if (typeof rawSqft === "string" && rawSqft.trim() === "") return undefined;
      const parsed = Number.parseInt(rawSqft.replace(/,/g, ''), 10);
      return isNaN(parsed) || parsed <= 0 ? undefined : parsed;
    })(),
    lot_size: homeData.lot_size ?? "",
    image_url: homeData.image_url ?? undefined,
    lat,
    lng,
    // Store the database ID for later use
    _databaseId: homeData.id,
  };
};

/**
 * Hook for managing saved homes data with React Query
 */
export const useSavedHomesData = () => {
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
    // Use exact query key format from dataConfig.ts (no spread)
    queryKey: queryKeys.homes.favorites(),
    queryFn: async () => {
      // Check cache first - if we have processed SavedHome[] data, return it
      const cached = queryClient.getQueryData<SavedHome[]>(queryKeys.homes.favorites());
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
    enabled: shouldLoadData,
    // Use placeholderData to provide cached data immediately when query becomes enabled
    placeholderData: (previousValue) => {
      // Check cache - this will be used if query is loading
      const cached = queryClient.getQueryData(queryKeys.homes.favorites());
      if (cached && Array.isArray(cached) && cached.length > 0) {
        // Check if it's already processed (SavedHome[])
        const isProcessed = cached.every(
          (home: unknown) => home && typeof home === "object" && "home_id" in home && "address" in home
        );
        if (isProcessed) {
          return cached as SavedHome[];
        }
        // If raw, process it synchronously (basic processing without geocoding)
        // This handles the case where prefetch stored raw data
        return cached.map((home: unknown, index: number) => mapHomeUniversalToSavedHome(home, index));
      }
      // Return previous value if available (maintains data during transitions)
      return previousValue;
    },
    select: (data) => {
      // Ensure data is always in SavedHome[] format
      if (!data) return [];
      if (Array.isArray(data)) {
        // Check if already processed
        const isProcessed = data.length === 0 || data.every(
          (home: unknown) => home && typeof home === "object" && "home_id" in home && "address" in home
        );
        if (isProcessed) {
          return data as SavedHome[];
        }
        // Process raw data (handles case where cached data is raw)
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
      const response = await userApi.addFavoriteHome({ home: property });
      if (!response.success) {
        throw new Error(response.error ?? "Failed to save home");
      }
      return response;
    },
    onMutate: async (property: unknown) => {
      // Optimistic update - add the home to cache immediately
      const previousHomes = queryClient.getQueryData<SavedHome[]>(
        queryKeys.homes.favorites(),
      );

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
        [...queryKeys.homes.favorites()],
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
          queryKeys.homes.favorites(),
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
      const previousHomes = queryClient.getQueryData<SavedHome[]>(
        queryKeys.homes.favorites(),
      );
      queryClient.setQueryData(
        queryKeys.homes.favorites(),
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
          queryKeys.homes.favorites(),
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
    [saveHomeMutation],
  );

  const removeSavedHome = useCallback(
    async (propertyId: string, propertyAddress?: string) => {
      // Find the home to get its address - use the same query key structure as the query
      const homes =
        queryClient.getQueryData<SavedHome[]>(
          queryKeys.homes.favorites(),
        ) ?? [];

      // Try to find by ID first, then by address if provided
      let home = homes.find((h) => h.home_id === propertyId);
      
      if (!home && propertyAddress && typeof propertyAddress === "string") {
        // Try matching by address
        const normalizedAddress = propertyAddress.toLowerCase();
        home = homes.find((h) => {
          const homeAddress = typeof h.address === "string" ? h.address.toLowerCase() : "";
          return homeAddress === normalizedAddress;
        });
      }

      if (!home) {
        // Try to get data from any cached favorites query as fallback
        const allCachedData = queryClient.getQueriesData({
          queryKey: queryKeys.homes.favorites(),
        });

        // Look through all cached data to find the home
        for (const [, cachedHomes] of allCachedData) {
          if (Array.isArray(cachedHomes)) {
            const foundHome = cachedHomes.find(
              (h: SavedHome) => {
                if (h.home_id === propertyId) return true;
                if (propertyAddress && typeof propertyAddress === "string") {
                  const normalizedAddress = propertyAddress.toLowerCase();
                  const homeAddress = typeof h.address === "string" ? h.address.toLowerCase() : "";
                  return homeAddress === normalizedAddress;
                }
                return false;
              }
            );
            if (foundHome) {
              return removeSavedHomeMutation.mutateAsync({
                propertyId,
                address: foundHome.address || propertyAddress || propertyId,
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
    [removeSavedHomeMutation, queryClient],
  );

  const isHomeSaved = useCallback(
    (propertyId: string, propertyAddress?: string) => {
      const homes =
        queryClient.getQueryData<SavedHome[]>(
          queryKeys.homes.favorites(),
        ) ?? [];
      // Try to match by ID first, then by address if provided
      if (propertyAddress && typeof propertyAddress === "string") {
        const normalizedAddress = propertyAddress.toLowerCase();
        return homes.some(
          (home) => {
            if (home.home_id === propertyId) return true;
            const homeAddress = typeof home.address === "string" ? home.address.toLowerCase() : "";
            return homeAddress === normalizedAddress;
          }
        );
      }
      return homes.some((home) => home.home_id === propertyId);
    },
    [queryClient],
  );

  const getSavedHome = useCallback(
    (propertyId: string) => {
      const homes =
        queryClient.getQueryData<SavedHome[]>(
          queryKeys.homes.favorites(),
        ) ?? [];
      return homes.find((home) => home.home_id === propertyId);
    },
    [queryClient],
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
