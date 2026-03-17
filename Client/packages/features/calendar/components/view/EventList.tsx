import React, { useMemo } from "react";

import { color } from "packages/design-tokens";
import Card from "packages/ui/components/cards/Card";
import { Box, ScrollView, Text } from "packages/ui/components/primitives";
import { dateParseISO } from "packages/utils/date";

import type { Calendar } from "@/features/calendar/types/calendar";
import type { ExtendedGoogleEvent } from "@/features/calendar/types/calendar";
import type { GoogleEvent } from "@/features/calendar/types/googleEvent";

import { EventCard } from "./EventCard";

type EventListProps = {
  events: ExtendedGoogleEvent[];
  title?: string;
  emptyMessage?: string;
  onEventClick?: (event: ExtendedGoogleEvent) => void;
  /** When true, render list only (no ScrollView) for embedding in another scroll/list. */
  embedInListHeader?: boolean;
  silverKeyCalendarId?: string | null;
  refreshEvents?: () => Promise<void>;
  updateEvent?: (eventId: string, event: GoogleEvent, calendarId?: string) => Promise<unknown>;
  deleteEvent?: (eventId: string, calendarId?: string) => Promise<void>;
  calendars?: Calendar[];
};

const titleStyle = {
  fontSize: 18,
  fontWeight: "800" as const,
  color: color("neutral.900"),
  marginBottom: 12,
};

const emptyStyle = {
  paddingVertical: 12,
  alignItems: "flex-start" as const,
};

const emptyTextStyle = {
  fontSize: 14,
  color: color("neutral.500"),
  textAlign: "left" as const,
};

const listStyle = {
  paddingBottom: 8,
  alignSelf: "stretch" as const,
  alignItems: "flex-start" as const,
};

const sepStyle = {
  height: 10,
};

export function EventList({
  events,
  title = "Upcoming Events",
  emptyMessage = "No upcoming events",
  onEventClick,
  embedInListHeader = false,
  silverKeyCalendarId = null,
  refreshEvents,
  updateEvent,
  deleteEvent,
  calendars = [],
}: EventListProps) {
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      try {
        const aStart = a.start?.dateTime ?? a.start?.date;
        const bStart = b.start?.dateTime ?? b.start?.date;
        if (!aStart || !bStart) return 0;
        return dateParseISO(aStart).valueOf() - dateParseISO(bStart).valueOf();
      } catch {
        return 0;
      }
    });
  }, [events]);

  const listContent =
    sortedEvents.length === 0 ? (
      <Box style={emptyStyle}>
        <Text style={emptyTextStyle}>{emptyMessage}</Text>
      </Box>
    ) : embedInListHeader ? (
      <Box style={listStyle}>
        {sortedEvents.map((event, index) => (
          <React.Fragment key={String(event.id ?? `event-${index}`)}>
            {index > 0 ? <Box style={sepStyle} /> : null}
            <EventCard
              event={event}
              silverKeyCalendarId={silverKeyCalendarId}
              refreshEvents={refreshEvents}
              updateEvent={updateEvent}
              deleteEvent={deleteEvent}
              calendars={calendars}
              onClick={() => onEventClick?.(event)}
            />
          </React.Fragment>
        ))}
      </Box>
    ) : (
      <ScrollView style={listStyle}>
        {sortedEvents.map((event, index) => (
          <React.Fragment key={String(event.id ?? `event-${index}`)}>
            {index > 0 ? <Box style={sepStyle} /> : null}
            <EventCard
              event={event}
              silverKeyCalendarId={silverKeyCalendarId}
              refreshEvents={refreshEvents}
              updateEvent={updateEvent}
              deleteEvent={deleteEvent}
              calendars={calendars}
              onClick={() => onEventClick?.(event)}
            />
          </React.Fragment>
        ))}
      </ScrollView>
    );

  return (
    <Card className="w-full" padding="md" hover={false}>
      {title ? <Text style={titleStyle}>{title}</Text> : null}
      {listContent}
    </Card>
  );
}
