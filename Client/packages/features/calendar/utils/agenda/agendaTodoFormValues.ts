import type { UpdateTodoRequest } from "packages/features/agent/api/agent";
import { parseAgendaDeadlineTime } from "packages/utils/comms/calendar/agenda/agentAgendaEvent";
import { defaultCreateEventTimedRange } from "packages/utils/comms/calendar/createEvent/createEventModalDefaults";
import { dayjs } from "packages/utils/core/date";

import type { AgendaTodoDTO } from "@/features/calendar/types/agenda";

export type AgendaTodoFormValues = {
  title: string;
  description: string;
  deadlineDate: string;
  time: string;
  isAllDay: boolean;
};

export type AgendaTodoFormSubmitPayload = {
  title: string;
  description: string | null;
  deadlineDate: string | null;
  deadlineTime: string | null;
  isAllDay: boolean;
  addGoogleMeet?: boolean;
};

function isEndOfDayDueDate(parsed: ReturnType<typeof dayjs>): boolean {
  return parsed.hour() === 23 && parsed.minute() === 59;
}

export function emptyAgendaTodoFormValues(): AgendaTodoFormValues {
  return {
    title: "",
    description: "",
    deadlineDate: "",
    time: defaultCreateEventTimedRange().startTime,
    isAllDay: false,
  };
}

export function todoToAgendaFormValues(todo: AgendaTodoDTO): AgendaTodoFormValues {
  const base = emptyAgendaTodoFormValues();
  base.title = todo.title;
  base.description = todo.description ?? "";

  const rawDue = todo.due_date;
  if (rawDue == null || rawDue === "") {
    return base;
  }

  const parsed = dayjs(rawDue);
  if (!parsed.isValid()) {
    return base;
  }

  base.deadlineDate = parsed.format("YYYY-MM-DD");
  if (isEndOfDayDueDate(parsed)) {
    base.isAllDay = true;
    base.time = defaultCreateEventTimedRange().startTime;
  } else {
    base.isAllDay = false;
    base.time = parsed.format("HH:mm");
  }

  return base;
}

export function agendaFormValuesToSubmitPayload(
  values: AgendaTodoFormValues,
  options?: { addGoogleMeet?: boolean }
): AgendaTodoFormSubmitPayload | null {
  const trimmed = values.title.trim();
  if (!trimmed) {
    return null;
  }

  const rawDeadline = values.deadlineDate.trim();
  let deadlineDate: string | null = null;
  if (rawDeadline !== "") {
    const deadlineParsed = dayjs(rawDeadline, "YYYY-MM-DD", true);
    if (!deadlineParsed.isValid()) {
      return null;
    }
    deadlineDate = deadlineParsed.format("YYYY-MM-DD");
  }

  const deadlineTime =
    values.isAllDay || !deadlineDate ? null : parseAgendaDeadlineTime(values.time.trim());
  const descTrimmed = values.description.trim();

  return {
    title: trimmed,
    description: descTrimmed === "" ? null : descTrimmed,
    deadlineDate,
    deadlineTime,
    isAllDay: values.isAllDay,
    addGoogleMeet: options?.addGoogleMeet,
  };
}

export function agendaFormValuesToUpdateRequest(
  values: AgendaTodoFormValues
): UpdateTodoRequest | null {
  const payload = agendaFormValuesToSubmitPayload(values);
  if (!payload) {
    return null;
  }

  const request: UpdateTodoRequest = {
    title: payload.title,
    description: payload.description,
  };

  if (!payload.deadlineDate) {
    request.due_date = null;
    return request;
  }

  const deadlineDay = dayjs(payload.deadlineDate, "YYYY-MM-DD", true);
  if (!deadlineDay.isValid()) {
    return null;
  }

  const timeParts = parseAgendaDeadlineTime(payload.deadlineTime);
  if (timeParts) {
    request.due_date = deadlineDay
      .hour(timeParts.hour)
      .minute(timeParts.minute)
      .second(0)
      .millisecond(0)
      .toISOString();
  } else {
    request.due_date = deadlineDay.endOf("day").toISOString();
  }

  return request;
}
