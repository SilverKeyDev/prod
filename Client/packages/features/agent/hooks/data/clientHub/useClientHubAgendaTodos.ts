import { useCallback, useMemo } from "react";

import type { AgendaTodoDTO } from "packages/features/calendar/types/agenda";
import { useDocumentsData } from "packages/features/documents";
import {
  completedSigningAgendaTodosForViewer,
  pendingSigningAgendaTodosAsClient,
} from "packages/hooks/data/agenda/signingAgendaFromDocuments";
import { log, LOG_CATEGORIES } from "packages/logger";

import { mapTodosToAgendaDTO } from "@/features/agent/utils/mapTodosToAgendaDTO";

import { useAgentTodos } from "./useAgentTodos";

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
