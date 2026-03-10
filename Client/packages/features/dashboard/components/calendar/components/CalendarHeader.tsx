import { BodyText, Button, Title } from "@ui";
import { Icon } from "@ui/icons";

import type { GoogleCalendar } from "packages/config/http/api/googleCalendar";
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
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Month/Year and Navigation */}
      <div className="flex items-center gap-2 sm:gap-4">
        <Title as="h2" size="md" className="text-gray-900">
          {monthYear}
        </Title>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPreviousMonth}
            className="h-8 w-8 p-0"
            label="Previous month"
          >
            <Icon name="chevron-left" className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNextMonth}
            className="h-8 w-8 p-0"
            label="Next month"
          >
            <Icon name="chevron-right" className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onToday} className="ml-2">
            Today
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      <div className="flex items-center gap-2">
        {isConnected ? (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <BodyText as="span" size="sm">
              Connected
            </BodyText>
            {calendars.length > 0 && (
              <BodyText as="span" size="sm" className="text-gray-400">
                ({calendars.length} {calendars.length === 1 ? "calendar" : "calendars"})
              </BodyText>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Icon name="calendar" className="h-4 w-4" />
            <BodyText as="span" size="sm">
              Not connected
            </BodyText>
          </div>
        )}
      </div>
    </div>
  );
}
