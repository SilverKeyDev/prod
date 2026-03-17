import type { TodoItem, TodoPriority } from "@/features/agent/types/agent";

export const TODO_PRIORITY_ORDER: Record<TodoPriority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export const TODO_PRIORITY_LABELS: Record<TodoPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export function sortTodosByPriority(todos: TodoItem[]): TodoItem[] {
  const incomplete = todos.filter((todo) => !todo.completed);
  return [...incomplete].sort(
    (a, b) => TODO_PRIORITY_ORDER[b.priority] - TODO_PRIORITY_ORDER[a.priority]
  );
}
