import { useEffect, useState } from "react";

import type { Calendar, ExtendedGoogleEvent } from "packages/features/calendar/types/calendar";
import type { GoogleEvent } from "packages/features/calendar/types/googleEvent";
import { log, LOG_CATEGORIES } from "packages/logger";
import type { UIState } from "packages/store";
import { useGoogleMapsStore, useUIStore } from "packages/store";
import type {
  AutocompleteRequest,
  AutocompleteSuggestion,
  GoogleMapsWindow,
} from "packages/types/google-maps";
import { asError } from "packages/utils";
import { dateNow, dateParseISO, dayjs } from "packages/utils/date";
import { getWindow } from "packages/utils/platform";

import { useGoogleEvents } from "@/features/calendar/hooks/data/useGoogleEvents";
import { detectEventTypeFromTitle } from "@/features/calendar/utils/createEventModalDetectEventType";

import { CreateEventModalForm } from "./CreateEventModalForm";

type CreateEventModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date;
  calendars: Calendar[];
  defaultCalendarId?: string | null;
  onEventCreated?: () => void;
  mode?: "create" | "edit";
  existingEvent?: ExtendedGoogleEvent;
  updateEvent?: (eventId: string, event: GoogleEvent, calendarId?: string) => Promise<unknown>;
};

export function CreateEventModal({
  isOpen,
  onClose,
  initialDate,
  calendars,
  defaultCalendarId,
  onEventCreated,
  mode = "create",
  existingEvent,
  updateEvent: updateEventProp,
}: CreateEventModalProps) {
  const enqueueToast = useUIStore((s: UIState) => s.enqueueToast);
  const {
    createEvent,
    updateEvent: updateEventFromHook,
    isCreatingEvent,
    isUpdatingEvent,
  } = useGoogleEvents();
  const updateEvent = updateEventProp ?? updateEventFromHook;
  const isSubmitting = isCreatingEvent || isUpdatingEvent;
  const { isLoaded: googleMapsLoaded, error: googleMapsError } = useGoogleMapsStore();

  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<
    Array<{ description: string; placePrediction: AutocompleteSuggestion["placePrediction"] }>
  >([]);
  const [hasSelectedLocation, setHasSelectedLocation] = useState(false);
  const [scriptsReady, setScriptsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>("primary");

  // Initialize form with initial date if provided (use initialDate timestamp to avoid Date ref churn)
  const initialDateMs = initialDate?.getTime();

  // Populate form when editing existing event
  useEffect(() => {
    if (isOpen && mode === "edit" && existingEvent) {
      setEventTitle(existingEvent.summary || "");
      setEventDescription(existingEvent.description || "");
      setEventLocation(existingEvent.location || "");
      const start = existingEvent.start?.dateTime ?? existingEvent.start?.date;
      const end = existingEvent.end?.dateTime ?? existingEvent.end?.date;
      if (start) {
        const startD = dateParseISO(start);
        setStartDate(startD.format("YYYY-MM-DD"));
        setStartTime(startD.format("HH:mm"));
      }
      if (end) {
        const endD = dateParseISO(end);
        setEndDate(endD.format("YYYY-MM-DD"));
        setEndTime(endD.format("HH:mm"));
      }
      if (existingEvent.calendarId) {
        setSelectedCalendarId(existingEvent.calendarId);
      }
    }
  }, [isOpen, mode, existingEvent]);

  useEffect(() => {
    if (initialDateMs != null && isOpen && mode !== "edit") {
      const d = dayjs(initialDateMs);
      const dateStr = d.format("YYYY-MM-DD");
      const hasTime = d.hour() !== 0 || d.minute() !== 0;
      const defaultHour = hasTime ? d.hour() : 9;
      const defaultMinute = hasTime ? d.minute() : 0;

      const startDateTime = d.hour(defaultHour).minute(defaultMinute).second(0).millisecond(0);
      const timeStr = `${String(defaultHour).padStart(2, "0")}:${String(defaultMinute).padStart(2, "0")}`;

      setStartDate(dateStr);
      setStartTime(timeStr);

      const endDateTime = startDateTime.add(1, "hour");
      setEndDate(endDateTime.format("YYYY-MM-DD"));
      setEndTime(endDateTime.format("HH:mm"));
    } else if (isOpen && initialDateMs == null && mode !== "edit") {
      const now = dateNow();
      const dateStr = now.format("YYYY-MM-DD");
      const timeStr = now.format("HH:mm");

      setStartDate(dateStr);
      setStartTime(timeStr);

      const endDateTime = now.add(1, "hour");
      setEndDate(endDateTime.format("YYYY-MM-DD"));
      setEndTime(endDateTime.format("HH:mm"));
    }
  }, [initialDateMs, isOpen, mode]);

  // Update scriptsReady based on centralized Google Maps loading
  useEffect(() => {
    if (googleMapsError) {
      log.error(LOG_CATEGORIES.ERRORS, "Google Maps loading error", googleMapsError);
      setLoadError("Failed to load Google Maps script.");
      return;
    }

    const win = getWindow();
    if (googleMapsLoaded && (win as unknown as GoogleMapsWindow | null)?.google?.maps?.places) {
      setScriptsReady(true);
    }
  }, [googleMapsLoaded, googleMapsError]);

  // Fetch autocomplete suggestions for event location as the user types
  useEffect(() => {
    if (!scriptsReady || !isOpen || eventLocation.trim().length < 3 || hasSelectedLocation) {
      setLocationSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const win = getWindow();
        const googleMapsWindow = win as unknown as GoogleMapsWindow | null;
        if (!googleMapsWindow?.google?.maps?.places) {
          setLocationSuggestions([]);
          return;
        }

        const sessionToken = new googleMapsWindow.google.maps.places.AutocompleteSessionToken();
        const request: AutocompleteRequest = {
          input: eventLocation,
          sessionToken,
          componentRestrictions: {
            country: "US",
          },
        };

        const { suggestions } =
          await googleMapsWindow.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
            request
          );

        const built =
          suggestions?.map((s) => ({
            description: s.placePrediction.text.text,
            placePrediction: s.placePrediction,
          })) ?? [];

        setLocationSuggestions(built);
      } catch (err: unknown) {
        const error = asError(err);
        log.error(LOG_CATEGORIES.ERRORS, "Event location autocomplete error", error);
        setLocationSuggestions([]);
      }
    };

    const win = getWindow();
    const timeoutId = win ? win.setTimeout(fetchSuggestions, 400) : 0;
    return () => {
      if (win && timeoutId) win.clearTimeout(timeoutId);
    };
  }, [eventLocation, hasSelectedLocation, isOpen, scriptsReady]);

  // Set default calendar when calendars are loaded (only update when value actually changes)
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
  }, [calendars, defaultCalendarId, isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEventTitle("");
      setEventDescription("");
      setEventLocation("");
      setLocationSuggestions([]);
      setHasSelectedLocation(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!eventTitle.trim() || !startDate || !startTime || !endDate || !endTime) {
      enqueueToast({
        type: "error",
        message: "Please fill in all required fields",
      });
      return;
    }

    // Validate that end time is after start time
    const startDateTime = dateParseISO(`${startDate}T${startTime}`);
    const endDateTime = dateParseISO(`${endDate}T${endTime}`);

    if (!endDateTime.isAfter(startDateTime)) {
      enqueueToast({
        type: "error",
        message: "End time must be after start time",
      });
      return;
    }

    try {
      // Format dates to ISO 8601 format
      const startISO = startDateTime.toISOString();
      const endISO = endDateTime.toISOString();

      // Get user's timezone
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const eventData: GoogleEvent & { eventType?: string } = {
        summary: eventTitle.trim(),
        description: eventDescription.trim() || undefined,
        location: eventLocation.trim() || undefined,
        start: {
          dateTime: startISO,
          timeZone: timeZone,
        },
        end: {
          dateTime: endISO,
          timeZone: timeZone,
        },
        calendarId: selectedCalendarId,
        // Optional: Add event type detection based on title keywords
        eventType: detectEventTypeFromTitle(eventTitle.trim()),
      };

      if (mode === "edit" && existingEvent?.id && updateEvent) {
        await updateEvent(existingEvent.id, eventData, existingEvent.calendarId);
        enqueueToast({
          type: "success",
          message: "Event updated successfully",
        });
      } else {
        await createEvent(eventData);
        enqueueToast({
          type: "success",
          message: "Event created successfully",
        });
      }

      // Call callback to refresh events
      if (onEventCreated) {
        onEventCreated();
      }

      onClose();
    } catch (error) {
      log.error(LOG_CATEGORIES.CALENDAR, "Error creating event", error);
      enqueueToast({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to create event",
      });
    }
  };

  const canSubmit = eventTitle.trim() && startDate && startTime && endDate && endTime;

  const handleEventLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasSelectedLocation(false);
    setEventLocation(e.target.value);
  };

  const handleLocationSelect = (suggestion: {
    description: string;
    placePrediction: AutocompleteSuggestion["placePrediction"];
  }) => {
    setHasSelectedLocation(true);
    setEventLocation(suggestion.description);
    setLocationSuggestions([]);
  };

  return (
    <CreateEventModalForm
      isOpen={isOpen}
      onClose={onClose}
      mode={mode}
      calendars={calendars}
      selectedCalendarId={selectedCalendarId}
      onCalendarChange={setSelectedCalendarId}
      eventTitle={eventTitle}
      onEventTitleChange={(e) => setEventTitle(e.target.value)}
      startDate={startDate}
      onStartDateChange={(e) => setStartDate(e.target.value)}
      startTime={startTime}
      onStartTimeChange={(e) => setStartTime(e.target.value)}
      endDate={endDate}
      onEndDateChange={(e) => setEndDate(e.target.value)}
      endTime={endTime}
      onEndTimeChange={(e) => setEndTime(e.target.value)}
      eventLocation={eventLocation}
      onEventLocationChange={handleEventLocationChange}
      locationSuggestions={locationSuggestions}
      onLocationSelect={handleLocationSelect}
      loadError={loadError}
      eventDescription={eventDescription}
      onEventDescriptionChange={(e) => setEventDescription(e.target.value)}
      canSubmit={Boolean(canSubmit)}
      isSubmitting={isSubmitting}
      isCreatingEvent={isCreatingEvent}
      isUpdatingEvent={isUpdatingEvent}
      onSubmit={handleSubmit}
    />
  );
}
