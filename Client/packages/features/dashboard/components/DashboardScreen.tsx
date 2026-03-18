import React, { useCallback, useMemo, useState } from "react";

import { Calendar, UpcomingEvents } from "packages/features/calendar";
import { useIsAgent } from "packages/features/homeauth";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useNavigation } from "packages/navigation";
import {
  Box,
  Pressable,
  PrimitiveInput,
  ScrollView,
  Text,
} from "packages/ui/components/primitives";
import { dateNow, dateParseISO } from "packages/utils/date";

import { useAgentClients } from "@/features/agent/hooks/data/useAgentClients";
import { useAgentDashboardMockData } from "@/features/agent/hooks/data/useAgentDashboardMockData";
import { useAgentTodos } from "@/features/agent/hooks/data/useAgentTodos";
import type { TodoPriority } from "@/features/agent/types/agent";
import {
  sortTodosByPriority,
  TODO_PRIORITY_LABELS,
  TODO_PRIORITY_ORDER,
} from "@/features/agent/utils/todoUtils";

import ClientList from "./ClientList/ClientList";
import DashboardChecklists from "./DashboardChecklists/DashboardChecklists";

type DashboardTodosSectionProps = {
  isAgent: boolean;
};

function DashboardTodosSection({ isAgent }: DashboardTodosSectionProps) {
  const { todos, createTodo, updateTodo } = useAgentTodos(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<TodoPriority>("medium");

  const sortedTodos = useMemo(() => sortTodosByPriority(todos), [todos]);

  const handleToggleTodo = async (id: string) => {
    if (!isAgent) return;

    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    try {
      await updateTodo(id, { completed: !todo.completed });
    } catch (error) {
      log.error(LOG_CATEGORIES.DASHBOARD, "Failed to update todo", error);
    }
  };

  const handleAddTodo = async () => {
    const trimmedTitle = newTodoTitle.trim();
    if (!isAgent || !trimmedTitle) return;

    try {
      const dueDate = dateNow().endOf("day");

      await createTodo({
        title: trimmedTitle,
        due_date: dueDate.toISOString(),
        priority: selectedPriority,
        type: "manual",
      });

      setNewTodoTitle("");
      setSelectedPriority("medium");
      setShowAddForm(false);
    } catch (error) {
      log.error(LOG_CATEGORIES.DASHBOARD, "Failed to create todo", error);
    }
  };

  return (
    <Box className="bg-background-surface gap-3 rounded-lg p-3 shadow-sm">
      {sortedTodos.length === 0 ? (
        <Text className="text-text-secondary text-sm">No todos for today.</Text>
      ) : (
        <Box className="gap-2">
          {sortedTodos.map((todo) => (
            <Box
              key={todo.id}
              className="border-border bg-background-surface flex-row items-start justify-between rounded-md border px-3 py-2"
            >
              <Pressable
                onPress={() => handleToggleTodo(todo.id)}
                disabled={!isAgent}
                className={`mr-3 mt-1 h-5 w-5 items-center justify-center rounded-full border ${
                  todo.completed ? "border-primary bg-primary" : "border-border"
                }`}
              >
                {todo.completed ? (
                  <Text className="text-xs font-semibold text-white">✓</Text>
                ) : null}
              </Pressable>

              <Box className="flex-1 gap-1">
                <Text
                  className={`text-sm ${
                    todo.completed ? "text-text-disabled line-through" : "text-text-primary"
                  }`}
                >
                  {todo.title}
                </Text>
                <Box className="flex flex-row items-center gap-3">
                  <Text className="text-text-secondary text-xs font-medium">
                    {TODO_PRIORITY_LABELS[todo.priority]}
                  </Text>
                  {todo.due_date ? (
                    <Text className="text-text-secondary text-xs">
                      {dateParseISO(todo.due_date).toDate().toLocaleDateString()}
                    </Text>
                  ) : null}
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {isAgent ? (
        showAddForm ? (
          <Box className="mt-2 flex flex-col gap-2">
            <PrimitiveInput
              value={newTodoTitle}
              onValueChange={setNewTodoTitle}
              placeholder="Add a todo for today"
              className="border-border bg-background-surface text-text-primary rounded-lg border px-3 py-2 text-base"
            />

            <Box className="flex flex-row flex-wrap gap-2">
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

            <Box className="flex flex-row gap-2">
              <Pressable
                onPress={handleAddTodo}
                className="bg-primary flex-1 rounded-lg px-4 py-2 active:opacity-90"
              >
                <Text className="text-center text-sm font-semibold text-white">Add todo</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setShowAddForm(false);
                  setNewTodoTitle("");
                  setSelectedPriority("medium");
                }}
                className="border-border bg-background-surface flex-1 rounded-lg border px-4 py-2"
              >
                <Text className="text-text-primary text-center text-sm font-semibold">Cancel</Text>
              </Pressable>
            </Box>
          </Box>
        ) : (
          <Pressable
            onPress={() => setShowAddForm(true)}
            className="border-border mt-1 rounded-lg border border-dashed px-3 py-2"
          >
            <Text className="text-primary text-center text-sm font-medium">Add todo</Text>
          </Pressable>
        )
      ) : null}
    </Box>
  );
}

export function DashboardScreen() {
  const isAgent = useIsAgent();
  const { navigateToPath } = useNavigation();
  const { clients } = useAgentClients();
  const { generateMockAlerts } = useAgentDashboardMockData();

  const allAlerts = useMemo(() => generateMockAlerts(clients), [clients, generateMockAlerts]);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const visibleAlerts = useMemo(
    () => allAlerts.filter((alert) => !dismissedAlertIds.includes(alert.id)),
    [allAlerts, dismissedAlertIds]
  );

  const handleClientClick = (clientId: string) => {
    navigateToPath(`/dashboard/client/${clientId}`);
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // Add any refresh logic here
    setRefreshing(false);
  }, []);

  return (
    <ScrollView className="flex-1" refreshing={refreshing} onRefresh={handleRefresh}>
      <Box className="gap-6 px-4 pb-8 pt-4">
        {isAgent ? (
          <Box className="gap-3">
            <Text className="text-text-primary text-lg font-medium">Today</Text>
            <DashboardTodosSection isAgent={isAgent} />

            <Box className="bg-background-surface mt-2 gap-2 rounded-lg p-3 shadow-sm">
              <Text className="text-text-primary text-sm font-semibold">Urgent alerts</Text>
              {visibleAlerts.length === 0 ? (
                <Text className="text-text-secondary mt-1 text-xs">
                  No urgent alerts right now.
                </Text>
              ) : (
                <Box className="gap-2">
                  {visibleAlerts.map((alert) => (
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

        <Box className="mt-6 gap-3">
          <Text className="text-text-primary text-lg font-medium">Upcoming Events</Text>
          <UpcomingEvents embedInListHeader />
        </Box>

        <DashboardChecklists />

        <Box className="gap-3">
          <Text className="text-text-primary text-lg font-medium">Calendar</Text>
          <Calendar />
        </Box>

        {/* Client List Section */}
        {isAgent && <ClientList onClientClick={handleClientClick} />}
      </Box>
    </ScrollView>
  );
}

export default DashboardScreen;
