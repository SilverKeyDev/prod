import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TodoItem } from "@/features/agent/api/agent";
import { agentApi } from "@/features/agent/api/agent";

import { useAgentTodos } from "./useAgentTodos";

vi.mock("@/features/agent/api/agent", () => ({
  agentApi: {
    getTodos: vi.fn(),
    updateTodo: vi.fn(),
    createTodo: vi.fn(),
  },
}));

vi.mock("packages/store", () => ({
  useAuthStore: (selector: (s: { isAuthenticated: boolean; authReady: boolean }) => unknown) =>
    selector({ isAuthenticated: true, authReady: true }),
}));

vi.mock("packages/hooks/ui", () => ({
  showErrorToast: vi.fn(),
}));

const todo: TodoItem = {
  id: "todo-1",
  title: "Follow up",
  completed: false,
  client_id: "client-1",
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
};

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("useAgentTodos", () => {
  beforeEach(() => {
    vi.mocked(agentApi.getTodos).mockReset();
    vi.mocked(agentApi.updateTodo).mockReset();
  });

  it("fetches todos for authenticated users", async () => {
    vi.mocked(agentApi.getTodos).mockResolvedValue({
      success: true,
      todos: [todo],
    });

    const { result } = renderHook(() => useAgentTodos(false), { wrapper });

    await waitFor(() => {
      expect(result.current.todos).toEqual([todo]);
    });
    expect(agentApi.getTodos).toHaveBeenCalledWith(false);
  });

  it("updateTodo toggles completion via API", async () => {
    vi.mocked(agentApi.getTodos).mockResolvedValue({ success: true, todos: [todo] });
    vi.mocked(agentApi.updateTodo).mockResolvedValue({
      success: true,
      todo: { ...todo, completed: true },
    });

    const { result } = renderHook(() => useAgentTodos(false), { wrapper });
    await waitFor(() => expect(result.current.todos).toHaveLength(1));

    await result.current.updateTodo("todo-1", { completed: true });
    expect(agentApi.updateTodo).toHaveBeenCalledWith("todo-1", { completed: true });
  });
});
