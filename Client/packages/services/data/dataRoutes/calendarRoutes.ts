import { type GoogleCalendar, googleCalendarApi } from "packages/config/http/api";
import { queryKeys } from "packages/config/query/keys";
import type { RouteConfig } from "packages/services/data/dataRouteTypes";
import type { UserProfile } from "packages/types";

import { calculateCalendarDateRange } from "@/features/calendar/utils/core/date";

export const calendarRoutes = {
  googleCalendarConnection: {
    key: "googleCalendarConnection",
    queryKey: () => [...queryKeys.googleCalendar.all, "connection"],
    queryFn: async () => {
      const isConnected = await googleCalendarApi.isConnected();
      return isConnected;
    },
    shouldPoll: false,
    staleTime: 5 * 60 * 1000,
    userType: "all",
    initialLoad: true,
  },

  googleCalendarPermissions: {
    key: "googleCalendarPermissions",
    queryKey: () => queryKeys.googleCalendar.permissions(),
    queryFn: async () => {
      const isConnected = await googleCalendarApi.isConnected();
      if (!isConnected) {
        return null;
      }
      const response = await googleCalendarApi.getPermissions();
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to fetch permissions");
      }
      return response.data;
    },
    shouldPoll: false,
    staleTime: 5 * 60 * 1000,
    userType: "all",
    initialLoad: true,
  },

  googleEvents: {
    key: "googleEvents",
    queryKey: () => {
      return [...queryKeys.googleCalendar.events(), "prefetch"] as const;
    },
    queryFn: async (_user: UserProfile | null) => {
      const isConnected = await googleCalendarApi.isConnected();

      if (!isConnected) {
        return {
          silverKeyCalendar: null as GoogleCalendar | null,
          events: [] as Array<{
            calendarId: string;
            events: unknown[];
            timeMin: string;
            timeMax: string;
          }>,
        };
      }

      const { timeMin, timeMax } = calculateCalendarDateRange();

      let silverKeyCalendar: GoogleCalendar | null = null;
      try {
        const sk = await googleCalendarApi.getOrCreateSilverKeyCalendar(undefined);
        if (sk.success && sk.data) {
          silverKeyCalendar = sk.data;
        }
      } catch {
        // Optional: SilverKey fetch can fail independently of primary events
      }

      let events: unknown[] = [];
      try {
        const ev = await googleCalendarApi.listEvents({
          calendarId: "primary",
          timeMin,
          timeMax,
        });
        if (ev.success && ev.data?.items) {
          events = ev.data.items.map((event) => ({
            ...event,
            calendarId: event.calendarId || "primary",
          }));
        }
      } catch {
        events = [];
      }

      return {
        silverKeyCalendar,
        events: [
          {
            calendarId: "primary",
            events,
            timeMin,
            timeMax,
          },
        ],
      };
    },
    shouldPoll: false,
    staleTime: 2 * 60 * 1000,
    userType: "all",
    initialLoad: true,
  },
} as const satisfies Record<string, RouteConfig>;
