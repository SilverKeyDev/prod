import { useCallback } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { userApi } from "packages/config/api";
import { queryKeys } from "packages/config/query/keys";
import type { SavedHome } from "packages/schemas";
import { useAuthStore } from "packages/store";

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
 * Hook for managing not-interested homes data with React Query
 */
export const useNotInterestedHomesData = () => {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);

  // Gate loading on auth readiness and authentication
  const shouldLoadData = authReady && isAuthenticated;

  // Not-interested homes query
  const {
    data: notInterestedHomesData,
    isLoading: notInterestedHomesLoading,
    error: notInterestedHomesError,
    refetch: refetchNotInterestedHomes,
  } = useQuery<SavedHome[], Error>({
    queryKey: queryKeys.homes.notInterested(),
    queryFn: async () => {
      const response = await userApi.getNotInterestedHomes();
      if (!response.success) {
        throw new Error(
          response.error ?? "Failed to load not-interested homes",
        );
      }
      const raw = response.notInterested ?? [];
      return raw
        .filter((h) => h && (h.address || h.id || h.zpid))
        .map((h) => ({
          home_id: h.id ?? h.zpid ?? h.mls_home_id ?? h.address ?? "",
          address: h.address ?? "",
          lat: h.latitude ?? 0,
          lng: h.longitude ?? 0,
        })) as SavedHome[];
    },
    enabled: shouldLoadData,
    placeholderData: () =>
      queryClient.getQueryData<SavedHome[]>(queryKeys.homes.notInterested()),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
  });

  // Mark as not-interested mutation
  const markNotInterestedMutation = useMutation({
    mutationFn: async ({
      property,
      why,
    }: {
      property: unknown;
      why?: string;
    }) => {
      const response = await userApi.addNotInterestedHome({
        home: property,
        why,
      });
      if (!response.success) {
        throw new Error(
          response.error ?? "Failed to mark home as not interested",
        );
      }
      return response;
    },
    onMutate: async ({ property }: { property: unknown; why?: string }) => {
      // Optimistic update - add the home to cache immediately
      const previousHomes = queryClient.getQueryData<SavedHome[]>(
        queryKeys.homes.notInterested(),
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
        queryKeys.homes.notInterested(),
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
          queryKeys.homes.notInterested(),
          context.previousHomes,
        );
      }
    },
    onSuccess: () => {
      // Invalidate and refetch not-interested homes after successful mark
      void queryClient.invalidateQueries({ queryKey: queryKeys.homes.all });
    },
  });

  // Remove not-interested mutation (undo)
  const removeNotInterestedMutation = useMutation({
    mutationFn: async ({
      address,
    }: {
      propertyId: string;
      address: string;
    }) => {
      const response = await userApi.removeNotInterestedHome({ address });
      if (!response.success) {
        throw new Error(
          response.error ?? "Failed to remove from not-interested",
        );
      }
      return response;
    },
    onMutate: ({ propertyId }) => {
      // Optimistic update - remove the home from cache
      const previousHomes = queryClient.getQueryData<SavedHome[]>(
        queryKeys.homes.notInterested(),
      );
      queryClient.setQueryData(
        queryKeys.homes.notInterested(),
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
          queryKeys.homes.notInterested(),
          context.previousHomes,
        );
      }
    },
    onSettled: () => {
      // Always refetch after mutation settles
      void queryClient.invalidateQueries({
        queryKey: queryKeys.homes.notInterested(),
      });
    },
  });

  // Update not-interested reason mutation
  const updateNotInterestedReasonMutation = useMutation({
    mutationFn: async ({ address, why }: { address: string; why: string }) => {
      const response = await userApi.updateNotInterestedHome({ address, why });
      if (!response.success) {
        throw new Error(
          response.error ?? "Failed to update not-interested reason",
        );
      }
      return response;
    },
    onSuccess: () => {
      // Invalidate and refetch not-interested homes after successful update
      void queryClient.invalidateQueries({ queryKey: queryKeys.homes.all });
    },
  });

  // Public methods
  const refreshNotInterestedHomes = useCallback(async () => {
    return await refetchNotInterestedHomes();
  }, [refetchNotInterestedHomes]);

  const markNotInterested = useCallback(
    async (property: unknown, why?: string) => {
      return markNotInterestedMutation.mutateAsync({ property, why });
    },
    [markNotInterestedMutation],
  );

  const removeNotInterested = useCallback(
    async (propertyId: string, propertyAddress?: string) => {
      // Find the home to get its address
      const homes =
        queryClient.getQueryData<SavedHome[]>(
          queryKeys.homes.notInterested(),
        ) ?? [];

      // Try to find by ID first, then by address if provided
      let home = homes.find((h) => h.home_id === propertyId);

      if (!home && propertyAddress && typeof propertyAddress === "string") {
        // Try matching by address
        const normalizedAddress = propertyAddress.toLowerCase();
        home = homes.find((h) => {
          const homeAddress =
            typeof h.address === "string" ? h.address.toLowerCase() : "";
          return homeAddress === normalizedAddress;
        });
      }

      if (!home) {
        // Try to get data from any cached not-interested query as fallback
        const allCachedData = queryClient.getQueriesData({
          queryKey: queryKeys.homes.notInterested(),
        });

        // Look through all cached data to find the home
        for (const [, cachedHomes] of allCachedData) {
          if (Array.isArray(cachedHomes)) {
            const foundHome = cachedHomes.find((h: SavedHome) => {
              if (h.home_id === propertyId) return true;
              if (propertyAddress && typeof propertyAddress === "string") {
                const normalizedAddress = propertyAddress.toLowerCase();
                const homeAddress =
                  typeof h.address === "string" ? h.address.toLowerCase() : "";
                return homeAddress === normalizedAddress;
              }
              return false;
            });
            if (foundHome) {
              return removeNotInterestedMutation.mutateAsync({
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
      return removeNotInterestedMutation.mutateAsync({
        propertyId,
        address: home.address,
      });
    },
    [removeNotInterestedMutation, queryClient],
  );

  const isNotInterested = useCallback(
    (propertyId: string, propertyAddress?: string) => {
      const homes =
        queryClient.getQueryData<SavedHome[]>(
          queryKeys.homes.notInterested(),
        ) ?? [];
      // Try to match by ID first, then by address if provided
      if (propertyAddress && typeof propertyAddress === "string") {
        const normalizedAddress = propertyAddress.toLowerCase();
        return homes.some((home) => {
          if (home.home_id === propertyId) return true;
          const homeAddress =
            typeof home.address === "string" ? home.address.toLowerCase() : "";
          return homeAddress === normalizedAddress;
        });
      }
      return homes.some((home) => home.home_id === propertyId);
    },
    [queryClient],
  );

  const updateNotInterestedReason = useCallback(
    async (address: string, why: string) => {
      return updateNotInterestedReasonMutation.mutateAsync({ address, why });
    },
    [updateNotInterestedReasonMutation],
  );

  return {
    // State
    notInterestedHomes: notInterestedHomesData ?? [],
    notInterestedHomesLoading,
    notInterestedHomesError: notInterestedHomesError?.message ?? null,

    // Methods
    refreshNotInterestedHomes,
    markNotInterested,
    updateNotInterestedReason,
    removeNotInterested,
    isNotInterested,
  };
};
