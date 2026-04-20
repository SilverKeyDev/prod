import type { ViewingItinerary } from "packages/api/viewings";
import { log, LOG_CATEGORIES } from "packages/logger";

import type { ViewingStop } from "@/features/calendar/components/viewings/ViewingStopList";
import type { ExtendedGoogleEvent } from "@/features/calendar/types/calendar";
import type { CreateEventModalAddWithoutSchedulePayload } from "@/features/calendar/types/createEventModal";
import type {
  GoogleCalendarEventCreateBody,
  GoogleEvent,
} from "@/features/calendar/types/googleEvent";
import {
  buildCreateEventGoogleStartEnd,
  CREATE_EVENT_TIME_STEP_MINUTES,
} from "@/features/calendar/utils/parsing/eventFormGooglePayload";

import { detectEventTypeFromTitle } from "./createEventModalDetectEventType";

export type RunCreateEventModalSubmitParams = {
  mode: "create" | "edit";
  eventTitle: string;
  /** When set, used as Google/event `eventType` instead of inferring from title. */
  explicitEventType?: string;
  eventDescription: string;
  eventLocation: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  selectedCalendarId: string;
  defaultCalendarId?: string | null;
  selectedClientId: string | null;
  showAgentClientPicker: boolean;
  agentMultiStopViewing: boolean;
  isPropertyViewing: boolean;
  viewingStops: ViewingStop[];
  existingEvent?: ExtendedGoogleEvent;
  onAddWithoutSchedule?: (payload: CreateEventModalAddWithoutSchedulePayload) => Promise<void>;
  createEvent: (body: GoogleCalendarEventCreateBody) => Promise<unknown>;
  updateEvent?: (eventId: string, event: GoogleEvent, calendarId?: string) => Promise<unknown>;
  onEventCreated?: () => void;
  onClose: () => void;
  setIsSavingUnscheduled: (next: boolean) => void;
  enqueueToast: (toast: { type: "error" | "success"; message: string }) => void;
  /** Forwarded to `buildCreateEventGoogleStartEnd` for timed events (e.g. quick-create). */
  clampTimedEndToStartLocalDay?: boolean;
};

export async function runCreateEventModalSubmit(p: RunCreateEventModalSubmitParams): Promise<void> {
  if (!p.eventTitle.trim()) {
    p.enqueueToast({
      type: "error",
      message: "Please enter a title",
    });
    return;
  }

  const rawStart = p.startDate.trim();
  const rawEnd = p.endDate.trim();
  const scheduleStartYmd = rawStart || rawEnd;
  const scheduleEndYmd = rawEnd || rawStart || scheduleStartYmd;
  const hasSchedule = Boolean(scheduleStartYmd && scheduleEndYmd);

  if (p.mode === "edit" && !hasSchedule) {
    p.enqueueToast({
      type: "error",
      message: "Please fill in all required fields",
    });
    return;
  }

  if (p.mode === "create" && !hasSchedule) {
    if (!p.onAddWithoutSchedule) {
      p.enqueueToast({
        type: "error",
        message: "Add a date to save to your SilverKey calendar",
      });
      return;
    }
    p.setIsSavingUnscheduled(true);
    try {
      const descTrimmed = p.eventDescription.trim();
      const locTrimmed = p.eventLocation.trim();
      const viewingAddresses = p.isPropertyViewing
        ? p.viewingStops.map((s) => s.address.trim()).filter(Boolean)
        : [];
      const viewingBlock =
        p.isPropertyViewing && viewingAddresses.length > 0
          ? `Stops:\n${viewingAddresses.map((a, i) => `${i + 1}. ${a}`).join("\n")}`
          : "";
      const parts = [
        descTrimmed || null,
        !locTrimmed || p.isPropertyViewing ? null : `Location: ${locTrimmed}`,
        viewingBlock || null,
      ].filter(Boolean);
      const descriptionForTodo = parts.length ? parts.join("\n\n") : null;

      await p.onAddWithoutSchedule({
        title: p.eventTitle.trim(),
        description: descriptionForTodo,
        clientId: p.selectedClientId,
      });
      p.enqueueToast({ type: "success", message: "Added to agenda" });
      p.onEventCreated?.();
      p.onClose();
    } catch (error) {
      log.error(LOG_CATEGORIES.CALENDAR, "Error adding agenda item", error);
      p.enqueueToast({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to add item",
      });
    } finally {
      p.setIsSavingUnscheduled(false);
    }
    return;
  }

  if (!p.isAllDay && (!p.startTime || !p.endTime)) {
    p.enqueueToast({
      type: "error",
      message: "Please select start and end time",
    });
    return;
  }

  let startEnd: Pick<GoogleEvent, "start" | "end">;
  try {
    startEnd = buildCreateEventGoogleStartEnd({
      isAllDay: p.isAllDay,
      startDate: scheduleStartYmd,
      endDate: scheduleEndYmd,
      startTime: p.startTime,
      endTime: p.endTime,
      timeStepMinutes: CREATE_EVENT_TIME_STEP_MINUTES,
      clampTimedEndToStartLocalDay: p.clampTimedEndToStartLocalDay,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Invalid date or time";
    p.enqueueToast({ type: "error", message: msg });
    return;
  }

  const calendarIdForCreate =
    p.mode === "create" && p.defaultCalendarId ? p.defaultCalendarId : p.selectedCalendarId;

  if (p.mode === "create" && !calendarIdForCreate) {
    p.enqueueToast({
      type: "error",
      message: "Calendar is not available. Connect Google Calendar and try again.",
    });
    return;
  }

  try {
    const titleHint = detectEventTypeFromTitle(p.eventTitle.trim());
    const eventType =
      p.showAgentClientPicker && p.agentMultiStopViewing
        ? "property_viewing"
        : (p.explicitEventType ?? titleHint);
    const eventData: GoogleCalendarEventCreateBody = {
      summary: p.eventTitle.trim(),
      description: p.eventDescription.trim() || undefined,
      location: p.eventLocation.trim() || undefined,
      start: startEnd.start,
      end: startEnd.end,
      calendarId: calendarIdForCreate,
      eventType,
    };

    if (p.isPropertyViewing) {
      const nonEmptyStops = p.viewingStops.filter((s) => s.address.trim());
      if (nonEmptyStops.length > 0) {
        const itineraryPayload: ViewingItinerary = {
          stops: nonEmptyStops,
          ordered: false,
          legs: null,
        };
        eventData.itinerary = itineraryPayload;
        const first = itineraryPayload.stops[0];
        if (first) {
          eventData.location = (first.label ?? first.address) as string;
        }
      }
    }

    if (p.mode === "create" && p.selectedClientId) {
      eventData.target_user_id = p.selectedClientId;
    }

    if (p.mode === "edit" && p.existingEvent?.id && p.updateEvent) {
      await p.updateEvent(p.existingEvent.id, eventData, p.existingEvent.calendarId);
      p.enqueueToast({
        type: "success",
        message: "Event updated successfully",
      });
    } else {
      await p.createEvent(eventData);
      p.enqueueToast({
        type: "success",
        message: "Added to calendar",
      });
    }

    p.onEventCreated?.();
    p.onClose();
  } catch (error) {
    log.error(LOG_CATEGORIES.CALENDAR, "Error creating event", error);
    p.enqueueToast({
      type: "error",
      message: error instanceof Error ? error.message : "Failed to create event",
    });
  }
}
