import {
  type Dispatch,
  type RefObject,
  type SetStateAction,
  useEffect,
  useLayoutEffect,
} from "react";

import { SILVERKEY_MODAL_ROOT_SELECTOR } from "packages/ui/components/modals/BaseModalTypes";
import { localYOffsetToRoundedMinutesFromMidnight } from "packages/utils/calendar/calendarQuickCreateSnap";
import { dayjs } from "packages/utils/date";
import { getDocument, getWindow } from "packages/utils/platform";

import { CAL_TIME_GRID_HOURS } from "@/features/calendar/components/timeGrid/calendarTimeGridConstants";
import type { ExtendedGoogleEvent } from "@/features/calendar/types/calendar";
import type {
  CalendarQuickCreateAnchorRect,
  CalendarQuickCreateState,
} from "@/features/calendar/types/calendarQuickCreate";
import { classifyQuickCreatePointerTarget } from "@/features/calendar/utils/grid/calendarQuickCreatePointer";

export function useCalendarQuickCreateOutsidePointer(
  quickCreate: CalendarQuickCreateState | null,
  isClientView: boolean,
  hourRowHeight: number,
  visibleEvents: ExtendedGoogleEvent[],
  commitQuickCreateRef: RefObject<() => Promise<void>>,
  beginQuickCreateWeek: (date: Date, minutesFromMidnight: number) => void,
  beginQuickCreateMonthDay: (date: Date) => void,
  setEditEvent: Dispatch<SetStateAction<ExtendedGoogleEvent | null>>,
  onWeekGridEventSelect?: (eventId: string) => void
): void {
  useEffect(() => {
    if (!quickCreate || isClientView) {
      return;
    }
    const doc = getDocument();
    if (!doc) {
      return;
    }

    const onPointerDown = async (e: PointerEvent) => {
      const target = e.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (target instanceof Element && target.closest(SILVERKEY_MODAL_ROOT_SELECTOR)) {
        return;
      }

      const hit = classifyQuickCreatePointerTarget(target);
      if (hit.kind === "popover") {
        return;
      }

      const totalGridHeight = CAL_TIME_GRID_HOURS * hourRowHeight;

      await commitQuickCreateRef.current?.();

      if (hit.kind === "week-empty") {
        const rect = hit.column.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const minutes = localYOffsetToRoundedMinutesFromMidnight(y, hourRowHeight, totalGridHeight);
        const d = dayjs(hit.ymd, "YYYY-MM-DD", true).toDate();
        beginQuickCreateWeek(d, minutes);
        return;
      }

      if (hit.kind === "month-day") {
        const d = dayjs(hit.dayKey, "YYYY-MM-DD", true).toDate();
        if (dayjs(d).isValid()) {
          beginQuickCreateMonthDay(d);
        }
        return;
      }

      if (hit.kind === "week-event") {
        onWeekGridEventSelect?.(hit.id);
        return;
      }

      if (hit.kind === "month-event") {
        const ev = visibleEvents.find((x) => x.id === hit.id);
        if (ev && !ev.isOptimisticCalendarDraft) {
          setEditEvent(ev);
        }
      }
    };

    doc.addEventListener("pointerdown", onPointerDown, true);
    return () => doc.removeEventListener("pointerdown", onPointerDown, true);
  }, [
    quickCreate,
    isClientView,
    hourRowHeight,
    beginQuickCreateWeek,
    beginQuickCreateMonthDay,
    visibleEvents,
    commitQuickCreateRef,
    setEditEvent,
    onWeekGridEventSelect,
  ]);
}

export function useCalendarQuickCreateEscape(
  quickCreate: CalendarQuickCreateState | null,
  isClientView: boolean,
  discardQuickCreate: () => void
): void {
  useEffect(() => {
    if (!quickCreate || isClientView) {
      return;
    }
    const doc = getDocument();
    if (!doc) {
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") {
        return;
      }
      const t = e.target;
      if (t instanceof Node) {
        const inModal = t instanceof Element && t.closest(SILVERKEY_MODAL_ROOT_SELECTOR);
        if (inModal) {
          return;
        }
      }
      e.preventDefault();
      discardQuickCreate();
    };
    doc.addEventListener("keydown", onKeyDown, true);
    return () => doc.removeEventListener("keydown", onKeyDown, true);
  }, [quickCreate, isClientView, discardQuickCreate]);
}

export function useCalendarQuickCreateAnchorLayout(
  quickCreate: CalendarQuickCreateState | null,
  calendarShellRef: RefObject<HTMLDivElement | null>,
  setQuickCreateAnchorRect: Dispatch<SetStateAction<CalendarQuickCreateAnchorRect | null>>
): void {
  useLayoutEffect(() => {
    if (!quickCreate) {
      setQuickCreateAnchorRect(null);
      return;
    }
    const measure = () => {
      const doc = getDocument();
      if (!doc) {
        return;
      }
      const el = doc.querySelector(`[data-calendar-week-event-id="${quickCreate.draftId}"]`);
      if (el instanceof HTMLElement) {
        const r = el.getBoundingClientRect();
        setQuickCreateAnchorRect({
          top: r.top,
          left: r.left,
          width: r.width,
          height: r.height,
        });
        return;
      }
      const m = doc.querySelector(`[data-calendar-month-draft-anchor="${quickCreate.draftId}"]`);
      if (m instanceof HTMLElement) {
        const r = m.getBoundingClientRect();
        setQuickCreateAnchorRect({
          top: r.top,
          left: r.left,
          width: r.width,
          height: r.height,
        });
        return;
      }
      const shell = calendarShellRef.current;
      if (shell) {
        const r = shell.getBoundingClientRect();
        setQuickCreateAnchorRect({
          top: r.top + 72,
          left: r.left + 16,
          width: 4,
          height: 4,
        });
        return;
      }
      setQuickCreateAnchorRect(null);
    };
    measure();
    const win = getWindow();
    win?.addEventListener("scroll", measure, true);
    win?.addEventListener("resize", measure);
    return () => {
      win?.removeEventListener("scroll", measure, true);
      win?.removeEventListener("resize", measure);
    };
  }, [quickCreate, calendarShellRef, setQuickCreateAnchorRect]);
}
