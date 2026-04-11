import { useCallback, useState } from "react";

import { useIsAgent } from "packages/hooks/store";
import { log, LOG_CATEGORIES } from "packages/logger";
import type { UIState } from "packages/store";
import { useGoogleMapsStore, useUIStore } from "packages/store";

import { useAgentClients } from "@/features/agent/hooks/data/useAgentClients";
import { useGoogleEvents } from "@/features/calendar/hooks/data/useGoogleEvents";
import { useCreateEventModalEffects } from "@/features/calendar/hooks/ui/useCreateEventModalEffects";
import type {
  Calendar,
  ExtendedGoogleEvent,
} from "@/features/calendar/types/calendar";
import type { CreateEventModalAddWithoutSchedulePayload } from "@/features/calendar/types/createEventModal";
import type {
  GoogleCalendarEventCreateBody,
  GoogleEvent,
} from "@/features/calendar/types/googleEvent";
import { defaultCreateEventTimedRange } from "@/features/calendar/utils/createEventModalDefaults";
import { detectEventTypeFromTitle } from "@/features/calendar/utils/createEventModalDetectEventType";
import {
  buildCreateEventGoogleStartEnd,
  CREATE_EVENT_TIME_STEP_MINUTES,
} from "@/features/calendar/utils/eventFormGooglePayload";

import { CreateEventModalForm } from "./CreateEventModalForm";

export type { CreateEventModalAddWithoutSchedulePayload } from "@/features/calendar/types/createEventModal";

type CreateEventModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date;
  calendars: Calendar[];
  defaultCalendarId?: string | null;
  onEventCreated?: () => void;
  /** When set (e.g. agent dashboard), saves title/description/client as a to-do with no due date. */
  onAddWithoutSchedule?: (
    payload: CreateEventModalAddWithoutSchedulePayload,
  ) => Promise<void>;
  mode?: "create" | "edit";
  existingEvent?: ExtendedGoogleEvent;
  updateEvent?: (
    eventId: string,
    event: GoogleEvent,
    calendarId?: string,
  ) => Promise<unknown>;
};

export function CreateEventModal({
  isOpen,
  onClose,
  initialDate,
  calendars,
  defaultCalendarId,
  onEventCreated,
  onAddWithoutSchedule,
  mode = "create",
  existingEvent,
  updateEvent: updateEventProp,
}: CreateEventModalProps) {
  const enqueueToast = useUIStore((s: UIState) => s.enqueueToast);
  const isAgent = useIsAgent();
  const { clients: _agentClients } = useAgentClients();
  const {
    createEvent,
    updateEvent: updateEventFromHook,
    isCreatingEvent,
    isUpdatingEvent,
  } = useGoogleEvents();
  const updateEvent = updateEventProp ?? updateEventFromHook;
  const isSubmitting = isCreatingEvent || isUpdatingEvent;
  const { isLoaded: googleMapsLoaded, error: googleMapsError } =
    useGoogleMapsStore();

  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [scriptsReady, setScriptsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [isAllDay, setIsAllDay] = useState(false);
  const [selectedCalendarId, setSelectedCalendarId] =
    useState<string>("primary");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isSavingUnscheduled, setIsSavingUnscheduled] = useState(false);

  const initialDateMs = initialDate?.getTime();

  const showAgentClientPicker = mode === "create" && isAgent;

  useCreateEventModalEffects({
    isOpen,
    mode,
    existingEvent,
    initialDateMs,
    calendars,
    defaultCalendarId,
    googleMapsLoaded,
    googleMapsError,
    scriptsReady,
    setEventTitle,
    setEventDescription,
    setEventLocation,
    setIsAllDay,
    setStartDate,
    setEndDate,
    setStartTime,
    setEndTime,
    setSelectedCalendarId,
    setSelectedClientId,
    setScriptsReady,
    setLoadError,
    setIsSavingUnscheduled,
  });

  const onDateRangeChange = useCallback(
    (lo: string, hi: string) => {
      setStartDate(lo);
      setEndDate(hi);

      if (mode === "edit") {
        return;
      }

      const rawStart = lo.trim();
      const rawEnd = hi.trim();
      const scheduleStart = rawStart || rawEnd;
      const scheduleEnd = rawEnd || rawStart || scheduleStart;
      if (!scheduleStart || !scheduleEnd) {
        return;
      }

      setIsAllDay(scheduleStart !== scheduleEnd);
    },
    [mode],
  );

  const onIsAllDayChange = useCallback((next: boolean) => {
    setIsAllDay(next);
    if (!next) {
      const { startTime: st, endTime: et } = defaultCreateEventTimedRange();
      setStartTime(st);
      setEndTime(et);
    }
  }, []);

  const handleSubmit = async () => {
    if (!eventTitle.trim()) {
      enqueueToast({
        type: "error",
        message: "Please enter a title",
      });
      return;
    }

    const rawStart = startDate.trim();
    const rawEnd = endDate.trim();
    const scheduleStartYmd = rawStart || rawEnd;
    const scheduleEndYmd = rawEnd || rawStart || scheduleStartYmd;
    const hasSchedule = Boolean(scheduleStartYmd && scheduleEndYmd);

    if (mode === "edit" && !hasSchedule) {
      enqueueToast({
        type: "error",
        message: "Please fill in all required fields",
      });
      return;
    }

    if (mode === "create" && !hasSchedule) {
      if (!onAddWithoutSchedule) {
        enqueueToast({
          type: "error",
          message: "Add a date to save to your SilverKey calendar",
        });
        return;
      }
      setIsSavingUnscheduled(true);
      try {
        const descTrimmed = eventDescription.trim();
        const locTrimmed = eventLocation.trim();
        const descriptionForTodo =
          !descTrimmed && !locTrimmed
            ? null
            : !locTrimmed
              ? descTrimmed
              : !descTrimmed
                ? `Location: ${locTrimmed}`
                : `${descTrimmed}\n\nLocation: ${locTrimmed}`;

        await onAddWithoutSchedule({
          title: eventTitle.trim(),
          description: descriptionForTodo,
          clientId: selectedClientId,
        });
        enqueueToast({ type: "success", message: "Added to agenda" });
        onEventCreated?.();
        onClose();
      } catch (error) {
        log.error(LOG_CATEGORIES.CALENDAR, "Error adding agenda item", error);
        enqueueToast({
          type: "error",
          message:
            error instanceof Error ? error.message : "Failed to add item",
        });
      } finally {
        setIsSavingUnscheduled(false);
      }
      return;
    }

    if (!isAllDay && (!startTime || !endTime)) {
      enqueueToast({
        type: "error",
        message: "Please select start and end time",
      });
      return;
    }

    let startEnd: Pick<GoogleEvent, "start" | "end">;
    try {
      startEnd = buildCreateEventGoogleStartEnd({
        isAllDay,
        startDate: scheduleStartYmd,
        endDate: scheduleEndYmd,
        startTime,
        endTime,
        timeStepMinutes: CREATE_EVENT_TIME_STEP_MINUTES,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invalid date or time";
      enqueueToast({ type: "error", message: msg });
      return;
    }

    const calendarIdForCreate =
      mode === "create" && defaultCalendarId
        ? defaultCalendarId
        : selectedCalendarId;

    if (mode === "create" && !calendarIdForCreate) {
      enqueueToast({
        type: "error",
        message:
          "Calendar is not available. Connect Google Calendar and try again.",
      });
      return;
    }

    try {
      const eventData: GoogleCalendarEventCreateBody = {
        summary: eventTitle.trim(),
        description: eventDescription.trim() || undefined,
        location: eventLocation.trim() || undefined,
        start: startEnd.start,
        end: startEnd.end,
        calendarId: calendarIdForCreate,
        eventType: detectEventTypeFromTitle(eventTitle.trim()),
      };

      if (mode === "create" && selectedClientId) {
        eventData.target_user_id = selectedClientId;
      }

      if (mode === "edit" && existingEvent?.id && updateEvent) {
        await updateEvent(
          existingEvent.id,
          eventData,
          existingEvent.calendarId,
        );
        enqueueToast({
          type: "success",
          message: "Event updated successfully",
        });
      } else {
        await createEvent(eventData);
        enqueueToast({
          type: "success",
          message: "Added to calendar",
        });
      }

      onEventCreated?.();
      onClose();
    } catch (error) {
      log.error(LOG_CATEGORIES.CALENDAR, "Error creating event", error);
      enqueueToast({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to create event",
      });
    }
  };

  const rawStartForUi = startDate.trim();
  const rawEndForUi = endDate.trim();
  const scheduleStartForUi = rawStartForUi || rawEndForUi;
  const scheduleEndForUi = rawEndForUi || rawStartForUi || scheduleStartForUi;
  const hasSchedule = Boolean(scheduleStartForUi && scheduleEndForUi);
  const canSubmitUnscheduled = Boolean(
    eventTitle.trim() && onAddWithoutSchedule,
  );
  const canSubmitScheduled = Boolean(
    eventTitle.trim() &&
      hasSchedule &&
      (isAllDay || (startTime && endTime)) &&
      (mode === "edit" || Boolean(defaultCalendarId)),
  );

  const canSubmit =
    mode === "edit"
      ? canSubmitScheduled
      : hasSchedule
        ? canSubmitScheduled
        : canSubmitUnscheduled;

  const formSubmitting = isSubmitting || isSavingUnscheduled;
  const primaryActionLabel =
    mode === "edit"
      ? isUpdatingEvent
        ? "Updating..."
        : "Update Event"
      : hasSchedule
        ? isCreatingEvent
          ? "Adding..."
          : "Add"
        : isSavingUnscheduled
          ? "Adding..."
          : "Add";

  const handleEventLocationChange = useCallback((value: string) => {
    setEventLocation(value);
  }, []);

  return (
    <CreateEventModalForm
      isOpen={isOpen}
      onClose={onClose}
      mode={mode}
      calendars={calendars}
      selectedCalendarId={selectedCalendarId}
      onCalendarChange={setSelectedCalendarId}
      hideCalendarPicker={mode === "create"}
      eventTitle={eventTitle}
      onEventTitleChange={(e) => setEventTitle(e.target.value)}
      showAgentClientPicker={showAgentClientPicker}
      selectedClientId={selectedClientId}
      onSelectedClientIdChange={setSelectedClientId}
      isAllDay={isAllDay}
      onIsAllDayChange={onIsAllDayChange}
      startDate={startDate}
      endDate={endDate}
      onDateRangeChange={onDateRangeChange}
      startTime={startTime}
      endTime={endTime}
      onStartTimeChange={setStartTime}
      onEndTimeChange={setEndTime}
      eventLocation={eventLocation}
      onEventLocationChange={handleEventLocationChange}
      locationScriptsReady={scriptsReady}
      loadError={loadError}
      eventDescription={eventDescription}
      onEventDescriptionChange={(e) => setEventDescription(e.target.value)}
      canSubmit={canSubmit}
      isSubmitting={formSubmitting}
      primaryActionLabel={primaryActionLabel}
      onSubmit={handleSubmit}
    />
  );
}
