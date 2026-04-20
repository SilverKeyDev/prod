import { useEffect } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import { getDocument, getWindow } from "packages/utils/platform";

export interface UseCalendarOAuthCallbackParams {
  enqueueToast: (toast: { type: "success"; message: string }) => void;
  refreshCalendars?: () => void | Promise<void>;
  refreshEvents?: () => void | Promise<void>;
}

/**
 * OAuth return handler: when URL has `google=connected` (after server redirects
 * to `/dashboard?google=connected`), toast, invalidate Google Calendar queries,
 * optional refetches, then strip the query via replaceState. Mount once on the
 * dashboard shell so it runs before nested calendar hooks strip the URL.
 */
export function useCalendarOAuthCallback({
  enqueueToast,
  refreshCalendars,
  refreshEvents,
}: UseCalendarOAuthCallbackParams): void {
  const queryClient = useQueryClient();
  useEffect(() => {
    const win = getWindow();
    const doc = getDocument();
    if (!win) return;
    const urlParams = new URLSearchParams(win.location.search);
    if (urlParams.get("google") !== "connected") return;

    enqueueToast({
      type: "success",
      message: "Google Calendar connected successfully",
    });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.googleCalendar.all,
    });
    void refreshCalendars?.();
    void refreshEvents?.();
    win.history.replaceState({}, doc?.title ?? "", win.location.pathname);
  }, [enqueueToast, queryClient, refreshCalendars, refreshEvents]);
}
