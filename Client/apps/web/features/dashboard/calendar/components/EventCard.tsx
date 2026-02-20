import type { ExtendedGoogleEvent } from "packages/schemas/calendar";
import {
  getEventEndDate,
  getEventStartDate,
} from "packages/utils/domain/calendar/eventParsing";

import Card from "@/components/layout/Card.web";
import { BodyText, Title } from "@/components/ui/index.web";

type EventCardProps = {
  event: ExtendedGoogleEvent;
  onClick?: () => void;
};

export function EventCard({ event, onClick }: EventCardProps) {
  const formatDate = (date: Date) => {
    try {
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

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
        return `${formatDate(start)} • ${formatTime(start)} - ${formatTime(end)}`;
      }

      // Multi-day event
      return `${formatDate(start)} ${formatTime(start)} - ${formatDate(end)} ${formatTime(end)}`;
    } catch {
      return "";
    }
  };

  return (
    <Card
      padding="sm"
      hover={!!onClick}
      onClick={onClick}
      className="mb-2 w-full cursor-pointer border-l-4 border-l-gold transition-all hover:shadow-md"
    >
      <div className="flex flex-col gap-1">
        <Title as="h4" size="sm" className="font-medium text-gray-900">
          {event.summary || "Untitled Event"}
        </Title>
        {formatDateRange() && (
          <BodyText as="p" size="xs" className="text-gray-600 sm:text-sm">
            {formatDateRange()}
          </BodyText>
        )}
        {event.location && (
          <BodyText as="p" size="xs" className="text-gray-500 sm:text-sm">
            {event.location}
          </BodyText>
        )}
        {event.description && (
          <BodyText
            as="p"
            size="xs"
            className="mt-1 line-clamp-2 text-gray-500 sm:text-sm"
          >
            {event.description}
          </BodyText>
        )}
      </div>
    </Card>
  );
}
