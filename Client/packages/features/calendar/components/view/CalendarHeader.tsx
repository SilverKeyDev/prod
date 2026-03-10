import { Icon } from "@ui/icons";

import type { GoogleCalendar } from "packages/config/http/api";

import { BodyText, Button } from "@/components/ui";
import { getVisibleDateRange } from "@/features/calendar/utils/date";

import { CalendarDateRange } from "./CalendarDateRange";
import { CalendarDropdown } from "./CalendarDropdown";
type CalendarHeaderProps = {
  currentDate: Date;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  isConnected: boolean;
  calendars?: GoogleCalendar[];
  enabledCalendarIds?: Set<string>;
  onToggleCalendar?: (calendarId: string, enabled: boolean) => void;
  silverKeyCalendarId?: string | null;
  onCreateEvent?: () => void;
  visibleDateRange?: {
    firstDate: Date;
    lastDate: Date;
  } | null;
};
export function CalendarHeader({
  currentDate,
  onPreviousWeek,
  onNextWeek,
  isConnected,
  calendars = [],
  enabledCalendarIds = new Set(),
  onToggleCalendar,
  silverKeyCalendarId,
  onCreateEvent,
  visibleDateRange: _visibleDateRange,
}: CalendarHeaderProps) {
  // Derive displayed range from currentDate so the title updates immediately when
  // the user changes the month (avoiding stale visibleDateRange from child effect)
  const { start: displayFirstDate, end: displayLastDate } = getVisibleDateRange(currentDate);
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Week Range and Navigation */}
      <div className="flex items-center gap-2 sm:gap-4">
        <CalendarDateRange firstDate={displayFirstDate} lastDate={displayLastDate} />
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPreviousWeek}
            className="h-8 w-8 p-0"
            label="Previous week"
          >
            <Icon name="chevron-left" className="h-4 w-4 text-gray-500" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNextWeek}
            className="h-8 w-8 p-0"
            label="Next week"
          >
            <Icon name="chevron-right" className="h-4 w-4 text-gray-500" />
          </Button>
        </div>
      </div>

      {/* Connection Status and Actions */}
      <div className="flex items-center gap-2">
        {isConnected ? (
          <>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <BodyText as="span" size="sm" className="hidden text-gray-600 sm:inline">
                Connected
              </BodyText>
              {calendars.length > 0 && (
                <BodyText as="span" size="sm" className="text-gray-400">
                  ({calendars.length} {calendars.length === 1 ? "calendar" : "calendars"})
                </BodyText>
              )}
              <CalendarDropdown
                calendars={calendars}
                enabledCalendarIds={enabledCalendarIds}
                onToggleCalendar={onToggleCalendar || (() => {})}
                silverKeyCalendarId={silverKeyCalendarId}
              />
            </div>
            {onCreateEvent && (
              <Button
                variant="primary"
                size="sm"
                onClick={onCreateEvent}
                icon={<Icon name="plus" className="h-4 w-4" />}
                className="ml-2"
              >
                Create Event
              </Button>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Icon name="calendar" className="h-4 w-4" />
            <BodyText as="span" size="sm" className="text-gray-400">
              Not connected
            </BodyText>
          </div>
        )}
      </div>
    </div>
  );
}
