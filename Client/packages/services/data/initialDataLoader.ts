import { QueryClient } from "@tanstack/react-query";
import type { UserProfile } from "../../schemas/user";
import { log, LOG_CATEGORIES } from "../../../logger";
import { getInitialLoadRoutes, DATA_ROUTES } from "./dataConfig";
import { queryKeys } from "../../config/query/keys";
import { agentApi } from "../../config/api/agent";
import type { AgentConversation } from "../../config/api/agent";

/**
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
      log.warn(LOG_CATEGORIES.INITIAL_API_CALLS, "No user provided, skipping prefetch");
      return;
    }

    const isAgent = user.is_agent ?? false;
    const routes = getInitialLoadRoutes(user);

    log.info(LOG_CATEGORIES.INITIAL_API_CALLS, "🚀 Starting data prefetch", {
      userId: user.id,
      isAgent,
      routeCount: routes.length,
    });

    // Execute all prefetches in parallel
    const prefetchPromises = routes.map((route) => this.prefetchRoute(route, user));

    try {
      await Promise.allSettled(prefetchPromises);
      log.info(LOG_CATEGORIES.INITIAL_API_CALLS, "✅ All prefetches completed");
      
      // After conversations are loaded, prefetch chat history for each conversation
      await this.prefetchChatHistories();
    } catch (error) {
      log.error(LOG_CATEGORIES.INITIAL_API_CALLS, "❌ Some prefetches failed", error);
      // Don't throw - allow app to continue even if some prefetches fail
    }
  }

  /**
   * Prefetch a single route using its configuration
   */
  private async prefetchRoute(
    route: typeof DATA_ROUTES[keyof typeof DATA_ROUTES],
    user: UserProfile | null
  ): Promise<void> {
    try {
      await this.queryClient.prefetchQuery({
        queryKey: route.queryKey(),
        queryFn: () => route.queryFn(user),
        staleTime: route.staleTime,
      });
      log.info(LOG_CATEGORIES.INITIAL_API_CALLS, `✅ ${route.key} prefetched`);
    } catch (error) {
      log.error(LOG_CATEGORIES.INITIAL_API_CALLS, `❌ ${route.key} prefetch failed`, error);
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
        log.debug(LOG_CATEGORIES.INITIAL_API_CALLS, "No conversations found in cache, skipping chat history prefetch");
        return;
      }

      log.info(LOG_CATEGORIES.INITIAL_API_CALLS, "📨 Prefetching chat histories", {
        conversationCount: conversations.length,
      });

      // Prefetch chat history for each conversation in parallel
      const historyPromises = conversations.map((conversation) =>
        this.prefetchChatHistory(conversation.id)
      );

      // Use Promise.allSettled to continue even if some fail
      const results = await Promise.allSettled(historyPromises);
      
      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      log.info(LOG_CATEGORIES.INITIAL_API_CALLS, "✅ Chat histories prefetched", {
        successful,
        failed,
        total: conversations.length,
      });
    } catch (error) {
      log.error(LOG_CATEGORIES.INITIAL_API_CALLS, "❌ Failed to prefetch chat histories", error);
      // Don't throw - this is a performance optimization, not critical
    }
  }

  /**
   * Prefetch chat history for a single conversation
   */
  private async prefetchChatHistory(conversationId: string): Promise<void> {
    try {
      // Check if already cached
      const cached = this.queryClient.getQueryData(
        queryKeys.agent.history(conversationId)
      );
      
      if (cached) {
        // Already cached, skip
        return;
      }

      // Prefetch chat history
      await this.queryClient.prefetchQuery({
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
        staleTime: 3 * 60 * 1000, // 3 minutes - same as conversations
      });
    } catch (error) {
      // Log but don't throw - individual failures shouldn't block others
      log.debug(LOG_CATEGORIES.INITIAL_API_CALLS, `Failed to prefetch chat history for conversation ${conversationId}`, error);
    }
  }
}
