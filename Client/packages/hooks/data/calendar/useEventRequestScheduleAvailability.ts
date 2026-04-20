import { useEffect, useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import { queryAvailability } from "packages/features/calendar/api/schedulingQueries";
import { toBuyerPreferenceExtensions } from "packages/features/profile/types/buyerPreferenceExtensions";
import { useUserPreferences } from "packages/hooks/data/user/useUserData";
import { log, LOG_CATEGORIES } from "packages/logger";
import type { FreebusyTimeBlock } from "packages/schemas/scheduling";
import { useGoogleCalendarStore } from "packages/store";
import { dayjs } from "packages/utils/date";
import {
  hasAnyAvailableSlotOnDate,
  isEventRequestSlotAvailable,
} from "packages/utils/scheduling/eventRequestAvailability";
import {
  buildDateOptions,
  buildTimeOptions,
  EVENT_REQUEST_DATE_RANGE_DAYS,
  EVENT_REQUEST_TIME_STEP_MINUTES,
  type EventScheduleOption,
} from "packages/utils/scheduling/eventRequestScheduleOptions";

const AVAILABLE_ROW_WEB = "bg-brand-secondary/15";
const UNAVAILABLE_ROW_WEB = "opacity-55";

export type UseEventRequestScheduleAvailabilityParams = {
  minDateYmd: string;
};

function annotateOptions(
  base: EventScheduleOption[],
  availabilityHintsReady: boolean,
  mapFn: (o: EventScheduleOption) => {
    ok: boolean;
  }
): EventScheduleOption[] {
  if (!availabilityHintsReady) {
    return base.map((o) => ({
      ...o,
      availabilityTone: "neutral" as const,
    }));
  }
  return base.map((o) => {
    const { ok } = mapFn(o);
    return {
      ...o,
      menuRowClassName: ok ? AVAILABLE_ROW_WEB : UNAVAILABLE_ROW_WEB,
      disabled: !ok,
      availabilityTone: ok ? ("available" as const) : ("unavailable" as const),
    };
  });
}

export function useEventRequestScheduleAvailability({
  minDateYmd,
}: UseEventRequestScheduleAvailabilityParams) {
  const { userPreferences, preferencesLoading } = useUserPreferences();
  const isGoogleConnected = useGoogleCalendarStore((s) => s.isConnected);

  const availabilityPrefs = useMemo(() => {
    const raw = userPreferences?.extended_buyer_preferences;
    return toBuyerPreferenceExtensions(raw)?.availability;
  }, [userPreferences?.extended_buyer_preferences]);

  const range = useMemo(() => {
    const start = dayjs(minDateYmd, "YYYY-MM-DD", true).startOf("day");
    if (!start.isValid()) {
      return { timeMin: "", timeMax: "" };
    }
    const end = start.add(EVENT_REQUEST_DATE_RANGE_DAYS - 1, "day").endOf("day");
    return {
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
    };
  }, [minDateYmd]);

  const busyQuery = useQuery({
    queryKey: queryKeys.scheduling.availability(range.timeMin, range.timeMax, ["primary"]),
    queryFn: async () => queryAvailability(range.timeMin, range.timeMax, ["primary"]),
    enabled: Boolean(range.timeMin && range.timeMax && isGoogleConnected),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!isGoogleConnected || !busyQuery.isError) {
      return;
    }
    log.warn(
      LOG_CATEGORIES.CALENDAR,
      "Event request availability: free/busy failed; hints ignore calendar busy until retry",
      busyQuery.error
    );
  }, [busyQuery.error, busyQuery.isError, isGoogleConnected]);

  const busyBlocks: FreebusyTimeBlock[] = useMemo(() => {
    if (!isGoogleConnected) {
      return [];
    }
    return busyQuery.data ?? [];
  }, [busyQuery.data, isGoogleConnected]);

  const availabilityHintsReady =
    !preferencesLoading && (!isGoogleConnected || !busyQuery.isLoading);

  const dateOptions: EventScheduleOption[] = useMemo(() => {
    const base = buildDateOptions(minDateYmd, EVENT_REQUEST_DATE_RANGE_DAYS);
    return annotateOptions(base, availabilityHintsReady, (o) => ({
      ok: hasAnyAvailableSlotOnDate({
        eventDateYmd: o.value,
        stepMinutes: EVENT_REQUEST_TIME_STEP_MINUTES,
        prefs: availabilityPrefs,
        busyBlocks,
      }),
    }));
  }, [minDateYmd, availabilityPrefs, busyBlocks, availabilityHintsReady]);

  const buildTimeOptionsForDate = useMemo(() => {
    return (eventDateYmd: string): EventScheduleOption[] => {
      const base = buildTimeOptions(EVENT_REQUEST_TIME_STEP_MINUTES);
      if (!eventDateYmd) {
        return annotateOptions(base, false, () => ({ ok: true }));
      }
      return annotateOptions(base, availabilityHintsReady, (o) => ({
        ok: isEventRequestSlotAvailable({
          eventDateYmd,
          eventTimeHm: o.value,
          stepMinutes: EVENT_REQUEST_TIME_STEP_MINUTES,
          prefs: availabilityPrefs,
          busyBlocks,
        }),
      }));
    };
  }, [availabilityPrefs, busyBlocks, availabilityHintsReady]);

  return useMemo(
    () => ({
      dateOptions,
      buildTimeOptionsForDate,
      availabilityHintsReady,
      busyBlocksLoading: isGoogleConnected && busyQuery.isLoading,
    }),
    [
      dateOptions,
      buildTimeOptionsForDate,
      availabilityHintsReady,
      isGoogleConnected,
      busyQuery.isLoading,
    ]
  );
}
