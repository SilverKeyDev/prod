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

function priorityRank(p: TodoItem["priority"]): number {
  if (p == null) {
    return 0;
  }
  return TODO_PRIORITY_ORDER[p];
}

export function sortTodosByPriority(todos: TodoItem[]): TodoItem[] {
  const incomplete = todos.filter((todo) => !todo.completed);
  return [...incomplete].sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority));
}
