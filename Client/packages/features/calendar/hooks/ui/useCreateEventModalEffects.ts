import { useEffect, useRef } from "react";

import type { Dispatch, SetStateAction } from "react";

import { log } from "packages/logger";
import {
  CREATE_EVENT_TIME_STEP_MINUTES,
  googleAllDayEndExclusiveToInclusiveEndYmd,
  quantizeHourMinute,
} from "packages/utils/comms/calendar/createEvent/eventFormGooglePayload";
import { dateParseISO, dayjs } from "packages/utils/core/date";

import type { Calendar, ExtendedGoogleEvent } from "@/features/calendar/types/calendar";
import {
  calendarEventKindFromSummary,
  type CalendarEventKindId,
} from "@/features/calendar/utils/createEventModal/calendarEventKinds";
import { defaultCreateEventTimedRange } from "@/features/calendar/utils/createEventModal/createEventModalDefaults";

export type UseCreateEventModalEffectsParams = {
  isOpen: boolean;
  mode: "create" | "edit";
  existingEvent: ExtendedGoogleEvent | undefined;
  initialDateMs: number | undefined;
  calendars: Calendar[];
  defaultCalendarId: string | null | undefined;
  googleMapsError: unknown;
  setEventTitle: (v: string) => void;
  setEventDescription: (v: string) => void;
  setEventLocation: (v: string) => void;
  setIsAllDay: (v: boolean) => void;
  setStartDate: (v: string) => void;
  setEndDate: (v: string) => void;
  setStartTime: (v: string) => void;
  setEndTime: (v: string) => void;
  setSelectedCalendarId: Dispatch<SetStateAction<string>>;
  setSelectedClientId: (v: string | null) => void;
  setLoadError: (v: string | null) => void;
  setIsSavingUnscheduled: (v: boolean) => void;
  setEventKindId: (id: CalendarEventKindId) => void;
};

/**
 * Syncs CreateEventModal local state from props and Google Maps (keeps the modal component lean).
 */
export function useCreateEventModalEffects(p: UseCreateEventModalEffectsParams): void {
  const {
    isOpen,
    mode,
    existingEvent,
    initialDateMs,
    calendars,
    defaultCalendarId,
    googleMapsError,
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
    setLoadError,
    setIsSavingUnscheduled,
    setEventKindId,
  } = p;

  const editFormSeededForEventIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      editFormSeededForEventIdRef.current = null;
      return;
    }
    if (mode !== "edit" || !existingEvent) {
      return;
    }
    const eventId = existingEvent.id;
    if (typeof eventId !== "string" || eventId.length === 0) {
      return;
    }
    if (editFormSeededForEventIdRef.current === eventId) {
      return;
    }
    editFormSeededForEventIdRef.current = eventId;

    setEventTitle(existingEvent.summary || "");
    setEventDescription(existingEvent.description || "");
    setEventLocation(existingEvent.location || "");
    const matched = calendarEventKindFromSummary(existingEvent.summary || "");
    setEventKindId(matched ?? "other");

    const allDay = Boolean(existingEvent.start?.date && !existingEvent.start?.dateTime);
    setIsAllDay(allDay);
    if (allDay && existingEvent.start?.date) {
      setStartDate(existingEvent.start.date);
      if (existingEvent.end?.date) {
        try {
          setEndDate(googleAllDayEndExclusiveToInclusiveEndYmd(existingEvent.end.date));
        } catch {
          setEndDate(existingEvent.start.date);
        }
      } else {
        setEndDate(existingEvent.start.date);
      }
      const { startTime: st, endTime: et } = defaultCreateEventTimedRange();
      setStartTime(st);
      setEndTime(et);
    } else {
      const startRaw = existingEvent.start?.dateTime ?? existingEvent.start?.date;
      const endRaw = existingEvent.end?.dateTime ?? existingEvent.end?.date;
      if (startRaw) {
        const startD = dateParseISO(startRaw);
        setStartDate(startD.format("YYYY-MM-DD"));
        const q = quantizeHourMinute(
          startD.hour(),
          startD.minute(),
          CREATE_EVENT_TIME_STEP_MINUTES
        );
        setStartTime(`${String(q.hour).padStart(2, "0")}:${String(q.minute).padStart(2, "0")}`);
      }
      if (endRaw) {
        const endD = dateParseISO(endRaw);
        setEndDate(endD.format("YYYY-MM-DD"));
        const qe = quantizeHourMinute(endD.hour(), endD.minute(), CREATE_EVENT_TIME_STEP_MINUTES);
        setEndTime(`${String(qe.hour).padStart(2, "0")}:${String(qe.minute).padStart(2, "0")}`);
      }
    }
    if (existingEvent.calendarId) {
      setSelectedCalendarId(existingEvent.calendarId);
    }
  }, [
    isOpen,
    mode,
    existingEvent,
    setEndDate,
    setEndTime,
    setEventDescription,
    setEventLocation,
    setEventTitle,
    setIsAllDay,
    setSelectedCalendarId,
    setStartDate,
    setStartTime,
    setEventKindId,
  ]);

  useEffect(() => {
    if (!isOpen || mode === "edit" || initialDateMs == null) {
      return;
    }
    const base = dayjs(initialDateMs);
    const dateStr = base.format("YYYY-MM-DD");
    const hasExplicitTime = base.hour() !== 0 || base.minute() !== 0 || base.second() !== 0;

    if (hasExplicitTime) {
      setIsAllDay(false);
      const q = quantizeHourMinute(base.hour(), base.minute(), CREATE_EVENT_TIME_STEP_MINUTES);
      const st = `${String(q.hour).padStart(2, "0")}:${String(q.minute).padStart(2, "0")}`;
      setStartDate(dateStr);
      setStartTime(st);
      const endDt = base.hour(q.hour).minute(q.minute).second(0).millisecond(0).add(1, "hour");
      setEndDate(endDt.format("YYYY-MM-DD"));
      const qe = quantizeHourMinute(endDt.hour(), endDt.minute(), CREATE_EVENT_TIME_STEP_MINUTES);
      setEndTime(`${String(qe.hour).padStart(2, "0")}:${String(qe.minute).padStart(2, "0")}`);
    } else {
      setIsAllDay(false);
      setStartDate(dateStr);
      setEndDate(dateStr);
      const { startTime: st, endTime: et } = defaultCreateEventTimedRange();
      setStartTime(st);
      setEndTime(et);
    }
  }, [
    initialDateMs,
    isOpen,
    mode,
    setEndDate,
    setEndTime,
    setIsAllDay,
    setStartDate,
    setStartTime,
  ]);

  useEffect(() => {
    if (googleMapsError) {
      log.error("ERRORS", "Google Maps loading error", googleMapsError);
      setLoadError("Failed to load Google Maps script.");
      return;
    }
    setLoadError(null);
  }, [googleMapsError, setLoadError]);

  useEffect(() => {
    if (calendars.length === 0 || !isOpen) return;

    const nextId = (() => {
      if (defaultCalendarId) {
        const silverKeyCalendar = calendars.find((cal) => cal.id === defaultCalendarId);
        if (silverKeyCalendar) return defaultCalendarId;
      }
      const primaryCalendar = calendars.find((cal) => cal.primary) || calendars[0];
      return primaryCalendar?.id;
    })();

    if (nextId) {
      setSelectedCalendarId((prev) => (prev === nextId ? prev : nextId));
    }
  }, [calendars, defaultCalendarId, isOpen, setSelectedCalendarId]);

  useEffect(() => {
    if (!isOpen) {
      setEventTitle("");
      setEventDescription("");
      setEventLocation("");
      setSelectedClientId(null);
      setIsAllDay(false);
      setStartDate("");
      setEndDate("");
      setStartTime("09:00");
      setEndTime("10:00");
      setIsSavingUnscheduled(false);
      setEventKindId("meeting");
    }
  }, [
    isOpen,
    setEndDate,
    setEndTime,
    setEventDescription,
    setEventLocation,
    setEventTitle,
    setIsAllDay,
    setIsSavingUnscheduled,
    setSelectedClientId,
    setStartDate,
    setStartTime,
    setEventKindId,
  ]);
}
