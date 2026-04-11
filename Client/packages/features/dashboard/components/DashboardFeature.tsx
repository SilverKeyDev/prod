import { useEffect, useMemo, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import {
  type AgendaTodoDTO,
  Calendar,
  CreateEventModal,
  filterCalendarsToAgentOwned,
  findSilverKeyCalendar,
  UpcomingEvents,
} from "packages/features/calendar";
import { useIsAgent } from "packages/features/homeauth";
import { submitAgentAgendaTodo } from "packages/hooks/data/agentAgendaTodoSubmit";
import { useSigningTodos } from "packages/hooks/data/useSigningTodos";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useNavigation } from "packages/navigation";
import { useUIStore } from "packages/store";
import type { UIState } from "packages/store/ui.slice";
import Button from "packages/ui/components/button/Button";
import { Box } from "packages/ui/components/primitives";

import { useAgentTodos } from "@/features/agent/hooks/data/useAgentTodos";
import type { TodoItem } from "@/features/agent/types/agent";
import { useCalendarOAuthCallback } from "@/features/calendar/hooks/data";
import { useGoogleCalendarStoreIntegration } from "@/features/calendar/hooks/store/useGoogleCalendarStoreIntegration";

import ClientHubScreen from "./ClientHub/ClientHubScreen";
import ClientList from "./ClientList/ClientList";
import DashboardChecklists from "./DashboardChecklists/DashboardChecklists";

type DashboardFeatureProps = {
  setMobileHeaderActions?: React.Dispatch<
    React.SetStateAction<React.ReactNode | null>
  >;
};

function mapTodosToAgendaDTO(todos: TodoItem[]): AgendaTodoDTO[] {
  return todos.map((t) => ({
    id: t.id,
    title: t.title,
    due_date: t.due_date,
    completed: t.completed,
  }));
}

export function DashboardFeature({
  setMobileHeaderActions,
}: DashboardFeatureProps) {
  const { navigateToPath, getCurrentRoute } = useNavigation();
  const isAgent = useIsAgent();
  const queryClient = useQueryClient();
  const enqueueToast = useUIStore((s: UIState) => s.enqueueToast);
  useCalendarOAuthCallback({ enqueueToast });

  const { todos, createTodo, updateTodo } = useAgentTodos(false);
  const signingTodos = useSigningTodos(isAgent);
  const { isConnected, calendars, refreshEvents } =
    useGoogleCalendarStoreIntegration();
  const [createEventModalOpen, setCreateEventModalOpen] = useState(false);

  const scopedCalendars = useMemo(() => {
    if (!isAgent || !calendars?.length) {
      return calendars ?? [];
    }
    return filterCalendarsToAgentOwned(calendars);
  }, [isAgent, calendars]);

  const silverKeyCalendar = useMemo(
    () => findSilverKeyCalendar(scopedCalendars),
    [scopedCalendars],
  );

  const agendaTodos = useMemo<AgendaTodoDTO[]>(
    () => [...mapTodosToAgendaDTO(todos), ...signingTodos],
    [todos, signingTodos],
  );

  const handleToggleAgendaTodo = async (id: string) => {
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

  const defaultCalendarId =
    silverKeyCalendar?.id ?? scopedCalendars[0]?.id ?? null;

  const canAddGoogleCalendarItem = Boolean(isConnected && defaultCalendarId);
  const showAddButton = isAgent || canAddGoogleCalendarItem || !isAgent;

  const headerActions = showAddButton ? (
    <Box className="flex flex-wrap items-center justify-end gap-2">
      <Button
        variant="outline"
        size="sm"
        iconName="plus"
        aria-haspopup="dialog"
        onPress={() => setCreateEventModalOpen(true)}
      >
        Add
      </Button>
    </Box>
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

  const pathMatch = getCurrentRoute().pathname.match(
    /^\/dashboard\/client\/(.+)$/,
  );
  const clientIdFromPath = pathMatch ? pathMatch[1] : null;

  if (clientIdFromPath) {
    return <ClientHubScreen clientId={clientIdFromPath} />;
  }

  return (
    <Box className="flex flex-col gap-6 sm:gap-8">
      <UpcomingEvents
        suppressConnectionPrompt
        agendaTodos={agendaTodos}
        onToggleAgendaTodo={handleToggleAgendaTodo}
        canEditAgendaTodos={true}
        headerActions={headerActions}
        ownedCalendarsOnly={isAgent}
      />

      {isAgent ? <ClientList onClientClick={handleClientClick} /> : null}

      {!isAgent ? <DashboardChecklists /> : null}

      <Calendar ownedCalendarsOnly={isAgent} />

      {showAddButton ? (
        <CreateEventModal
          isOpen={createEventModalOpen}
          onClose={() => setCreateEventModalOpen(false)}
          calendars={scopedCalendars}
          defaultCalendarId={defaultCalendarId}
          onEventCreated={() => void refreshEvents()}
          onAddWithoutSchedule={async (payload) => {
            try {
              await submitAgentAgendaTodo(
                {
                  title: payload.title,
                  description: payload.description,
                  deadlineDate: null,
                  deadlineTime: null,
                  clientId: isAgent ? payload.clientId : undefined,
                },
                {
                  useCalendarEvent: false,
                  defaultCalendarId,
                  createTodo,
                  queryClient,
                },
              );
            } catch (error) {
              log.error(
                LOG_CATEGORIES.DASHBOARD,
                "Failed to create agenda to-do",
                error,
              );
              throw error;
            }
          }}
        />
      ) : null}
    </Box>
  );
}
