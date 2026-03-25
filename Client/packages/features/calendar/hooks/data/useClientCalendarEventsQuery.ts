import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";

import { googleCalendarApi } from "@/features/calendar/api";
import type { GoogleEvent } from "@/features/calendar/types/googleEvent";

/**
 * Full client calendar events for a date range (agent viewing a connected client’s Google calendar).
 */
export function useClientCalendarEventsQuery(
  clientId: string | null,
  timeMin: string,
  timeMax: string,
  calendarId = "primary"
) {
  return useQuery({
    queryKey: [
      ...queryKeys.googleCalendar.all,
      "client-events-detail",
      clientId,
      timeMin,
      timeMax,
      calendarId,
    ],
    queryFn: async (): Promise<GoogleEvent[]> => {
      const response = await googleCalendarApi.getClientEvents(clientId!, {
        calendarId,
        timeMin,
        timeMax,
      });
      if (!response.success) {
        throw new Error(response.error ?? "Failed to load client events");
      }
      return response.data?.items ?? [];
    },
    enabled: Boolean(clientId && timeMin && timeMax),
    staleTime: 60 * 1000,
  });
}
