import React, { useEffect, useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import Card from "../../../components/layout/Card";
import { googleCalendarApi } from "../../../../../packages/config/api/googleCalendar";
import { queryKeys } from "../../../../../packages/config/query/keys";
import type { GoogleEvent } from "../../../../../packages/config/api/googleCalendar";
import { useGoogleCalendarStoreIntegration } from "../../../../../packages/hooks/store/useGoogleCalendarStoreIntegration";

const TodayCalendar: React.FC = () => {
  const queryClient = useQueryClient();
  const [todayEvents, setTodayEvents] = useState<GoogleEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isConnected, calendars } = useGoogleCalendarStoreIntegration();

  // Get SilverKey calendar ID
  const silverKeyCalendarId = useMemo(() => {
    return calendars.find((cal) => cal.summary === "SilverKey")?.id;
  }, [calendars]);

  useEffect(() => {
    if (!isConnected) {
      setTodayEvents([]);
      return;
    }

    // Try to fetch from all enabled calendars, prioritizing SilverKey calendar
    const calendarIds = silverKeyCalendarId
      ? [silverKeyCalendarId, "primary"]
      : ["primary"];

    // Check for cached events first
    const cachedEventsByCalendar: GoogleEvent[][] = [];
    let hasCachedData = false;
    
    calendarIds.forEach((calendarId) => {
      const cacheKey = [...queryKeys.googleCalendar.events(), "today", calendarId];
      const cached = queryClient.getQueryData<GoogleEvent[]>(cacheKey);
      if (cached && cached.length > 0) {
        cachedEventsByCalendar.push(
          cached.map((event) => ({
            ...event,
            calendarId,
          }))
        );
        hasCachedData = true;
      } else {
        cachedEventsByCalendar.push([]);
      }
    });

    // Show cached events immediately if available
    if (hasCachedData) {
      const allCachedEvents = cachedEventsByCalendar.flat();
      // Remove duplicates by event ID
      const uniqueEvents = Array.from(
        new Map(allCachedEvents.map((event) => [event.id, event])).values()
      );
      // Sort by start time
      uniqueEvents.sort((a, b) => {
        try {
          const dateA = new Date(a.start.dateTime).getTime();
          const dateB = new Date(b.start.dateTime).getTime();
          return dateA - dateB;
        } catch {
          return 0;
        }
      });
      setTodayEvents(uniqueEvents);
      setLoading(false);
    } else {
      setLoading(true);
    }

    const fetchTodayEvents = async () => {
      setError(null);
      try {
        const eventPromises = calendarIds.map(async (calendarId) => {
          try {
            const response = await googleCalendarApi.listTodayEvents({
              calendarId,
            });
            if (response.success && response.data?.items) {
              const events = response.data.items.map((event) => ({
                ...event,
                calendarId,
              }));
              
              // Cache the events in React Query
              const cacheKey = [...queryKeys.googleCalendar.events(), "today", calendarId];
              queryClient.setQueryData(cacheKey, response.data.items);
              
              return events;
            }
            // Check if this is a calendar access error (not found or access denied)
            // These are expected for some calendars, so we silently skip them
            if (!response.success && response.error) {
              const errorCode =
                typeof response.error === "string" ? response.error : "";
              if (
                errorCode === "calendar_not_found" ||
                errorCode === "calendar_access_denied"
              ) {
                // Silently skip calendars that aren't accessible
                return [];
              }
            }
            return [];
          } catch (err) {
            // Log but don't fail the entire request - just skip this calendar
            console.warn(
              `Failed to fetch today's events from calendar ${calendarId}:`,
              err
            );
            return [];
          }
        });

        const eventArrays = await Promise.all(eventPromises);
        const allEvents = eventArrays.flat();

        // Remove duplicates by event ID
        const uniqueEvents = Array.from(
          new Map(allEvents.map((event) => [event.id, event])).values()
        );

        // Sort by start time
        uniqueEvents.sort((a, b) => {
          try {
            const dateA = new Date(a.start.dateTime).getTime();
            const dateB = new Date(b.start.dateTime).getTime();
            return dateA - dateB;
          } catch {
            return 0;
          }
        });

        setTodayEvents(uniqueEvents);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch today's events"
        );
        console.error("Error fetching today's events:", err);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if we don't have cached data, or fetch in background to update
    if (!hasCachedData) {
      void fetchTodayEvents();
    } else {
      // Fetch fresh data in background to update cache
      void fetchTodayEvents();
    }
  }, [isConnected, silverKeyCalendarId, queryClient]);

  const formatTime = (dateTime: string) => {
    try {
      const date = new Date(dateTime);
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "";
    }
  };

  if (!isConnected) {
    return (
      <Card className="h-full">
        <div className="flex items-center gap-2 mb-4">
          <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-olive" />
          <h2 className="heading-responsive-sm text-navy">Today</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-responsive-sm text-black/60">
            Connect Google Calendar to see today's events
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <div className="flex items-center gap-2 mb-4">
        <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-olive" />
        <h2 className="heading-responsive-sm text-navy">Today</h2>
      </div>
      {loading ? (
        <div className="text-center py-8">
          <p className="text-responsive-sm text-black/60">Loading events...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-responsive-sm text-red-600">{error}</p>
        </div>
      ) : todayEvents.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-responsive-sm text-black/60">
            No events scheduled for today
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {todayEvents.map((event) => (
            <div
              key={event.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-beige/30 bg-white hover:bg-beige/5 transition-colors"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-olive/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-olive" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-responsive-sm font-medium text-navy mb-1">
                  {event.summary || "Untitled Event"}
                </p>
                <p className="text-xs sm:text-sm text-black/60">
                  {formatTime(event.start.dateTime)}
                </p>
                {event.location && (
                  <p className="text-xs text-black/40 mt-1">{event.location}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default TodayCalendar;
