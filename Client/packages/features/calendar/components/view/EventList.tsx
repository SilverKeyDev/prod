import React, { useMemo } from "react";

import { color } from "packages/design-tokens";
import type { ExtendedGoogleEvent } from "packages/schemas/calendar";
import { Box, ScrollView, Text } from "packages/ui/components/primitives";
import { dateParseISO } from "packages/utils/date";

import { EventCard } from "./EventCard";

type EventListProps = {
  events: ExtendedGoogleEvent[];
  title?: string;
  emptyMessage?: string;
  onEventClick?: (event: ExtendedGoogleEvent) => void;
  /** When true, render list only (no ScrollView) for embedding in another scroll/list. */
  embedInListHeader?: boolean;
};

const cardStyle = {
  width: "100%" as const,
  borderRadius: 12,
  backgroundColor: color("neutral.50"),
  borderWidth: 1,
  borderColor: color("neutral.200"),
  padding: 16,
};

const titleStyle = {
  fontSize: 18,
  fontWeight: "800" as const,
  color: color("neutral.900"),
  marginBottom: 12,
};

const emptyStyle = {
  paddingVertical: 12,
  alignItems: "center" as const,
};

const emptyTextStyle = {
  fontSize: 14,
  color: color("neutral.500"),
};

const listStyle = {
  paddingBottom: 8,
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
}: EventListProps) {
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      try {
        const dateA = dateParseISO(a.start.dateTime).valueOf();
        const dateB = dateParseISO(b.start.dateTime).valueOf();
        return dateA - dateB;
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
            <EventCard event={event} onClick={() => onEventClick?.(event)} />
          </React.Fragment>
        ))}
      </Box>
    ) : (
      <ScrollView style={listStyle}>
        {sortedEvents.map((event, index) => (
          <React.Fragment key={String(event.id ?? `event-${index}`)}>
            {index > 0 ? <Box style={sepStyle} /> : null}
            <EventCard event={event} onClick={() => onEventClick?.(event)} />
          </React.Fragment>
        ))}
      </ScrollView>
    );

  return (
    <Box style={cardStyle}>
      <Text style={titleStyle}>{title}</Text>
      {listContent}
    </Box>
  );
}
