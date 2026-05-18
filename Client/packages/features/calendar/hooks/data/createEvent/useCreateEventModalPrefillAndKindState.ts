import { useCallback, useEffect, useRef, useState } from "react";

import { getCalendarEventKindOptionSlice } from "@/features/calendar/utils/createEventModal/calendarEventKindOptions";
import {
  CALENDAR_EVENT_KINDS,
  type CalendarEventKindId,
} from "@/features/calendar/utils/createEventModal/calendarEventKinds";

import type { CreateModalPrefilledCreateSnapshot } from "./useCreateEventModal.types";

type ChecklistQuerySlice = {
  isLoading: boolean;
  data?: { checkedIds?: readonly string[] } | undefined;
};

export type UseCreateEventModalPrefillAndKindStateParams = {
  isOpen: boolean;
  mode: "create" | "edit";
  selectedClientId: string | null;
  prefilledCreateSnapshot: CreateModalPrefilledCreateSnapshot | null | undefined;
  prefilledCreateKey: number | undefined;
  checklistSubjectId: string | null;
  searchChecklistQuery: ChecklistQuerySlice;
  offerChecklistQuery: ChecklistQuerySlice;
  setEventTitle: (value: string) => void;
  setEventDescription: (value: string) => void;
  setEventLocation: (value: string) => void;
  setStartDate: (value: string) => void;
  setEndDate: (value: string) => void;
  setStartTime: (value: string) => void;
  setEndTime: (value: string) => void;
  setIsAllDay: (value: boolean) => void;
  setCreateTimesChosenViaWeekSlot: (value: boolean) => void;
};

export function useCreateEventModalPrefillAndKindState({
  isOpen,
  mode,
  selectedClientId,
  prefilledCreateSnapshot = null,
  prefilledCreateKey,
  checklistSubjectId,
  searchChecklistQuery,
  offerChecklistQuery,
  setEventTitle,
  setEventDescription,
  setEventLocation,
  setStartDate,
  setEndDate,
  setStartTime,
  setEndTime,
  setIsAllDay,
  setCreateTimesChosenViaWeekSlot,
}: UseCreateEventModalPrefillAndKindStateParams) {
  const [eventKindId, setEventKindId] = useState<CalendarEventKindId>("other");
  const createKindSeededRef = useRef(false);
  const appliedPrefillKeyRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      createKindSeededRef.current = false;
      appliedPrefillKeyRef.current = null;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || mode !== "create") {
      return;
    }
    if (prefilledCreateKey == null || prefilledCreateSnapshot == null) {
      return;
    }
    if (appliedPrefillKeyRef.current === prefilledCreateKey) {
      return;
    }
    appliedPrefillKeyRef.current = prefilledCreateKey;
    setEventTitle(prefilledCreateSnapshot.eventTitle);
    setEventDescription(prefilledCreateSnapshot.eventDescription);
    setEventLocation(prefilledCreateSnapshot.eventLocation);
    setStartDate(prefilledCreateSnapshot.startDate);
    setEndDate(prefilledCreateSnapshot.endDate);
    setStartTime(prefilledCreateSnapshot.startTime);
    setEndTime(prefilledCreateSnapshot.endTime);
    setIsAllDay(prefilledCreateSnapshot.isAllDay);
    setCreateTimesChosenViaWeekSlot(Boolean(prefilledCreateSnapshot.timesChosenViaWeekSlot));
    setEventKindId("other");
    createKindSeededRef.current = true;
  }, [
    isOpen,
    mode,
    prefilledCreateKey,
    prefilledCreateSnapshot,
    setEndDate,
    setEndTime,
    setEventDescription,
    setEventLocation,
    setEventTitle,
    setIsAllDay,
    setStartDate,
    setStartTime,
    setCreateTimesChosenViaWeekSlot,
  ]);

  useEffect(() => {
    createKindSeededRef.current = false;
  }, [selectedClientId]);

  useEffect(() => {
    if (!isOpen || mode !== "create") {
      return;
    }
    if (prefilledCreateKey != null && prefilledCreateSnapshot != null) {
      return;
    }
    if (createKindSeededRef.current) {
      return;
    }
    if (checklistSubjectId) {
      if (searchChecklistQuery.isLoading || offerChecklistQuery.isLoading) {
        return;
      }
    }
    const slice = getCalendarEventKindOptionSlice({
      searchCheckedIds: checklistSubjectId ? searchChecklistQuery.data?.checkedIds : undefined,
      offerCheckedIds: checklistSubjectId ? offerChecklistQuery.data?.checkedIds : undefined,
    });
    setEventKindId(slice.defaultKindId);
    if (slice.defaultKindId !== "other") {
      setEventTitle(CALENDAR_EVENT_KINDS[slice.defaultKindId].label);
    } else {
      setEventTitle("");
    }
    createKindSeededRef.current = true;
  }, [
    isOpen,
    mode,
    checklistSubjectId,
    searchChecklistQuery.isLoading,
    searchChecklistQuery.data?.checkedIds,
    offerChecklistQuery.isLoading,
    offerChecklistQuery.data?.checkedIds,
    prefilledCreateKey,
    prefilledCreateSnapshot,
    setEventTitle,
  ]);

  const handleEventKindIdChange = useCallback(
    (id: CalendarEventKindId) => {
      setEventKindId(id);
      if (id !== "other") {
        setEventTitle(CALENDAR_EVENT_KINDS[id].label);
      } else {
        setEventTitle("");
      }
    },
    [setEventTitle]
  );

  return { eventKindId, setEventKindId, handleEventKindIdChange };
}
