import { useEffect, useState } from "react";

import { log, LOG_CATEGORIES } from "packages/logger";
import type { UIState } from "packages/store";
import { useGoogleMapsStore, useUIStore } from "packages/store";
import type {
  AutocompleteRequest,
  AutocompleteSuggestion,
  GoogleMapsWindow,
} from "packages/types/google-maps";
import Button from "packages/ui/components/button/Button";
import CancelButton from "packages/ui/components/button/CancelButton";
import Dropdown from "packages/ui/components/form/Dropdown";
import { Textarea } from "packages/ui/components/form/FormField";
import { Box } from "packages/ui/components/primitives";
import { asError } from "packages/utils";
import { dateNow, dateParseISO, dayjs } from "packages/utils/date";
import { getWindow } from "packages/utils/platform";

import BaseModal from "@/components/modals/BaseModal";
import { BodyText, CloseButton, DateInput, Input, TimeInput } from "@/components/ui";
import Label from "@/components/ui/text/Label.web";
import { useGoogleEvents } from "@/features/calendar/hooks/data/useGoogleEvents";

import type { Calendar } from "../../types/calendar";
import type { GoogleEvent } from "../../types/googleEvent";

type CreateEventModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date;
  calendars: Calendar[];
  defaultCalendarId?: string | null;
  onEventCreated?: () => void;
};

// Helper function to detect event type from title
function detectEventType(title: string): string | undefined {
  const lowerTitle = title.toLowerCase();

  if (
    lowerTitle.includes("viewing") ||
    lowerTitle.includes("tour") ||
    lowerTitle.includes("showing")
  ) {
    return "property_viewing";
  }
  if (lowerTitle.includes("inspection")) {
    return "inspection";
  }
  if (lowerTitle.includes("closing") || lowerTitle.includes("close")) {
    return "closing";
  }
  if (lowerTitle.includes("meeting")) {
    return "meeting";
  }
  if (lowerTitle.includes("appointment")) {
    return "appointment";
  }
  if (lowerTitle.includes("open house")) {
    return "open_house";
  }

  return undefined; // Let backend handle default
}

export function CreateEventModal({
  isOpen,
  onClose,
  initialDate,
  calendars,
  defaultCalendarId,
  onEventCreated,
}: CreateEventModalProps) {
  const enqueueToast = useUIStore((s: UIState) => s.enqueueToast);
  const { createEvent, isCreatingEvent } = useGoogleEvents();
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

  useEffect(() => {
    if (initialDateMs != null && isOpen) {
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
    } else if (isOpen && initialDateMs == null) {
      const now = dateNow();
      const dateStr = now.format("YYYY-MM-DD");
      const timeStr = now.format("HH:mm");

      setStartDate(dateStr);
      setStartTime(timeStr);

      const endDateTime = now.add(1, "hour");
      setEndDate(endDateTime.format("YYYY-MM-DD"));
      setEndTime(endDateTime.format("HH:mm"));
    }
  }, [initialDateMs, isOpen]);

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

  const handleCreate = async () => {
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
        eventType: detectEventType(eventTitle.trim()),
      };

      await createEvent(eventData);

      enqueueToast({
        type: "success",
        message: "Event created successfully",
      });

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

  const canCreate = eventTitle.trim() && startDate && startTime && endDate && endTime;

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
    <BaseModal isOpen={isOpen} onClose={onClose} size="md">
      <Box className="space-y-4">
        <Box className="flex items-center justify-between border-b border-gray-200 pb-3">
          <Label as="h3" htmlFor="event-title" className="text-base font-medium text-gray-900">
            Create New Event
          </Label>
          <CloseButton onClick={onClose} size="overlay" className="ml-2" />
        </Box>
        {/* Calendar Selection */}
        {calendars.length > 1 && (
          <Dropdown
            label="Calendar"
            options={calendars.map((cal) => ({
              value: cal.id,
              label: cal.summary,
            }))}
            value={selectedCalendarId}
            onChange={(id) => setSelectedCalendarId(id)}
          />
        )}

        {/* Event Title */}
        <Box>
          <Label htmlFor="event-title" required>
            Event Title
          </Label>
          <Input
            id="event-title"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            placeholder="e.g., Property Viewing, Home Inspection"
            className="mt-1"
            // eslint-disable-next-line jsx-a11y/no-autofocus -- Focus title when modal opens
            autoFocus
          />
        </Box>

        {/* Start Date and Time */}
        <Box className="grid grid-cols-2 gap-3">
          <DateInput
            id="start-date"
            label="Start Date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <TimeInput
            id="start-time"
            label="Start Time"
            required
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </Box>

        {/* End Date and Time */}
        <Box className="grid grid-cols-2 gap-3">
          <DateInput
            id="end-date"
            label="End Date"
            required
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <TimeInput
            id="end-time"
            label="End Time"
            required
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </Box>

        {/* Location */}
        <Box>
          <Label htmlFor="event-location">Location (optional)</Label>
          <Input
            id="event-location"
            value={eventLocation}
            onChange={handleEventLocationChange}
            placeholder="e.g., 123 Main St, City, State"
            className="mt-1"
            autoComplete="off"
          />
          {loadError && (
            <BodyText as="p" size="xs" className="text-rose mt-1">
              {loadError} You can still type an address manually.
            </BodyText>
          )}
          {locationSuggestions.length > 0 && (
            <ul className="relative z-50 mt-2 max-h-60 overflow-hidden overflow-y-auto rounded-md border bg-white shadow-sm">
              {locationSuggestions.map((s, idx) => (
                <li key={s.placePrediction.text.text + idx}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLocationSelect(s)}
                    className="w-full cursor-pointer justify-start px-3 py-2 text-left text-sm hover:bg-gray-100"
                  >
                    {s.description}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Box>

        {/* Event Description */}
        <Box>
          <Label htmlFor="event-description">Description (optional)</Label>
          <Textarea
            id="event-description"
            value={eventDescription}
            onChange={(e) => setEventDescription(e.target.value)}
            placeholder="Add any additional details about the event..."
            rows={3}
            className="mt-1"
          />
        </Box>

        {/* Actions */}
        <Box className="flex gap-3 pt-2">
          <CancelButton onClick={onClose} className="flex-1" disabled={isCreatingEvent}>
            Cancel
          </CancelButton>
          <Button
            variant="primary"
            onClick={handleCreate}
            disabled={!canCreate || isCreatingEvent}
            loading={isCreatingEvent}
            className="flex-1"
          >
            {isCreatingEvent ? "Creating..." : "Create Event"}
          </Button>
        </Box>
      </Box>
    </BaseModal>
  );
}
