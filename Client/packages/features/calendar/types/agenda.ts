/**
 * Minimal to-do shape for the upcoming agenda (dashboard maps agent todos here).
 * Keeps calendar feature free of agent package imports.
 */
export type AgendaTodoPriority = "low" | "medium" | "high" | "urgent";

export type AgendaTodoDTO = {
  id: string;
  title: string;
  due_date: string | null;
  completed: boolean;
  priority: AgendaTodoPriority | null;
};
