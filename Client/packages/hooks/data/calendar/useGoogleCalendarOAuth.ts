/**
 * Hook that exposes Google Calendar OAuth start.
 * Wraps config/api so components use hooks only.
 */
import { useCallback } from "react";

import { googleCalendarApi } from "packages/config/api/calendar/googleCalendar";

export function useGoogleCalendarOAuth() {
  const startOAuth = useCallback((useScheduling?: boolean) => {
    void googleCalendarApi.startOAuth(useScheduling ?? false);
  }, []);

  return { startOAuth };
}
