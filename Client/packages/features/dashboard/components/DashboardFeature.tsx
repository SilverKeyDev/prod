import { useEffect, useMemo } from "react";

import {
  type AgendaTodoDTO,
  Calendar,
  findSilverKeyCalendar,
  UpcomingEvents,
} from "packages/features/calendar";
import { useIsAgent } from "packages/features/homeauth";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useNavigation } from "packages/navigation";
import { useUIStore } from "packages/store";
import type { UIState } from "packages/store/ui.slice";
import { Box } from "packages/ui/components/primitives";
import { dateNow } from "packages/utils/date";

import { useAgentTodos } from "@/features/agent/hooks/data/useAgentTodos";
import type { TodoItem, TodoPriority, TodoType } from "@/features/agent/types/agent";
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
  const enqueueToast = useUIStore((s: UIState) => s.enqueueToast);
  useCalendarOAuthCallback({ enqueueToast });

  const { todos, createTodo, updateTodo } = useAgentTodos(false);
  const { isConnected, calendars } = useGoogleCalendarStoreIntegration();

  const silverKeyCalendar = useMemo(
    () => findSilverKeyCalendar(calendars ?? []),
    [calendars]
  );

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

  const handleCreateAgendaTodo = async (title: string, priority: TodoPriority, type: TodoType) => {
    if (!isAgent) {
      return;
    }
    try {
      const dueDate = dateNow().endOf("day");
      await createTodo({
        title,
        due_date: dueDate.toISOString(),
        priority,
        type,
      });
    } catch (error) {
      log.error(LOG_CATEGORIES.DASHBOARD, "Failed to create todo", error);
    }
  };

  const handleUpdateAgendaTodoPriority = async (id: string, priority: TodoPriority) => {
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
    <AgentAgendaPlusButton
      calendars={calendars ?? []}
      defaultCalendarId={silverKeyCalendar?.id ?? calendars?.[0]?.id ?? null}
      canCreateEvent={Boolean(isConnected && (calendars?.length ?? 0) > 0)}
      onCreateTodo={handleCreateAgendaTodo}
    />
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
      />

      {isAgent ? <ClientList onClientClick={handleClientClick} /> : null}

      <Calendar />
    </Box>
  );
}
