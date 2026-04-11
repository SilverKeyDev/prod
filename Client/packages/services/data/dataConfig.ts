import {
  agentApi,
  googleCalendarApi,
  preferencesApi,
  searchApi,
  userApi,
} from "packages/config/http/api";
import { queryKeys } from "packages/config/query/keys";
import { getTaskChecklist } from "packages/features/checklists";
import type { UserProfile } from "packages/types";

import { calculateCalendarDateRange } from "@/features/calendar/utils/date";
import { transformSearchResponse } from "@/features/search/utils/searchTransform";

/**
 * Configuration for a data route
 */
export interface RouteConfig {
  /** Unique identifier for the route */
  key: string;
  /** Function that returns the React Query key for this route */
  queryKey: () => readonly unknown[];
  /** Function that fetches the data for this route */
  queryFn: (user: UserProfile | null) => Promise<unknown>;
  /** Whether this route should be polled in the background */
  shouldPoll: boolean;
  /** Polling interval in milliseconds (background) */
  pollingInterval?: number;
  /** Polling interval in milliseconds when user is on the active page (optional) */
  pollingIntervalActive?: number;
  /** Stale time in milliseconds for React Query */
  staleTime: number;
  /** User type restriction: 'all' or 'agent' */
  userType: "all" | "agent";
  /** Whether to load this route on initial prefetch */
  initialLoad: boolean;
}

/**
 * Centralized configuration for all data routes
 * Defines which routes are loaded initially, which are polled, and at what intervals
 */
export const DATA_ROUTES: Record<string, RouteConfig> = {
  // ============================================
  // Core User Data (All Users)
  // ============================================

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
      const closing =
        typeof raw.is_closing_mode === "boolean" ? raw.is_closing_mode : false;

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
    staleTime: 5 * 60 * 1000, // 5 minutes
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
    staleTime: 5 * 60 * 1000, // 5 minutes
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
      // Return raw homes - geocoding can happen lazily when needed
      return rawHomes;
    },
    shouldPoll: true,
    pollingInterval: 5 * 60 * 1000, // 5 minutes
    staleTime: 5 * 60 * 1000, // 5 minutes
    userType: "all",
    initialLoad: true,
  },

  isochrone: {
    key: "isochrone",
    queryKey: () => queryKeys.search.isochrone(null),
    queryFn: async () => {
      const response = await searchApi.getIsochrone();
      if (!response.success || !response.data) {
        throw new Error(response.error ?? "Failed to fetch isochrone data");
      }
      // Transform API response to match IsochroneData schema (lon -> lng)
      return {
        ...response.data,
        center: {
          lat: response.data.center.lat,
          lng: response.data.center.lon,
        },
      };
    },
    shouldPoll: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    userType: "all",
    initialLoad: true,
  },

  searchResults: {
    key: "searchResults",
    queryKey: () => queryKeys.search.results(),
    queryFn: async () => {
      // Fetch persisted search results on initial load (read-only; no new search on server)
      try {
        const response = await searchApi.searchByPolygon({
          perBucketPages: 20,
          onlyCached: true, // Only fetch cached results on initial load
        });

        if (!response.success) {
          return [];
        }

        // Transform API response to SearchResult format
        return transformSearchResponse(response);
      } catch {
        // Silently fail - return empty array
        return [];
      }
    },
    shouldPoll: false,
    staleTime: Number.POSITIVE_INFINITY, // Never stale - results stay until new search or explicit refetch
    userType: "all",
    // Do not prefetch at login: same key as useSearchResultsData - duplicate queryFn + refetchOnMount:false
    // could leave a truncated onlyCached snapshot stuck until manual search. Search page owns first fetch.
    initialLoad: false,
  },

  // ============================================
  // Agent-Only Data
  // ============================================

  agentClients: {
    key: "agentClients",
    queryKey: () => queryKeys.agent.clients(),
    queryFn: async () => {
      const response = await agentApi.getClients();
      if (!response.success) {
        throw new Error(response.error ?? "Failed to fetch clients");
      }
      return response.clients ?? [];
    },
    shouldPoll: true,
    pollingInterval: 3 * 60 * 1000, // 3 minutes (background)
    pollingIntervalActive: 15000, // 15 seconds (when on messaging page)
    staleTime: 30 * 1000, // 30 seconds
    userType: "agent",
    initialLoad: true,
  },

  agentTodos: {
    key: "agentTodos",
    queryKey: () => queryKeys.agent.todos(false),
    queryFn: async () => {
      const response = await agentApi.getTodos(false);
      if (!response.success) {
        throw new Error(response.error ?? "Failed to fetch todos");
      }
      return response.todos ?? [];
    },
    shouldPoll: true,
    pollingInterval: 60 * 1000, // 1 minute
    staleTime: 1 * 60 * 1000, // 1 minute
    userType: "agent",
    initialLoad: true,
  },

  // ============================================
  // Conversations (All Users - for messaging)
  // ============================================

  conversations: {
    key: "conversations",
    queryKey: () => queryKeys.agent.conversations(),
    queryFn: async () => {
      const response = await agentApi.getChats();
      if (!response.success) {
        throw new Error(response.error ?? "Failed to fetch conversations");
      }
      return response.conversations ?? [];
    },
    shouldPoll: true,
    pollingInterval: 45000, // 45 seconds (background)
    pollingIntervalActive: 8000, // 8 seconds (when on messaging page)
    staleTime: 0, // Always fetch fresh for conversations
    userType: "all",
    initialLoad: true,
  },

  notificationCounter: {
    key: "notificationCounter",
    queryKey: () => queryKeys.agent.notificationCounter(),
    queryFn: async (_user: UserProfile | null) => {
      const response = await agentApi.getNotificationCounter();
      if (!response.success) {
        throw new Error(
          response.error ?? "Failed to fetch notification counter",
        );
      }
      return response.total_count;
    },
    shouldPoll: true,
    pollingInterval: 10 * 1000, // 10 seconds
    staleTime: 0, // Always fetch fresh
    userType: "all",
    initialLoad: true,
  },

  connectionRequests: {
    key: "connectionRequests",
    queryKey: () => [...queryKeys.agent.all, "connection-requests"] as const,
    queryFn: async () => {
      const response = await agentApi.getConnectionRequests();
      if (!response.success) {
        throw new Error(
          response.error ?? "Failed to fetch connection requests",
        );
      }
      return response.requests ?? [];
    },
    shouldPoll: true,
    pollingInterval: 60 * 1000, // 1 minute (background)
    pollingIntervalActive: 15000, // 15 seconds (when on messaging page)
    staleTime: 30 * 1000, // 30 seconds
    userType: "all",
    initialLoad: true,
  },

  // ============================================
  // Calendar (Agent Only)
  // ============================================

  googleCalendars: {
    key: "googleCalendars",
    queryKey: () => queryKeys.googleCalendar.calendars(),
    queryFn: async () => {
      const response = await googleCalendarApi.listCalendars();
      if (!response.success) {
        throw new Error(response.error ?? "Failed to fetch calendars");
      }
      return response.data?.items ?? [];
    },
    shouldPoll: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    userType: "agent",
    initialLoad: false,
  },

  googleCalendarConnection: {
    key: "googleCalendarConnection",
    queryKey: () => [...queryKeys.googleCalendar.all, "connection"],
    queryFn: async () => {
      const isConnected = await googleCalendarApi.isConnected();
      return isConnected;
    },
    shouldPoll: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    userType: "all",
    initialLoad: true,
  },

  googleCalendarPermissions: {
    key: "googleCalendarPermissions",
    queryKey: () => queryKeys.googleCalendar.permissions(),
    queryFn: async () => {
      // Only fetch permissions if user is connected
      const isConnected = await googleCalendarApi.isConnected();
      if (!isConnected) {
        // Return null to indicate not connected (will be handled by hook)
        return null;
      }
      const response = await googleCalendarApi.getPermissions();
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to fetch permissions");
      }
      return response.data;
    },
    shouldPoll: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    userType: "all",
    initialLoad: true, // Load on initial page load to check permissions
  },

  googleEvents: {
    key: "googleEvents",
    queryKey: () => {
      // This route prefetches events for all calendars
      return [...queryKeys.googleCalendar.events(), "prefetch"] as const;
    },
    queryFn: async (_user: UserProfile | null) => {
      // Check if user is connected first
      const isConnected = await googleCalendarApi.isConnected();

      // Only fetch events if connected
      if (!isConnected) {
        return [];
      }

      // Fetch all calendars first
      // Note: This only returns the authenticated user's own calendars (not client calendars)
      // Agents should use the availability endpoint to view client calendars
      const calendarsResponse = await googleCalendarApi.listCalendars();
      if (!calendarsResponse.success || !calendarsResponse.data?.items) {
        return [];
      }

      const calendars = calendarsResponse.data.items;

      // Calculate 4-week date range aligned to week boundaries (same as Calendar.tsx)
      const { timeMin, timeMax } = calculateCalendarDateRange();

      // Fetch events for all calendars using /api/v1/google/me/events? for each calendar
      const eventPromises = calendars.map(async (calendar) => {
        try {
          const response = await googleCalendarApi.listEvents({
            calendarId: calendar.id,
            timeMin,
            timeMax,
          });

          if (!response.success) {
            throw new Error(response.error ?? "Failed to fetch events");
          }

          return {
            calendarId: calendar.id,
            events: response.data?.items ?? [],
            timeMin,
            timeMax,
          };
        } catch {
          // Silently fail for individual calendars - return empty array
          return {
            calendarId: calendar.id,
            events: [],
            timeMin,
            timeMax,
          };
        }
      });

      const results = await Promise.all(eventPromises);

      // Return results with calendar info for proper caching in initialDataLoader
      // Also include calendars so they can be stored in cache for "primary" resolution
      return {
        calendars,
        events: results,
      };
    },
    shouldPoll: false,
    staleTime: 2 * 60 * 1000, // 2 minutes - events can change frequently
    userType: "all", // Prefetch for all users, not just agents
    initialLoad: true,
  },

  // ============================================
  // Checklists (All Users)
  // ============================================

  checklistEscrow: {
    key: "checklistEscrow",
    queryKey: () => ["checklists", "escrow"],
    queryFn: async () => getTaskChecklist("escrow"),
    shouldPoll: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    userType: "all",
    initialLoad: true,
  },

  checklistFinancing: {
    key: "checklistFinancing",
    queryKey: () => ["checklists", "financing"],
    queryFn: async () => getTaskChecklist("financing"),
    shouldPoll: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    userType: "all",
    initialLoad: true,
  },

  checklistClosing: {
    key: "checklistClosing",
    queryKey: () => ["checklists", "closing"],
    queryFn: async () => getTaskChecklist("closing"),
    shouldPoll: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    userType: "all",
    initialLoad: true,
  },

  checklistInsurance: {
    key: "checklistInsurance",
    queryKey: () => ["checklists", "insurance"],
    queryFn: async () => getTaskChecklist("insurance"),
    shouldPoll: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    userType: "all",
    initialLoad: true,
  },
} as const;

/**
 * Get all routes that should be loaded initially
 */
export function getInitialLoadRoutes(user: UserProfile | null): RouteConfig[] {
  const isAgent = user?.is_agent ?? false;
  const authed = Boolean(user);
  return Object.values(DATA_ROUTES).filter((route) => {
    if (!route.initialLoad) {
      return false;
    }
    // Dashboard to-dos: same API for agents (all rows) and clients (their rows only)
    if (route.key === "agentTodos") {
      return authed;
    }
    return route.userType === "all" || (route.userType === "agent" && isAgent);
  });
}

/**
 * Get all routes that should be polled
 */
export function getPollingRoutes(user: UserProfile | null): RouteConfig[] {
  const isAgent = user?.is_agent ?? false;
  return Object.values(DATA_ROUTES).filter(
    (route) =>
      route.shouldPoll &&
      (route.userType === "all" || (route.userType === "agent" && isAgent)),
  );
}
