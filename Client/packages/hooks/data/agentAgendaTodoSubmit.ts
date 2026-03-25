import type { QueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import type { CreateTodoRequest } from "packages/features/agent/api/agent";
import type { TodoPriority } from "packages/features/agent/types/agent";
import { googleCalendarApi } from "packages/features/calendar/api";
import { buildAgentTodoGoogleEvent } from "packages/features/calendar/utils/agentTaskEvent";
import { dayjs } from "packages/utils/date";

export type AgentAgendaTodoSubmitPayload = {
  title: string;
  priority: TodoPriority | null;
  /** Local calendar date YYYY-MM-DD, or null if none */
  deadlineDate: string | null;
};

export async function submitAgentAgendaTodo(
  payload: AgentAgendaTodoSubmitPayload,
  options: {
    useCalendarEvent: boolean;
    defaultCalendarId: string | null;
    createTodo: (body: CreateTodoRequest) => Promise<unknown>;
    queryClient: QueryClient;
  }
): Promise<void> {
  const title = payload.title.trim();
  if (!title) {
    return;
  }

  const calendarId = options.defaultCalendarId;
  if (options.useCalendarEvent && calendarId) {
    const event = buildAgentTodoGoogleEvent({
      title,
      deadlineDate: payload.deadlineDate,
      priority: payload.priority,
      calendarId,
    });
    const res = await googleCalendarApi.createEvent(event);
    if (!res.success) {
      throw new Error(res.error ?? "Failed to create calendar event");
    }
    await options.queryClient.invalidateQueries({ queryKey: queryKeys.googleCalendar.events() });
    await options.queryClient.invalidateQueries({
      queryKey: queryKeys.googleCalendar.eventsList(),
    });
    return;
  }

  const body: CreateTodoRequest = { title, type: "manual" };
  if (payload.deadlineDate) {
    const d = dayjs(payload.deadlineDate, "YYYY-MM-DD", true);
    if (d.isValid()) {
      body.due_date = d.endOf("day").toISOString();
    }
  }
  if (payload.priority) {
    body.priority = payload.priority;
  }
  await options.createTodo(body);
}
