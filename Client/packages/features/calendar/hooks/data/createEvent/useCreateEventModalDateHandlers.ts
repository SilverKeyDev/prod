import { useCallback } from "react";

import { defaultCreateEventTimedRange } from "@/features/calendar/utils/createEventModal/createEventModalDefaults";

export function useCreateEventModalDateHandlers(
  mode: "create" | "edit",
  setStartDate: (v: string) => void,
  setEndDate: (v: string) => void,
  setIsAllDay: (v: boolean) => void,
  setStartTime: (v: string) => void,
  setEndTime: (v: string) => void,
  setCreateTimesChosenViaWeekSlot: (v: boolean) => void
) {
  const onDateRangeChange = useCallback(
    (lo: string, hi: string) => {
      setStartDate(lo);
      setEndDate(hi);

      if (mode === "edit") {
        return;
      }

      setCreateTimesChosenViaWeekSlot(false);

      const rawStart = lo.trim();
      const rawEnd = hi.trim();
      const scheduleStart = rawStart || rawEnd;
      const scheduleEnd = rawEnd || rawStart || scheduleStart;
      if (!scheduleStart || !scheduleEnd) {
        return;
      }
    },
    [mode, setCreateTimesChosenViaWeekSlot, setEndDate, setStartDate]
  );

  const onCalendarTimedSlotPick = useCallback(
    (payload: { startTime: string; endTime: string }) => {
      setStartTime(payload.startTime);
      setEndTime(payload.endTime);
      if (mode === "create") {
        setCreateTimesChosenViaWeekSlot(true);
      }
    },
    [mode, setCreateTimesChosenViaWeekSlot, setEndTime, setStartTime]
  );

  const onIsAllDayChange = useCallback(
    (next: boolean) => {
      setIsAllDay(next);
      if (!next) {
        const { startTime: st, endTime: et } = defaultCreateEventTimedRange();
        setStartTime(st);
        setEndTime(et);
        setCreateTimesChosenViaWeekSlot(false);
      }
    },
    [setCreateTimesChosenViaWeekSlot, setEndTime, setIsAllDay, setStartTime]
  );

  return { onDateRangeChange, onCalendarTimedSlotPick, onIsAllDayChange };
}
