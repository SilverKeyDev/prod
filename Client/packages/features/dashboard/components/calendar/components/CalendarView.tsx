import { useMemo } from "react";

import { Button } from "@ui";
import { Card } from "@ui/layout";

import type { GoogleEvent } from "packages/features/calendar/api";
import { dateFormat, dateNow, dateParseISO, dayjs } from "packages/utils/date";

type CalendarViewProps = {
  currentDate: Date;
  events: GoogleEvent[];
  onDateClick?: (date: Date) => void;
};

export function CalendarView({ currentDate, events, onDateClick }: CalendarViewProps) {
  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, GoogleEvent[]> = {};

    events.forEach((event) => {
      try {
        const eventDate = dateParseISO(event.start.dateTime);
        const dateKey = dateFormat(eventDate, "YYYY-MM-DD");
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(event);
      } catch {
        // Skip invalid dates
      }
    });

    return grouped;
  }, [events]);

  // Get calendar grid data
  const calendarGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of month
    const firstDay = dayjs([year, month, 1]);
    const firstDayOfWeek = firstDay.day(); // 0 = Sunday

    // Last day of month
    const lastDay = dayjs([year, month + 1, 0]);
    const daysInMonth = lastDay.date();

    // Days from previous month to show
    const prevMonth = dayjs([year, month, 0]);
    const daysInPrevMonth = prevMonth.date();

    const days: Array<{
      date: Date;
      isCurrentMonth: boolean;
      isToday: boolean;
      events: GoogleEvent[];
    }> = [];

    const today = dateNow().startOf("day");

    // Previous month days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = dayjs([year, month - 1, daysInPrevMonth - i]);
      const dateKey = date.format("YYYY-MM-DD");
      days.push({
        date: date.toDate(),
        isCurrentMonth: false,
        isToday: date.isSame(today, "day"),
        events: eventsByDate[dateKey] || [],
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = dayjs([year, month, day]);
      const dateKey = date.format("YYYY-MM-DD");
      days.push({
        date: date.toDate(),
        isCurrentMonth: true,
        isToday: date.isSame(today, "day"),
        events: eventsByDate[dateKey] || [],
      });
    }

    // Next month days to fill the grid (42 cells = 6 weeks)
    const remainingCells = 42 - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      const date = dayjs([year, month + 1, day]);
      const dateKey = date.format("YYYY-MM-DD");
      days.push({
        date: date.toDate(),
        isCurrentMonth: false,
        isToday: date.isSame(today, "day"),
        events: eventsByDate[dateKey] || [],
      });
    }

    return days;
  }, [currentDate, eventsByDate]);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Card padding="md" className="w-full overflow-hidden">
      {/* Week day headers */}
      <div className="mb-2 grid grid-cols-7 gap-1">
        {weekDays.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-semibold text-gray-600 sm:text-sm"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarGrid.map((day, index) => {
          const dateKey = day.date.toISOString().split("T")[0];
          const dayNumber = day.date.getDate();

          return (
            <Button
              key={`${dateKey}-${index}`}
              variant="ghost"
              onClick={() => onDateClick?.(day.date)}
              className={`relative min-h-16 w-full rounded border p-1 text-left transition-colors sm:min-h-20 ${day.isCurrentMonth ? "border-beige/30 bg-white" : "border-gray-100 bg-gray-50/50"} ${day.isToday ? "border-brown bg-brown/5" : ""} hover:border-brown/50 hover:bg-brown/5 ${onDateClick ? "cursor-pointer" : "cursor-default"} `}
            >
              {/* Day number */}
              <div
                className={`absolute left-1 top-1 text-xs font-medium sm:text-sm ${day.isCurrentMonth ? "text-gray-900" : "text-gray-400"} ${day.isToday ? "text-brown font-semibold" : ""} `}
              >
                {dayNumber}
              </div>

              {/* Events */}
              <div className="space-y-0.5 pt-5">
                {day.events.slice(0, 3).map((event, eventIndex) => (
                  <div
                    key={event.id || `event-${eventIndex}`}
                    className="bg-olive/10 text-olive border-olive w-[80%] truncate rounded border-l-2 px-1 py-0.5 text-xs font-medium sm:text-xs"
                    title={event.summary}
                  >
                    {event.start.dateTime && (
                      <>{dateFormat(dateParseISO(event.start.dateTime), "h:mm A")} </>
                    )}
                    {event.summary || "Untitled"}
                  </div>
                ))}
                {day.events.length > 3 && (
                  <div className="w-[80%] px-1 text-xs text-gray-500">
                    +{day.events.length - 3} more
                  </div>
                )}
              </div>
            </Button>
          );
        })}
      </div>
    </Card>
  );
}
