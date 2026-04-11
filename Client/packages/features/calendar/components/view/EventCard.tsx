import { useCallback, useMemo, useState } from "react";

import Button from "packages/ui/components/button/Button";
import CancelButton from "packages/ui/components/button/CancelButton";
import { DeleteModal } from "packages/ui/components/modals";
import { Box, Text, TouchableBox } from "packages/ui/components/primitives";

import type {
  Calendar,
  ExtendedGoogleEvent,
} from "@/features/calendar/types/calendar";
import type { GoogleEvent } from "@/features/calendar/types/googleEvent";
import {
  getEventEndDate,
  getEventStartDate,
} from "@/features/calendar/utils/eventParsing";

import { CreateEventModal } from "./CreateEventModal";

type EventCardProps = {
  event: ExtendedGoogleEvent;
  silverKeyCalendarId?: string | null;
  refreshEvents?: () => Promise<void>;
  updateEvent?: (
    eventId: string,
    event: GoogleEvent,
    calendarId?: string,
  ) => Promise<unknown>;
  deleteEvent?: (eventId: string, calendarId?: string) => Promise<void>;
  calendars?: Calendar[];
  onClick?: () => void;
};

function formatDate(date: Date) {
  try {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function formatTime(date: Date) {
  try {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
}

export function EventCard({
  event,
  silverKeyCalendarId = null,
  refreshEvents,
  updateEvent,
  deleteEvent,
  calendars = [],
  onClick,
}: EventCardProps) {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  // Check if event is from a SilverKey calendar (matches "SilverKey" or "SilverKey ~ [Name]")
  const isSilverKeyEvent = useMemo(() => {
    if (!event.calendarId) return false;

    // Check by calendar ID if silverKeyCalendarId is provided
    if (silverKeyCalendarId && event.calendarId === silverKeyCalendarId) {
      return true;
    }

    // Check by calendar name from calendars list
    const calendar = calendars.find((cal) => cal.id === event.calendarId);
    return calendar?.summary?.startsWith("SilverKey") ?? false;
  }, [event.calendarId, silverKeyCalendarId, calendars]);

  const handleEdit = useCallback(() => {
    setEditModalOpen(true);
  }, []);

  const handleCancel = useCallback(() => {
    setCancelConfirmOpen(true);
  }, []);

  const handleEditClose = useCallback(() => {
    setEditModalOpen(false);
  }, []);

  const handleCancelConfirmClose = useCallback(() => {
    setCancelConfirmOpen(false);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!event.id || !deleteEvent) return;
    await deleteEvent(event.id, event.calendarId);
    setCancelConfirmOpen(false);
    await refreshEvents?.();
  }, [event.id, event.calendarId, deleteEvent, refreshEvents]);

  const handleEventUpdated = useCallback(() => {
    setEditModalOpen(false);
    void refreshEvents?.();
  }, [refreshEvents]);

  const dateRange = useMemo(() => {
    try {
      const start = getEventStartDate(event);
      const end = getEventEndDate(event);

      if (!start || !end) {
        return "";
      }

      if (start.toDateString() === end.toDateString()) {
        return `${formatDate(start)} • ${formatTime(start)} - ${formatTime(
          end,
        )}`;
      }

      return `${formatDate(start)} ${formatTime(start)} - ${formatDate(
        end,
      )} ${formatTime(end)}`;
    } catch {
      return "";
    }
  }, [event]);

  // Only allow editing events from SilverKey calendars
  const showEditActions = isSilverKeyEvent && updateEvent && deleteEvent;

  const eventBody = (
    <>
      <Text className="text-text-primary text-left text-sm font-semibold">
        {event.summary || "Untitled Event"}
      </Text>
      {dateRange ? (
        <Text className="text-text-secondary text-left text-xs sm:text-sm">
          {dateRange}
        </Text>
      ) : null}
      {event.location ? (
        <Text className="text-text-secondary text-left text-xs sm:text-sm">
          {event.location}
        </Text>
      ) : null}
      {event.description ? (
        <Text className="text-text-secondary line-clamp-2 text-left text-xs sm:text-sm">
          {event.description}
        </Text>
      ) : null}
    </>
  );

  return (
    <>
      <Box className="border-border bg-background-surface mb-2 ml-2 w-full overflow-hidden rounded-xl border transition-shadow hover:shadow-md">
        <Box className="flex flex-row items-stretch">
          <Box className="bg-accent w-1" />
          <Box className="flex-1 p-3 text-left">
            {onClick ? (
              <TouchableBox
                onPress={onClick}
                className="space-y-1 text-left outline-none"
              >
                {eventBody}
              </TouchableBox>
            ) : (
              <Box className="space-y-1">{eventBody}</Box>
            )}
            {showEditActions ? (
              <Box className="mt-2 flex flex-row gap-2">
                <Button variant="outline" size="sm" onPress={handleEdit}>
                  Edit
                </Button>
                <CancelButton size="sm" onPress={handleCancel}>
                  Cancel
                </CancelButton>
              </Box>
            ) : null}
          </Box>
        </Box>
      </Box>

      {showEditActions && (
        <>
          <CreateEventModal
            isOpen={editModalOpen}
            onClose={handleEditClose}
            mode="edit"
            existingEvent={event}
            calendars={calendars}
            defaultCalendarId={event.calendarId}
            onEventCreated={handleEventUpdated}
            updateEvent={updateEvent}
          />
          <DeleteModal
            isOpen={cancelConfirmOpen}
            onClose={handleCancelConfirmClose}
            onConfirm={handleDeleteConfirm}
            title="Cancel Event"
            message="Are you sure you want to cancel this event? This action cannot be undone."
            confirmText="Cancel Event"
          />
        </>
      )}
    </>
  );
}
