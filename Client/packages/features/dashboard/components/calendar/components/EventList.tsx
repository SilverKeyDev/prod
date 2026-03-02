import { BodyText, Title } from "@ui";
import { Card } from "@ui/layout";

import type { GoogleEvent } from "packages/config/api/googleCalendar";
import { dateParseISO } from "packages/utils/date";

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
  // Sort events by start time
  const sortedEvents = [...events].sort((a, b) => {
    try {
      const dateA = dateParseISO(a.start.dateTime).valueOf();
      const dateB = dateParseISO(b.start.dateTime).valueOf();
      return dateA - dateB;
    } catch {
      return 0;
    }
  });

  return (
    <Card padding="md" className="w-full">
      <Title as="h3" size="md" className="mb-4 text-gray-900">
        {title}
      </Title>
      {sortedEvents.length === 0 ? (
        <BodyText as="p" size="sm" className="py-4 text-center text-gray-500">
          {emptyMessage}
        </BodyText>
      ) : (
        <div className="space-y-2">
          {sortedEvents.map((event, index) => (
            <EventCard
              key={event.id || `event-${index}`}
              event={event}
              onClick={() => onEventClick?.(event)}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
