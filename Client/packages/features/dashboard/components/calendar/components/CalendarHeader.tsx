import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

import type { GoogleCalendar } from "packages/types/integrations/googleCalendar";
import { Box } from "packages/ui/components/primitives";

import { BodyText, Button, Title } from "@/components/ui";

type CalendarHeaderProps = {
  currentDate: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  isConnected: boolean;
  calendars?: GoogleCalendar[];
};

export function CalendarHeader({
  currentDate,
  onPreviousMonth,
  onNextMonth,
  onToday,
  isConnected,
  calendars = [],
}: CalendarHeaderProps) {
  const monthYear = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <Box className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Box className="flex items-center gap-2 sm:gap-4">
        <Title as="h2" size="md" className="font-semibold text-gray-900 sm:text-2xl">
          {monthYear}
        </Title>
        <Box className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPreviousMonth}
            className="h-8 w-8 p-0"
            label="Previous month"
            iconName="arrow-left"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNextMonth}
            className="h-8 w-8 p-0"
            label="Next month"
            iconName="chevron-right"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onToday}
            className="ml-2"
            iconName="calendar"
          >
            Today
          </Button>
        </Box>
      </Box>

      <Box className="flex items-center gap-2">
        {isConnected ? (
          <Box className="flex items-center gap-2 text-sm text-gray-600">
            <Box className="h-2 w-2 rounded-full bg-green-500" />
            <BodyText as="span" size="sm" className="text-gray-600">
              Connected
            </BodyText>
            {calendars.length > 0 && (
              <BodyText as="span" size="sm" className="text-gray-400">
                ({calendars.length} {calendars.length === 1 ? "calendar" : "calendars"})
              </BodyText>
            )}
          </Box>
        ) : (
          <Box className="flex items-center gap-2 text-sm text-gray-400">
            <CalendarIcon className="h-4 w-4" />
            <BodyText as="span" size="sm" className="text-gray-400">
              Not connected
            </BodyText>
          </Box>
        )}
      </Box>
    </Box>
  );
}
