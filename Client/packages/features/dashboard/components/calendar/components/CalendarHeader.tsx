import { BodyText, Title } from "@ui";
import { Icon } from "@ui/icons";

import type { GoogleCalendar } from "packages/config/http/api/googleCalendar";
import { Box, Pressable, Text } from "packages/ui/components/primitives";
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
      {/* Month/Year and Navigation */}
      <Box className="flex items-center gap-2 sm:gap-4">
        <Title as="h2" size="md" className="text-gray-900">
          {monthYear}
        </Title>
        <Box className="flex items-center gap-1">
          <Pressable
            onPress={onPreviousMonth}
            className="h-8 w-8 items-center justify-center rounded border border-gray-200 bg-gray-50 hover:bg-gray-100"
          >
            <Icon name="chevron-left" className="h-4 w-4" />
          </Pressable>
          <Pressable
            onPress={onNextMonth}
            className="h-8 w-8 items-center justify-center rounded border border-gray-200 bg-gray-50 hover:bg-gray-100"
          >
            <Icon name="chevron-right" className="h-4 w-4" />
          </Pressable>
          <Pressable
            onPress={onToday}
            className="ml-2 rounded border border-gray-300 bg-white px-3 py-1 hover:bg-gray-50"
          >
            <Text className="text-sm font-medium text-gray-700">Today</Text>
          </Pressable>
        </Box>
      </Box>

      {/* Connection Status */}
      <Box className="flex items-center gap-2">
        {isConnected ? (
          <Box className="flex items-center gap-2 text-sm text-gray-600">
            <Box className="h-2 w-2 rounded-full bg-green-500" />
            <BodyText as="span" size="sm">
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
            <Icon name="calendar" className="h-4 w-4" />
            <BodyText as="span" size="sm">
              Not connected
            </BodyText>
          </Box>
        )}
      </Box>
    </Box>
  );
}
