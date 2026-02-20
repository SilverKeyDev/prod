import { useCallback } from "react";

import { log, LOG_CATEGORIES } from "logger";

import { preferencesApi } from "packages/config/api";
import type { Calendar } from "packages/schemas/calendar";
import { calculateDisabledCalendarIds } from "packages/utils/domain/calendar/calendar";

/**
 * Hook for saving calendar preferences
 */
export function useCalendarPreferences() {
  const savePreferences = useCallback(
    async (
      calendars: Calendar[],
      enabledCalendarIds: Set<string>,
      silverKeyCalendarId: string | null,
    ): Promise<void> => {
      const disabledCalendars = calculateDisabledCalendarIds(
        calendars,
        enabledCalendarIds,
        silverKeyCalendarId,
      );

      try {
        await preferencesApi.createOrUpdate({
          disabled_calendars: disabledCalendars,
        });
      } catch (error) {
        log.error(
          LOG_CATEGORIES.CALENDAR,
          "Failed to save calendar preferences",
          error,
        );
        throw error;
      }
    },
    [],
  );

  return { savePreferences };
}
