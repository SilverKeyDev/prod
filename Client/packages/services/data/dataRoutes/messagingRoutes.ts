import { agentApi } from "packages/config/http/api";
import { queryKeys } from "packages/config/query/keys";
import type { RouteConfig } from "packages/services/data/dataRouteTypes";
import type { UserProfile } from "packages/types";

export const messagingRoutes = {
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
    pollingInterval: 45000,
    pollingIntervalActive: 8000,
    staleTime: 0,
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
    pollingInterval: 10 * 1000,
    staleTime: 0,
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
    shouldPoll: true,
    pollingInterval: 60 * 1000,
    pollingIntervalActive: 15000,
    staleTime: 30 * 1000,
    userType: "all",
    initialLoad: true,
  },
} as const satisfies Record<string, RouteConfig>;
