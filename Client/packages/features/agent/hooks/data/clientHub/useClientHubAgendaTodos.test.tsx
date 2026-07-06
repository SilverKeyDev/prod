import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import type { TodoItem } from "@/features/agent/api/agent";

import { useClientHubAgendaTodos } from "./useClientHubAgendaTodos";

const clientTodo: TodoItem = {
  id: "todo-1",
  title: "Call client",
  completed: false,
  client_id: "client-1",
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
};

const otherClientTodo: TodoItem = {
  ...clientTodo,
  id: "todo-2",
  client_id: "client-2",
};

const completedClientTodo: TodoItem = {
  ...clientTodo,
  id: "todo-done",
  completed: true,
  title: "Done for client",
};

const updateTodo = vi.fn();
const deleteTodo = vi.fn();

vi.mock("./useAgentTodos", () => ({
  useAgentTodos: () => ({
    todos: [clientTodo, otherClientTodo, completedClientTodo],
    updateTodo,
    deleteTodo,
  }),
}));

vi.mock("packages/features/documents", () => ({
  useDocumentsData: () => ({ documents: [] }),
}));

vi.mock("packages/features/documents/hooks/data/agenda/signingAgendaFromDocuments", () => ({
  pendingSigningAgendaTodosAsClient: () => [],
  completedSigningAgendaTodosForViewer: () => [],
}));

vi.mock("@/features/agent/utils/mapTodosToAgendaDTO", () => ({
  mapTodosToAgendaDTO: (todos: TodoItem[]) =>
    todos.map((t) => ({ id: t.id, title: t.title, completed: t.completed })),
}));

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("useClientHubAgendaTodos", () => {
  it("returns agenda todos filtered to the given client including completed", async () => {
    const { result } = renderHook(() => useClientHubAgendaTodos("client-1"), { wrapper });

    await waitFor(() => {
      expect(result.current.agendaTodos).toHaveLength(2);
    });
    expect(result.current.agendaTodos.map((t) => t.id).sort()).toEqual(["todo-1", "todo-done"]);
  });

  it("onToggleAgendaTodo updates todo completion for matching client todo", async () => {
    updateTodo.mockResolvedValue({ ...clientTodo, completed: true });

    const { result } = renderHook(() => useClientHubAgendaTodos("client-1"), { wrapper });
    await waitFor(() => expect(result.current.agendaTodos).toHaveLength(2));

    await result.current.onToggleAgendaTodo("todo-1");
    expect(updateTodo).toHaveBeenCalledWith("todo-1", { completed: true });
  });
});
