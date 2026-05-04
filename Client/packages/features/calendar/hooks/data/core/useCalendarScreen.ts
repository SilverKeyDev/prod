import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useClientSettings } from "packages/hooks/data/user/useClientSettings";
import { useMediaQuery } from "packages/hooks/ui";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useUIStore } from "packages/store";
import type { UIState } from "packages/store/ui.slice";
import { SILVERKEY_MODAL_ROOT_SELECTOR } from "packages/ui/components/modals/BaseModalTypes";
import { screenUp } from "packages/ui/types/screens";
import { dateNow, dayjs } from "packages/utils/date";
import { getDocument } from "packages/utils/platform";

import { useGoogleCalendarPermissions } from "@/features/calendar/hooks/data/google/useGoogleCalendarPermissions";
import { useGoogleEvents } from "@/features/calendar/hooks/data/google/useGoogleEvents";
import { useGoogleCalendarStoreIntegration } from "@/features/calendar/hooks/store/useGoogleCalendarStoreIntegration";
import { useCalendarQuickCreateSession } from "@/features/calendar/hooks/ui/useCalendarQuickCreateSession";
import { useCalendarSwipe } from "@/features/calendar/hooks/ui/useCalendarSwipe";
import type { CalendarViewType, ExtendedGoogleEvent } from "@/features/calendar/types/calendar";
import {
  calendarDateToKey,
  getCalendarDayListHeading,
} from "@/features/calendar/utils/core/calendarDateKeys";
import {
  calculateCalendarDateRange,
  getVisibleDateRange,
  stepFocusedDate,
} from "@/features/calendar/utils/core/date";
import { formatCalendarToolbarLabel } from "@/features/calendar/utils/grid/calendarToolbarLabel";
import { buildWeekTimedEventResizeGoogleEvent } from "@/features/calendar/utils/grid/calendarWeekTimedEventResize";
import { getEventLocalDayKeys } from "@/features/calendar/utils/parsing/eventParsing";

import { useCalendarErrorToasts } from "./useCalendarErrorToasts";
import { useClientCalendarEventsQuery } from "./useClientCalendarEventsQuery";

export type { CalendarQuickCreateState } from "@/features/calendar/types/calendarQuickCreate";

export type UseCalendarScreenParams = {
  clientUserId?: string;
  showSelectedDayEventList?: boolean;
};

export function useCalendarScreen({
  clientUserId,
  showSelectedDayEventList = true,
}: UseCalendarScreenParams) {
  const enqueueToast = useUIStore((s: UIState) => s.enqueueToast);
  const {
    isConnected,
    calendars,
    calendarsLoading,
    calendarsError,
    eventsError,
    connectGoogleCalendar,
  } = useGoogleCalendarStoreIntegration();

  const isClientView = Boolean(clientUserId);
  const scopedCalendars = useMemo(() => calendars ?? [], [calendars]);
  const silverKeyCalendarId = useMemo(
    () => (!isClientView ? (scopedCalendars[0]?.id ?? null) : null),
    [isClientView, scopedCalendars]
  );
  const defaultCalendarId = silverKeyCalendarId;

  useCalendarErrorToasts({
    calendarsError: isClientView ? null : calendarsError,
    eventsError: isClientView ? null : eventsError,
    enqueueToast,
  });

  const { permissionsLoading, hasRequiredPermissions, isPartiallyEnabled, permissions } =
    useGoogleCalendarPermissions();

  const { clientSettings, clientSettingsQuery, patchClientSettings } = useClientSettings();
  const serverShell = (clientSettings?.calendar?.shell as CalendarViewType | undefined) ?? "month";

  const [viewMode, setViewModeState] = useState<CalendarViewType>("month");
  const hydratedShellRef = useRef(false);

  useEffect(() => {
    if (hydratedShellRef.current) return;
    if (clientSettingsQuery.isLoading) return;
    hydratedShellRef.current = true;
    setViewModeState(serverShell);
  }, [clientSettingsQuery.isLoading, serverShell]);

  const setViewMode = useCallback(
    (mode: CalendarViewType) => {
      setViewModeState(mode);
      const availability = clientSettings?.calendar?.availability ?? "week";
      patchClientSettings({ calendar: { shell: mode, availability } });
    },
    [clientSettings?.calendar?.availability, patchClientSettings]
  );
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

  const {
    events: rawSelfEvents,
    refreshEvents: refetchEvents,
    updateEvent,
    deleteEvent,
    createEvent,
    isCreatingEvent,
  } = useGoogleEvents({
    calendarId: "primary",
    timeMin: range.timeMin,
    timeMax: range.timeMax,
    enabled: !isClientView && isConnected,
  });

  const clientEventsQuery = useClientCalendarEventsQuery(
    isClientView ? clientUserId! : null,
    range.timeMin,
    range.timeMax,
    "primary"
  );

  const rawEvents = useMemo((): ExtendedGoogleEvent[] => {
    if (isClientView) {
      return (clientEventsQuery.data ?? []).map((e) => ({
        ...e,
        calendarId: "primary",
        isClientEvent: true as const,
      }));
    }
    return rawSelfEvents;
  }, [isClientView, clientEventsQuery.data, rawSelfEvents]);

  const visibleEvents = rawEvents;

  const quickSession = useCalendarQuickCreateSession({
    isClientView,
    defaultCalendarId,
    visibleEvents,
    createEvent,
    isCreatingEvent,
    refetchEvents,
    calendarShellRef,
    onWeekGridEventSelect: setWeekSelectedEventId,
  });

  const gridDisplayEvents = quickSession.gridDisplayEvents;

  useEffect(() => {
    if (isClientView || viewMode !== "week" || !weekSelectedEventId) {
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
      if (t instanceof Element && t.closest("[data-silverkey-quick-event-popover]")) {
        return;
      }
      const hit = gridDisplayEvents.find((x) => x.id === weekSelectedEventId);
      if (!hit?.id || hit.isOptimisticCalendarDraft || hit.isProfileAvailabilityEvent) {
        return;
      }
      e.preventDefault();
      void deleteEvent(hit.id, hit.calendarId);
      setWeekSelectedEventId(null);
    };
    doc.addEventListener("keydown", onKeyDown, true);
    return () => doc.removeEventListener("keydown", onKeyDown, true);
  }, [isClientView, viewMode, weekSelectedEventId, gridDisplayEvents, deleteEvent]);

  const handleWeekTimedResizeCommit = useCallback(
    async (payload: {
      event: ExtendedGoogleEvent;
      dayKey: string;
      startMin: number;
      endMin: number;
    }) => {
      if (!payload.event.id || isClientView) {
        return;
      }
      try {
        const body = buildWeekTimedEventResizeGoogleEvent(
          payload.event,
          payload.dayKey,
          payload.startMin,
          payload.endMin
        );
        await updateEvent(payload.event.id, body, payload.event.calendarId);
        await refetchEvents();
      } catch (error) {
        log.error(LOG_CATEGORIES.ERRORS, "Week grid time resize failed", error);
        enqueueToast({
          type: "error",
          message: "Could not update event time",
        });
      }
    },
    [isClientView, updateEvent, refetchEvents, enqueueToast]
  );

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
    [showSelectedDayEventList, setViewMode]
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

  const handleConnect = useCallback(() => {
    connectGoogleCalendar();
  }, [connectGoogleCalendar]);

  const shouldShowConnectionPrompt = useMemo(() => {
    if (isClientView) return false;
    if (!isConnected) return true;
    if (isConnected && permissions !== null) {
      if (!hasRequiredPermissions || isPartiallyEnabled) return true;
    }
    return false;
  }, [isClientView, isConnected, permissions, hasRequiredPermissions, isPartiallyEnabled]);

  const permissionsReady = isClientView || (!permissionsLoading && permissions !== undefined);

  const bodySelectedKey = showSelectedDayEventList ? selectedDayKey : null;
  const gridCalendars = isClientView ? [] : scopedCalendars;

  return {
    isClientView,
    silverKeyCalendarId,
    defaultCalendarId,
    calendarsLoading,
    permissionsReady,
    clientEventsQuery,
    shouldShowConnectionPrompt,
    handleConnect,
    calendarShellRef,
    selectedDayKey,
    setSelectedDayKey,
    selectedEvents,
    getSelectedDayListHeading: (dateKey: string) => getCalendarDayListHeading(dateKey, "events"),
    refetchEvents,
    updateEvent,
    deleteEvent,
    gridCalendars,
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
    fullCreatePrefill: quickSession.fullCreatePrefill,
    fullCreateKey: quickSession.fullCreateKey,
    isCreatingQuickEvent: quickSession.isCreatingQuickEvent,
    isAgentUser: quickSession.isAgentUser,
    weekSelectedEventId,
    setWeekSelectedEventId,
    handleWeekTimedResizeCommit,
  };
}
