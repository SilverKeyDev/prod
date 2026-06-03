import type { QueryClient } from "@tanstack/react-query";

import { agentApi } from "packages/config/http/api";
import { queryKeys } from "packages/config/query/keys";
import type { AgentConversation } from "packages/features/agent/api/agent";
import { INITIAL_CHAT_HISTORY_LIMIT } from "packages/features/messaging/hooks/data/useAgentChats";
import { log } from "packages/logger";
import { getInitialLoadRoutes, type RouteConfig } from "packages/services/data/dataConfig";
import { coreUserRoutes } from "packages/services/data/dataRoutes/coreUserRoutes";
import type { GoogleCalendar, UserProfile } from "packages/types";
import { resolveApiResultErrorMessage } from "packages/utils/errorHandling";
import { prefetchRemoteImage } from "packages/utils/media/prefetchRemoteImage";

import { LIBRARY_PREFETCH_ROUTE_KEYS, prefetchFormsLibrary } from "./libraryRouteDataPrefetch";

export interface PrefetchRouteParams {
  routeConfig: RouteConfig;
  userProfile: UserProfile | null;
  queryClient: QueryClient;
}

/**
 * Prefetches data for a single route configuration
 * Handles special case for googleEvents which requires per-calendar caching
 */
export async function prefetchRoute(params: PrefetchRouteParams): Promise<void> {
  const { routeConfig, userProfile, queryClient } = params;

  try {
    // Handle googleEvents specially - prefetch events per calendar with proper query keys
    if (routeConfig.key === "googleEvents") {
      log.debug("CALENDAR", "Prefetching google events (primary + SilverKey metadata)");

      const prefetchResult = await routeConfig.queryFn(userProfile);

      if (!prefetchResult || Array.isArray(prefetchResult)) {
        log.debug("CALENDAR", "No google events to prefetch (user not connected or no data)");
        return;
      }

      if (
        typeof prefetchResult !== "object" ||
        !("events" in prefetchResult) ||
        !Array.isArray(prefetchResult.events)
      ) {
        log.debug("CALENDAR", "Invalid prefetch result structure");
        return;
      }

      const typedResult = prefetchResult as {
        silverKeyCalendar: GoogleCalendar | null;
        events: Array<{
          calendarId: string;
          events: unknown[];
          timeMin: string;
          timeMax: string;
        }>;
      };

      if (typedResult.silverKeyCalendar) {
        queryClient.setQueryData(
          queryKeys.scheduling.silverKeyCalendar(),
          typedResult.silverKeyCalendar
        );
        log.info("CALENDAR", "Stored SilverKey calendar in cache", {
          calendarId: typedResult.silverKeyCalendar.id,
        });
      }

      // Set each calendar's events directly in cache using setQueryData
      typedResult.events.forEach((result) => {
        const queryKey = queryKeys.googleCalendar.eventsList({
          calendarId: result.calendarId,
          timeMin: result.timeMin,
          timeMax: result.timeMax,
        });

        // Ensure calendarId is included in each event when storing to cache
        const events = result.events as Array<{ calendarId?: string }>;
        const eventsWithCalendarId = events.map((event) => ({
          ...event,
          calendarId: event.calendarId || result.calendarId,
        }));

        queryClient.setQueryData(queryKey, eventsWithCalendarId);

        if (eventsWithCalendarId.length > 0) {
          log.debug("CALENDAR", "Stored Google Calendar events in cache", {
            calendarId: result.calendarId,
            eventCount: eventsWithCalendarId.length,
          });
        }
      });

      log.info("CALENDAR", "Successfully prefetched google events", {
        batchCount: typedResult.events.length,
        totalEvents: typedResult.events.reduce((sum, r) => sum + r.events.length, 0),
      });
      return;
    }

    log.debug("API", "Prefetching route", {
      routeKey: routeConfig.key,
    });

    await queryClient.prefetchQuery({
      queryKey: routeConfig.queryKey(),
      queryFn: () => routeConfig.queryFn(userProfile),
      staleTime: routeConfig.staleTime,
    });

    log.debug("API", "Successfully prefetched route", {
      routeKey: routeConfig.key,
    });
  } catch (error) {
    log.warn("API", "Failed to prefetch route", {
      routeKey: routeConfig.key,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Prefetches chat history for a single conversation
 * Silently fails if already cached or if request errors
 */
export async function prefetchChatHistory(
  conversationId: string,
  queryClient: QueryClient
): Promise<void> {
  try {
    const cached = queryClient.getQueryData(queryKeys.agent.history(conversationId));

    if (cached) {
      return;
    }

    await queryClient.prefetchQuery({
      queryKey: queryKeys.agent.history(conversationId),
      queryFn: async () => {
        const response = await agentApi.getChatHistory(conversationId, {
          limit: INITIAL_CHAT_HISTORY_LIMIT,
        });
        if (!response.success) {
          throw new Error(resolveApiResultErrorMessage(response, "Failed to fetch chat history"));
        }
        return {
          messages: response.messages ?? [],
          conversation: response.conversation,
          has_more_older: response.has_more_older,
          has_more_newer: response.has_more_newer,
        };
      },
      staleTime: 3 * 60 * 1000,
    });
  } catch {
    // Silently fail
  }
}

/**
 * Prefetches chat history for all conversations
 * Gets conversations from cache and prefetches each history in parallel
 */
export async function prefetchChatHistories(queryClient: QueryClient): Promise<void> {
  try {
    const conversations = queryClient.getQueryData<AgentConversation[]>(
      queryKeys.agent.conversations()
    );

    if (!conversations || conversations.length === 0) {
      return;
    }

    const historyPromises = conversations.map((conversation) =>
      prefetchChatHistory(conversation.id, queryClient)
    );

    await Promise.allSettled(historyPromises);
  } catch {
    // Don't throw - this is a performance optimization, not critical
  }
}

export interface PrefetchAllParams {
  user: UserProfile;
  queryClient: QueryClient;
}

/**
 * Prefetches all initial data for a user
 * Runs Library-critical routes first, then remaining routes (plus agent forms library)
 * in parallel, then prefetches chat histories.
 */
export async function prefetchAllInitialData(params: PrefetchAllParams): Promise<void> {
  const { user, queryClient } = params;

  const isAgent = (user.roles ?? []).includes("agent");
  log.info("API", "Starting initial data prefetch", {
    userId: user.id,
    isAgent,
  });

  prefetchRemoteImage(user.profile_picture_url);

  const routes = getInitialLoadRoutes(user);
  const tierARoutes = routes.filter((r) => LIBRARY_PREFETCH_ROUTE_KEYS.has(r.key));
  const tierBRoutes = routes.filter((r) => !LIBRARY_PREFETCH_ROUTE_KEYS.has(r.key));

  log.debug("API", "Routes to prefetch", {
    routeCount: routes.length,
    tierACount: tierARoutes.length,
    tierBCount: tierBRoutes.length,
    routeKeys: routes.map((r) => r.key),
  });

  try {
    const tierAResults = await Promise.allSettled(
      tierARoutes.map((routeConfig) =>
        prefetchRoute({ routeConfig, userProfile: user, queryClient })
      )
    );
    const tierASucceeded = tierAResults.filter((r) => r.status === "fulfilled").length;
    const tierAFailed = tierAResults.filter((r) => r.status === "rejected").length;
    log.info("API", "Initial tier A prefetch completed (Library-critical)", {
      total: tierARoutes.length,
      succeeded: tierASucceeded,
      failed: tierAFailed,
    });

    const tierBPromises: Promise<void>[] = tierBRoutes.map((routeConfig) =>
      prefetchRoute({ routeConfig, userProfile: user, queryClient })
    );
    if (!isAgent) {
      tierBPromises.push(
        prefetchRoute({ routeConfig: coreUserRoutes.searchResults, userProfile: user, queryClient })
      );
    }
    if (isAgent) {
      tierBPromises.push(prefetchFormsLibrary(queryClient));
    }

    const tierBResults = await Promise.allSettled(tierBPromises);
    const tierBSucceeded = tierBResults.filter((r) => r.status === "fulfilled").length;
    const tierBFailed = tierBResults.filter((r) => r.status === "rejected").length;
    log.info("API", "Initial tier B prefetch completed", {
      total: tierBPromises.length,
      succeeded: tierBSucceeded,
      failed: tierBFailed,
    });

    // After conversations are loaded, prefetch chat history for each conversation
    await prefetchChatHistories(queryClient);
  } catch (error) {
    // Don't throw - allow app to continue even if some prefetches fail
    log.error(`API.${error}`, "Error during initial data prefetch");
  }
}
