import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import { agentApi } from "../../../config/api";
import { queryKeys } from "../../../config/query/keys";
import { useAuthStore } from "../../../store/auth.slice";
import type {
  TodoItem,
  CreateTodoRequest,
  UpdateTodoRequest,
} from "../../../config/api";

export type UseAgentTodosReturn = {
  todos: TodoItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createTodo: (data: CreateTodoRequest) => Promise<TodoItem | null>;
  updateTodo: (id: string, data: UpdateTodoRequest) => Promise<TodoItem | null>;
  isCreating: boolean;
  isUpdating: boolean;
};

/**
 * Hook to fetch and manage agent todos
 */
export function useAgentTodos(includeCompleted = false): UseAgentTodosReturn {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);
  const isAgent = useAuthStore((s) => s.user?.is_agent ?? false);

  // Check cache first when enabled becomes true (cache-first strategy)
  const shouldLoadData = useMemo(
    () => authReady && isAuthenticated && isAgent,
    [authReady, isAuthenticated, isAgent],
  );

  // Fetch todos
  const {
    data: todosResponse,
    isLoading,
    error,
    refetch: refetchTodos,
  } = useQuery({
    queryKey: queryKeys.agent.todos(includeCompleted),
    queryFn: async () => {
      const response = await agentApi.getTodos(includeCompleted);
      if (!response.success) {
        throw new Error(response.error ?? "Failed to fetch todos");
      }
      return response.todos ?? [];
    },
    enabled: shouldLoadData,
    // Use placeholderData function to check cache reactively when enabled changes
    // Note: Only use cached data if we're querying with includeCompleted=false (what's prefetched)
    placeholderData: () => {
      if (includeCompleted === false) {
        return queryClient.getQueryData<TodoItem[]>(
          queryKeys.agent.todos(false),
        );
      }
      return undefined;
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    refetchOnMount: false,
  });

  // Create todo mutation
  const createTodoMutation = useMutation({
    mutationFn: async (data: CreateTodoRequest) => {
      const response = await agentApi.createTodo(data);
      if (!response.success) {
        throw new Error(response.error ?? "Failed to create todo");
      }
      return response.todo ?? null;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.agent.all });
    },
  });

  // Update todo mutation
  const updateTodoMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateTodoRequest;
    }) => {
      const response = await agentApi.updateTodo(id, data);
      if (!response.success) {
        throw new Error(response.error ?? "Failed to update todo");
      }
      return response.todo ?? null;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.agent.all });
    },
  });

  const refetch = useCallback(async () => {
    await refetchTodos();
  }, [refetchTodos]);

  const createTodo = useCallback(
    async (data: CreateTodoRequest) => {
      return await createTodoMutation.mutateAsync(data);
    },
    [createTodoMutation],
  );

  const updateTodo = useCallback(
    async (id: string, data: UpdateTodoRequest) => {
      return await updateTodoMutation.mutateAsync({ id, data });
    },
    [updateTodoMutation],
  );

  return {
    todos: todosResponse ?? [],
    isLoading,
    error: error?.message ?? null,
    refetch,
    createTodo,
    updateTodo,
    isCreating: createTodoMutation.isPending,
    isUpdating: updateTodoMutation.isPending,
  };
}
