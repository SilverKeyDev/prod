import { useMemo } from "react";

import { Box, Pressable, Text } from "packages/ui/components/primitives";

import { getEventEndDate, getEventStartDate } from "@/features/calendar/utils/eventParsing";

import type { ExtendedGoogleEvent } from "../../types/calendar";

type EventCardProps = {
  event: ExtendedGoogleEvent;
  onClick?: () => void;
};

function formatDate(date: Date) {
  try {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function formatTime(date: Date) {
  try {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
}

export function EventCard({ event, onClick }: EventCardProps) {
  const dateRange = useMemo(() => {
    try {
      const start = getEventStartDate(event);
      const end = getEventEndDate(event);

      if (!start || !end) {
        return "";
      }

      if (start.toDateString() === end.toDateString()) {
        return `${formatDate(start)} • ${formatTime(start)} - ${formatTime(end)}`;
      }

      return `${formatDate(start)} ${formatTime(start)} - ${formatDate(end)} ${formatTime(end)}`;
    } catch {
      return "";
    }
  }, [event]);

  return (
    <Pressable
      onPress={onClick}
      disabled={!onClick}
      className="mb-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-md disabled:cursor-default disabled:opacity-100"
    >
      <Box className="flex flex-row items-stretch">
        <Box className="bg-gold w-1" />
        <Box className="flex-1 space-y-1 p-3">
          <Text className="text-sm font-semibold text-gray-900">
            {event.summary || "Untitled Event"}
          </Text>
          {dateRange ? <Text className="text-xs text-gray-600 sm:text-sm">{dateRange}</Text> : null}
          {event.location ? (
            <Text className="text-xs text-gray-500 sm:text-sm">{event.location}</Text>
          ) : null}
          {event.description ? (
            <Text className="line-clamp-2 text-xs text-gray-500 sm:text-sm">
              {event.description}
            </Text>
          ) : null}
        </Box>
      </Box>
    </Pressable>
  );
}
