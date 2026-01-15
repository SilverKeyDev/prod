import React from "react";
import TodoList from "./TodoList";
import { useAgentTodos } from "../../../../../packages/hooks/data/agent/useAgentTodos";
import { useIsAgent } from "../../../../../packages/hooks/store/auth/useIsAgent";
import type {
  TodoPriority,
  TodoType,
} from "../../../../../packages/schemas/agent/agent";
import { log, LOG_CATEGORIES } from "../../../../../logger";

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

  const handleAddTodo = async (
    title: string,
    priority: TodoPriority,
    type: TodoType
  ) => {
    if (!isAgent) return;
    try {
      // Set due date to end of today by default
      const dueDate = new Date();
      dueDate.setHours(23, 59, 59, 999);

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
      log.error(
        LOG_CATEGORIES.DASHBOARD,
        "Failed to update todo priority",
        error
      );
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
      {/* Todo List - Left */}
      <div className="md:col-span-1">
        <TodoList
          todos={todos}
          onToggleComplete={handleToggleTodo}
          onAddTodo={handleAddTodo}
          onUpdatePriority={handleUpdatePriority}
          canEdit={isAgent}
        />
      </div>

    </div>
  );
};

export default TodayPanel;
