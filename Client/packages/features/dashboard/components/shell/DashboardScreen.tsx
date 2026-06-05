import React, { useCallback, useMemo, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { DashboardAgentTodaySection, mapTodosToAgendaDTO } from "packages/features/agent";
import {
  submitAgendaItemAsGoogleCalendarEvent,
  submitAgentAgendaTodo,
} from "packages/features/agent/hooks/data/agenda/agentAgendaTodoSubmit";
import { type AgendaTodoDTO, Calendar, UpcomingEvents } from "packages/features/calendar";
import DashboardChecklists from "packages/features/dashboard/components/DashboardChecklists/DashboardChecklists";
import { MobileAgendaAddButton } from "packages/features/dashboard/components/widgets/MobileAgendaAddButton";
import {
  useCompletedSigningTodos,
  useSigningTodos,
} from "packages/features/documents/hooks/data/agenda/useSigningTodos";
import { useActiveWorkspace } from "packages/features/homeauth";
import { log } from "packages/logger";
import { useNavigation } from "packages/navigation";
import type { UIState } from "packages/store";
import { useUIStore } from "packages/store";
import { Box, ScrollView, Text } from "packages/ui/components/structure/primitives";

import { useAgentTodos } from "@/features/agent/hooks/data/clientHub/useAgentTodos";
import { useCalendarOAuthCallback } from "@/features/calendar/hooks/data";
import { useGoogleCalendarStoreIntegration } from "@/features/calendar/hooks/store/useGoogleCalendarStoreIntegration";

export function DashboardScreen() {
  const isAgentWorkspace = useActiveWorkspace() === "agent";
  const queryClient = useQueryClient();
  const enqueueToast = useUIStore((s: UIState) => s.enqueueToast);
  useCalendarOAuthCallback({ enqueueToast });
  const { navigateToPath } = useNavigation();
  const { isConnected, calendars } = useGoogleCalendarStoreIntegration();

  const scopedCalendars = useMemo(() => calendars ?? [], [calendars]);

  const defaultCalendarId = scopedCalendars[0]?.id ?? null;
  const canCreateEvent = Boolean(isConnected && defaultCalendarId);
  const useCalendarEventForTodo = Boolean(canCreateEvent && defaultCalendarId);

  const { todos, createTodo, updateTodo } = useAgentTodos(true);
  const signingTodos = useSigningTodos(isAgentWorkspace);
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
      log.error("DASHBOARD", "Failed to update todo", error);
    }
  };

  const googleCalendarAgendaMeetEligible =
    (isAgentWorkspace && useCalendarEventForTodo) ||
    (!isAgentWorkspace && Boolean(defaultCalendarId));

  const handleMobileAgendaSubmit = async (payload: {
    title: string;
    description: string | null;
    deadlineDate: string | null;
    deadlineTime: string | null;
    addGoogleMeet?: boolean;
  }) => {
    if (isAgentWorkspace) {
      try {
        await submitAgentAgendaTodo(payload, {
          useCalendarEvent: useCalendarEventForTodo,
          defaultCalendarId,
          createTodo,
          queryClient,
        });
      } catch (error) {
        log.error("DASHBOARD", "Failed to create agenda item", error);
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
        log.error("DASHBOARD", "Failed to create agenda to-do", error);
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
      log.error("DASHBOARD", "Failed to create calendar event", error);
      throw error;
    }
  };

  const showMobileAdd = isAgentWorkspace || useCalendarEventForTodo || !isAgentWorkspace;
  const headerActions = showMobileAdd ? (
    <MobileAgendaAddButton
      onSubmitTodo={handleMobileAgendaSubmit}
      googleCalendarCreateEligible={googleCalendarAgendaMeetEligible}
    />
  ) : undefined;

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshing(false);
  }, []);

  return (
    <ScrollView className="flex-1" refreshing={refreshing} onRefresh={handleRefresh}>
      <Box className="gap-6 px-4 pb-8 pt-4">
        {isAgentWorkspace ? <DashboardAgentTodaySection /> : null}

        <UpcomingEvents
          embedInListHeader
          suppressConnectionPrompt
          agendaTodos={agendaTodos}
          onToggleAgendaTodo={handleToggleAgendaTodo}
          canEditAgendaTodos={true}
          onSigningAgendaPress={handleSigningAgendaPress}
          headerActions={headerActions}
        />

        {!isAgentWorkspace ? (
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
