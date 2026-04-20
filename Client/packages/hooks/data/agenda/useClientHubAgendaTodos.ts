import { useCallback, useMemo } from "react";

import type { TodoItem } from "packages/features/agent/types/agent";
import type { AgendaTodoDTO } from "packages/features/calendar/types/agenda";
import { useDocumentsData } from "packages/features/documents";
import { log, LOG_CATEGORIES } from "packages/logger";

import { useAgentTodos } from "@/features/agent/hooks/data/useAgentTodos";

import {
  completedSigningAgendaTodosForViewer,
  pendingSigningAgendaTodosAsClient,
} from "./signingAgendaFromDocuments";

function mapTodosToAgendaDTO(todos: TodoItem[]): AgendaTodoDTO[] {
  return todos.map((t) => ({
    id: t.id,
    title: t.title,
    due_date: t.due_date,
    completed: t.completed,
  }));
}

/**
 * Agenda to-dos for an agent viewing a client hub: same merge as the client's dashboard
 * (client-scoped todos + signing items as the client would see them).
 */
export function useClientHubAgendaTodos(clientId: string): {
  agendaTodos: AgendaTodoDTO[];
  onToggleAgendaTodo: (id: string) => Promise<void>;
} {
  const { todos, updateTodo } = useAgentTodos(false);
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
        log.error(LOG_CATEGORIES.DASHBOARD, "Failed to update todo", error);
      }
    },
    [clientTodos, updateTodo]
  );

  return { agendaTodos, onToggleAgendaTodo };
}
