import { BodyText, Title } from "@ui";

import type { GoogleEvent } from "packages/features/calendar";
import { Box, Pressable } from "packages/ui/components/primitives";
import { dateFormat, dateParseISO } from "packages/utils/date";

type EventCardProps = {
  event: GoogleEvent;
  onClick?: () => void;
};

export function EventCard({ event, onClick }: EventCardProps) {
  const formatTime = (dateTime: string) => {
    try {
      return dateFormat(dateParseISO(dateTime), "h:mm A");
    } catch {
      return "";
    }
  };

  const formatDateRange = () => {
    try {
      const start = dateParseISO(event.start.dateTime);
      const end = dateParseISO(event.end.dateTime);

      // Same day event
      if (start.isSame(end, "day")) {
        return `${formatTime(event.start.dateTime)} - ${formatTime(event.end.dateTime)}`;
      }

      // Multi-day event
      return `${dateFormat(start, "M/D/YYYY")} - ${dateFormat(end, "M/D/YYYY")}`;
    } catch {
      return "";
    }
  };

  return (
    <Pressable
      onPress={onClick}
      className="border-l-olive mb-2 w-full rounded-lg border border-gray-200 border-l-4 bg-white p-3 shadow-sm transition-all hover:shadow-md"
    >
      <Box className="flex flex-col gap-1">
        <Title as="h4" size="sm" className="font-medium text-gray-900">
          {event.summary || "Untitled Event"}
        </Title>
        {formatDateRange() && (
          <BodyText as="p" size="xs" className="text-gray-600">
            {formatDateRange()}
          </BodyText>
        )}
        {event.location && (
          <BodyText as="p" size="xs" className="text-gray-500">
            {event.location}
          </BodyText>
        )}
        {event.description && (
          <BodyText as="p" size="xs" className="mt-1 line-clamp-2 text-gray-500">
            {event.description}
          </BodyText>
        )}
      </Box>
    </Pressable>
  );
}
