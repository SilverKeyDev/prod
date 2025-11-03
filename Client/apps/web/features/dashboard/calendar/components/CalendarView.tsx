import { useMemo } from "react";
import type { GoogleEvent } from "../../../../../../packages/config/api/googleCalendar";
import Card from "../../../../components/layout/Card";

type CalendarViewProps = {
  currentDate: Date;
  events: GoogleEvent[];
  onDateClick?: (date: Date) => void;
};

export function CalendarView({
  currentDate,
  events,
  onDateClick,
}: CalendarViewProps) {
  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, GoogleEvent[]> = {};

    events.forEach((event) => {
      try {
        const eventDate = new Date(event.start.dateTime);
        const dateKey = eventDate.toISOString().split("T")[0]; // YYYY-MM-DD
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
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday

    // Last day of month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Days from previous month to show
    const prevMonth = new Date(year, month, 0);
    const daysInPrevMonth = prevMonth.getDate();

    const days: Array<{
      date: Date;
      isCurrentMonth: boolean;
      isToday: boolean;
      events: GoogleEvent[];
    }> = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Previous month days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, daysInPrevMonth - i);
      const dateKey = date.toISOString().split("T")[0];
      days.push({
        date,
        isCurrentMonth: false,
        isToday: date.getTime() === today.getTime(),
        events: eventsByDate[dateKey] || [],
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = date.toISOString().split("T")[0];
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
        events: eventsByDate[dateKey] || [],
      });
    }

    // Next month days to fill the grid (42 cells = 6 weeks)
    const remainingCells = 42 - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(year, month + 1, day);
      const dateKey = date.toISOString().split("T")[0];
      days.push({
        date,
        isCurrentMonth: false,
        isToday: date.getTime() === today.getTime(),
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
            <button
              key={`${dateKey}-${index}`}
              onClick={() => onDateClick?.(day.date)}
              className={`
                relative min-h-[60px] sm:min-h-[80px] rounded border p-1 text-left transition-colors
                ${day.isCurrentMonth ? "border-beige/30 bg-white" : "border-gray-100 bg-gray-50/50"}
                ${day.isToday ? "border-brown bg-brown/5" : ""}
                hover:border-brown/50 hover:bg-brown/5
                ${onDateClick ? "cursor-pointer" : "cursor-default"}
              `}
            >
              {/* Day number */}
              <div
                className={`
                  mb-1 text-xs font-medium sm:text-sm
                  ${day.isCurrentMonth ? "text-gray-900" : "text-gray-400"}
                  ${day.isToday ? "text-brown font-semibold" : ""}
                `}
              >
                {dayNumber}
              </div>

              {/* Events */}
              <div className="space-y-0.5">
                {day.events.slice(0, 3).map((event, eventIndex) => (
                  <div
                    key={event.id || `event-${eventIndex}`}
                    className="truncate rounded px-1 py-0.5 text-[10px] sm:text-xs bg-olive/10 text-olive font-medium border-l-2 border-olive"
                    title={event.summary}
                  >
                    {event.start.dateTime && (
                      <>
                        {new Date(event.start.dateTime).toLocaleTimeString(
                          "en-US",
                          {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          }
                        )}{" "}
                      </>
                    )}
                    {event.summary || "Untitled"}
                  </div>
                ))}
                {day.events.length > 3 && (
                  <div className="text-[10px] text-gray-500 px-1">
                    +{day.events.length - 3} more
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}