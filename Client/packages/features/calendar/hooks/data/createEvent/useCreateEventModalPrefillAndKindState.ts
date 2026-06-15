import { useCallback, useEffect, useRef, useState } from "react";

import {
  CALENDAR_EVENT_KINDS,
  type CalendarEventKindId,
} from "@/features/calendar/utils/createEventModal/calendarEventKinds";

import type { CreateModalPrefilledCreateSnapshot } from "./useCreateEventModal.types";

const DEFAULT_CREATE_KIND_ID: CalendarEventKindId = "meeting";

export type UseCreateEventModalPrefillAndKindStateParams = {
  isOpen: boolean;
  mode: "create" | "edit";
  prefilledCreateSnapshot: CreateModalPrefilledCreateSnapshot | null | undefined;
  prefilledCreateKey: number | undefined;
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
  prefilledCreateSnapshot = null,
  prefilledCreateKey,
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
  const [eventKindId, setEventKindId] = useState<CalendarEventKindId>(DEFAULT_CREATE_KIND_ID);
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
    if (!isOpen || mode !== "create") {
      return;
    }
    if (prefilledCreateKey != null && prefilledCreateSnapshot != null) {
      return;
    }
    if (createKindSeededRef.current) {
      return;
    }
    setEventKindId(DEFAULT_CREATE_KIND_ID);
    setEventTitle(CALENDAR_EVENT_KINDS[DEFAULT_CREATE_KIND_ID].label);
    createKindSeededRef.current = true;
  }, [isOpen, mode, prefilledCreateKey, prefilledCreateSnapshot, setEventTitle]);

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
