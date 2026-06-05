import { agentApi } from "packages/config/http/api";
import { queryKeys } from "packages/config/query/keys";
import { throwUnlessApiSuccess } from "packages/services/data/apiRouteResponse";
import type { RouteConfig } from "packages/services/data/dataRouteTypes";

export const agentRoutes = {
  agentClients: {
    key: "agentClients",
    queryKey: () => queryKeys.agent.clients(),
    queryFn: async () => {
      const response = await agentApi.getClients();
      throwUnlessApiSuccess(response, "Failed to fetch clients");
      return response.clients ?? [];
    },
    shouldPoll: true,
    pollingInterval: 3 * 60 * 1000,
    pollingIntervalActive: 15000,
    staleTime: 30 * 1000,
    userType: "agent",
    initialLoad: true,
  },

  agentTodos: {
    key: "agentTodos",
    queryKey: () => queryKeys.agent.todos(true),
    queryFn: async () => {
      const response = await agentApi.getTodos(true);
      throwUnlessApiSuccess(response, "Failed to fetch todos");
      return response.todos ?? [];
    },
    shouldPoll: true,
    pollingInterval: 60 * 1000,
    staleTime: 1 * 60 * 1000,
    userType: "agent",
    initialLoad: true,
  },
} as const satisfies Record<string, RouteConfig>;
