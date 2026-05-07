import { preferencesApi, searchApi, userApi } from "packages/config/http/api";
import { queryKeys } from "packages/config/query/keys";
import { fetchCachedPolygonSearchResults } from "packages/features/search/api/fetchCachedPolygonSearchResults";
import { log, LOG_CATEGORIES } from "packages/logger";
import type { RouteConfig } from "packages/services/data/dataRouteTypes";
import { HttpError } from "packages/services/http/compatibility";

export const coreUserRoutes = {
  userProfile: {
    key: "userProfile",
    queryKey: () => queryKeys.user.profile(),
    queryFn: async () => {
      const response = await userApi.getProfile();
      if (!response.success) {
        throw new Error(response.error ?? "Failed to fetch user profile");
      }
      const userData = response.user ?? response.data;
      if (!userData) {
        throw new Error("No user data received");
      }
      const raw = userData as Record<string, unknown>;
      const closing = typeof raw.is_closing_mode === "boolean" ? raw.is_closing_mode : false;

      return {
        ...userData,
        has_subscription: userData.has_subscription ?? false,
        subscription: userData.subscription ?? null,
        has_preferences: userData.has_preferences ?? false,
        is_agent: userData.is_agent ?? false,
        is_closing_mode: closing,
        client_ids: Array.isArray(userData.client_ids)
          ? userData.client_ids.join(",")
          : userData.client_ids,
      };
    },
    shouldPoll: false,
    staleTime: 5 * 60 * 1000,
    userType: "all",
    initialLoad: true,
  },

  userPreferences: {
    key: "userPreferences",
    queryKey: () => queryKeys.user.preferences(null),
    queryFn: async () => {
      const response = await preferencesApi.get();
      if (!response.success) {
        throw new Error(response.error ?? "Failed to fetch preferences");
      }
      return response.preferences;
    },
    shouldPoll: false,
    staleTime: 5 * 60 * 1000,
    userType: "all",
    initialLoad: true,
  },

  savedHomes: {
    key: "savedHomes",
    queryKey: () => queryKeys.homes.favorites(),
    queryFn: async () => {
      const response = await userApi.getFavoriteHomes();
      if (!response.success) {
        throw new Error(response.error ?? "Failed to load favorite homes");
      }
      const rawHomes = response.favorites ?? [];
      return rawHomes;
    },
    shouldPoll: true,
    pollingInterval: 5 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
    userType: "all",
    initialLoad: true,
  },

  isochrone: {
    key: "isochrone",
    queryKey: () => queryKeys.search.isochrone(null),
    queryFn: async (user) => {
      if (!user?.has_preferences) {
        return null;
      }
      try {
        const response = await searchApi.getIsochrone();
        if (!response.success || !response.data) {
          throw new Error(response.error ?? "Failed to fetch isochrone data");
        }
        return {
          ...response.data,
          center: {
            lat: response.data.center.lat,
            lng: response.data.center.lon,
          },
        };
      } catch (error) {
        if (error instanceof HttpError && error.status === 400) {
          // Missing or incomplete commute inputs should not break bootstrap prefetch.
          log.debug(LOG_CATEGORIES.API, "Skipping isochrone prefetch: incomplete commute inputs", {
            hasPreferences: user.has_preferences,
          });
          return null;
        }
        throw error;
      }
    },
    shouldPoll: false,
    staleTime: 5 * 60 * 1000,
    userType: "all",
    initialLoad: true,
  },

  searchResults: {
    key: "searchResults",
    queryKey: () => queryKeys.search.results(),
    queryFn: async (_user) => fetchCachedPolygonSearchResults(),
    shouldPoll: false,
    staleTime: Number.POSITIVE_INFINITY,
    userType: "all",
    initialLoad: false,
  },
} as const satisfies Record<string, RouteConfig>;
