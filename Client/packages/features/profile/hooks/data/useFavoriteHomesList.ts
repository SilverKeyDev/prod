/**
 * Hook that fetches the current user's favorite homes list.
 * Wraps config/api so components use hooks only.
 */
import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { useAuthStore } from "packages/store";

import { userApi } from "@/features/profile/api/user";

export type FavoriteHomeItem = {
  user_id: string;
  address: string;
  beds: string;
  baths: string;
  sqft: string;
  lot_size: string;
  price: string;
  image_url: string;
  created_at: string;
  updated_at: string;
};

function mapRawToFavoriteHome(home: unknown): FavoriteHomeItem {
  const typedHome = home as Record<string, unknown>;
  return {
    user_id: typeof typedHome.user_id === "string" ? typedHome.user_id : "",
    address: typeof typedHome.address === "string" ? typedHome.address : "",
    beds:
      typeof typedHome.beds === "string"
        ? typedHome.beds
        : typeof typedHome.beds === "number"
          ? typedHome.beds.toString()
          : "",
    baths:
      typeof typedHome.baths === "string"
        ? typedHome.baths
        : typeof typedHome.baths === "number"
          ? typedHome.baths.toString()
          : "",
    sqft:
      typeof typedHome.sqft === "string"
        ? typedHome.sqft
        : typeof typedHome.sqft === "number"
          ? typedHome.sqft.toString()
          : "",
    lot_size: typeof typedHome.lot_size === "string" ? typedHome.lot_size : "",
    price: typeof typedHome.price === "string" ? typedHome.price : "",
    image_url: typeof typedHome.image_url === "string" ? typedHome.image_url : "",
    created_at: typeof typedHome.created_at === "string" ? typedHome.created_at : "",
    updated_at: typeof typedHome.updated_at === "string" ? typedHome.updated_at : "",
  };
}

export function useFavoriteHomesList(clientId?: string) {
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const enabled = authReady && isAuthenticated;

  const query = useQuery({
    queryKey: ["favoriteHomesList", clientId],
    queryFn: async () => {
      const response = await userApi.getFavoriteHomes(clientId);
      if (!response.success) {
        throw new Error(response.error ?? "Failed to load favorite homes");
      }
      const raw = (response.favorites ?? []) as unknown[];
      return raw.map(mapRawToFavoriteHome);
    },
    enabled,
    staleTime: 1 * 60 * 1000, // 1 minute - favorites can change as user browses
  });

  const favoriteHomes = useMemo(() => (query.data ?? []) as FavoriteHomeItem[], [query.data]);

  return {
    favoriteHomes,
    loading: query.isLoading,
    error: query.error
      ? query.error instanceof Error
        ? query.error.message
        : "Failed to load favorite homes"
      : null,
    refetch: query.refetch,
  };
}
