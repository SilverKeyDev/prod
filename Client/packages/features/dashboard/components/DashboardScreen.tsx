import React, { useCallback, useMemo, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { type AgendaTodoDTO, Calendar, UpcomingEvents } from "packages/features/calendar";
import { mapTodosToAgendaDTO } from "packages/features/dashboard/utils/mapTodosToAgendaDTO";
import { useIsAgent } from "packages/features/homeauth";
import {
  submitAgendaItemAsGoogleCalendarEvent,
  submitAgentAgendaTodo,
} from "packages/hooks/data/agenda/agentAgendaTodoSubmit";
import {
  useCompletedSigningTodos,
  useSigningTodos,
} from "packages/hooks/data/agenda/useSigningTodos";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useNavigation } from "packages/navigation";
import type { UIState } from "packages/store";
import { useUIStore } from "packages/store";
import { Box, ScrollView, Text } from "packages/ui/components/primitives";

import { useAgentClients } from "@/features/agent/hooks/data/useAgentClients";
import { useAgentDashboardMockData } from "@/features/agent/hooks/data/useAgentDashboardMockData";
import { useAgentTodos } from "@/features/agent/hooks/data/useAgentTodos";
import { useCalendarOAuthCallback } from "@/features/calendar/hooks/data";
import { useGoogleCalendarStoreIntegration } from "@/features/calendar/hooks/store/useGoogleCalendarStoreIntegration";

import { DashboardAgentTodaySection } from "./DashboardAgentTodaySection";
import DashboardChecklists from "./DashboardChecklists/DashboardChecklists";
import { MobileAgendaAddButton } from "./MobileAgendaAddButton";

export function DashboardScreen() {
  const isAgent = useIsAgent();
  const queryClient = useQueryClient();
  const enqueueToast = useUIStore((s: UIState) => s.enqueueToast);
  useCalendarOAuthCallback({ enqueueToast });
  const { navigateToPath } = useNavigation();
  const { clients } = useAgentClients();
  const { generateMockAlerts } = useAgentDashboardMockData();
  const { isConnected, calendars } = useGoogleCalendarStoreIntegration();

  const scopedCalendars = useMemo(() => calendars ?? [], [calendars]);

  const defaultCalendarId = scopedCalendars[0]?.id ?? null;
  const canCreateEvent = Boolean(isConnected && defaultCalendarId);
  const useCalendarEventForTodo = Boolean(canCreateEvent && defaultCalendarId);

  const { todos, createTodo, updateTodo } = useAgentTodos(false);
  const signingTodos = useSigningTodos(isAgent);
  const completedSigningTodos = useCompletedSigningTodos();

  const agendaTodos = useMemo<AgendaTodoDTO[]>(
    () => [...mapTodosToAgendaDTO(todos), ...signingTodos, ...completedSigningTodos],
    [todos, signingTodos, completedSigningTodos]
  );

  const handleSigningAgendaPress = useCallback(
    (_agreementId: string) => {
      navigateToPath("/library");
      enqueueToast({
        type: "info",
        message: "Open Documents on Saved to complete signing.",
      });
    },
    [enqueueToast, navigateToPath]
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

  const googleCalendarAgendaMeetEligible =
    (isAgent && useCalendarEventForTodo) || (!isAgent && Boolean(defaultCalendarId));

  const handleMobileAgendaSubmit = async (payload: {
    title: string;
    description: string | null;
    deadlineDate: string | null;
    deadlineTime: string | null;
    addGoogleMeet?: boolean;
  }) => {
    if (isAgent) {
      try {
        await submitAgentAgendaTodo(payload, {
          useCalendarEvent: useCalendarEventForTodo,
          defaultCalendarId,
          createTodo,
          queryClient,
        });
      } catch (error) {
        log.error(LOG_CATEGORIES.DASHBOARD, "Failed to create agenda item", error);
        throw error;
      }
      return;
    }

    if (!payload.deadlineDate?.trim()) {
      try {
        await submitAgentAgendaTodo(payload, {
          useCalendarEvent: false,
          defaultCalendarId: defaultCalendarId ?? null,
          createTodo,
          queryClient,
        });
      } catch (error) {
        log.error(LOG_CATEGORIES.DASHBOARD, "Failed to create agenda to-do", error);
        throw error;
      }
      return;
    }

    if (!defaultCalendarId) {
      return;
    }
    try {
      await submitAgendaItemAsGoogleCalendarEvent(
        {
          title: payload.title,
          description: payload.description,
          deadlineDate: payload.deadlineDate.trim(),
          deadlineTime: payload.deadlineTime,
          addGoogleMeet: payload.addGoogleMeet,
        },
        {
          calendarId: defaultCalendarId,
          queryClient,
        }
      );
    } catch (error) {
      log.error(LOG_CATEGORIES.DASHBOARD, "Failed to create calendar event", error);
      throw error;
    }
  };

  const showMobileAdd = isAgent || useCalendarEventForTodo || !isAgent;
  const headerActions = showMobileAdd ? (
    <MobileAgendaAddButton
      onSubmitTodo={handleMobileAgendaSubmit}
      googleCalendarCreateEligible={googleCalendarAgendaMeetEligible}
    />
  ) : undefined;

  const allAlerts = useMemo(() => generateMockAlerts(clients), [clients, generateMockAlerts]);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshing(false);
  }, []);

  return (
    <ScrollView className="flex-1" refreshing={refreshing} onRefresh={handleRefresh}>
      <Box className="gap-6 px-4 pb-8 pt-4">
        {isAgent ? <DashboardAgentTodaySection alerts={allAlerts} /> : null}

        <UpcomingEvents
          embedInListHeader
          suppressConnectionPrompt
          agendaTodos={agendaTodos}
          onToggleAgendaTodo={handleToggleAgendaTodo}
          canEditAgendaTodos={true}
          onSigningAgendaPress={handleSigningAgendaPress}
          headerActions={headerActions}
        />

        {!isAgent ? (
          <Box className="gap-3">
            <Text className="text-text-primary text-lg font-medium">Checklists</Text>
            <DashboardChecklists />
          </Box>
        ) : null}

        <Box className="gap-3">
          <Text className="text-text-primary text-lg font-medium">Calendar</Text>
          <Calendar />
        </Box>
      </Box>
    </ScrollView>
  );
}

export default DashboardScreen;
