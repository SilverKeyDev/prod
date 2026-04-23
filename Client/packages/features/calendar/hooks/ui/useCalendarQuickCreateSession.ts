import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useIsAgent } from "packages/hooks/store";
import { useUIStore } from "packages/store";
import type { UIState } from "packages/store/ui.slice";
import { getWindow } from "packages/utils/platform";

import type { CreateModalPrefilledCreateSnapshot } from "@/features/calendar/hooks/data/createEvent/useCreateEventModal.types";
import type { ExtendedGoogleEvent } from "@/features/calendar/types/calendar";
import type {
  CalendarQuickCreateAnchorRect,
  CalendarQuickCreateState,
} from "@/features/calendar/types/calendarQuickCreate";
import type { GoogleCalendarEventCreateBody } from "@/features/calendar/types/googleEvent";
import { calendarDateToKey } from "@/features/calendar/utils/core/calendarDateKeys";
import { explicitEventTypeForCalendarKind } from "@/features/calendar/utils/createEventModal/calendarEventKinds";
import { runCreateEventModalSubmit } from "@/features/calendar/utils/createEventModal/createEventModalSubmit";
import {
  buildOptimisticAllDayDraftEvent,
  buildOptimisticTimedDraftEvent,
  defaultTimedRangeFromMinutes,
} from "@/features/calendar/utils/grid/calendarQuickCreateDraft";

import {
  useCalendarQuickCreateAnchorLayout,
  useCalendarQuickCreateEscape,
  useCalendarQuickCreateOutsidePointer,
} from "./useCalendarQuickCreateSession.effects";

export type CalendarQuickCreateLocalPersistence = {
  commit: (quick: CalendarQuickCreateState) => void | Promise<void>;
  isSaving: boolean;
};

export type UseCalendarQuickCreateSessionParams = {
  isClientView: boolean;
  defaultCalendarId: string | null;
  visibleEvents: ExtendedGoogleEvent[];
  createEvent: (body: GoogleCalendarEventCreateBody) => Promise<unknown>;
  isCreatingEvent: boolean;
  refetchEvents: () => Promise<unknown>;
  calendarShellRef: RefObject<HTMLDivElement | null>;
  /** When set, quick-create commits here instead of Google Calendar. */
  localPersistence?: CalendarQuickCreateLocalPersistence | null;
  /** After quick-create commit, week column clicks select instead of opening the edit modal. */
  onWeekGridEventSelect?: (eventId: string) => void;
};

function newDraftId(): string {
  const c = getWindow()?.crypto;
  if (c?.randomUUID) {
    return `quick-draft-${c.randomUUID()}`;
  }
  return `quick-draft-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function useCalendarQuickCreateSession({
  isClientView,
  defaultCalendarId,
  visibleEvents,
  createEvent,
  isCreatingEvent,
  refetchEvents,
  calendarShellRef,
  localPersistence = null,
  onWeekGridEventSelect,
}: UseCalendarQuickCreateSessionParams) {
  const enqueueToast = useUIStore((s: UIState) => s.enqueueToast);
  const isAgent = useIsAgent();

  const [quickCreate, setQuickCreate] = useState<CalendarQuickCreateState | null>(null);
  const quickCreateRef = useRef<CalendarQuickCreateState | null>(null);
  quickCreateRef.current = quickCreate;

  const [, setIsSavingUnscheduled] = useState(false);
  const [hourRowHeight, setHourRowHeight] = useState(48);
  const [editEvent, setEditEvent] = useState<ExtendedGoogleEvent | null>(null);
  const [fullCreateFromQuickOpen, setFullCreateFromQuickOpen] = useState(false);
  const [fullCreatePrefill, setFullCreatePrefill] =
    useState<CreateModalPrefilledCreateSnapshot | null>(null);
  const [fullCreateKey, setFullCreateKey] = useState(0);
  const [quickCreateAnchorRect, setQuickCreateAnchorRect] =
    useState<CalendarQuickCreateAnchorRect | null>(null);

  const commitQuickCreateRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    const win = getWindow();
    if (!win) {
      return;
    }
    const update = () => {
      setHourRowHeight(Math.max(40, Math.round(win.innerHeight / 15)));
    };
    update();
    win.addEventListener("resize", update);
    return () => win.removeEventListener("resize", update);
  }, []);

  const optimisticQuickEvent = useMemo((): ExtendedGoogleEvent | null => {
    const q = quickCreate;
    if (!q) {
      return null;
    }
    const calId = q.selectedCalendarId || defaultCalendarId || undefined;
    try {
      if (q.isAllDay) {
        return buildOptimisticAllDayDraftEvent({
          id: q.draftId,
          summary: q.eventTitle || "New Event",
          calendarId: calId,
          startYmd: q.startDate,
        });
      }
      return buildOptimisticTimedDraftEvent({
        id: q.draftId,
        summary: q.eventTitle || "New Event",
        calendarId: calId,
        startYmd: q.startDate,
        startTime: q.startTime,
        endTime: q.endTime,
      });
    } catch {
      return null;
    }
  }, [quickCreate, defaultCalendarId]);

  const gridDisplayEvents = useMemo(() => {
    if (!optimisticQuickEvent) {
      return visibleEvents;
    }
    return [...visibleEvents, optimisticQuickEvent];
  }, [visibleEvents, optimisticQuickEvent]);

  const discardQuickCreate = useCallback(() => {
    setQuickCreate(null);
  }, []);

  const quickCreateOutsideSafeTargetsRef = useRef(new Set<HTMLElement>());
  const registerQuickCreateOutsideSafeTarget = useCallback((element: HTMLElement) => {
    quickCreateOutsideSafeTargetsRef.current.add(element);
    return () => {
      quickCreateOutsideSafeTargetsRef.current.delete(element);
    };
  }, []);

  const commitQuickCreate = useCallback(async () => {
    const q = quickCreateRef.current;
    if (!q || isClientView) {
      return;
    }
    if (localPersistence) {
      await localPersistence.commit(q);
      discardQuickCreate();
      return;
    }
    await runCreateEventModalSubmit({
      mode: "create",
      eventTitle: q.eventTitle,
      explicitEventType: explicitEventTypeForCalendarKind("other"),
      eventDescription: q.eventDescription,
      eventLocation: q.eventLocation,
      startDate: q.startDate,
      endDate: q.endDate,
      startTime: q.startTime,
      endTime: q.endTime,
      isAllDay: q.isAllDay,
      selectedCalendarId: q.selectedCalendarId,
      defaultCalendarId,
      selectedClientId: q.selectedClientId,
      isPropertyViewing: false,
      viewingStops: [],
      onAddWithoutSchedule: undefined,
      createEvent,
      onEventCreated: () => {
        void refetchEvents();
      },
      onClose: discardQuickCreate,
      addGoogleMeet: false,
      setIsSavingUnscheduled,
      enqueueToast,
      clampTimedEndToStartLocalDay: !q.isAllDay && q.source === "week",
    });
  }, [
    isClientView,
    createEvent,
    defaultCalendarId,
    discardQuickCreate,
    enqueueToast,
    refetchEvents,
    localPersistence,
  ]);

  commitQuickCreateRef.current = commitQuickCreate;

  const beginQuickCreateWeek = useCallback(
    (date: Date, minutesFromMidnight: number) => {
      if (isClientView) {
        return;
      }
      const startYmd = calendarDateToKey(date);
      const { startTime, endTime } = defaultTimedRangeFromMinutes(startYmd, minutesFromMidnight);
      setQuickCreate({
        draftId: newDraftId(),
        eventTitle: "New Event",
        eventDescription: "",
        eventLocation: "",
        startDate: startYmd,
        endDate: startYmd,
        startTime,
        endTime,
        isAllDay: false,
        selectedCalendarId: defaultCalendarId ?? "primary",
        selectedClientId: null,
        source: "week",
        repeatWeekly: localPersistence ? false : undefined,
      });
    },
    [defaultCalendarId, isClientView, localPersistence]
  );

  const beginQuickCreateMonthDay = useCallback(
    (date: Date) => {
      if (isClientView) {
        return;
      }
      const startYmd = calendarDateToKey(date);
      setQuickCreate({
        draftId: newDraftId(),
        eventTitle: "New Event",
        eventDescription: "",
        eventLocation: "",
        startDate: startYmd,
        endDate: startYmd,
        startTime: "09:00",
        endTime: "10:00",
        isAllDay: true,
        selectedCalendarId: defaultCalendarId ?? "primary",
        selectedClientId: null,
        source: "month",
      });
    },
    [defaultCalendarId, isClientView]
  );

  const handleWeekTimeSlotDoubleClick = useCallback(
    async (payload: { date: Date; minutesFromMidnight: number }) => {
      if (isClientView) {
        return;
      }
      if (quickCreateRef.current) {
        await commitQuickCreateRef.current();
      }
      beginQuickCreateWeek(payload.date, payload.minutesFromMidnight);
    },
    [beginQuickCreateWeek, isClientView]
  );

  const handleMonthQuickCreateDoubleTap = useCallback(
    async (date: Date) => {
      if (isClientView) {
        return;
      }
      if (quickCreateRef.current) {
        await commitQuickCreateRef.current();
      }
      beginQuickCreateMonthDay(date);
    },
    [beginQuickCreateMonthDay, isClientView]
  );

  const handleEditDetailsFromQuickCreate = useCallback(() => {
    const q = quickCreateRef.current;
    if (!q) {
      return;
    }
    setFullCreatePrefill({
      eventTitle: q.eventTitle,
      eventDescription: q.eventDescription,
      eventLocation: q.eventLocation,
      startDate: q.startDate,
      endDate: q.endDate,
      startTime: q.startTime,
      endTime: q.endTime,
      isAllDay: q.isAllDay,
    });
    setFullCreateKey((k) => k + 1);
    discardQuickCreate();
    setFullCreateFromQuickOpen(true);
  }, [discardQuickCreate]);

  useCalendarQuickCreateOutsidePointer(
    quickCreate,
    isClientView,
    hourRowHeight,
    visibleEvents,
    discardQuickCreate,
    quickCreateOutsideSafeTargetsRef,
    beginQuickCreateWeek,
    beginQuickCreateMonthDay,
    setEditEvent,
    onWeekGridEventSelect
  );

  useCalendarQuickCreateEscape(quickCreate, isClientView, discardQuickCreate);

  useCalendarQuickCreateAnchorLayout(quickCreate, calendarShellRef, setQuickCreateAnchorRect);

  const handleMonthEventPress = useCallback((ev: ExtendedGoogleEvent) => {
    if (ev.isOptimisticCalendarDraft) {
      return;
    }
    setEditEvent(ev);
  }, []);

  const updateQuickCreate = useCallback((patch: Partial<CalendarQuickCreateState>) => {
    setQuickCreate((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  return {
    gridDisplayEvents,
    quickCreate,
    quickCreateAnchorRect,
    quickCreateDayKey: quickCreate?.startDate ?? null,
    quickCreateDraftIdForAnchor: quickCreate?.draftId ?? null,
    updateQuickCreate,
    commitQuickCreate,
    discardQuickCreate,
    registerQuickCreateOutsideSafeTarget,
    handleWeekTimeSlotDoubleClick,
    handleMonthQuickCreateDoubleTap,
    handleEditDetailsFromQuickCreate,
    handleMonthEventPress,
    editEvent,
    setEditEvent,
    fullCreateFromQuickOpen,
    setFullCreateFromQuickOpen,
    fullCreatePrefill,
    fullCreateKey,
    isCreatingQuickEvent: localPersistence ? localPersistence.isSaving : isCreatingEvent,
    isAgentUser: isAgent,
  };
}
