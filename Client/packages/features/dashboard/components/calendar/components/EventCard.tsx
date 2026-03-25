import type { GoogleEvent } from "packages/types/googleCalendar";
import { Box } from "packages/ui/components/primitives";
import { dateParseISO } from "packages/utils/date";

import Card from "@/components/layout/Card.web";
import { BodyText, Title } from "@/components/ui";

type EventCardProps = {
  event: GoogleEvent;
  onClick?: () => void;
};

export function EventCard({ event, onClick }: EventCardProps) {
  const formatTime = (dateTime: string) => {
    try {
      return dateParseISO(dateTime).toDate().toLocaleTimeString("en-US", {
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
      if (!event.start.dateTime || !event.end.dateTime) return "";
      const start = dateParseISO(event.start.dateTime).toDate();
      const end = dateParseISO(event.end.dateTime).toDate();

      if (start.toDateString() === end.toDateString()) {
        return `${formatTime(event.start.dateTime)} - ${formatTime(event.end.dateTime)}`;
      }

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
      className="border-l-olive mb-2 w-full cursor-pointer border-l-4 transition-all hover:shadow-md"
    >
      <Box className="flex flex-col gap-1">
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
          <BodyText as="p" size="xs" className="mt-1 line-clamp-2 text-gray-500 sm:text-sm">
            {event.description}
          </BodyText>
        )}
      </Box>
    </Card>
  );
}
