import { useCallback } from "react";

import { log, LOG_CATEGORIES } from "packages/logger";
import type { Calendar } from "packages/schemas/calendar";

import { preferencesApi } from "@/features/calendar/api/preferences";
import { calculateDisabledCalendarIds } from "@/features/calendar/utils/calendar";

/**
 * Hook for saving calendar preferences
 */
export function useCalendarPreferences() {
  const savePreferences = useCallback(
    async (
      calendars: Calendar[],
      enabledCalendarIds: Set<string>,
      silverKeyCalendarId: string | null
    ): Promise<void> => {
      const disabledCalendars = calculateDisabledCalendarIds(
        calendars,
        enabledCalendarIds,
        silverKeyCalendarId
      );

      try {
        await preferencesApi.createOrUpdate({
          disabled_calendars: disabledCalendars,
        });
      } catch (error) {
        log.error(LOG_CATEGORIES.CALENDAR, "Failed to save calendar preferences", error);
        throw error;
      }
    },
    []
  );

  return { savePreferences };
}
