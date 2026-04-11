import React from "react";

import Cover from "packages/ui/components/modals/cover";
import { Box, Text } from "packages/ui/components/primitives";

import type { Calendar } from "@/features/calendar/types/calendar";
import type { GoogleEvent } from "@/features/calendar/types/googleEvent";
import type { UpcomingAgendaItem } from "@/features/calendar/utils/mergeUpcomingAgenda";

import { EventCard } from "./EventCard";
import { TodoAgendaRow } from "./TodoAgendaRow";

const sepStyle = { height: 10 };

function agendaItemKey(item: UpcomingAgendaItem, index: number) {
  if (item.kind === "event") {
    return String(item.event.id ?? `event-${index}`);
  }
  return `todo-${item.todo.id}`;
}

type AllAgendaEventsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  items: UpcomingAgendaItem[];
  loading?: boolean;
  silverKeyCalendarId?: string | null;
  refreshEvents?: () => Promise<void>;
  updateEvent?: (
    eventId: string,
    event: GoogleEvent,
    calendarId?: string,
  ) => Promise<unknown>;
  deleteEvent?: (eventId: string, calendarId?: string) => Promise<void>;
  calendars?: Calendar[];
  onToggleAgendaTodo?: (id: string) => void;
  canEditAgendaTodos?: boolean;
};

export function AllAgendaEventsModal({
  isOpen,
  onClose,
  items,
  loading = false,
  silverKeyCalendarId = null,
  refreshEvents,
  updateEvent,
  deleteEvent,
  calendars = [],
  onToggleAgendaTodo,
  canEditAgendaTodos = false,
}: AllAgendaEventsModalProps) {
  return (
    <Cover
      isOpen={isOpen}
      onClose={onClose}
      title="All agenda items"
      showCloseButton
      showHeaderBorder
      animation="slideFromRight"
    >
      {loading ? (
        <Box className="py-6">
          <Text className="text-text-secondary text-center text-sm">
            Loading calendar events…
          </Text>
        </Box>
      ) : items.length === 0 ? (
        <Box className="py-4">
          <Text className="text-text-secondary text-sm">
            No events or to-dos to show.
          </Text>
        </Box>
      ) : (
        <Box className="pb-2">
          {items.map((item, index) => (
            <React.Fragment key={agendaItemKey(item, index)}>
              {index > 0 ? <Box style={sepStyle} /> : null}
              {item.kind === "event" ? (
                <EventCard
                  event={item.event}
                  silverKeyCalendarId={silverKeyCalendarId}
                  refreshEvents={refreshEvents}
                  updateEvent={updateEvent}
                  deleteEvent={deleteEvent}
                  calendars={calendars}
                />
              ) : (
                <TodoAgendaRow
                  todo={item.todo}
                  onToggleComplete={(id) => onToggleAgendaTodo?.(id)}
                  canEditComplete={Boolean(
                    canEditAgendaTodos && onToggleAgendaTodo,
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </Box>
      )}
    </Cover>
  );
}
