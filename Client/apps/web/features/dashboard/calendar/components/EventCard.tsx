import type { ExtendedGoogleEvent } from "../../../../../../packages/schemas/calendar";
import { getEventStartDate, getEventEndDate } from "../../../../../../packages/utils/calendar/eventParsing";
import Card from "../../../../components/layout/Card";

type EventCardProps = {
  event: ExtendedGoogleEvent;
  onClick?: () => void;
};

export function EventCard({ event, onClick }: EventCardProps) {
  const formatTime = (date: Date) => {
    try {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "";
    }
  };

  const formatDateRange = () => {
    try {
      const start = getEventStartDate(event);
      const end = getEventEndDate(event);
      
      if (!start || !end) {
        return "";
      }
      
      // Same day event
      if (start.toDateString() === end.toDateString()) {
        return `${formatTime(start)} - ${formatTime(end)}`;
      }
      
      // Multi-day event
      return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    } catch {
      return "";
    }
  };

  return (
    <Card
      padding="sm"
      hover={!!onClick}
      onClick={onClick}
      className="mb-2 w-full cursor-pointer border-l-4 border-l-olive transition-all hover:shadow-md"
    >
      <div className="flex flex-col gap-1">
        <h4 className="font-medium text-gray-900">{event.summary || "Untitled Event"}</h4>
        {formatDateRange() && (
          <p className="text-xs text-gray-600 sm:text-sm">{formatDateRange()}</p>
        )}
        {event.location && (
          <p className="text-xs text-gray-500 sm:text-sm">{event.location}</p>
        )}
        {event.description && (
          <p className="mt-1 line-clamp-2 text-xs text-gray-500 sm:text-sm">
            {event.description}
          </p>
        )}
      </div>
    </Card>
  );
}

