import React, { useCallback, useMemo, useState } from "react";

import { Alert, Modal, Pressable as ModalPressable, StyleSheet } from "react-native";

import { type AgendaTodoDTO, Calendar, UpcomingEvents } from "packages/features/calendar";
import { useIsAgent } from "packages/features/homeauth";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useNavigation } from "packages/navigation";
import { useUIStore } from "packages/store";
import type { UIState } from "packages/store/ui.slice";
import type { UrgentAlert } from "packages/types";
import Button from "packages/ui/components/button/Button";
import {
  Box,
  Pressable,
  PrimitiveInput,
  ScrollView,
  Text,
} from "packages/ui/components/primitives";
import { dateNow } from "packages/utils/date";

import { useAgentClients } from "@/features/agent/hooks/data/useAgentClients";
import { useAgentDashboardMockData } from "@/features/agent/hooks/data/useAgentDashboardMockData";
import { useAgentTodos } from "@/features/agent/hooks/data/useAgentTodos";
import type { TodoItem, TodoPriority } from "@/features/agent/types/agent";
import { TODO_PRIORITY_LABELS, TODO_PRIORITY_ORDER } from "@/features/agent/utils/todoUtils";
import { useCalendarOAuthCallback } from "@/features/calendar/hooks/data";

import ClientList from "./ClientList/ClientList";

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  sheetWrap: {
    width: "100%",
  },
});

function mapTodosToAgendaDTO(todos: TodoItem[]): AgendaTodoDTO[] {
  return todos.map((t) => ({
    id: t.id,
    title: t.title,
    due_date: t.due_date,
    completed: t.completed,
    priority: t.priority,
  }));
}

type MobileAgendaAddButtonProps = {
  onCreateTodo: (title: string, priority: TodoPriority) => Promise<void>;
  onCalendarEventHint: () => void;
};

function MobileAgendaAddButton({ onCreateTodo, onCalendarEventHint }: MobileAgendaAddButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<TodoPriority>("medium");

  const openChooser = useCallback(() => {
    Alert.alert("Add", undefined, [
      { text: "Add to-do", onPress: () => setModalOpen(true) },
      {
        text: "Add calendar event",
        onPress: onCalendarEventHint,
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }, [onCalendarEventHint]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setNewTodoTitle("");
    setSelectedPriority("medium");
  }, []);

  const submitTodo = useCallback(async () => {
    const trimmed = newTodoTitle.trim();
    if (!trimmed) {
      return;
    }
    try {
      await onCreateTodo(trimmed, selectedPriority);
      closeModal();
    } catch (error) {
      log.error(LOG_CATEGORIES.DASHBOARD, "Failed to create todo (mobile)", error);
    }
  }, [closeModal, newTodoTitle, onCreateTodo, selectedPriority]);

  return (
    <>
      <Pressable
        onPress={openChooser}
        className="border-border rounded-lg border border-dashed px-3 py-2 active:opacity-80"
      >
        <Text className="text-primary text-center text-sm font-medium">Add</Text>
      </Pressable>

      <Modal visible={modalOpen} animationType="slide" transparent onRequestClose={closeModal}>
        <ModalPressable style={modalStyles.backdrop} onPress={closeModal}>
          <ModalPressable
            style={modalStyles.sheetWrap}
            onPress={(e) => {
              e.stopPropagation();
            }}
          >
            <Box className="bg-background-surface max-h-[85%] w-full rounded-t-2xl px-4 pb-8 pt-4">
              <Text className="text-text-primary mb-3 text-base font-semibold">Add to-do</Text>
              <PrimitiveInput
                value={newTodoTitle}
                onValueChange={setNewTodoTitle}
                placeholder="What do you need to do?"
                className="border-border bg-background-base text-text-primary mb-3 rounded-lg border px-3 py-2 text-base"
              />
              <Box className="mb-4 flex-row flex-wrap gap-2">
                {(Object.keys(TODO_PRIORITY_ORDER) as TodoPriority[]).map((priority) => {
                  const selected = selectedPriority === priority;
                  return (
                    <Pressable
                      key={priority}
                      onPress={() => setSelectedPriority(priority)}
                      className={`rounded-full px-3 py-1 ${
                        selected ? "bg-primary" : "border-border bg-background-base border"
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${selected ? "text-white" : "text-text-primary"}`}
                      >
                        {TODO_PRIORITY_LABELS[priority]}
                      </Text>
                    </Pressable>
                  );
                })}
              </Box>
              <Text className="text-text-secondary mb-4 text-xs">
                Due date defaults to end of today.
              </Text>
              <Box className="flex-row gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  onPress={() => void submitTodo()}
                >
                  Save
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onPress={closeModal}>
                  Cancel
                </Button>
              </Box>
            </Box>
          </ModalPressable>
        </ModalPressable>
      </Modal>
    </>
  );
}

export function DashboardScreen() {
  const isAgent = useIsAgent();
  const enqueueToast = useUIStore((s: UIState) => s.enqueueToast);
  useCalendarOAuthCallback({ enqueueToast });
  const { navigateToPath } = useNavigation();
  const { clients } = useAgentClients();
  const { generateMockAlerts } = useAgentDashboardMockData();

  const { todos, createTodo, updateTodo } = useAgentTodos(false);

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
    const todo = todos.find((t: (typeof todos)[number]) => t.id === id);
    if (!todo) {
      return;
    }
    try {
      await updateTodo(id, { completed: !todo.completed });
    } catch (error) {
      log.error(LOG_CATEGORIES.DASHBOARD, "Failed to update todo", error);
    }
  };

  const handleCreateAgendaTodo = async (title: string, priority: TodoPriority) => {
    if (!isAgent) {
      return;
    }
    try {
      const dueDate = dateNow().endOf("day");
      await createTodo({
        title,
        due_date: dueDate.toISOString(),
        priority,
        type: "manual",
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

  const handleCalendarEventHint = useCallback(() => {
    enqueueToast({
      message: "Create calendar events in the Calendar section below.",
      type: "info",
    });
  }, [enqueueToast]);

  const headerActions = isAgent ? (
    <MobileAgendaAddButton
      onCreateTodo={handleCreateAgendaTodo}
      onCalendarEventHint={handleCalendarEventHint}
    />
  ) : undefined;

  const allAlerts = useMemo(() => generateMockAlerts(clients), [clients, generateMockAlerts]);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const visibleAlerts = useMemo(
    () => allAlerts.filter((alert: UrgentAlert) => !dismissedAlertIds.includes(alert.id)),
    [allAlerts, dismissedAlertIds]
  );

  const handleClientClick = (clientId: string) => {
    navigateToPath(`/dashboard/client/${clientId}`);
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshing(false);
  }, []);

  return (
    <ScrollView className="flex-1" refreshing={refreshing} onRefresh={handleRefresh}>
      <Box className="gap-6 px-4 pb-8 pt-4">
        {isAgent ? (
          <Box className="gap-3">
            <Text className="text-text-primary text-lg font-medium">Today</Text>

            <ClientList onClientClick={handleClientClick} />

            <Box className="bg-background-surface mt-2 gap-2 rounded-lg p-3 shadow-sm">
              <Text className="text-text-primary text-sm font-semibold">Urgent alerts</Text>
              {visibleAlerts.length === 0 ? (
                <Text className="text-text-secondary mt-1 text-xs">
                  No urgent alerts right now.
                </Text>
              ) : (
                <Box className="gap-2">
                  {visibleAlerts.map((alert: UrgentAlert) => (
                    <Box
                      key={alert.id}
                      className="border-destructive bg-primary-muted flex-row items-start justify-between gap-3 rounded-lg border px-3 py-2"
                    >
                      <Box className="flex-1">
                        <Text className="text-destructive text-xs font-semibold">
                          {alert.message}
                        </Text>
                        {alert.client_id ? (
                          <Pressable
                            onPress={() => {
                              navigateToPath(`/dashboard/client/${alert.client_id}`);
                            }}
                            className="mt-1"
                          >
                            <Text className="text-primary text-xs font-medium">View client →</Text>
                          </Pressable>
                        ) : null}
                      </Box>
                      <Pressable
                        onPress={() =>
                          setDismissedAlertIds((prev) =>
                            prev.includes(alert.id) ? prev : [...prev, alert.id]
                          )
                        }
                        className="mt-0.5 rounded-full px-2 py-1"
                      >
                        <Text className="text-text-secondary text-xs font-medium">Dismiss</Text>
                      </Pressable>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        ) : null}

        <UpcomingEvents
          embedInListHeader
          suppressConnectionPrompt
          sectionTitle="Upcoming"
          agendaTodos={agendaTodos}
          onToggleAgendaTodo={handleToggleAgendaTodo}
          onUpdateAgendaTodoPriority={handleUpdateAgendaTodoPriority}
          canEditAgendaTodos={isAgent}
          headerActions={headerActions}
        />

        <Box className="gap-3">
          <Text className="text-text-primary text-lg font-medium">Calendar</Text>
          <Calendar />
        </Box>
      </Box>
    </ScrollView>
  );
}

export default DashboardScreen;
