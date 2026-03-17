import React from "react";

import { useIsAgent } from "packages/hooks/store";
import { log, LOG_CATEGORIES } from "packages/logger";
import { Box } from "packages/ui/components/primitives";
import { dateNow } from "packages/utils/date";

import { useAgentTodos } from "@/features/agent/hooks/data/useAgentTodos";
import type { TodoPriority, TodoType } from "@/features/agent/types/agent";

import TodoList from "./TodoList";

const TodayPanel: React.FC = () => {
  const { todos, createTodo, updateTodo } = useAgentTodos(false);
  const isAgent = useIsAgent();

  const handleToggleTodo = async (id: string) => {
    if (!isAgent) return;
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    try {
      await updateTodo(id, {
        completed: !todo.completed,
      });
    } catch (error) {
      log.error(LOG_CATEGORIES.DASHBOARD, "Failed to update todo", error);
    }
  };

  const handleAddTodo = async (title: string, priority: TodoPriority, type: TodoType) => {
    if (!isAgent) return;
    try {
      // Set due date to end of today by default
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

  const handleUpdatePriority = async (id: string, priority: TodoPriority) => {
    if (!isAgent) return;
    try {
      await updateTodo(id, {
        priority,
      });
    } catch (error) {
      log.error(LOG_CATEGORIES.DASHBOARD, "Failed to update todo priority", error);
    }
  };

  return (
    <Box className="mb-6 space-y-6 sm:mb-8">
      {/* Top Row - Todos */}
      <Box className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
        <Box className="md:col-span-2">
          <TodoList
            todos={todos}
            onToggleComplete={handleToggleTodo}
            onAddTodo={handleAddTodo}
            onUpdatePriority={handleUpdatePriority}
            canEdit={isAgent}
          />
        </Box>
      </Box>

      {/* Agreement widgets have been disabled while the signing provider is migrated. */}
    </Box>
  );
};

export default TodayPanel;
