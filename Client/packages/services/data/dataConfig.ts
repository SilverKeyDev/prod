import { queryKeys } from "../../config/query/keys";
import { agentApi, googleCalendarApi, preferencesApi, userApi, searchApi } from "../../config/api";
import { agentService } from "../agent/agent";
import { apiGet } from "../http/compatibility";
import type { UserProfile } from "../../schemas";
import { calculateCalendarDateRange } from "../../utils/calendar/date";
import { transformSearchResponse } from "../search/search";

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
      return {
        ...userData,
        has_subscription: userData.has_subscription ?? false,
        subscription: userData.subscription ?? null,
        has_preferences: userData.has_preferences ?? false,
        is_agent: userData.is_agent ?? false,
        is_closing_mode: userData.is_closing_mode ?? false,
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
    queryKey: () => queryKeys.user.preferences(),
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
    queryKey: () => queryKeys.search.isochrone(),
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
      // Fetch cached search results on initial load
      // Backend handles cache validation and returns cached or empty results
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
      } catch (error) {
        // Silently fail - return empty array
        return [];
      }
    },
    shouldPoll: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    userType: "all",
    initialLoad: true,
  },

  // ============================================
  // Agent-Only Data
  // ============================================

  agentClients: {
    key: "agentClients",
    queryKey: () => queryKeys.agent.clients(),
    queryFn: async () => {
      return agentService.fetchClients();
    },
    shouldPoll: true,
    pollingInterval: 3 * 60 * 1000, // 3 minutes
    staleTime: 3 * 60 * 1000, // 3 minutes
    userType: "agent",
    initialLoad: false,
  },

  agentTodos: {
    key: "agentTodos",
    queryKey: () => queryKeys.agent.todos(false),
    queryFn: async () => {
      return agentService.fetchTodos(false);
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
        throw new Error(response.error ?? "Failed to fetch notification counter");
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
        throw new Error(response.error ?? "Failed to fetch connection requests");
      }
      return response.requests ?? [];
    },
    shouldPoll: false,
    staleTime: 1 * 60 * 1000, // 1 minute
    userType: "agent",
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

      // Calculate 5-week date range aligned to week boundaries (same as Calendar.tsx)
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
        } catch (error) {
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
    queryFn: async () => {
      const response = await apiGet<{ success: boolean; data: number[] }>(
        "/api/v1/user/close?type=escrow"
      );
      if (!response.success) {
        throw new Error("Failed to fetch escrow checklist");
      }
      return response.data ?? [];
    },
    shouldPoll: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    userType: "all",
    initialLoad: true,
  },

  checklistFinancing: {
    key: "checklistFinancing",
    queryKey: () => ["checklists", "financing"],
    queryFn: async () => {
      const response = await apiGet<{ success: boolean; data: number[] }>(
        "/api/v1/user/close?type=financing"
      );
      if (!response.success) {
        throw new Error("Failed to fetch financing checklist");
      }
      return response.data ?? [];
    },
    shouldPoll: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    userType: "all",
    initialLoad: true,
  },

  checklistClosing: {
    key: "checklistClosing",
    queryKey: () => ["checklists", "closing"],
    queryFn: async () => {
      const response = await apiGet<{ success: boolean; data: number[] }>(
        "/api/v1/user/close?type=closing"
      );
      if (!response.success) {
        throw new Error("Failed to fetch closing checklist");
      }
      return response.data ?? [];
    },
    shouldPoll: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    userType: "all",
    initialLoad: true,
  },

  checklistInsurance: {
    key: "checklistInsurance",
    queryKey: () => ["checklists", "insurance"],
    queryFn: async () => {
      const response = await apiGet<{ success: boolean; data: number[] }>(
        "/api/v1/user/close?type=insurance"
      );
      if (!response.success) {
        throw new Error("Failed to fetch insurance checklist");
      }
      return response.data ?? [];
    },
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
  return Object.values(DATA_ROUTES).filter(
    (route) =>
      route.initialLoad && (route.userType === "all" || (route.userType === "agent" && isAgent))
  );
}

/**
 * Get all routes that should be polled
 */
export function getPollingRoutes(user: UserProfile | null): RouteConfig[] {
  const isAgent = user?.is_agent ?? false;
  return Object.values(DATA_ROUTES).filter(
    (route) =>
      route.shouldPoll && (route.userType === "all" || (route.userType === "agent" && isAgent))
  );
}
