import { useEffect, useRef } from "react";

import type { Dispatch, SetStateAction } from "react";

import type { ViewingStop } from "packages/api/viewings";
import { log, LOG_CATEGORIES } from "packages/logger";
import { dateParseISO, dayjs } from "packages/utils/date";

import type { Calendar, ExtendedGoogleEvent } from "@/features/calendar/types/calendar";
import {
  calendarEventKindFromSummary,
  type CalendarEventKindId,
} from "@/features/calendar/utils/createEventModal/calendarEventKinds";
import { defaultCreateEventTimedRange } from "@/features/calendar/utils/createEventModal/createEventModalDefaults";
import {
  CREATE_EVENT_TIME_STEP_MINUTES,
  googleAllDayEndExclusiveToInclusiveEndYmd,
  quantizeHourMinute,
} from "@/features/calendar/utils/parsing/eventFormGooglePayload";
import type {
  ViewingRouteEndMode,
  ViewingRouteEndpoint,
  ViewingTourAnchor,
  ViewingTourStartSelection,
} from "@/features/calendar/utils/viewing/viewingRoutePlan";
import { inferViewingTourStartSelection } from "@/features/calendar/utils/viewing/viewingRoutePlan";

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
  setViewingStops: (stops: ViewingStop[]) => void;
  setEventKindId: (id: CalendarEventKindId) => void;
  viewingTourAnchors: ViewingTourAnchor[];
  setViewingStartSelection: (v: ViewingTourStartSelection) => void;
  setViewingEndMode: (v: ViewingRouteEndMode) => void;
  setViewingEndFixed: (v: ViewingRouteEndpoint | null) => void;
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
    setViewingStops,
    setEventKindId,
    viewingTourAnchors,
    setViewingStartSelection,
    setViewingEndMode,
    setViewingEndFixed,
  } = p;

  /** Avoid re-seeding on every `existingEvent` reference change (parent re-renders), which cleared edits on blur. */
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
    const itinerary = existingEvent.itinerary;
    const itineraryStops = itinerary?.stops;
    if (itineraryStops && itineraryStops.length > 0) {
      setViewingStops(itineraryStops);
      setEventKindId("property_viewings");
      setViewingStartSelection(
        inferViewingTourStartSelection(itinerary?.start ?? null, viewingTourAnchors)
      );
      setViewingEndMode(
        (itinerary?.end_mode as ViewingRouteEndMode | undefined) ?? "last_property"
      );
      setViewingEndFixed(itinerary?.end ?? null);
    } else {
      setViewingStops([]);
      setViewingStartSelection({ kind: "omit" });
      setViewingEndMode("last_property");
      setViewingEndFixed(null);
      const matched = calendarEventKindFromSummary(existingEvent.summary || "");
      setEventKindId(matched ?? "other");
    }
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
    setViewingStops,
    setEventKindId,
    viewingTourAnchors,
    setViewingStartSelection,
    setViewingEndMode,
    setViewingEndFixed,
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
      // Single calendar day from picker: default to timed (not all-day).
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
      log.error(LOG_CATEGORIES.ERRORS, "Google Maps loading error", googleMapsError);
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
      setViewingStops([]);
      setViewingStartSelection({ kind: "omit" });
      setViewingEndMode("last_property");
      setViewingEndFixed(null);
      setSelectedClientId(null);
      setIsAllDay(false);
      setStartDate("");
      setEndDate("");
      setStartTime("09:00");
      setEndTime("10:00");
      setIsSavingUnscheduled(false);
      setEventKindId("other");
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
    setViewingStops,
    setEventKindId,
    setViewingStartSelection,
    setViewingEndMode,
    setViewingEndFixed,
  ]);
}
