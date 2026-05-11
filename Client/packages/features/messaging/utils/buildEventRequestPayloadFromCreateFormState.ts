import type { ViewingItinerary } from "packages/api/viewings";
import type { EventRequestPayload } from "packages/features/messaging/types/eventRequest";
import {
  buildCreateEventGoogleStartEnd,
  CREATE_EVENT_TIME_STEP_MINUTES,
} from "packages/utils/calendar/eventFormGooglePayload";
import { dayjs } from "packages/utils/date";

import type { ViewingStop } from "@/features/calendar/components/viewings/ViewingStopList";
import type { GoogleEvent } from "@/features/calendar/types/googleEvent";
import {
  buildViewingItineraryDraftFromForm,
  primaryLocationLabelFromItinerary,
  type ViewingRouteEndMode,
  type ViewingRouteEndpoint,
  type ViewingTourAnchor,
  type ViewingTourStartSelection,
} from "@/features/calendar/utils/viewing/viewingRoutePlan";

function googleStartEndToRequestIso(startEnd: Pick<GoogleEvent, "start" | "end">): {
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
  isPropertyViewing: boolean;
  viewingStops: ViewingStop[];
  viewingStartSelection: ViewingTourStartSelection;
  viewingTourAnchors: ViewingTourAnchor[];
  viewingEndMode: ViewingRouteEndMode;
  viewingEndFixed: ViewingRouteEndpoint | null;
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

  let startEnd: Pick<GoogleEvent, "start" | "end">;
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

  if (input.isPropertyViewing) {
    const itineraryPayload = buildViewingItineraryDraftFromForm({
      stops: input.viewingStops,
      startSelection: input.viewingStartSelection,
      anchors: input.viewingTourAnchors,
      endMode: input.viewingEndMode,
      endFixed: input.viewingEndFixed,
    });
    if (!itineraryPayload) {
      return {
        error: "Add at least one property address for the viewing tour.",
      };
    }
    payload.itinerary = itineraryPayload as ViewingItinerary;
    const loc = primaryLocationLabelFromItinerary(itineraryPayload);
    if (loc) {
      payload.location = loc;
    }
  }

  return { payload };
}
