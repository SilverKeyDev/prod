import { useCallback } from "react";
import { preferencesApi } from "../../../config/api";
import { log, LOG_CATEGORIES } from "../../../../logger";
import { calculateDisabledCalendarIds } from "../../../utils/calendar/calendar";
import type { Calendar } from "../../../schemas/calendar";

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
