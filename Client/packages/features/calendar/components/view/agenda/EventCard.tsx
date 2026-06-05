import { useCallback, useMemo, useState } from "react";

import { CreateEventModal } from "packages/features/calendar/components/view/eventModal/CreateEventModal";
import { Button, CancelButton } from "packages/ui";
import { Box, Text, TouchableBox } from "packages/ui/components/structure/primitives";
import DeleteModal from "packages/ui/components/surfaces/modals/standalone/DeleteModal";
import {
  getEventEndDate,
  getEventStartDate,
} from "packages/utils/comms/calendar/parsing/eventParsing";
import {
  formatLocaleTime12HourEnUs,
  formatLocaleWeekdayShortMonthDayEnUs,
} from "packages/utils/core/date";

import type { GoogleCalendar } from "@/features/calendar/api/types";
import { AgendaCompleteControl } from "@/features/calendar/components/view/agenda/AgendaCompleteControl";
import type { Calendar, ExtendedGoogleEvent } from "@/features/calendar/types/calendar";
import type { GoogleEvent } from "@/features/calendar/types/googleEvent";
import { calendarColorForEvent } from "@/features/calendar/utils/createEventModal/calendarEventColors";

type EventCardProps = {
  event: ExtendedGoogleEvent;
  silverKeyCalendarId?: string | null;
  refreshEvents?: () => Promise<void>;
  updateEvent?: (eventId: string, event: GoogleEvent, calendarId?: string) => Promise<unknown>;
  deleteEvent?: (eventId: string, calendarId?: string) => Promise<void>;
  calendars?: Calendar[];
  onClick?: () => void;
  agendaComplete?: boolean;
  onToggleAgendaComplete?: () => void;
  canToggleAgendaComplete?: boolean;
};

function formatDate(date: Date) {
  return formatLocaleWeekdayShortMonthDayEnUs(date);
}

function formatTime(date: Date) {
  return formatLocaleTime12HourEnUs(date);
}

export function EventCard({
  event,
  silverKeyCalendarId: _silverKeyCalendarId = null,
  refreshEvents,
  updateEvent,
  deleteEvent,
  calendars = [],
  onClick,
  agendaComplete = false,
  onToggleAgendaComplete,
  canToggleAgendaComplete = false,
}: EventCardProps) {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

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

  const stripeColor = useMemo(
    () => calendarColorForEvent(event, calendars as GoogleCalendar[]),
    [event, calendars]
  );

  const dateRange = useMemo(() => {
    try {
      const start = getEventStartDate(event);
      const end = getEventEndDate(event);

      if (!start || !end) {
        return "";
      }

      if (start.toDateString() === end.toDateString()) {
        return `${formatDate(start)} • ${formatTime(start)} - ${formatTime(end)}`;
      }

      return `${formatDate(start)} ${formatTime(start)} - ${formatDate(end)} ${formatTime(end)}`;
    } catch {
      return "";
    }
  }, [event]);

  /** Callers pass update/delete only when edits are allowed (e.g. omit for client calendar or view-only). */
  const showEditActions = Boolean(updateEvent && deleteEvent);

  const showAgendaComplete = Boolean(onToggleAgendaComplete);

  const eventBody = (
    <>
      <Text
        className={`text-left text-sm font-semibold ${
          agendaComplete ? "text-text-disabled line-through" : "text-text-primary"
        }`}
      >
        {event.summary || "Untitled Event"}
      </Text>
      {dateRange ? (
        <Text className="text-text-secondary text-left text-xs sm:text-sm">{dateRange}</Text>
      ) : null}
      {event.location ? (
        <Text className="text-text-secondary text-left text-xs sm:text-sm">{event.location}</Text>
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
      <Box className="mb-2 w-full max-w-full pl-2">
        <Box className="border-border bg-background-surface w-full overflow-hidden rounded-xl border transition-shadow hover:shadow-md">
          <Box className="flex flex-row items-stretch">
            <Box className="w-1 shrink-0" style={{ backgroundColor: stripeColor }} />
            <Box className="min-w-0 flex-1 p-3 text-left">
              <Box className="flex flex-row items-start gap-2">
                {showAgendaComplete ? (
                  <AgendaCompleteControl
                    completed={agendaComplete}
                    canToggle={canToggleAgendaComplete}
                    onToggle={() => onToggleAgendaComplete?.()}
                  />
                ) : null}
                <Box className="min-w-0 flex-1">
                  {onClick ? (
                    <TouchableBox onPress={onClick} className="space-y-1 text-left outline-none">
                      {eventBody}
                    </TouchableBox>
                  ) : (
                    <Box className="space-y-1">{eventBody}</Box>
                  )}
                </Box>
                {showEditActions ? (
                  <Box className="flex flex-shrink-0 flex-row flex-wrap justify-end gap-2">
                    <Button variant="outline" size="sm" onPress={handleEdit} iconName="pencil">
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
