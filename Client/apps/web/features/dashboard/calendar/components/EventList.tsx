import type { GoogleEvent } from "../../../../../../packages/config/api/googleCalendar";
import { EventCard } from "./EventCard";
import Card from "../../../../components/layout/Card";

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
      const dateA = new Date(a.start.dateTime).getTime();
      const dateB = new Date(b.start.dateTime).getTime();
      return dateA - dateB;
    } catch {
      return 0;
    }
  });

  return (
    <Card padding="md" className="w-full">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>
      {sortedEvents.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-500">{emptyMessage}</p>
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

