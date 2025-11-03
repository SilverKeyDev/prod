import { useState, useEffect, useCallback, useMemo } from "react";
import { useGoogleCalendarStoreIntegration } from "../../../../../packages/hooks/store/useGoogleCalendarStoreIntegration";
import { useUIStore } from "../../../../../packages/store";
import type { UIState } from "../../../../../packages/store/ui.slice";
import { CalendarConnectionPrompt } from "./components/CalendarConnectionPrompt";
import { CalendarHeader } from "./components/CalendarHeader";
import { CalendarView } from "./components/CalendarView";
import { EventList } from "./components/EventList";

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
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
    disconnectGoogleCalendar,
  } = useGoogleCalendarStoreIntegration();

  // Check for OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("google") === "connected") {
      enqueueToast({
        type: "success",
        message: "Google Calendar connected successfully",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
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
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  }, []);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const handleConnect = useCallback(() => {
    connectGoogleCalendar();
  }, [connectGoogleCalendar]);

  // Filter events for current month
  const currentMonthEvents = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

    return events.filter((event) => {
      try {
        const eventDate = new Date(event.start.dateTime);
        return eventDate >= monthStart && eventDate <= monthEnd;
      } catch {
        return false;
      }
    });
  }, [events, currentDate]);

  // Upcoming events (next 7 days)
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    return events.filter((event) => {
      try {
        const eventDate = new Date(event.start.dateTime);
        return eventDate >= today && eventDate <= nextWeek;
      } catch {
        return false;
      }
    });
  }, [events]);

  // Show connection prompt if not connected
  if (!isConnected && !calendarsLoading) {
    return (
      <div className="w-full">
        <CalendarConnectionPrompt
          onConnect={handleConnect}
          isLoading={calendarsLoading}
        />
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
        <div className="mb-4 text-center text-sm text-gray-500">
          Loading calendar...
        </div>
      )}

      {/* Calendar Grid */}
      <div className="mb-8">
        <CalendarView
          currentDate={currentDate}
          events={currentMonthEvents}
        />
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

