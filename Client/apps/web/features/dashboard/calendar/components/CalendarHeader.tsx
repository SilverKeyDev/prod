import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "../../../../components/ui";
import type { GoogleCalendar } from "../../../../../../packages/config/api/googleCalendar";

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
        <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">
          {monthYear}
        </h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPreviousMonth}
            className="h-8 w-8 p-0"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNextMonth}
            className="h-8 w-8 p-0"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onToday}
            className="ml-2"
          >
            Today
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      <div className="flex items-center gap-2">
        {isConnected ? (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span>Connected</span>
            {calendars.length > 0 && (
              <span className="text-gray-400">
                ({calendars.length} {calendars.length === 1 ? "calendar" : "calendars"})
              </span>
            )}
          </div>
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

