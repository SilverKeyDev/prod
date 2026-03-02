import { useEffect } from "react";

import { getDocument, getWindow } from "packages/utils/platform";

export interface UseCalendarOAuthCallbackParams {
  enqueueToast: (toast: { type: "success"; message: string }) => void;
  refreshCalendars: () => void | Promise<void>;
  refreshEvents: () => void | Promise<void>;
}

/**
 * Effect: when URL has google=connected, show success toast, clear params via
 * replaceState, and refresh calendars and events. No JSX.
 */
export function useCalendarOAuthCallback({
  enqueueToast,
  refreshCalendars,
  refreshEvents,
}: UseCalendarOAuthCallbackParams): void {
  useEffect(() => {
    const win = getWindow();
    const doc = getDocument();
    if (!win) return;
    const urlParams = new URLSearchParams(win.location.search);
    if (urlParams.get("google") === "connected") {
      enqueueToast({
        type: "success",
        message: "Google Calendar connected successfully",
      });
      win.history.replaceState({}, doc?.title ?? "", win.location.pathname);
      void refreshCalendars();
      void refreshEvents();
    }
  }, [enqueueToast, refreshCalendars, refreshEvents]);
}
