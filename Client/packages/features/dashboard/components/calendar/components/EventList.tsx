import type { GoogleEvent } from "packages/types/integrations/googleCalendar";
import { Box } from "packages/ui/components/primitives";
import { dateParseISO } from "packages/utils/date";

import Card from "@/components/layout/Card.web";
import { BodyText, Title } from "@/components/ui";

import { EventCard } from "./EventCard";

type EventListProps = {
  events: GoogleEvent[];
  title?: string;
  emptyMessage?: string;
  onEventClick?: (event: GoogleEvent) => void;
};

export function EventList({
  events,
  title = "Upcoming Events",
  emptyMessage = "No upcoming events",
  onEventClick,
}: EventListProps) {
  const sortedEvents = [...events].sort((a, b) => {
    try {
      if (!a.start.dateTime || !b.start.dateTime) return 0;
      const dateA = dateParseISO(a.start.dateTime).valueOf();
      const dateB = dateParseISO(b.start.dateTime).valueOf();
      return dateA - dateB;
    } catch {
      return 0;
    }
  });

  return (
    <Card padding="md" className="w-full">
      <Title as="h3" size="sm" className="mb-4 font-semibold text-gray-900">
        {title}
      </Title>
      {sortedEvents.length === 0 ? (
        <BodyText as="p" size="sm" className="py-4 text-center text-gray-500">
          {emptyMessage}
        </BodyText>
      ) : (
        <Box className="space-y-2">
          {sortedEvents.map((event, index) => (
            <EventCard
              key={event.id || `event-${index}`}
              event={event}
              onClick={() => onEventClick?.(event)}
            />
          ))}
        </Box>
      )}
    </Card>
  );
}
