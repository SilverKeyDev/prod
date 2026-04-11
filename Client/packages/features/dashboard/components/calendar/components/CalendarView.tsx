import { useMemo } from "react";

import {
  eventSpansMultipleLocalDays,
  getEventFirstLocalDayKey,
  getEventLocalDayKeys,
} from "packages/features/calendar";
import type { GoogleEvent } from "packages/types/googleCalendar";
import { Box } from "packages/ui/components/primitives";
import { dateNow, dateParseISO, dayjs } from "packages/utils/date";

import Card from "@/components/layout/Card.web";
import { BodyText, Button } from "@/components/ui";

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
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, GoogleEvent[]> = {};

    events.forEach((event) => {
      try {
        for (const dateKey of getEventLocalDayKeys(event)) {
          if (!grouped[dateKey]) {
            grouped[dateKey] = [];
          }
          grouped[dateKey].push(event);
        }
      } catch {
        // Skip invalid dates
      }
    });

    return grouped;
  }, [events]);

  const calendarGrid = useMemo(() => {
    const year = dayjs(currentDate).year();
    const month = dayjs(currentDate).month();

    const firstOfMonth = dayjs().year(year).month(month).date(1);
    const firstDayOfWeek = firstOfMonth.day();
    const daysInMonth = firstOfMonth.daysInMonth();
    const prevMonthEnd = firstOfMonth.subtract(1, "day");

    const days: Array<{
      date: Date;
      isCurrentMonth: boolean;
      isToday: boolean;
      events: GoogleEvent[];
    }> = [];

    const today = dateNow().startOf("day");

    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthEnd.subtract(firstDayOfWeek - 1 - i, "day");
      const dateKey = d.format("YYYY-MM-DD");
      days.push({
        date: d.toDate(),
        isCurrentMonth: false,
        isToday: d.isSame(today, "day"),
        events: eventsByDate[dateKey] || [],
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const d = dayjs().year(year).month(month).date(day);
      const dateKey = d.format("YYYY-MM-DD");
      days.push({
        date: d.toDate(),
        isCurrentMonth: true,
        isToday: d.isSame(today, "day"),
        events: eventsByDate[dateKey] || [],
      });
    }

    const remainingCells = 42 - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      const d = firstOfMonth.add(1, "month").date(day);
      const dateKey = d.format("YYYY-MM-DD");
      days.push({
        date: d.toDate(),
        isCurrentMonth: false,
        isToday: d.isSame(today, "day"),
        events: eventsByDate[dateKey] || [],
      });
    }

    return days;
  }, [currentDate, eventsByDate]);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Card padding="md" className="w-full overflow-hidden">
      <Box className="mb-2 grid grid-cols-7 gap-1">
        {weekDays.map((day) => (
          <Box key={day} className="py-2 text-center">
            <BodyText
              as="span"
              size="xs"
              className="font-semibold text-gray-600 sm:text-sm"
            >
              {day}
            </BodyText>
          </Box>
        ))}
      </Box>

      <Box className="grid grid-cols-7 gap-1">
        {calendarGrid.map((day, index) => {
          const d = dayjs(day.date);
          const dateKey = d.format("YYYY-MM-DD");
          const dayNumber = d.date();

          return (
            <Button
              key={`${dateKey}-${index}`}
              type="button"
              variant="ghost"
              onClick={() => onDateClick?.(day.date)}
              className={`relative h-auto min-h-16 w-full rounded border p-1 text-left transition-colors sm:min-h-20 ${
                day.isCurrentMonth
                  ? "border-beige/30 bg-white"
                  : "border-gray-100 bg-gray-50/50"
              } ${
                day.isToday ? "border-brown bg-brown/5" : ""
              } hover:border-brown/50 hover:bg-brown/5 ${
                onDateClick ? "cursor-pointer" : "cursor-default"
              } `}
            >
              <BodyText
                as="span"
                size="xs"
                className={`mb-1 block font-medium sm:text-sm ${
                  day.isCurrentMonth ? "text-gray-900" : "text-gray-400"
                } ${day.isToday ? "text-brown font-semibold" : ""} `}
              >
                {dayNumber}
              </BodyText>

              <Box className="space-y-0.5">
                {day.events.slice(0, 3).map((event, eventIndex) => {
                  const isMultiDay = eventSpansMultipleLocalDays(event);
                  const firstKey = getEventFirstLocalDayKey(event);
                  const isContinuation = Boolean(
                    isMultiDay && firstKey !== null && dateKey !== firstKey,
                  );
                  const rangeClasses = isContinuation
                    ? "border-dashed border-neutral-400 bg-neutral-200/40"
                    : isMultiDay
                      ? "border-dashed border-olive/70"
                      : "border-solid border-neutral-400";

                  let label: string;
                  if (isContinuation) {
                    label = `→ · ${event.summary || "Untitled"}`;
                  } else if (event.start?.dateTime) {
                    const startTime = dateParseISO(event.start.dateTime)
                      .toDate()
                      .toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      });
                    label = [startTime, event.summary || "Untitled"].join(
                      " · ",
                    );
                  } else if (isMultiDay) {
                    label = `All day · ${event.summary || "Untitled"}`;
                  } else {
                    label = event.summary || "Untitled";
                  }

                  return (
                    <BodyText
                      key={event.id || `event-${eventIndex}`}
                      as="span"
                      size="xs"
                      title={event.summary}
                      className={`bg-olive/10 text-olive truncate rounded border-l-2 px-1 py-0.5 font-medium sm:text-xs ${rangeClasses}`}
                    >
                      {label}
                    </BodyText>
                  );
                })}
                {day.events.length > 3 && (
                  <BodyText as="span" size="xs" className="px-1 text-gray-500">
                    +{day.events.length - 3} more
                  </BodyText>
                )}
              </Box>
            </Button>
          );
        })}
      </Box>
    </Card>
  );
}
