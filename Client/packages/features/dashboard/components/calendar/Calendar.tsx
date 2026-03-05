import { useCallback, useEffect, useMemo, useState } from "react";

import { CalendarConnectionPrompt } from "packages/features/calendar";
import { useGoogleCalendarStoreIntegration } from "packages/hooks/store/useGoogleCalendarStoreIntegration";
import { type UIState, useUIStore } from "packages/store";
import { dateNow, dateParseISO, dayjs } from "packages/utils/date";
import { getDocument, getWindow } from "packages/utils/platform";

import { CalendarHeader } from "./components/CalendarHeader";
import { CalendarView } from "./components/CalendarView";
import { EventList } from "./components/EventList";

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(() => dateNow().toDate());
  const enqueueToast = useUIStore((s: UIState) => s.enqueueToast);

  const {
    isConnected,
    calendars,
    calendarsLoading,
    calendarsError,
    events,
    eventsLoading,
    eventsError,
    refreshCalendars,
    refreshEvents,
    connectGoogleCalendar,
    disconnectGoogleCalendar: _disconnectGoogleCalendar,
  } = useGoogleCalendarStoreIntegration();

  // Check for OAuth callback (web only; getWindow/getDocument are null on RN)
  useEffect(() => {
    const win = getWindow();
    const doc = getDocument();
    if (!win || !doc) return;

    const urlParams = new URLSearchParams(win.location.search);
    if (urlParams.get("google") === "connected") {
      enqueueToast({
        type: "success",
        message: "Google Calendar connected successfully",
      });
      // Clean up URL
      win.history.replaceState({}, doc.title, win.location.pathname);
      // Refresh calendars and events
      void refreshCalendars();
      void refreshEvents();
    }
  }, [enqueueToast, refreshCalendars, refreshEvents]);

  // Refresh events when connection status changes
  useEffect(() => {
    if (isConnected) {
      void refreshEvents();
    }
  }, [isConnected, refreshEvents]);

  // Handle errors
  useEffect(() => {
    if (calendarsError) {
      enqueueToast({
        type: "error",
        message: `Calendar error: ${calendarsError}`,
      });
    }
    if (eventsError) {
      enqueueToast({
        type: "error",
        message: `Events error: ${eventsError}`,
      });
    }
  }, [calendarsError, eventsError, enqueueToast]);

  const handlePreviousMonth = useCallback(() => {
    setCurrentDate((prev) => {
      return dayjs(prev)
        .month(prev.getMonth() - 1)
        .toDate();
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentDate((prev) => {
      return dayjs(prev)
        .month(prev.getMonth() + 1)
        .toDate();
    });
  }, []);

  const handleToday = useCallback(() => {
    setCurrentDate(dateNow().toDate());
  }, []);

  const handleConnect = useCallback(() => {
    connectGoogleCalendar();
  }, [connectGoogleCalendar]);

  // Filter events for current month
  const currentMonthEvents = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthStart = dayjs([year, month, 1]).startOf("day");
    const monthEnd = dayjs([year, month + 1, 0]).endOf("day");

    return events.filter((event) => {
      try {
        const eventDate = dateParseISO(event.start.dateTime);
        return eventDate.isSameOrAfter(monthStart) && eventDate.isSameOrBefore(monthEnd);
      } catch {
        return false;
      }
    });
  }, [events, currentDate]);

  // Upcoming events (next 7 days)
  const upcomingEvents = useMemo(() => {
    const today = dateNow().startOf("day");
    const nextWeek = today.add(7, "day");

    return events.filter((event) => {
      try {
        const eventDate = dateParseISO(event.start.dateTime);
        return eventDate.isSameOrAfter(today) && eventDate.isBefore(nextWeek);
      } catch {
        return false;
      }
    });
  }, [events]);

  // Show connection prompt if not connected
  if (!isConnected && !calendarsLoading) {
    return (
      <div className="w-full">
        <CalendarConnectionPrompt onConnect={handleConnect} isLoading={calendarsLoading} />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Calendar Header */}
      <CalendarHeader
        currentDate={currentDate}
        onPreviousMonth={handlePreviousMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
        isConnected={isConnected}
        calendars={calendars}
      />

      {/* Loading State */}
      {(calendarsLoading || eventsLoading) && (
        <div className="mb-4 text-center text-sm text-gray-500">Loading calendar...</div>
      )}

      {/* Calendar Grid */}
      <div className="mb-8">
        <CalendarView currentDate={currentDate} events={currentMonthEvents} />
      </div>

      {/* Upcoming Events List */}
      {upcomingEvents.length > 0 && (
        <EventList
          events={upcomingEvents}
          title="Upcoming Events (Next 7 Days)"
          emptyMessage="No upcoming events"
        />
      )}
    </div>
  );
}
