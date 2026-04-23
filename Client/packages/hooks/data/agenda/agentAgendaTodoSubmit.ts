import type { QueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import type { CreateTodoRequest } from "packages/features/agent/api/agent";
import { googleCalendarApi } from "packages/features/calendar/api";
import type { GoogleEventCreateResponse } from "packages/features/calendar/api/types";
import {
  buildAgentTodoGoogleEvent,
  parseAgendaDeadlineTime,
} from "packages/features/calendar/utils/core/agentTaskEvent";
import {
  copyTextToClipboard,
  isGoogleMeetProvisioningPending,
  pollGoogleMeetHangoutLink,
} from "packages/features/calendar/utils/createEventModal/googleMeetAfterCreate";
import { showErrorToast, showInfoToast } from "packages/hooks/ui/toast";
import { dayjs } from "packages/utils/date";

/** Payload for a single-day Google Calendar quick-add (requires a date). */
export type AgendaCalendarQuickAddPayload = {
  title: string;
  description: string | null;
  deadlineDate: string;
  deadlineTime: string | null;
  addGoogleMeet?: boolean;
};

export type AgentAgendaTodoSubmitPayload = {
  title: string;
  description: string | null;
  /** YYYY-MM-DD when scheduling; null or empty for an undated to-do. */
  deadlineDate: string | null;
  deadlineTime: string | null;
  /** When set (e.g. agent modal), associates the to-do with a client. */
  clientId?: string | null;
  /** When creating a Google Calendar event, optional Meet. */
  addGoogleMeet?: boolean;
};

/** Create a Google Calendar event from the agenda form (clients and agents). */
export async function submitAgendaItemAsGoogleCalendarEvent(
  payload: AgendaCalendarQuickAddPayload,
  options: { calendarId: string; queryClient: QueryClient }
): Promise<void> {
  const title = payload.title.trim();
  if (!title) {
    return;
  }

  const deadlineDay = dayjs(payload.deadlineDate.trim(), "YYYY-MM-DD", true);
  if (!deadlineDay.isValid()) {
    throw new Error("A valid date (YYYY-MM-DD) is required.");
  }
  const deadlineDateNormalized = deadlineDay.format("YYYY-MM-DD");

  const event = buildAgentTodoGoogleEvent({
    title,
    deadlineDate: deadlineDateNormalized,
    deadlineTime: payload.deadlineTime,
    calendarId: options.calendarId,
    description: payload.description,
    addGoogleMeet: payload.addGoogleMeet,
  });
  const res = await googleCalendarApi.createEvent(event);
  if (!res.success || !res.data) {
    throw new Error(res.error ?? "Failed to create calendar event");
  }
  const created = res.data as GoogleEventCreateResponse;
  if (payload.addGoogleMeet) {
    let meetLink =
      typeof created.hangoutLink === "string" && created.hangoutLink.length > 0
        ? created.hangoutLink
        : null;
    if (!meetLink && created.id && isGoogleMeetProvisioningPending(created)) {
      showInfoToast("Meet link generating…");
      meetLink = await pollGoogleMeetHangoutLink(created.id, options.calendarId);
    }
    if (meetLink) {
      const copied = await copyTextToClipboard(meetLink);
      if (copied) {
        showInfoToast("Meet link copied to clipboard.");
      }
    } else {
      showErrorToast("Couldn't add Meet; you can add a link manually.");
    }
  }
  await options.queryClient.invalidateQueries({
    queryKey: queryKeys.googleCalendar.events(),
  });
  await options.queryClient.invalidateQueries({
    queryKey: queryKeys.googleCalendar.eventsList(),
  });
}

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

  const rawDeadline = payload.deadlineDate?.trim() ?? "";
  if (!rawDeadline) {
    const body: CreateTodoRequest = { title, type: "manual" };
    const descUndated = payload.description?.trim();
    if (descUndated) {
      body.description = descUndated;
    }
    const cid = payload.clientId?.trim();
    if (cid) {
      body.client_id = cid;
    }
    await options.createTodo(body);
    return;
  }

  const deadlineDay = dayjs(rawDeadline, "YYYY-MM-DD", true);
  if (!deadlineDay.isValid()) {
    throw new Error("A valid date (YYYY-MM-DD) is required.");
  }

  const calendarId = options.defaultCalendarId;
  if (options.useCalendarEvent && calendarId) {
    await submitAgendaItemAsGoogleCalendarEvent(
      {
        title,
        description: payload.description,
        deadlineDate: deadlineDay.format("YYYY-MM-DD"),
        deadlineTime: payload.deadlineTime,
        addGoogleMeet: payload.addGoogleMeet,
      },
      {
        calendarId,
        queryClient: options.queryClient,
      }
    );
    return;
  }

  const body: CreateTodoRequest = { title, type: "manual" };
  const descTrimmed = payload.description?.trim();
  if (descTrimmed) {
    body.description = descTrimmed;
  }
  const cid = payload.clientId?.trim();
  if (cid) {
    body.client_id = cid;
  }
  const timeParts = parseAgendaDeadlineTime(payload.deadlineTime);
  if (timeParts) {
    body.due_date = deadlineDay
      .hour(timeParts.hour)
      .minute(timeParts.minute)
      .second(0)
      .millisecond(0)
      .toISOString();
  } else {
    body.due_date = deadlineDay.endOf("day").toISOString();
  }
  await options.createTodo(body);
}
