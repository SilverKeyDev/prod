import { useEffect } from "react";

export interface UseCalendarErrorToastsParams {
  calendarsError: string | null;
  eventsError: string | null;
  clientEventsError?: string | null;
  enqueueToast: (toast: { type: "error"; message: string }) => void;
}

/**
 * Effect: when calendar/events/client errors are set, show error toasts. No JSX.
 */
export function useCalendarErrorToasts({
  calendarsError,
  eventsError,
  clientEventsError = null,
  enqueueToast,
}: UseCalendarErrorToastsParams): void {
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
    if (clientEventsError) {
      enqueueToast({
        type: "error",
        message: `Client events error: ${clientEventsError}`,
      });
    }
  }, [calendarsError, eventsError, clientEventsError, enqueueToast]);
}
