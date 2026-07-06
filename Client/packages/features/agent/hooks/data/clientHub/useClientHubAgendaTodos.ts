import { useCallback, useMemo } from "react";

import type { UpdateTodoRequest } from "packages/features/agent/api/agent";
import type { AgendaTodoDTO } from "packages/features/calendar/types/agenda";
import { useDocumentsData } from "packages/features/documents";
import {
  completedSigningAgendaTodosForViewer,
  pendingSigningAgendaTodosAsClient,
} from "packages/features/documents/hooks/data/agenda/signingAgendaFromDocuments";
import { log } from "packages/logger";

import { mapTodosToAgendaDTO } from "@/features/agent/utils/mapTodosToAgendaDTO";

import { useAgentTodos } from "./useAgentTodos";

/**
 * Agenda to-dos for an agent viewing a client hub: same merge as the client's dashboard
 * (client-scoped todos + signing items as the client would see them).
 */
export function useClientHubAgendaTodos(clientId: string): {
  agendaTodos: AgendaTodoDTO[];
  onToggleAgendaTodo: (id: string) => Promise<void>;
  updateAgendaTodo: (id: string, data: UpdateTodoRequest) => Promise<void>;
  deleteAgendaTodo: (id: string) => Promise<void>;
} {
  const { todos, updateTodo, deleteTodo } = useAgentTodos(true);
  const { documents } = useDocumentsData(clientId);

  const clientTodos = useMemo(
    () => todos.filter((t) => t.client_id === clientId),
    [todos, clientId]
  );

  const agendaTodos = useMemo<AgendaTodoDTO[]>(
    () => [
      ...mapTodosToAgendaDTO(clientTodos),
      ...pendingSigningAgendaTodosAsClient(documents, clientId),
      ...completedSigningAgendaTodosForViewer(documents, clientId),
    ],
    [clientTodos, documents, clientId]
  );

  const onToggleAgendaTodo = useCallback(
    async (id: string) => {
      const todo = clientTodos.find((t) => t.id === id);
      if (!todo) {
        return;
      }
      try {
        await updateTodo(id, { completed: !todo.completed });
      } catch (error) {
        log.error("DASHBOARD", "Failed to update todo", error);
      }
    },
    [clientTodos, updateTodo]
  );

  const updateAgendaTodo = useCallback(
    async (id: string, data: UpdateTodoRequest) => {
      const todo = clientTodos.find((t) => t.id === id);
      if (!todo) {
        return;
      }
      try {
        await updateTodo(id, data);
      } catch (error) {
        log.error("DASHBOARD", "Failed to update client agenda to-do", error);
        throw error;
      }
    },
    [clientTodos, updateTodo]
  );

  const deleteAgendaTodo = useCallback(
    async (id: string) => {
      const todo = clientTodos.find((t) => t.id === id);
      if (!todo) {
        return;
      }
      try {
        await deleteTodo(id);
      } catch (error) {
        log.error("DASHBOARD", "Failed to delete client agenda to-do", error);
        throw error;
      }
    },
    [clientTodos, deleteTodo]
  );

  return { agendaTodos, onToggleAgendaTodo, updateAgendaTodo, deleteAgendaTodo };
}
