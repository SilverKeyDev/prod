import { useState, useEffect } from "react";
import BaseModal from "../../../../components/modals/BaseModal";
import Button from "../../../../components/ui/button/Button";
import Input from "../../../../components/ui/form/Input";
import Label from "../../../../components/ui/text/Label";
import { Textarea } from "../../../../components/ui/form/FormField";
import { googleCalendarApi } from "../../../../../../packages/config/api";
import type {
  GoogleEvent,
  GoogleCalendar,
} from "../../../../../../packages/config/api";
import { useUIStore } from "../../../../../../packages/store";
import type { UIState } from "../../../../../../packages/store/ui.slice";
import { log, LOG_CATEGORIES } from "../../../../../../logger";

type CreateEventModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date;
  calendars: GoogleCalendar[];
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

  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedCalendarId, setSelectedCalendarId] =
    useState<string>("primary");
  const [isCreating, setIsCreating] = useState(false);

  // Initialize form with initial date if provided
  useEffect(() => {
    if (initialDate && isOpen) {
      const dateStr = initialDate.toISOString().split("T")[0];
      // If the date has a meaningful time (not midnight), use it; otherwise default to 9 AM
      const hasTime =
        initialDate.getHours() !== 0 || initialDate.getMinutes() !== 0;
      const defaultHour = hasTime ? initialDate.getHours() : 9;
      const defaultMinute = hasTime ? initialDate.getMinutes() : 0;

      const startDateTime = new Date(initialDate);
      startDateTime.setHours(defaultHour, defaultMinute, 0, 0);
      const timeStr = `${String(defaultHour).padStart(2, "0")}:${String(defaultMinute).padStart(2, "0")}`;

      setStartDate(dateStr);
      setStartTime(timeStr);

      // Set end time to 1 hour later by default
      const endDateTime = new Date(startDateTime);
      endDateTime.setHours(endDateTime.getHours() + 1);
      setEndDate(endDateTime.toISOString().split("T")[0]);
      setEndTime(endDateTime.toTimeString().slice(0, 5));
    } else if (isOpen && !initialDate) {
      // Initialize with current date/time if no initial date
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      const timeStr = now.toTimeString().slice(0, 5);

      setStartDate(dateStr);
      setStartTime(timeStr);

      const endDateTime = new Date(now);
      endDateTime.setHours(endDateTime.getHours() + 1);
      setEndDate(endDateTime.toISOString().split("T")[0]);
      setEndTime(endDateTime.toTimeString().slice(0, 5));
    }
  }, [initialDate, isOpen]);

  // Set default calendar when calendars are loaded
  useEffect(() => {
    if (calendars.length > 0 && isOpen) {
      if (defaultCalendarId) {
        // Use SilverKey calendar if available
        const silverKeyCalendar = calendars.find(
          (cal) => cal.id === defaultCalendarId,
        );
        if (silverKeyCalendar) {
          setSelectedCalendarId(defaultCalendarId);
          return;
        }
      }
      // Otherwise use primary calendar or first available
      const primaryCalendar =
        calendars.find((cal) => cal.primary) || calendars[0];
      if (primaryCalendar) {
        setSelectedCalendarId(primaryCalendar.id);
      }
    }
  }, [calendars, defaultCalendarId, isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEventTitle("");
      setEventDescription("");
      setEventLocation("");
      setIsCreating(false);
    }
  }, [isOpen]);

  const handleCreate = async () => {
    if (
      !eventTitle.trim() ||
      !startDate ||
      !startTime ||
      !endDate ||
      !endTime
    ) {
      enqueueToast({
        type: "error",
        message: "Please fill in all required fields",
      });
      return;
    }

    // Validate that end time is after start time
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);

    if (endDateTime <= startDateTime) {
      enqueueToast({
        type: "error",
        message: "End time must be after start time",
      });
      return;
    }

    setIsCreating(true);

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

      const response = await googleCalendarApi.createEvent(eventData);

      if (response.success && response.data) {
        enqueueToast({
          type: "success",
          message: "Event created successfully",
        });

        // Call callback to refresh events
        if (onEventCreated) {
          onEventCreated();
        }

        onClose();
      } else {
        enqueueToast({
          type: "error",
          message: response.error || "Failed to create event",
        });
      }
    } catch (error) {
      log.error(LOG_CATEGORIES.CALENDAR, "Error creating event", error);
      enqueueToast({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to create event",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const canCreate =
    eventTitle.trim() && startDate && startTime && endDate && endTime;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Event"
      size="md"
    >
      <div className="space-y-4">
        {/* Calendar Selection */}
        {calendars.length > 1 && (
          <div>
            <Label htmlFor="calendar-select">Calendar</Label>
            <select
              id="calendar-select"
              value={selectedCalendarId}
              onChange={(e) => setSelectedCalendarId(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brown focus:outline-none focus:ring-1 focus:ring-brown"
            >
              {calendars.map((calendar) => (
                <option key={calendar.id} value={calendar.id}>
                  {calendar.summary}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Event Title */}
        <div>
          <Label htmlFor="event-title" required>
            Event Title
          </Label>
          <Input
            id="event-title"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            placeholder="e.g., Property Viewing, Home Inspection"
            className="mt-1"
            autoFocus
          />
        </div>

        {/* Start Date and Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="start-date" required>
              Start Date
            </Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="start-time" required>
              Start Time
            </Label>
            <Input
              id="start-time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        {/* End Date and Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="end-date" required>
              End Date
            </Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="end-time" required>
              End Time
            </Label>
            <Input
              id="end-time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <Label htmlFor="event-location">Location (optional)</Label>
          <Input
            id="event-location"
            value={eventLocation}
            onChange={(e) => setEventLocation(e.target.value)}
            placeholder="e.g., 123 Main St, City, State"
            className="mt-1"
          />
        </div>

        {/* Event Description */}
        <div>
          <Label htmlFor="event-description">Description (optional)</Label>
          <Textarea
            id="event-description"
            value={eventDescription}
            onChange={(e) => setEventDescription(e.target.value)}
            placeholder="Add any additional details about the event..."
            rows={3}
            className="mt-1"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            variant="olive"
            onClick={handleCreate}
            disabled={!canCreate || isCreating}
            loading={isCreating}
            className="flex-1"
          >
            {isCreating ? "Creating..." : "Create Event"}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
