import { useEffect, useMemo, useRef, useState } from "react";

import { useUserPreferences } from "packages/hooks/data/auth/useUserData";
import { useGoogleEvents } from "packages/hooks/data/calendar";
import { useGoogleCalendarStoreIntegration } from "packages/hooks/store/calendar/useGoogleCalendarStoreIntegration";
import type { ExtendedGoogleEvent } from "packages/schemas/calendar";
import type { DateRange } from "packages/schemas/calendar";
import type { FreebusyTimeBlock } from "packages/schemas/scheduling";
import { dateParseISO } from "packages/utils/core/date";
import {
  findSilverKeyCalendar,
  getCalendarsKey,
  initializeEnabledCalendars,
} from "packages/utils/domain/calendar/calendar";
import {
  calculateCalendarDateRange,
  getVisibleDateRange,
} from "packages/utils/domain/calendar/date";
import { filterCurrentPeriodEvents } from "packages/utils/domain/calendar/eventFiltering";

import Card from "@/components/layout/Card.web";
import { Button } from "@/components/ui/index.web";

type CalendarViewProps = {
  currentDate: Date;
  availability?: FreebusyTimeBlock[];
  onDateClick?: (date: Date) => void;
  silverKeyCalendarId?: string | null;
  onVisibleDatesChange?: (firstDate: Date, lastDate: Date) => void;
};

export function CalendarView({
  currentDate,
  availability,
  onDateClick,
  silverKeyCalendarId,
  onVisibleDatesChange,
}: CalendarViewProps) {
  const { isConnected, calendars } = useGoogleCalendarStoreIntegration();

  const { userPreferences } = useUserPreferences();

  // Initialize enabled calendars from preferences (similar to Calendar.tsx)
  const [enabledCalendarIds, setEnabledCalendarIds] = useState<Set<string>>(
    new Set(),
  );
  const initializedFromPreferencesRef = useRef(false);
  const lastCalendarsRef = useRef<string>("");

  useEffect(() => {
    if (!calendars || calendars.length === 0) {
      return;
    }

    const calendarsKey = getCalendarsKey(calendars);
    const calendarsChanged = lastCalendarsRef.current !== calendarsKey;

    const disabledCalendars = userPreferences?.disabled_calendars;
    const hasDisabledCalendars = Array.isArray(disabledCalendars);

    const silverKeyCalendar = findSilverKeyCalendar(calendars);
    const silverKeyCalendarIdValue =
      silverKeyCalendar?.id || silverKeyCalendarId || null;

    if (!initializedFromPreferencesRef.current || calendarsChanged) {
      const enabledSet = initializeEnabledCalendars(
        calendars,
        hasDisabledCalendars ? disabledCalendars : undefined,
        silverKeyCalendarIdValue,
      );
      setEnabledCalendarIds(enabledSet);
      initializedFromPreferencesRef.current = true;
      lastCalendarsRef.current = calendarsKey;
    }
  }, [calendars, userPreferences, silverKeyCalendarId]);

  // Calculate date range based on currentDate (the month being viewed)
  // This ensures we fetch events for the correct period when navigating months
  const dateRange: DateRange = useMemo(() => {
    return calculateCalendarDateRange(currentDate);
  }, [currentDate]);

  // Read events using React Query hook (cache-only)
  // Events are prefetched by initialDataLoader on page load
  const { events: allEvents } = useGoogleEvents({
    calendarIds: Array.from(enabledCalendarIds),
    timeMin: dateRange.timeMin,
    timeMax: dateRange.timeMax,
    enabled:
      isConnected &&
      calendars &&
      calendars.length > 0 &&
      enabledCalendarIds.size > 0,
  });

  // Filter events for current visible period
  const events = useMemo(() => {
    return filterCurrentPeriodEvents(allEvents, currentDate);
  }, [allEvents, currentDate]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, ExtendedGoogleEvent[]> = {};

    events.forEach((event) => {
      try {
        const eventStart = event.start?.dateTime ?? event.start?.date;
        if (!eventStart) return;
        const eventDate = dateParseISO(eventStart);
        const dateKey = eventDate.format("YYYY-MM-DD");
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

  // Group availability blocks by date
  const availabilityByDate = useMemo(() => {
    if (!availability) return {};

    const grouped: Record<string, FreebusyTimeBlock[]> = {};

    availability.forEach((block) => {
      try {
        const blockStart = dateParseISO(block.start);
        const dateKey = blockStart.format("YYYY-MM-DD");
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(block);
      } catch {
        // Skip invalid dates
      }
    });

    return grouped;
  }, [availability]);

  // Get calendar grid data using utility function (defaults to 5-week month view)
  const calendarGrid = useMemo(() => {
    // Generate calendar grid days using getVisibleDateRange utility
    const { gridDays } = getVisibleDateRange(currentDate, "month");

    if (!gridDays) {
      return [];
    }

    // Map grid days to include events and availability
    return gridDays.map((day) => {
      const dateKey = day.date.toISOString().split("T")[0];
      return {
        ...day,
        events: eventsByDate[dateKey] || [],
        availability: availabilityByDate[dateKey] || [],
      };
    });
  }, [currentDate, eventsByDate, availabilityByDate]);

  // Notify parent of visible date range changes
  // Use utility function to calculate first and last dates directly from currentDate
  // to avoid depending on calendarGrid which gets recreated when eventsByDate or availabilityByDate change
  const visibleDateRange = useMemo(() => {
    const { start, end } = getVisibleDateRange(currentDate);
    return { firstDate: start, lastDate: end };
  }, [currentDate]);

  const lastNotifiedDatesRef = useRef<{
    firstDate: Date;
    lastDate: Date;
  } | null>(null);

  useEffect(() => {
    if (onVisibleDatesChange && visibleDateRange) {
      const { firstDate, lastDate } = visibleDateRange;

      // Only notify if dates have actually changed
      const lastNotified = lastNotifiedDatesRef.current;
      if (
        !lastNotified ||
        firstDate.getTime() !== lastNotified.firstDate.getTime() ||
        lastDate.getTime() !== lastNotified.lastDate.getTime()
      ) {
        lastNotifiedDatesRef.current = { firstDate, lastDate };
        onVisibleDatesChange(firstDate, lastDate);
      }
    }
  }, [visibleDateRange, onVisibleDatesChange]);

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
              size="sm"
              onClick={() => onDateClick?.(day.date)}
              className={`
                relative min-h-16 sm:min-h-20 rounded p-1 text-left transition-colors w-full
                ${day.isFirstOfMonth ? "border-2 border-gold bg-white" : day.isToday ? "border border-olive bg-olive/10" : "border border-beige/30 bg-white"}
                ${day.isPast ? "opacity-50" : ""}
                hover:border-brown/50 hover:bg-brown/5
                ${onDateClick ? "cursor-pointer" : "cursor-default"}
              `}
            >
              {/* Day number */}
              <div
                className={`
                  w-full mb-1 text-xs font-medium sm:text-sm
                  ${day.isPast ? "text-gray-400" : "text-gray-900"}
                  ${day.isToday ? "text-olive font-semibold" : ""}
                `}
              >
                {dayNumber}
              </div>

              {/* Events and/or Availability - w-full so 95% event width is consistent */}
              <div className="w-full min-w-0 space-y-0.5">
                {/* Display events (agent's calendar and client's calendar) */}
                {day.events.slice(0, 3).map((event, eventIndex) => {
                  const isSilverKeyEvent =
                    silverKeyCalendarId &&
                    event.calendarId === silverKeyCalendarId;
                  const isClientEvent = event.isClientEvent === true;
                  return (
                    <div
                      key={event.id || `event-${eventIndex}`}
                      className={`w-[95%] truncate rounded px-1 py-0.5 text-xs font-medium border-l-2 ${
                        day.isPast
                          ? isSilverKeyEvent
                            ? "bg-gold/10 text-gray-600 border-gold/70"
                            : isClientEvent
                              ? "bg-blue-50 text-blue-600 border-blue-400"
                              : "bg-gray-100 text-gray-400 border-gray-300"
                          : isSilverKeyEvent
                            ? "bg-gold/10 text-gray-800 border-gold"
                            : isClientEvent
                              ? "bg-blue-50 text-blue-700 border-blue-500"
                              : "bg-olive/10 text-olive border-olive"
                      }`}
                      title={
                        isClientEvent
                          ? `Client: ${event.summary}`
                          : event.summary
                      }
                    >
                      {event.start.dateTime && (
                        <>
                          {dateParseISO(event.start.dateTime)
                            .toDate()
                            .toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            })}{" "}
                        </>
                      )}
                      {event.summary || "Untitled"}
                    </div>
                  );
                })}
                {/* Display availability blocks (client's busy time) */}
                {availability &&
                  day.availability.slice(0, 3).map((block, blockIndex) => {
                    const startTime = dateParseISO(block.start).toDate();
                    const endTime = dateParseISO(block.end).toDate();
                    const timeStr = `${startTime.toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })} - ${endTime.toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}`;
                    return (
                      <div
                        key={`availability-${blockIndex}`}
                        className={`w-[95%] truncate rounded px-1 py-0.5 text-xs font-medium border-l-2 ${
                          day.isPast
                            ? "bg-gray-100 text-gray-500 border-gray-300"
                            : "bg-red-50 text-red-700 border-red-400"
                        }`}
                        title={`Client Busy: ${timeStr}`}
                      >
                        {timeStr}
                      </div>
                    );
                  })}
                {/* Show "more" indicator if there are more than 3 items total */}
                {(day.events.length > 3 ||
                  (availability && day.availability.length > 3)) && (
                  <div
                    className={`w-[95%] text-xs px-1 ${day.isPast ? "text-gray-400" : "text-gray-500"}`}
                  >
                    +
                    {day.events.length +
                      (availability ? day.availability.length : 0) -
                      3}{" "}
                    more
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
