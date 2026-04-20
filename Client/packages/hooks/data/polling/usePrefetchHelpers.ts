import type { QueryClient } from "@tanstack/react-query";

import { agentApi } from "packages/config/http/api";
import { queryKeys } from "packages/config/query/keys";
import type { AgentConversation } from "packages/features/agent/api/agent";
import { log, LOG_CATEGORIES } from "packages/logger";
import type { RouteConfig } from "packages/services/data/dataConfig";
import { getInitialLoadRoutes } from "packages/services/data/dataConfig";
import type { GoogleCalendar, UserProfile } from "packages/types";
import { prefetchRemoteImage } from "packages/utils/media/prefetchRemoteImage";

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
      log.debug(
        LOG_CATEGORIES.CALENDAR,
        "Prefetching google events (primary + SilverKey metadata)"
      );

      const prefetchResult = await routeConfig.queryFn(userProfile);

      if (!prefetchResult || Array.isArray(prefetchResult)) {
        log.debug(
          LOG_CATEGORIES.CALENDAR,
          "No google events to prefetch (user not connected or no data)"
        );
        return;
      }

      if (
        typeof prefetchResult !== "object" ||
        !("events" in prefetchResult) ||
        !Array.isArray(prefetchResult.events)
      ) {
        log.debug(LOG_CATEGORIES.CALENDAR, "Invalid prefetch result structure");
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
        log.info(LOG_CATEGORIES.CALENDAR, "Stored SilverKey calendar in cache", {
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
          log.debug(LOG_CATEGORIES.CALENDAR, "Stored Google Calendar events in cache", {
            calendarId: result.calendarId,
            eventCount: eventsWithCalendarId.length,
          });
        }
      });

      log.info(LOG_CATEGORIES.CALENDAR, "Successfully prefetched google events", {
        batchCount: typedResult.events.length,
        totalEvents: typedResult.events.reduce((sum, r) => sum + r.events.length, 0),
      });
      return;
    }

    log.debug(LOG_CATEGORIES.API, "Prefetching route", {
      routeKey: routeConfig.key,
    });

    await queryClient.prefetchQuery({
      queryKey: routeConfig.queryKey(),
      queryFn: () => routeConfig.queryFn(userProfile),
      staleTime: routeConfig.staleTime,
    });

    log.debug(LOG_CATEGORIES.API, "Successfully prefetched route", {
      routeKey: routeConfig.key,
    });
  } catch (error) {
    log.warn(LOG_CATEGORIES.API, "Failed to prefetch route", {
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
        const response = await agentApi.getChatHistory(conversationId);
        if (!response.success) {
          throw new Error(response.error ?? "Failed to fetch chat history");
        }
        return {
          messages: response.messages ?? [],
          conversation: response.conversation,
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
 * Executes all route prefetches in parallel, then prefetches chat histories
 */
export async function prefetchAllInitialData(params: PrefetchAllParams): Promise<void> {
  const { user, queryClient } = params;

  const isAgent = user.is_agent ?? false;
  log.info(LOG_CATEGORIES.API, "Starting initial data prefetch", {
    userId: user.id,
    isAgent,
  });

  prefetchRemoteImage(user.profile_picture_url);

  const routes = getInitialLoadRoutes(user);
  log.debug(LOG_CATEGORIES.API, "Routes to prefetch", {
    routeCount: routes.length,
    routeKeys: routes.map((r) => r.key),
  });

  // Execute all prefetches in parallel
  const prefetchPromises = routes.map((routeConfig) =>
    prefetchRoute({ routeConfig, userProfile: user, queryClient })
  );

  try {
    const results = await Promise.allSettled(prefetchPromises);
    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    log.info(LOG_CATEGORIES.API, "Initial route prefetch completed", {
      total: routes.length,
      succeeded,
      failed,
    });

    // After conversations are loaded, prefetch chat history for each conversation
    await prefetchChatHistories(queryClient);
  } catch (error) {
    // Don't throw - allow app to continue even if some prefetches fail
    log.error(LOG_CATEGORIES.API, "Error during initial data prefetch", error);
  }
}
