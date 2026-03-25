import { useEffect, useMemo } from "react";

import { useQueryClient } from "@tanstack/react-query";

import {
  type AgendaTodoDTO,
  Calendar,
  filterCalendarsToAgentOwned,
  findSilverKeyCalendar,
  UpcomingEvents,
} from "packages/features/calendar";
import { useIsAgent } from "packages/features/homeauth";
import { submitAgentAgendaTodo } from "packages/hooks/data/agentAgendaTodoSubmit";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useNavigation } from "packages/navigation";
import { useUIStore } from "packages/store";
import type { UIState } from "packages/store/ui.slice";
import { Box } from "packages/ui/components/primitives";

import { useAgentTodos } from "@/features/agent/hooks/data/useAgentTodos";
import type { TodoItem, TodoPriority } from "@/features/agent/types/agent";
import { useCalendarOAuthCallback } from "@/features/calendar/hooks/data";
import { useGoogleCalendarStoreIntegration } from "@/features/calendar/hooks/store/useGoogleCalendarStoreIntegration";

import { AgentAgendaPlusButton } from "./AgentAgendaPlusButton";
import ClientHubScreen from "./ClientHub/ClientHubScreen";
import ClientList from "./ClientList/ClientList";

type DashboardFeatureProps = {
  setMobileHeaderActions?: React.Dispatch<React.SetStateAction<React.ReactNode | null>>;
};

function mapTodosToAgendaDTO(todos: TodoItem[]): AgendaTodoDTO[] {
  return todos.map((t) => ({
    id: t.id,
    title: t.title,
    due_date: t.due_date,
    completed: t.completed,
    priority: t.priority,
  }));
}

export function DashboardFeature({ setMobileHeaderActions }: DashboardFeatureProps) {
  const { navigateToPath, getCurrentRoute } = useNavigation();
  const isAgent = useIsAgent();
  const queryClient = useQueryClient();
  const enqueueToast = useUIStore((s: UIState) => s.enqueueToast);
  useCalendarOAuthCallback({ enqueueToast });

  const { todos, createTodo, updateTodo } = useAgentTodos(false);
  const { isConnected, calendars } = useGoogleCalendarStoreIntegration();

  const scopedCalendars = useMemo(() => {
    if (!isAgent || !calendars?.length) {
      return calendars ?? [];
    }
    return filterCalendarsToAgentOwned(calendars);
  }, [isAgent, calendars]);

  const silverKeyCalendar = useMemo(() => findSilverKeyCalendar(scopedCalendars), [scopedCalendars]);

  const agendaTodos = useMemo<AgendaTodoDTO[] | undefined>(() => {
    if (!isAgent) {
      return undefined;
    }
    return mapTodosToAgendaDTO(todos);
  }, [isAgent, todos]);

  const handleToggleAgendaTodo = async (id: string) => {
    if (!isAgent) {
      return;
    }
    const todo = todos.find((t) => t.id === id);
    if (!todo) {
      return;
    }
    try {
      await updateTodo(id, { completed: !todo.completed });
    } catch (error) {
      log.error(LOG_CATEGORIES.DASHBOARD, "Failed to update todo", error);
    }
  };

  const defaultCalendarId = silverKeyCalendar?.id ?? scopedCalendars[0]?.id ?? null;
  const useCalendarEventForTodo = Boolean(
    isConnected && scopedCalendars.length > 0 && defaultCalendarId
  );

  const handleSubmitAgendaTodo = async (payload: {
    title: string;
    priority: TodoPriority | null;
    deadlineDate: string | null;
  }) => {
    if (!isAgent) {
      return;
    }
    try {
      await submitAgentAgendaTodo(payload, {
        useCalendarEvent: useCalendarEventForTodo,
        defaultCalendarId,
        createTodo,
        queryClient,
      });
    } catch (error) {
      log.error(LOG_CATEGORIES.DASHBOARD, "Failed to create todo", error);
    }
  };

  const handleUpdateAgendaTodoPriority = async (id: string, priority: TodoPriority | null) => {
    if (!isAgent) {
      return;
    }
    try {
      await updateTodo(id, { priority });
    } catch (error) {
      log.error(LOG_CATEGORIES.DASHBOARD, "Failed to update todo priority", error);
    }
  };

  const headerActions = isAgent ? (
    <AgentAgendaPlusButton onSubmitAgentTodo={handleSubmitAgendaTodo} />
  ) : undefined;

  useEffect(() => {
    if (setMobileHeaderActions) {
      setMobileHeaderActions(null);
    }
    return () => {
      if (setMobileHeaderActions) {
        setMobileHeaderActions(null);
      }
    };
  }, [setMobileHeaderActions]);

  const handleClientClick = (clientId: string) => {
    navigateToPath(`/dashboard/client/${clientId}`);
  };

  const pathMatch = getCurrentRoute().pathname.match(/^\/dashboard\/client\/(.+)$/);
  const clientIdFromPath = pathMatch ? pathMatch[1] : null;

  if (clientIdFromPath) {
    return <ClientHubScreen clientId={clientIdFromPath} />;
  }

  return (
    <Box className="flex flex-col gap-6 sm:gap-8">
      <UpcomingEvents
        suppressConnectionPrompt
        sectionTitle="Upcoming"
        agendaTodos={agendaTodos}
        onToggleAgendaTodo={handleToggleAgendaTodo}
        onUpdateAgendaTodoPriority={handleUpdateAgendaTodoPriority}
        canEditAgendaTodos={isAgent}
        headerActions={headerActions}
        ownedCalendarsOnly={isAgent}
      />

      {isAgent ? <ClientList onClientClick={handleClientClick} /> : null}

      <Calendar ownedCalendarsOnly={isAgent} />
    </Box>
  );
}
