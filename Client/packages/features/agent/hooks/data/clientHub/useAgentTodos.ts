import { useCallback, useMemo } from "react";

import { type QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import { showErrorToast } from "packages/hooks/ui";
import { log } from "packages/logger";
import { useAuthStore } from "packages/store";
import { resolveApiResultErrorMessage } from "packages/utils/core/errorHandling";

import type { CreateTodoRequest, TodoItem, UpdateTodoRequest } from "@/features/agent/api/agent";
import { agentApi } from "@/features/agent/api/agent";

const TODO_LIST_QUERY_FLAGS = [false, true] as const;

type TodoCacheSnapshot = Array<{
  key: ReturnType<typeof queryKeys.agent.todos>;
  data: TodoItem[] | undefined;
}>;

function snapshotTodoCaches(queryClient: QueryClient): TodoCacheSnapshot {
  return TODO_LIST_QUERY_FLAGS.map((includeCompleted) => ({
    key: queryKeys.agent.todos(includeCompleted),
    data: queryClient.getQueryData<TodoItem[]>(queryKeys.agent.todos(includeCompleted)),
  }));
}

function restoreTodoCaches(queryClient: QueryClient, snapshots: TodoCacheSnapshot) {
  for (const { key, data } of snapshots) {
    queryClient.setQueryData(key, data);
  }
}

function writeTodoToCaches(queryClient: QueryClient, todo: TodoItem) {
  for (const includeCompleted of TODO_LIST_QUERY_FLAGS) {
    const key = queryKeys.agent.todos(includeCompleted);
    queryClient.setQueryData<TodoItem[]>(key, (old) => {
      if (!old) {
        return old;
      }
      const index = old.findIndex((item) => item.id === todo.id);
      if (!includeCompleted && todo.completed) {
        return index === -1 ? old : old.filter((item) => item.id !== todo.id);
      }
      if (index === -1) {
        return includeCompleted ? [...old, todo] : old;
      }
      const next = [...old];
      next[index] = todo;
      return next;
    });
  }
}

function applyOptimisticTodoPatch(queryClient: QueryClient, id: string, patch: UpdateTodoRequest) {
  for (const includeCompleted of TODO_LIST_QUERY_FLAGS) {
    const key = queryKeys.agent.todos(includeCompleted);
    queryClient.setQueryData<TodoItem[]>(key, (old) => {
      if (!old) {
        return old;
      }
      const index = old.findIndex((item) => item.id === id);
      if (index === -1) {
        return old;
      }
      const merged = { ...old[index], ...patch };
      if (!includeCompleted && merged.completed) {
        return old.filter((item) => item.id !== id);
      }
      const next = [...old];
      next[index] = merged;
      return next;
    });
  }
}

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
  // Check cache first when enabled becomes true (cache-first strategy)
  const shouldLoadData = useMemo(() => authReady && isAuthenticated, [authReady, isAuthenticated]);

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
        throw new Error(resolveApiResultErrorMessage(response, "Failed to fetch todos"));
      }
      return response.todos ?? [];
    },
    enabled: shouldLoadData,
    // Use placeholderData function to check cache reactively when enabled changes
    // Note: Only use cached data if we're querying with includeCompleted=false (what's prefetched)
    placeholderData: () => {
      return queryClient.getQueryData<TodoItem[]>(queryKeys.agent.todos(includeCompleted));
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    refetchOnMount: false,
  });

  // Create todo mutation
  const createTodoMutation = useMutation({
    mutationFn: async (data: CreateTodoRequest) => {
      const response = await agentApi.createTodo(data);
      if (!response.success) {
        throw new Error(resolveApiResultErrorMessage(response, "Failed to create todo"));
      }
      return response.todo ?? null;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.agent.all });
    },
    onError: (error) => {
      log.error("ERRORS", "Create todo failed", error);
      showErrorToast("Failed to create todo. Please try again.");
    },
  });

  // Update todo mutation
  const updateTodoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTodoRequest }) => {
      const response = await agentApi.updateTodo(id, data);
      if (!response.success) {
        throw new Error(resolveApiResultErrorMessage(response, "Failed to update todo"));
      }
      return response.todo ?? null;
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.agent.todos() });
      const snapshots = snapshotTodoCaches(queryClient);
      applyOptimisticTodoPatch(queryClient, id, data);
      return { snapshots };
    },
    onSuccess: (serverTodo) => {
      if (serverTodo) {
        writeTodoToCaches(queryClient, serverTodo);
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.agent.notificationCounter() });
    },
    onError: (error, _variables, context) => {
      if (context?.snapshots) {
        restoreTodoCaches(queryClient, context.snapshots);
      }
      log.error("ERRORS", "Update todo failed", error);
      showErrorToast("Failed to update todo. Please try again.");
    },
  });

  const refetch = useCallback(async () => {
    await refetchTodos();
  }, [refetchTodos]);

  const createTodo = useCallback(
    async (data: CreateTodoRequest) => {
      return await createTodoMutation.mutateAsync(data);
    },
    [createTodoMutation]
  );

  const updateTodo = useCallback(
    async (id: string, data: UpdateTodoRequest) => {
      return await updateTodoMutation.mutateAsync({ id, data });
    },
    [updateTodoMutation]
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
