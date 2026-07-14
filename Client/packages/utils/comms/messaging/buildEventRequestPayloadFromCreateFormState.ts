import {
  buildCreateEventGoogleStartEnd,
  CREATE_EVENT_TIME_STEP_MINUTES,
} from "packages/utils/comms/calendar/createEvent/eventFormGooglePayload";
import type { EventRequestPayload } from "packages/utils/comms/messaging/eventRequestPayload";
import { dayjs } from "packages/utils/core/date";

type GoogleStartEnd = {
  start?: { dateTime?: string; date?: string } | null;
  end?: { dateTime?: string; date?: string } | null;
};

function googleStartEndToRequestIso(startEnd: GoogleStartEnd): {
  start: string;
  end: string;
} | null {
  const s = startEnd.start;
  const e = startEnd.end;
  if (
    s &&
    typeof s === "object" &&
    "dateTime" in s &&
    typeof s.dateTime === "string" &&
    e &&
    typeof e === "object" &&
    "dateTime" in e &&
    typeof e.dateTime === "string"
  ) {
    return { start: s.dateTime, end: e.dateTime };
  }
  if (
    s &&
    typeof s === "object" &&
    "date" in s &&
    typeof s.date === "string" &&
    e &&
    typeof e === "object" &&
    "date" in e &&
    typeof e.date === "string"
  ) {
    const startMs = dayjs(s.date, "YYYY-MM-DD", true).startOf("day").valueOf();
    const endMs = dayjs(e.date, "YYYY-MM-DD", true).subtract(1, "day").endOf("day").valueOf();
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
      return null;
    }
    return { start: dayjs(startMs).toISOString(), end: dayjs(endMs).toISOString() };
  }
  return null;
}

export type BuildEventRequestPayloadFromCreateFormStateInput = {
  eventTitle: string;
  eventDescription: string;
  eventLocation: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
};

export function buildEventRequestPayloadFromCreateFormState(
  input: BuildEventRequestPayloadFromCreateFormStateInput
): { payload: EventRequestPayload } | { error: string } {
  if (!input.eventTitle.trim()) {
    return { error: "Please enter a title" };
  }

  const rawStart = input.startDate.trim();
  const rawEnd = input.endDate.trim();
  const scheduleStartYmd = rawStart || rawEnd;
  const scheduleEndYmd = rawEnd || rawStart || scheduleStartYmd;
  if (!scheduleStartYmd || !scheduleEndYmd) {
    return { error: "Pick a date for the request." };
  }

  if (!input.isAllDay && (!input.startTime || !input.endTime)) {
    return { error: "Pick a start and end time." };
  }

  let startEnd: GoogleStartEnd;
  try {
    startEnd = buildCreateEventGoogleStartEnd({
      isAllDay: input.isAllDay,
      startDate: scheduleStartYmd,
      endDate: scheduleEndYmd,
      startTime: input.startTime,
      endTime: input.endTime,
      timeStepMinutes: CREATE_EVENT_TIME_STEP_MINUTES,
    });
  } catch {
    return { error: "Invalid date or time." };
  }

  const iso = googleStartEndToRequestIso(startEnd);
  if (!iso) {
    return { error: "Invalid schedule." };
  }

  const payload: EventRequestPayload = {
    title: input.eventTitle.trim(),
    start: iso.start,
    end: iso.end,
    description: input.eventDescription.trim() || undefined,
    location: input.eventLocation.trim() || undefined,
  };

  return { payload };
}
