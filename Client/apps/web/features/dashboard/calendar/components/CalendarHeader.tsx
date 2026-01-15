import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
} from "lucide-react";
import { Button } from "../../../../components/ui";
import { CalendarDropdown } from "./CalendarDropdown";
import type { GoogleCalendar } from "../../../../../../packages/config/api";
import { CalendarDateRange } from "./CalendarDateRange";
import { getVisibleDateRange } from "../../../../../../packages/utils/calendar/date";

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
  visibleDateRange?: { firstDate: Date; lastDate: Date } | null;
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
  visibleDateRange,
}: CalendarHeaderProps) {
  // Use visible dates from CalendarView if available, otherwise fallback to calculated range
  const fallbackRange = getVisibleDateRange(currentDate);
  const displayFirstDate = visibleDateRange?.firstDate ?? fallbackRange.start;
  const displayLastDate = visibleDateRange?.lastDate ?? fallbackRange.end;

  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Week Range and Navigation */}
      <div className="flex items-center gap-2 sm:gap-4">
        <CalendarDateRange
          firstDate={displayFirstDate}
          lastDate={displayLastDate}
        />
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPreviousWeek}
            className="h-8 w-8 p-0"
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4 text-gray-500" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNextWeek}
            className="h-8 w-8 p-0"
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4 text-gray-500" />
          </Button>
        </div>
      </div>

      {/* Connection Status and Actions */}
      <div className="flex items-center gap-2">
        {isConnected ? (
          <>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>Connected</span>
              {calendars.length > 0 && (
                <span className="text-gray-400">
                  ({calendars.length}{" "}
                  {calendars.length === 1 ? "calendar" : "calendars"})
                </span>
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
                variant="olive"
                size="sm"
                onClick={onCreateEvent}
                icon={<Plus className="h-4 w-4" />}
                className="ml-2"
              >
                Create Event
              </Button>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <CalendarIcon className="h-4 w-4" />
            <span>Not connected</span>
          </div>
        )}
      </div>
    </div>
  );
}
