import { QueryClient } from "@tanstack/react-query";

import type { AgentConversation, GoogleCalendar } from "packages/config/http/api";
import { agentApi } from "packages/config/http/api";
import { queryKeys } from "packages/config/query/keys";
import { INITIAL_CHAT_HISTORY_LIMIT } from "packages/features/messaging/hooks/data/useAgentChats";
import { log } from "packages/logger";
import type { UserProfile } from "packages/types";
import { prefetchRemoteImage } from "packages/utils/product/media/prefetchRemoteImage";

import { DATA_ROUTES, getInitialLoadRoutes } from "./dataConfig";

/**
 * @deprecated This service class is no longer used. Initial data loading logic
 * has been moved directly into useDataInitialization hook to comply with
 * architecture rules (hooks/data should not import business logic services).
 *
 * See: Client/packages/hooks/data/polling/useDataInitialization.ts
 *
 * Initial data loader - prefetches all page data on login
 * Called once after successful authentication
 */
export class InitialDataLoader {
  constructor(private queryClient: QueryClient) {}

  /**
   * Prefetch all data for all pages based on user type
   */
  async prefetchAllData(user: UserProfile | null): Promise<void> {
    if (!user) {
      log.warn("API", "Prefetch called with null user");
      return;
    }

    const isAgent = (user.roles ?? []).includes("agent");
    log.info("API", "Starting initial data prefetch", {
      userId: user.id,
      isAgent,
    });

    prefetchRemoteImage(user.profile_picture_url);

    const routes = getInitialLoadRoutes(user);
    log.debug("API", "Routes to prefetch", {
      routeCount: routes.length,
      routeKeys: routes.map((r) => r.key),
    });

    // Execute all prefetches in parallel
    const prefetchPromises = routes.map((route) => this.prefetchRoute(route, user));

    try {
      const results = await Promise.allSettled(prefetchPromises);
      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      log.info("API", "Initial route prefetch completed", {
        total: routes.length,
        succeeded,
        failed,
      });

      // After conversations are loaded, prefetch chat history for each conversation
      await this.prefetchChatHistories();

      // Note: googleEvents is now handled in prefetchRoute above
      // No need for separate prefetchGoogleEvents call
    } catch (error) {
      // Don't throw - allow app to continue even if some prefetches fail
      log.error(`API.${error}`, "Error during initial data prefetch");
    }
  }

  /**
   * Prefetch a single route using its configuration
   */
  private async prefetchRoute(
    route: (typeof DATA_ROUTES)[keyof typeof DATA_ROUTES],
    user: UserProfile | null
  ): Promise<void> {
    try {
      // Handle googleEvents specially - prefetch events per calendar with proper query keys
      // This matches the exact query structure used by useCalendarEvents hook
      if (route.key === "googleEvents") {
        log.debug("CALENDAR", "Prefetching google events (primary + SilverKey metadata)");

        const prefetchResult = await route.queryFn(user);

        if (!prefetchResult || Array.isArray(prefetchResult)) {
          log.debug("CALENDAR", "No google events to prefetch (user not connected or no data)");
          return;
        }

        if (
          typeof prefetchResult !== "object" ||
          !("events" in prefetchResult) ||
          !Array.isArray(prefetchResult.events)
        ) {
          log.debug("CALENDAR", "Invalid prefetch result structure", {
            resultType: typeof prefetchResult,
            hasEvents:
              prefetchResult && typeof prefetchResult === "object" && "events" in prefetchResult,
          });
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
          this.queryClient.setQueryData(
            queryKeys.scheduling.silverKeyCalendar(),
            typedResult.silverKeyCalendar
          );
          log.info("CALENDAR", "Stored SilverKey calendar in cache", {
            calendarId: typedResult.silverKeyCalendar.id,
          });
        }

        // Set each calendar's events directly in cache using setQueryData
        // This avoids any refetch behavior - data is only set on initial mount
        // This matches the exact structure used by CalendarView (which reads from cache)
        typedResult.events.forEach((result) => {
          const queryKey = queryKeys.googleCalendar.eventsList({
            calendarId: result.calendarId,
            timeMin: result.timeMin,
            timeMax: result.timeMax,
          });

          // Use setQueryData to directly set cache without any query/refetch behavior
          // Ensure calendarId is included in each event when storing to cache
          // This matches the exact return structure used by CalendarView
          const events = result.events as unknown[] as Array<{
            calendarId?: string;
          }>;
          const eventsWithCalendarId = events.map((event) => ({
            ...event,
            calendarId: event.calendarId || result.calendarId,
          }));

          // Set data directly in cache - this won't trigger any refetches
          this.queryClient.setQueryData(queryKey, eventsWithCalendarId);

          // Log cache storage details (only for non-empty calendars to reduce noise)
          if (eventsWithCalendarId.length > 0) {
            log.debug("CALENDAR", "Stored Google Calendar events in cache", {
              calendarId: result.calendarId,
              eventCount: eventsWithCalendarId.length,
            });
          }
        });

        // No need to wait - setQueryData is synchronous

        log.info("CALENDAR", "Successfully prefetched google events", {
          batchCount: typedResult.events.length,
          totalEvents: typedResult.events.reduce(
            (sum, r) => sum + (r.events as unknown[]).length,
            0
          ),
        });
        return;
      }

      log.debug("API", "Prefetching route", {
        routeKey: route.key,
      });

      await this.queryClient.prefetchQuery({
        queryKey: route.queryKey(),
        queryFn: () => route.queryFn(user),
        staleTime: route.staleTime,
      });

      log.debug("API", "Successfully prefetched route", {
        routeKey: route.key,
      });
    } catch (error) {
      // Log error but don't throw - individual prefetch failures shouldn't block others
      log.warn("API", "Failed to prefetch route", {
        routeKey: route.key,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Prefetch chat history for all conversations
   * This ensures messaging opens instantly from cache
   */
  private async prefetchChatHistories(): Promise<void> {
    try {
      // Get conversations from cache
      const conversations = this.queryClient.getQueryData<AgentConversation[]>(
        queryKeys.agent.conversations()
      );

      if (!conversations || conversations.length === 0) {
        return;
      }

      // Prefetch chat history for each conversation in parallel
      const historyPromises = conversations.map((conversation) =>
        this.prefetchChatHistory(conversation.id)
      );

      // Use Promise.allSettled to continue even if some fail
      await Promise.allSettled(historyPromises);
    } catch {
      // Don't throw - this is a performance optimization, not critical
    }
  }

  /**
   * Prefetch chat history for a single conversation
   */
  private async prefetchChatHistory(conversationId: string): Promise<void> {
    try {
      // Check if already cached
      const cached = this.queryClient.getQueryData(queryKeys.agent.history(conversationId));

      if (cached) {
        // Already cached, skip
        return;
      }

      // Prefetch chat history
      await this.queryClient.prefetchQuery({
        queryKey: queryKeys.agent.history(conversationId),
        queryFn: async () => {
          const response = await agentApi.getChatHistory(conversationId, {
            limit: INITIAL_CHAT_HISTORY_LIMIT,
          });
          if (!response.success) {
            throw new Error(response.error ?? "Failed to fetch chat history");
          }
          return {
            messages: response.messages ?? [],
            conversation: response.conversation,
            has_more_older: response.has_more_older,
            has_more_newer: response.has_more_newer,
          };
        },
        staleTime: 3 * 60 * 1000, // 3 minutes - same as conversations
      });
    } catch {
      // Silently fail - individual failures shouldn't block others
    }
  }
}
