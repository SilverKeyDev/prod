import type { AgendaTodoDTO } from "packages/features/calendar";

import type { TodoItem } from "@/features/agent/types/agent";

export function mapTodosToAgendaDTO(todos: TodoItem[]): AgendaTodoDTO[] {
  return todos.map((t) => ({
    id: t.id,
    title: t.title,
    due_date: t.due_date,
    completed: t.completed,
  }));
}
