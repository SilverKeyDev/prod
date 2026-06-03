import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  GoogleCalendarEventCreateBody,
  GoogleEventCreateResponse,
} from "packages/features/calendar/api/types";
import { useCalendarQuickCreateSession } from "packages/features/calendar/hooks/ui/useCalendarQuickCreateSession";
import { useCalendarSwipe } from "packages/features/calendar/hooks/ui/useCalendarSwipe";
import type {
  Calendar,
  CalendarViewType,
  ExtendedGoogleEvent,
} from "packages/features/calendar/types/calendar";
import type { GoogleEvent } from "packages/features/calendar/types/googleEvent";
import type { BuyerPreferenceExtensions } from "packages/features/profile/types/sections/buyerPreferenceExtensions";
import { expandProfileAvailabilityToEvents } from "packages/features/profile/utils/availability/expandProfileAvailabilityToEvents";
import {
  addAvailabilityFromQuickCreate,
  deleteAvailabilityByEventId,
  updateAvailabilityFromEditedEvent,
} from "packages/features/profile/utils/availability/profileAvailabilityMutations";
import { useMediaQuery } from "packages/hooks/ui";
import { log, LOG_CATEGORIES } from "packages/logger";
import { SILVERKEY_MODAL_ROOT_SELECTOR } from "packages/ui/components/modals/BaseModalTypes";
import { screenUp } from "packages/ui/types/screens";
import {
  buildWeekTimedEventResizeGoogleEvent,
  calculateCalendarDateRange,
  calendarDateToKey,
  formatCalendarToolbarLabel,
  getCalendarDayListHeading,
  getEventLocalDayKeys,
  getVisibleDateRange,
  stepFocusedDate,
} from "packages/utils/calendar";
import { dateNow, dayjs } from "packages/utils/date";
import { getDocument } from "packages/utils/platform";

export type UseLocalAvailabilityCalendarScreenParams = {
  buyerPreferenceExtensions: BuyerPreferenceExtensions | undefined;
  patchBuyerPreferenceExtensions: (
    fn: (prev: BuyerPreferenceExtensions | undefined) => BuyerPreferenceExtensions
  ) => void;
  showSelectedDayEventList?: boolean;
};

export function useLocalAvailabilityCalendarScreen({
  buyerPreferenceExtensions,
  patchBuyerPreferenceExtensions,
  showSelectedDayEventList = true,
}: UseLocalAvailabilityCalendarScreenParams) {
  /** Week/month toggle is local to this screen (agent profile availability only). */
  const [viewMode, setViewMode] = useState<CalendarViewType>("week");
  const [focusedDate, setFocusedDate] = useState(() => dateNow().startOf("day").toDate());
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [weekSelectedEventId, setWeekSelectedEventId] = useState<string | null>(null);
  const calendarShellRef = useRef<HTMLDivElement | null>(null);
  const isLargeScreen = useMediaQuery(screenUp("md"));

  useEffect(() => {
    if (viewMode !== "week") {
      setWeekSelectedEventId(null);
    }
  }, [viewMode]);

  useEffect(() => {
    if (!showSelectedDayEventList || selectedDayKey === null) return;
    const doc = getDocument();
    if (!doc) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = calendarShellRef.current;
      if (!el) return;
      const target = e.target;
      if (target instanceof Element && target.closest(SILVERKEY_MODAL_ROOT_SELECTOR)) {
        return;
      }
      if (target instanceof Node && el.contains(target)) return;
      setSelectedDayKey(null);
    };
    doc.addEventListener("pointerdown", onPointerDown);
    return () => doc.removeEventListener("pointerdown", onPointerDown);
  }, [showSelectedDayEventList, selectedDayKey]);

  const range = useMemo(() => {
    const { timeMin, timeMax } = calculateCalendarDateRange(focusedDate);
    return { timeMin, timeMax };
  }, [focusedDate]);

  const rawEvents = useMemo((): ExtendedGoogleEvent[] => {
    return expandProfileAvailabilityToEvents(
      buyerPreferenceExtensions?.availability,
      range.timeMin,
      range.timeMax
    );
  }, [buyerPreferenceExtensions?.availability, range.timeMax, range.timeMin]);

  const noopCreateEvent = useCallback(
    async (_body: GoogleCalendarEventCreateBody): Promise<GoogleEventCreateResponse> =>
      ({}) as GoogleEventCreateResponse,
    []
  );

  const refetchEvents = useCallback(async () => {
    /* local state only */
  }, []);

  const localPersistence = useMemo(
    () => ({
      commit: (q: Parameters<typeof addAvailabilityFromQuickCreate>[1]) => {
        patchBuyerPreferenceExtensions((prev) => addAvailabilityFromQuickCreate(prev, q));
      },
      isSaving: false,
    }),
    [patchBuyerPreferenceExtensions]
  );

  const quickSession = useCalendarQuickCreateSession({
    isClientView: false,
    defaultCalendarId: null,
    visibleEvents: rawEvents,
    createEvent: noopCreateEvent,
    isCreatingEvent: false,
    refetchEvents,
    calendarShellRef,
    localPersistence,
    onWeekGridEventSelect: setWeekSelectedEventId,
  });

  const { handleWeekTimeSlotDoubleClick, handleMonthQuickCreateDoubleTap } = quickSession;

  const gridDisplayEvents = quickSession.gridDisplayEvents;

  const eventsByDay = useMemo(() => {
    const map = new Map<string, ExtendedGoogleEvent[]>();
    for (const ev of gridDisplayEvents) {
      for (const key of getEventLocalDayKeys(ev)) {
        const arr = map.get(key);
        if (arr) arr.push(ev);
        else map.set(key, [ev]);
      }
    }
    return map;
  }, [gridDisplayEvents]);

  const days = useMemo(() => {
    const { gridDays } = getVisibleDateRange(focusedDate, "month");
    if (!gridDays) return [];
    return gridDays.map((day) => {
      const key = calendarDateToKey(day.date);
      const count = key ? (eventsByDay.get(key)?.length ?? 0) : 0;
      return {
        key,
        date: day.date,
        isCurrentMonth: day.isCurrentMonth,
        isPast: day.isPast,
        isToday: day.isToday,
        count,
      };
    });
  }, [focusedDate, eventsByDay]);

  const selectedEvents = useMemo(() => {
    const raw = selectedDayKey ? (eventsByDay.get(selectedDayKey) ?? []) : [];
    return raw.filter((e) => !e.isOptimisticCalendarDraft);
  }, [eventsByDay, selectedDayKey]);

  const toolbarLabel = useMemo(
    () => formatCalendarToolbarLabel(focusedDate, viewMode),
    [focusedDate, viewMode]
  );

  const handlePrev = useCallback(() => {
    setFocusedDate((prev) => stepFocusedDate(prev, viewMode, -1));
  }, [viewMode]);

  const handleNext = useCallback(() => {
    setFocusedDate((prev) => stepFocusedDate(prev, viewMode, 1));
  }, [viewMode]);

  const handleJumpToDayFromDate = useCallback(
    (d: Date) => {
      const start = dayjs(d).startOf("day").toDate();
      setFocusedDate(start);
      setViewMode("week");
      if (showSelectedDayEventList) {
        setSelectedDayKey(calendarDateToKey(start));
      }
    },
    [showSelectedDayEventList]
  );

  const handleDayHeaderPress = useCallback(
    (d: Date) => {
      if (!showSelectedDayEventList) return;
      setSelectedDayKey(calendarDateToKey(d));
    },
    [showSelectedDayEventList]
  );

  const swipeHandlers = useCalendarSwipe({
    onSwipeLeft:
      viewMode !== "month"
        ? () => setFocusedDate((prev) => stepFocusedDate(prev, viewMode, 1))
        : undefined,
    onSwipeRight:
      viewMode !== "month"
        ? () => setFocusedDate((prev) => stepFocusedDate(prev, viewMode, -1))
        : undefined,
    onSwipeUp:
      viewMode === "month"
        ? () => setFocusedDate((prev) => stepFocusedDate(prev, "month", 1))
        : undefined,
    onSwipeDown:
      viewMode === "month"
        ? () => setFocusedDate((prev) => stepFocusedDate(prev, "month", -1))
        : undefined,
  });

  const bodySelectedKey = showSelectedDayEventList ? selectedDayKey : null;

  const deleteEvent = useCallback(
    async (eventId: string, _calendarId?: string) => {
      patchBuyerPreferenceExtensions((prev) => deleteAvailabilityByEventId(prev, eventId));
    },
    [patchBuyerPreferenceExtensions]
  );

  const updateEvent = useCallback(
    async (
      eventId: string,
      event: GoogleEvent,
      _calendarId?: string
    ): Promise<GoogleEventCreateResponse> => {
      patchBuyerPreferenceExtensions((prev) =>
        updateAvailabilityFromEditedEvent(prev, eventId, event)
      );
      return {} as GoogleEventCreateResponse;
    },
    [patchBuyerPreferenceExtensions]
  );

  useEffect(() => {
    if (viewMode !== "week" || !weekSelectedEventId) {
      return;
    }
    const doc = getDocument();
    if (!doc) {
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Backspace" && e.key !== "Delete") {
        return;
      }
      const t = e.target;
      if (t instanceof HTMLElement) {
        if (t.isContentEditable) {
          return;
        }
        const tag = t.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
          return;
        }
      }
      if (t instanceof Element && t.closest(SILVERKEY_MODAL_ROOT_SELECTOR)) {
        return;
      }
      if (
        t instanceof Element &&
        (t.closest("[data-silverkey-quick-event-popover]") ||
          t.closest("[data-silverkey-create-event-form-popover]"))
      ) {
        return;
      }
      const hit = gridDisplayEvents.find((x) => x.id === weekSelectedEventId);
      if (!hit?.id || hit.isOptimisticCalendarDraft) {
        return;
      }
      e.preventDefault();
      void deleteEvent(hit.id);
      setWeekSelectedEventId(null);
    };
    doc.addEventListener("keydown", onKeyDown, true);
    return () => doc.removeEventListener("keydown", onKeyDown, true);
  }, [viewMode, weekSelectedEventId, gridDisplayEvents, deleteEvent]);

  const handleWeekTimedResizeCommit = useCallback(
    async (payload: {
      event: ExtendedGoogleEvent;
      dayKey: string;
      startMin: number;
      endMin: number;
    }) => {
      if (!payload.event.id) {
        return;
      }
      try {
        const body = buildWeekTimedEventResizeGoogleEvent(
          payload.event,
          payload.dayKey,
          payload.startMin,
          payload.endMin
        );
        await updateEvent(payload.event.id, body);
      } catch (error) {
        log.error(LOG_CATEGORIES.ERRORS, "Week grid time resize failed", error);
      }
    },
    [updateEvent]
  );

  const addAvailabilityForSelectedDay = useCallback(() => {
    if (!selectedDayKey) {
      return;
    }
    const d = dayjs(selectedDayKey).startOf("day").toDate();
    if (!dayjs(d).isValid()) {
      return;
    }
    if (viewMode === "week") {
      void handleWeekTimeSlotDoubleClick({
        date: d,
        minutesFromMidnight: 9 * 60,
      });
    } else {
      void handleMonthQuickCreateDoubleTap(d);
    }
  }, [selectedDayKey, viewMode, handleWeekTimeSlotDoubleClick, handleMonthQuickCreateDoubleTap]);

  return {
    isClientView: false as const,
    silverKeyCalendarId: null as string | null,
    defaultCalendarId: null as string | null,
    calendarsLoading: false,
    permissionsReady: true,
    shouldShowConnectionPrompt: false,
    handleConnect: () => {
      /* no-op */
    },
    calendarShellRef,
    selectedDayKey,
    setSelectedDayKey,
    selectedEvents,
    getSelectedDayListHeading: (dateKey: string) => getCalendarDayListHeading(dateKey),
    refetchEvents,
    updateEvent,
    deleteEvent,
    gridCalendars: [] as Calendar[],
    days,
    eventsByDay,
    bodySelectedKey,
    visibleEvents: gridDisplayEvents,
    toolbarLabel,
    viewMode,
    setViewMode,
    handlePrev,
    handleNext,
    handleJumpToDayFromDate,
    handleDayHeaderPress,
    swipeHandlers,
    isLargeScreen,
    focusedDate,
    quickCreate: quickSession.quickCreate,
    quickCreateAnchorRect: quickSession.quickCreateAnchorRect,
    quickCreateDayKey: quickSession.quickCreateDayKey,
    quickCreateDraftIdForAnchor: quickSession.quickCreateDraftIdForAnchor,
    updateQuickCreate: quickSession.updateQuickCreate,
    commitQuickCreate: quickSession.commitQuickCreate,
    discardQuickCreate: quickSession.discardQuickCreate,
    registerQuickCreateOutsideSafeTarget: quickSession.registerQuickCreateOutsideSafeTarget,
    handleWeekTimeSlotDoubleClick: quickSession.handleWeekTimeSlotDoubleClick,
    handleMonthQuickCreateDoubleTap: quickSession.handleMonthQuickCreateDoubleTap,
    handleEditDetailsFromQuickCreate: quickSession.handleEditDetailsFromQuickCreate,
    handleMonthEventPress: quickSession.handleMonthEventPress,
    editEvent: quickSession.editEvent,
    setEditEvent: quickSession.setEditEvent,
    fullCreateFromQuickOpen: quickSession.fullCreateFromQuickOpen,
    setFullCreateFromQuickOpen: quickSession.setFullCreateFromQuickOpen,
    fullCreateAnchorRect: quickSession.fullCreateAnchorRect,
    dismissFullCreate: quickSession.dismissFullCreate,
    fullCreatePrefill: quickSession.fullCreatePrefill,
    fullCreateKey: quickSession.fullCreateKey,
    isCreatingQuickEvent: quickSession.isCreatingQuickEvent,
    isAgentUser: false,
    weekSelectedEventId,
    setWeekSelectedEventId,
    handleWeekTimedResizeCommit,
    addAvailabilityForSelectedDay,
  };
}
