import React, { useCallback, useMemo, useState } from "react";

import { Calendar, UpcomingEvents } from "packages/features/calendar";
import { useIsAgent } from "packages/features/homeauth";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useNavigation } from "packages/navigation";
import { Box, Pressable, PrimitiveInput,ScrollView, Text } from "packages/ui/components/primitives";
import { dateNow, dateParseISO } from "packages/utils/date";

import { useAgentClients } from "@/features/agent/hooks/data/useAgentClients";
import { useAgentDashboardMockData } from "@/features/agent/hooks/data/useAgentDashboardMockData";
import { useAgentTodos } from "@/features/agent/hooks/data/useAgentTodos";
import type { TodoItem, TodoPriority } from "@/features/agent/types/agent";

import ClientList from "./ClientList/ClientList";
import DashboardChecklists from "./DashboardChecklists/DashboardChecklists";

type DashboardTodosSectionProps = {
  isAgent: boolean;
};

const priorityOrder: Record<TodoPriority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const priorityLabels: Record<TodoPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

function sortTodosByPriority(todos: TodoItem[]): TodoItem[] {
  const incomplete = todos.filter((todo) => !todo.completed);
  return [...incomplete].sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
}

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
    <Box className="gap-3 rounded-lg bg-white p-3 shadow-sm">
      {sortedTodos.length === 0 ? (
        <Text className="text-sm text-gray-600">No todos for today.</Text>
      ) : (
        <Box className="gap-2">
          {sortedTodos.map((todo) => (
            <Box
              key={todo.id}
              className="flex-row items-start justify-between rounded-md border border-gray-200 bg-white px-3 py-2"
            >
              <Pressable
                onPress={() => handleToggleTodo(todo.id)}
                disabled={!isAgent}
                className={`mr-3 mt-1 h-5 w-5 items-center justify-center rounded-full border ${
                  todo.completed ? "border-brand-accent bg-brand-accent" : "border-gray-300"
                }`}
              >
                {todo.completed ? (
                  <Text className="text-xs font-semibold text-white">✓</Text>
                ) : null}
              </Pressable>

              <Box className="flex-1 gap-1">
                <Text
                  className={`text-sm ${
                    todo.completed ? "text-gray-400 line-through" : "text-gray-900"
                  }`}
                >
                  {todo.title}
                </Text>
                <Box className="flex-row items-center gap-3">
                  <Text className="text-xs font-medium text-gray-700">
                    {priorityLabels[todo.priority]}
                  </Text>
                  {todo.due_date ? (
                    <Text className="text-xs text-gray-500">
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
          <Box className="mt-2 gap-2">
            <PrimitiveInput
              value={newTodoTitle}
              onValueChange={setNewTodoTitle}
              placeholder="Add a todo for today"
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-base text-gray-900"
            />

            <Box className="flex-row flex-wrap gap-2">
              {(Object.keys(priorityOrder) as TodoPriority[]).map((priority) => {
                const selected = selectedPriority === priority;
                return (
                  <Pressable
                    key={priority}
                    onPress={() => setSelectedPriority(priority)}
                    className={`rounded-full px-3 py-1 ${
                      selected ? "bg-brand-accent" : "border border-gray-200 bg-gray-50"
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${selected ? "text-white" : "text-gray-800"}`}
                    >
                      {priorityLabels[priority]}
                    </Text>
                  </Pressable>
                );
              })}
            </Box>

            <Box className="flex-row gap-2">
              <Pressable
                onPress={handleAddTodo}
                className="bg-brand-accent flex-1 rounded-lg px-4 py-2 active:opacity-90"
              >
                <Text className="text-center text-sm font-semibold text-white">Add todo</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setShowAddForm(false);
                  setNewTodoTitle("");
                  setSelectedPriority("medium");
                }}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2"
              >
                <Text className="text-center text-sm font-semibold text-gray-800">Cancel</Text>
              </Pressable>
            </Box>
          </Box>
        ) : (
          <Pressable
            onPress={() => setShowAddForm(true)}
            className="mt-1 rounded-lg border border-dashed border-gray-300 px-3 py-2"
          >
            <Text className="text-brand-accent text-center text-sm font-medium">Add todo</Text>
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
    <ScrollView 
      className="flex-1" 
      refreshing={refreshing}
      onRefresh={handleRefresh}
    >
      <Box className="gap-6 px-4 pb-8 pt-4">
        {isAgent ? (
          <Box className="gap-3">
            <Text className="text-lg font-medium text-gray-800">Today</Text>
            <DashboardTodosSection isAgent={isAgent} />

            <Box className="mt-2 gap-2 rounded-lg bg-white p-3 shadow-sm">
              <Text className="text-sm font-semibold text-gray-900">Urgent alerts</Text>
              {visibleAlerts.length === 0 ? (
                <Text className="mt-1 text-xs text-gray-600">No urgent alerts right now.</Text>
              ) : (
                <Box className="gap-2">
                  {visibleAlerts.map((alert) => (
                    <Box
                      key={alert.id}
                      className="flex-row items-start justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2"
                    >
                      <Box className="flex-1">
                        <Text className="text-xs font-semibold text-rose-700">{alert.message}</Text>
                        {alert.client_id ? (
                          <Pressable
                            onPress={() => {
                              navigateToPath(`/dashboard/client/${alert.client_id}`);
                            }}
                            className="mt-1"
                          >
                            <Text className="text-brand-accent text-xs font-medium">
                              View client →
                            </Text>
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
                        <Text className="text-xs font-medium text-gray-500">Dismiss</Text>
                      </Pressable>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        ) : null}

        <Box className="gap-3">
          <Text className="text-lg font-medium text-gray-800">Upcoming Events</Text>
          <UpcomingEvents embedInListHeader />
        </Box>

        <DashboardChecklists />

        <Box className="gap-3">
          <Text className="text-lg font-medium text-gray-800">Calendar</Text>
          <Calendar />
        </Box>

        {/* Client List Section */}
        {isAgent && <ClientList onClientClick={handleClientClick} />}
      </Box>
    </ScrollView>
  );
}

export default DashboardScreen;