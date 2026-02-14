import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../../../store/auth.slice";
import { agentApi } from "../../../config/api";
import { queryKeys } from "../../../config/query/keys";
import type {
  AgentSearchResult,
  ClientSearchResult,
} from "../../../config/api";

export type UseAgentSearchReturn = {
  agents: AgentSearchResult[];
  isLoading: boolean;
  error: string | null;
};

export type UseClientSearchReturn = {
  clients: ClientSearchResult[];
  isLoading: boolean;
  error: string | null;
};

/**
 * Hook to search for agents (for clients) with debouncing
 */
export function useAgentSearch(query: string, enabled: boolean = true) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Debounce search query
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query]);

  const {
    data: agentsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.agent.all.concat(["search-agents", debouncedQuery]),
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        return [];
      }
      const response = await agentApi.searchAgents(debouncedQuery);
      if (!response.success) {
        throw new Error(response.error ?? "Failed to search agents");
      }
      return response.agents ?? [];
    },
    enabled:
      enabled && authReady && isAuthenticated && debouncedQuery.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
  });

  return {
    agents: agentsData ?? [],
    isLoading,
    error: error?.message ?? null,
  };
}

/**
 * Hook to search for clients (for agents) with debouncing
 */
export function useClientSearch(query: string, enabled: boolean = true) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Debounce search query
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query]);

  const {
    data: clientsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.agent.all.concat(["search-clients", debouncedQuery]),
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        return [];
      }
      const response = await agentApi.searchClients(debouncedQuery);
      if (!response.success) {
        throw new Error(response.error ?? "Failed to search clients");
      }
      return response.clients ?? [];
    },
    enabled:
      enabled && authReady && isAuthenticated && debouncedQuery.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
  });

  return {
    clients: clientsData ?? [],
    isLoading,
    error: error?.message ?? null,
  };
}
