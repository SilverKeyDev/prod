import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useGoogleCalendarStoreIntegration } from "../../../../../packages/hooks/store/useGoogleCalendarStoreIntegration";
import { useUserPreferences } from "../../../../../packages/hooks/data/useUserData";
import { preferencesApi } from "../../../../../packages/config/api/preferences";
import { useUIStore } from "../../../../../packages/store";
import type { UIState } from "../../../../../packages/store/ui.slice";
import { CalendarConnectionPrompt } from "./components/CalendarConnectionPrompt";
import { CalendarHeader } from "./components/CalendarHeader";
import { CalendarView } from "./components/CalendarView";
import { EventList } from "./components/EventList";
import { CreateEventModal } from "./components/CreateEventModal";
import { googleCalendarApi } from "../../../../../packages/config/api/googleCalendar";
import type { GoogleEvent } from "../../../../../packages/config/api/googleCalendar";

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [enabledCalendarIds, setEnabledCalendarIds] = useState<Set<string>>(new Set());
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [selectedDateForEvent, setSelectedDateForEvent] = useState<Date | undefined>(undefined);
  const enqueueToast = useUIStore((s: UIState) => s.enqueueToast);
  const { userPreferences, refreshUserPreferences } = useUserPreferences();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initializedFromPreferencesRef = useRef(false);
  const lastCalendarsRef = useRef<string>("");
  const hadDisabledCalendarsRef = useRef(false);

  const {
    isConnected,
    calendars,
    calendarsLoading,
    calendarsError,
    events: baseEvents,
    eventsLoading,
    eventsError,
    refreshCalendars,
    refreshEvents,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
  } = useGoogleCalendarStoreIntegration();

  // Fetch events from all enabled calendars
  const [allEvents, setAllEvents] = useState<GoogleEvent[]>([]);
  const [fetchingEvents, setFetchingEvents] = useState(false);

  // Fetch events from all enabled calendars
  useEffect(() => {
    if (!isConnected || calendars.length === 0 || enabledCalendarIds.size === 0) {
      setAllEvents([]);
      return;
    }

    const fetchAllEvents = async () => {
      setFetchingEvents(true);
      try {
        // Calculate date range to cover current month view and upcoming events
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const monthStart = new Date(year, month, 1);
        monthStart.setHours(0, 0, 0, 0);
        
        // Get end of current month and extend a bit for upcoming events view
        const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);
        const now = new Date();
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const timeMax = sevenDaysFromNow > monthEnd ? sevenDaysFromNow : monthEnd;
        
        const timeMin = monthStart.toISOString();
        const timeMaxISO = timeMax.toISOString();

        // Fetch events from all enabled calendars
        const eventPromises = Array.from(enabledCalendarIds).map(async (calendarId) => {
          try {
            const response = await googleCalendarApi.listEvents({
              calendarId,
              timeMin,
              timeMax: timeMaxISO,
            });
            if (response.success && response.data?.items) {
              // Tag each event with its calendarId
              return response.data.items.map((event) => ({
                ...event,
                calendarId,
              }));
            }
            return [];
          } catch (error) {
            console.error(`Failed to fetch events from calendar ${calendarId}:`, error);
            return [];
          }
        });

        const eventArrays = await Promise.all(eventPromises);
        const allFetchedEvents = eventArrays.flat();
        setAllEvents(allFetchedEvents);
      } catch (error) {
        console.error("Error fetching events from enabled calendars:", error);
      } finally {
        setFetchingEvents(false);
      }
    };

    void fetchAllEvents();
  }, [isConnected, calendars, enabledCalendarIds, currentDate]);

  // Use fetched events if available, otherwise fall back to baseEvents
  const events = allEvents.length > 0 ? allEvents : baseEvents;

  // Get or create SilverKey calendar whenever calendar page is opened
  const silverKeyCalendarIdRef = useRef<string | null>(null);
  const creatingSilverKeyCalendarRef = useRef(false);
  
  useEffect(() => {
    if (!isConnected || calendars.length === 0) {
      return;
    }

    // Check if SilverKey calendar exists (exact name match)
    const silverKeyCalendar = calendars.find((cal) => cal.summary === "SilverKey");
    
    if (silverKeyCalendar) {
      silverKeyCalendarIdRef.current = silverKeyCalendar.id;
    } else if (!creatingSilverKeyCalendarRef.current) {
      // Create SilverKey calendar if it doesn't exist
      creatingSilverKeyCalendarRef.current = true;
      const createSilverKeyCalendar = async () => {
        try {
          const response = await googleCalendarApi.getOrCreateSilverKeyCalendar();
          if (response.success && response.data) {
            silverKeyCalendarIdRef.current = response.data.id;
            // Refresh calendars to include the new one
            await refreshCalendars();
          }
        } catch (error) {
          console.error("Failed to create SilverKey calendar:", error);
        } finally {
          creatingSilverKeyCalendarRef.current = false;
        }
      };
      void createSilverKeyCalendar();
    }
  }, [isConnected, calendars, refreshCalendars]);

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

  const handleDateClick = useCallback((date: Date) => {
    setSelectedDateForEvent(date);
    setIsCreateEventModalOpen(true);
  }, []);

  const handleOpenCreateEventModal = useCallback(() => {
    setSelectedDateForEvent(undefined);
    setIsCreateEventModalOpen(true);
  }, []);

  const handleEventCreated = useCallback(() => {
    // Refresh events after creation
    void refreshEvents();
    // Also trigger a refetch of all events
    setFetchingEvents(true);
    const fetchAllEvents = async () => {
      try {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const monthStart = new Date(year, month, 1);
        monthStart.setHours(0, 0, 0, 0);
        
        const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);
        const now = new Date();
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const timeMax = sevenDaysFromNow > monthEnd ? sevenDaysFromNow : monthEnd;
        
        const timeMin = monthStart.toISOString();
        const timeMaxISO = timeMax.toISOString();

        const eventPromises = Array.from(enabledCalendarIds).map(async (calendarId) => {
          try {
            const response = await googleCalendarApi.listEvents({
              calendarId,
              timeMin,
              timeMax: timeMaxISO,
            });
            if (response.success && response.data?.items) {
              return response.data.items.map((event) => ({
                ...event,
                calendarId,
              }));
            }
            return [];
          } catch (error) {
            console.error(`Failed to fetch events from calendar ${calendarId}:`, error);
            return [];
          }
        });

        const eventArrays = await Promise.all(eventPromises);
        const allFetchedEvents = eventArrays.flat();
        setAllEvents(allFetchedEvents);
      } catch (error) {
        console.error("Error fetching events from enabled calendars:", error);
      } finally {
        setFetchingEvents(false);
      }
    };
    void fetchAllEvents();
  }, [currentDate, enabledCalendarIds, refreshEvents]);


  const handleConnect = useCallback(() => {
    connectGoogleCalendar();
  }, [connectGoogleCalendar]);

  // Initialize enabled calendars from preferences or default to all enabled
  useEffect(() => {
    if (calendars.length === 0) {
      return;
    }

    // Create a stable key from calendar IDs to detect when calendars change
    const calendarsKey = calendars.map((cal) => cal.id).sort().join(",");
    const calendarsChanged = lastCalendarsRef.current !== calendarsKey;
    
    // Check if disabled_calendars just became available
    const disabledCalendars = userPreferences?.disabled_calendars;
    const hasDisabledCalendars = Array.isArray(disabledCalendars);
    const disabledCalendarsJustLoaded = !hadDisabledCalendarsRef.current && hasDisabledCalendars;
    
    // Track if we have disabled_calendars now
    if (hasDisabledCalendars) {
      hadDisabledCalendarsRef.current = true;
    }

    // Find SilverKey calendar (exact name match)
    const silverKeyCalendar = calendars.find((cal) => cal.summary === "SilverKey");
    if (silverKeyCalendar) {
      silverKeyCalendarIdRef.current = silverKeyCalendar.id;
    }

    // Initialize from preferences when:
    // 1. We haven't initialized yet, OR
    // 2. The calendars list has changed (new calendars added/removed), OR
    // 3. disabled_calendars just loaded (wasn't available, now is)
    if (!initializedFromPreferencesRef.current || calendarsChanged || disabledCalendarsJustLoaded) {
      const disabledSet = new Set(hasDisabledCalendars ? disabledCalendars : []);
      // All calendars are enabled by default, except those in disabled_calendars
      // But always ensure SilverKey calendar is enabled
      const enabledSet = new Set(
        calendars
          .map((cal) => cal.id)
          .filter((id) => {
            // Always include SilverKey calendar
            if (silverKeyCalendar && id === silverKeyCalendar.id) {
              return true;
            }
            // Include others if not disabled
            return !disabledSet.has(id);
          })
      );
      setEnabledCalendarIds(enabledSet);
      initializedFromPreferencesRef.current = true;
      lastCalendarsRef.current = calendarsKey;
    }
  }, [calendars, userPreferences]);

  // Handle toggling calendar visibility and save to preferences
  const handleToggleCalendar = useCallback((calendarId: string, enabled: boolean) => {
    // Prevent disabling SilverKey calendar
    if (silverKeyCalendarIdRef.current && calendarId === silverKeyCalendarIdRef.current && !enabled) {
      enqueueToast({
        type: "info",
        message: "SilverKey calendar cannot be disabled",
      });
      return;
    }

    setEnabledCalendarIds((prev) => {
      const newSet = new Set(prev);
      if (enabled) {
        newSet.add(calendarId);
      } else {
        newSet.delete(calendarId);
      }
      
      // Ensure SilverKey calendar is always enabled
      if (silverKeyCalendarIdRef.current) {
        newSet.add(silverKeyCalendarIdRef.current);
      }
      
      // Save disabled calendars to preferences (debounced)
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          // Calculate disabled calendars (all calendar IDs minus enabled ones)
          // Exclude SilverKey calendar from disabled list
          const allCalendarIds = calendars.map((cal) => cal.id);
          const disabledCalendars = allCalendarIds.filter((id) => {
            if (silverKeyCalendarIdRef.current && id === silverKeyCalendarIdRef.current) {
              return false; // Never disable SilverKey calendar
            }
            return !newSet.has(id);
          });
          
          await preferencesApi.createOrUpdate({
            disabled_calendars: disabledCalendars,
          });
          
          // Refresh preferences to get updated data
          await refreshUserPreferences();
        } catch (error) {
          console.error("Failed to save calendar preferences:", error);
          enqueueToast({
            type: "error",
            message: "Failed to save calendar preferences",
          });
        }
      }, 500); // 500ms debounce
      
      return newSet;
    });
  }, [calendars, refreshUserPreferences, enqueueToast]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Filter events by enabled calendars
  const filteredEvents = useMemo(() => {
    if (enabledCalendarIds.size === 0) {
      // If no calendars are enabled, show no events
      return [];
    }

    return events.filter((event) => {
      // If event has a calendarId, check if that calendar is enabled
      if (event.calendarId) {
        return enabledCalendarIds.has(event.calendarId);
      }
      // For events without calendarId (legacy events from baseEvents),
      // check if primary calendar is enabled
      // Primary calendar ID is typically "primary" or the first calendar's ID
      const primaryCalendar = calendars.find((cal) => cal.primary) || calendars[0];
      if (primaryCalendar && enabledCalendarIds.has(primaryCalendar.id)) {
        return true;
      }
      // If primary is not enabled or not found, don't show the event
      return false;
    });
  }, [events, enabledCalendarIds, calendars]);

  // Filter events for current month
  const currentMonthEvents = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

    return filteredEvents.filter((event) => {
      try {
        const eventDate = new Date(event.start.dateTime);
        return eventDate >= monthStart && eventDate <= monthEnd;
      } catch {
        return false;
      }
    });
  }, [filteredEvents, currentDate]);

  // Upcoming events (next 7 days) - only from SilverKey calendar
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    return filteredEvents.filter((event) => {
      try {
        // Only show events from SilverKey calendar
        if (silverKeyCalendarIdRef.current && event.calendarId !== silverKeyCalendarIdRef.current) {
          return false;
        }
        const eventDate = new Date(event.start.dateTime);
        return eventDate >= today && eventDate <= nextWeek;
      } catch {
        return false;
      }
    });
  }, [filteredEvents]);

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
      {/* Upcoming Events List */}
      {upcomingEvents.length > 0 && (
        <div className="mb-8">
          <EventList
            events={upcomingEvents}
            title="Upcoming Events (Next 7 Days)"
            emptyMessage="No upcoming events"
          />
        </div>
      )}

      {/* Calendar Header */}
      <CalendarHeader
        currentDate={currentDate}
        onPreviousMonth={handlePreviousMonth}
        onNextMonth={handleNextMonth}
        isConnected={isConnected}
        calendars={calendars}
        enabledCalendarIds={enabledCalendarIds}
        onToggleCalendar={handleToggleCalendar}
        silverKeyCalendarId={silverKeyCalendarIdRef.current}
        onCreateEvent={handleOpenCreateEventModal}
      />

      {/* Loading State */}
      {(calendarsLoading || eventsLoading || fetchingEvents) && (
        <div className="mb-4 text-center text-sm text-gray-500">
          Loading calendar...
        </div>
      )}

      {/* Calendar Grid */}
      <div className="mb-8">
        <CalendarView
          currentDate={currentDate}
          events={currentMonthEvents}
          silverKeyCalendarId={silverKeyCalendarIdRef.current}
          onDateClick={handleDateClick}
        />
      </div>

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        onClose={() => setIsCreateEventModalOpen(false)}
        initialDate={selectedDateForEvent}
        calendars={calendars}
        defaultCalendarId={silverKeyCalendarIdRef.current}
        onEventCreated={handleEventCreated}
      />
    </div>
  );
}

