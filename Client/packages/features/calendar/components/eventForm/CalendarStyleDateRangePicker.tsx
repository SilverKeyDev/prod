import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { Icon } from "@ui/icons";
import type { MouseEvent } from "react";

import { Button } from "packages/ui";
import Popover from "packages/ui/components/popover/Popover";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import Label from "packages/ui/components/text/Label.web";
import {
  formatDateRange,
  getVisibleDateRange,
  stepFocusedDate,
} from "packages/utils/calendar/core/date";
import { formatCalendarToolbarLabel } from "packages/utils/calendar/grid/calendarToolbarLabel";
import { dateNow, dayjs } from "packages/utils/date";

import type { GoogleCalendar } from "@/features/calendar/api/types";
import type { Calendar, CalendarViewType } from "@/features/calendar/types/calendar";
import type { WeekTimeSlotDoubleClickPayload } from "@/features/calendar/types/calendarQuickCreate";
import { defaultTimedRangeFromMinutes } from "@/features/calendar/utils/grid/calendarQuickCreateDraft";

import { formatRangeButtonLabel, orderedRange } from "./calendarStyleDateRangePickerHelpers";
import { CalendarStyleDateRangePickerPopoverBody } from "./CalendarStyleDateRangePickerPopoverBody";

export type CalendarStyleDateRangePickerProps = {
  id?: string;
  label: string;
  required?: boolean;
  /** Shown under the trigger when set (e.g. optional calendar hint). */
  helperText?: string;
  startDate: string;
  endDate: string;
  onRangeChange: (startYmd: string, endYmd: string) => void;
  /** When set, a gray clear (X) control appears inside the field when a date is selected. */
  onClear?: () => void;
  disabled?: boolean;
  error?: string;
  /**
   * When this picker is inside a quick-create popover (or similar), register the open panel so
   * document-level outside-click handlers ignore clicks on the date grid.
   */
  registerOutsideClickSafeTarget?: (element: HTMLElement) => () => void;
  /** Highlight days where both parties have at least one mutually free slot (create flow). */
  mutualAvailabilityEnabled?: boolean;
  mutualAvailabilityHintsReady?: boolean;
  mutualDayKeys?: Set<string>;
  /** Short hint inside the date popover (e.g. legend). */
  mutualAvailabilityPopoverHint?: string;
  /** Calendars for week view (same shape as main calendar / profile). Defaults to primary. */
  calendars?: GoogleCalendar[] | Calendar[];
  /** When true, show a Grid / Week toggle; week uses `CalendarToolbar` + `CalendarWeekView` like profile availability. @default true */
  weekViewOption?: boolean;
  /** Initial layout when the popover opens (also reapplied each open). @default "grid" */
  initialLayout?: "grid" | "week";
  /**
   * Add-to-Agenda (timed): double-click a week time slot to set date + times (same as main calendar).
   * Mutual-availability row tinting from `EventFormTimeRange` does not apply on the grid — accepted trade-off.
   */
  weekTimeSelectionEnabled?: boolean;
  /** Called after a week slot double-click with derived start/end times. */
  onTimedSlotPick?: (payload: {
    startYmd: string;
    endYmd: string;
    startTime: string;
    endTime: string;
  }) => void;
};

export function CalendarStyleDateRangePicker({
  id,
  label,
  required,
  helperText,
  startDate,
  endDate,
  onRangeChange,
  onClear,
  disabled,
  error,
  registerOutsideClickSafeTarget,
  mutualAvailabilityEnabled = false,
  mutualAvailabilityHintsReady = false,
  mutualDayKeys,
  mutualAvailabilityPopoverHint,
  calendars,
  weekViewOption = true,
  initialLayout = "grid",
  weekTimeSelectionEnabled = false,
  onTimedSlotPick,
}: CalendarStyleDateRangePickerProps) {
  const { lo: rangeLo, hi: rangeHi } = useMemo(
    () => (startDate && endDate ? orderedRange(startDate, endDate) : { lo: "", hi: "" }),
    [startDate, endDate]
  );

  /** First Sunday of the visible 4-week grid (same anchor model as `Calendar.tsx`). */
  const initialGridAnchor = useMemo(() => {
    const thisWeekSunday = dateNow().subtract(dateNow().day(), "day").startOf("day");
    const trimmed = startDate?.trim() ?? "";
    if (trimmed && dayjs(trimmed, "YYYY-MM-DD", true).isValid()) {
      const d = dayjs(trimmed, "YYYY-MM-DD", true).startOf("day");
      return d.subtract(d.day(), "day").startOf("day");
    }
    return thisWeekSunday;
  }, [startDate]);

  const [gridAnchor, setGridAnchor] = useState(initialGridAnchor);
  const [pendingStart, setPendingStart] = useState<string | null>(null);
  /** When false, one tap selects a single day and closes. When true, two taps set a range (opt-in). */
  const [rangeMode, setRangeMode] = useState(false);
  /** Compact month grid vs profile-style week time grid (optional). */
  const [layoutMode, setLayoutMode] = useState<"grid" | "week">(() => initialLayout);
  const [weekFocusedDate, setWeekFocusedDate] = useState(() => dateNow().startOf("day").toDate());
  const [popoverOpen, setPopoverOpen] = useState(false);
  const wasPopoverOpenRef = useRef(false);
  const popoverPanelContentRef = useRef<HTMLDivElement | null>(null);

  const resolvedCalendars = useMemo((): GoogleCalendar[] => {
    if (calendars?.length) {
      return calendars.map((c) =>
        "accessRole" in c && typeof c.accessRole === "string"
          ? (c as GoogleCalendar)
          : {
              id: c.id,
              summary: c.summary,
              primary: c.primary ?? null,
              accessRole: "owner",
            }
      );
    }
    return [
      {
        id: "primary",
        summary: "Calendar",
        accessRole: "owner",
        primary: true,
      },
    ];
  }, [calendars]);

  const showWeekToggle = weekViewOption !== false;
  const effectiveLayout = showWeekToggle ? layoutMode : "grid";

  useLayoutEffect(() => {
    if (!popoverOpen || !registerOutsideClickSafeTarget) {
      return;
    }
    const el = popoverPanelContentRef.current;
    if (!el) {
      return;
    }
    return registerOutsideClickSafeTarget(el);
  }, [popoverOpen, registerOutsideClickSafeTarget]);

  // Sync grid window and clear range-in-progress only when the popover opens — not when
  // startDate updates after the first tap (that would clear pendingStart and block two-tap ranges).
  useEffect(() => {
    if (popoverOpen && !wasPopoverOpenRef.current) {
      setGridAnchor(initialGridAnchor);
      setPendingStart(null);
      setRangeMode(false);
      setLayoutMode(initialLayout);
      const t = startDate?.trim();
      if (initialLayout === "week") {
        if (t && dayjs(t, "YYYY-MM-DD", true).isValid()) {
          setWeekFocusedDate(dayjs(t, "YYYY-MM-DD", true).toDate());
        } else {
          setWeekFocusedDate(initialGridAnchor.toDate());
        }
      }
    }
    wasPopoverOpenRef.current = popoverOpen;
  }, [popoverOpen, initialGridAnchor, initialLayout, startDate]);

  const {
    start: rangeStart,
    end: rangeEnd,
    gridDays,
  } = useMemo(() => getVisibleDateRange(gridAnchor.toDate(), "month"), [gridAnchor]);

  const rangeTitle = formatDateRange(rangeStart, rangeEnd);

  const grid = gridDays ?? [];

  const handleDayClick = useCallback(
    (key: string) => {
      if (!rangeMode) {
        onRangeChange(key, key);
        setPopoverOpen(false);
        return;
      }
      if (pendingStart === null) {
        onRangeChange(key, key);
        setPendingStart(key);
        return;
      }
      if (pendingStart === key) {
        setPendingStart(null);
        setPopoverOpen(false);
        return;
      }
      const { lo, hi } = orderedRange(pendingStart, key);
      onRangeChange(lo, hi);
      setPendingStart(null);
      setPopoverOpen(false);
    },
    [rangeMode, pendingStart, onRangeChange]
  );

  const handleWeekDayHeaderPress = useCallback(
    (date: Date) => {
      const key = dayjs(date).format("YYYY-MM-DD");
      handleDayClick(key);
    },
    [handleDayClick]
  );

  const activateWeekView = useCallback(() => {
    setLayoutMode("week");
    setRangeMode(false);
    setPendingStart(null);
    const t = startDate?.trim();
    if (t && dayjs(t, "YYYY-MM-DD", true).isValid()) {
      setWeekFocusedDate(dayjs(t, "YYYY-MM-DD", true).toDate());
    } else {
      setWeekFocusedDate(gridAnchor.toDate());
    }
  }, [startDate, gridAnchor]);

  const handlePickerViewModeChange = useCallback(
    (mode: CalendarViewType) => {
      if (mode === "week") {
        activateWeekView();
      } else {
        setLayoutMode("grid");
      }
    },
    [activateWeekView]
  );

  const handleWeekTimeSlotDoubleClick = useCallback(
    (payload: WeekTimeSlotDoubleClickPayload) => {
      const ymd = dayjs(payload.date).format("YYYY-MM-DD");
      const { startTime, endTime } = defaultTimedRangeFromMinutes(ymd, payload.minutesFromMidnight);
      onRangeChange(ymd, ymd);
      onTimedSlotPick?.({
        startYmd: ymd,
        endYmd: ymd,
        startTime,
        endTime,
      });
      setPopoverOpen(false);
    },
    [onRangeChange, onTimedSlotPick]
  );

  const handleWeekPrev = useCallback(() => {
    setWeekFocusedDate((d) => stepFocusedDate(d, "week", -1));
  }, []);

  const handleWeekNext = useCallback(() => {
    setWeekFocusedDate((d) => stepFocusedDate(d, "week", 1));
  }, []);

  const weekToolbarLabel = useMemo(
    () => formatCalendarToolbarLabel(weekFocusedDate, "week"),
    [weekFocusedDate]
  );

  const goPrevWindow = useCallback(() => {
    setGridAnchor((prev) => prev.subtract(5, "week"));
  }, []);

  const goNextWindow = useCallback(() => {
    setGridAnchor((prev) => prev.add(5, "week"));
  }, []);

  const hasSelection = Boolean(startDate?.trim() || endDate?.trim());
  const showClear = Boolean(onClear && hasSelection);

  const popoverPanelMaxHeight =
    effectiveLayout === "week" ? "min(88vh, 820px)" : "min(72vh, 520px)";

  return (
    <Box className="w-full min-w-0">
      {label ? (
        <Label htmlFor={id} required={required} className="mb-2">
          {label}
        </Label>
      ) : null}
      <Popover
        open={popoverOpen}
        onOpenChange={setPopoverOpen}
        panelStack="modal"
        side="viewportCenter"
        matchTriggerWidth={effectiveLayout === "grid"}
        centerWidePanelMaxPx={effectiveLayout === "week" ? 720 : undefined}
        panelMaxHeight={popoverPanelMaxHeight}
        panelClassName={effectiveLayout === "week" ? "p-2" : "p-3"}
        triggerWrapperClassName="w-full min-w-0"
        trigger={({ open, onToggle, panelId }) => (
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            contentAlign="start"
            onClick={onToggle}
            aria-expanded={open}
            aria-haspopup="dialog"
            aria-controls={panelId}
            className="border-border bg-background-surface hover:bg-accent-muted focus:border-input-variant-focus-border h-12 w-full min-w-0 rounded-lg border px-3 text-left font-normal focus:ring-neutral-400"
          >
            <Box className="flex min-h-0 min-w-0 flex-1 items-center gap-2">
              <Icon name="calendar" className="text-text-secondary h-4 w-4 shrink-0" />
              <BodyText as="span" size="sm" className="text-text-primary min-w-0 flex-1 truncate">
                {formatRangeButtonLabel(startDate, endDate)}
              </BodyText>
            </Box>
            {showClear ? (
              <Box
                className="text-text-secondary hover:text-text-primary flex h-8 w-8 min-w-8 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-transparent"
                onClick={(e: MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClear?.();
                }}
                onMouseDown={(e: MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                role="button"
                label="Clear dates"
              >
                <Icon name="x" className="h-4 w-4" />
              </Box>
            ) : null}
          </Button>
        )}
      >
        {({ onClose, panelId }) => (
          <CalendarStyleDateRangePickerPopoverBody
            popoverPanelContentRef={popoverPanelContentRef}
            rangeMode={rangeMode}
            setRangeMode={setRangeMode}
            setPendingStart={setPendingStart}
            onClose={onClose}
            effectiveLayout={effectiveLayout}
            mutualAvailabilityEnabled={mutualAvailabilityEnabled}
            mutualAvailabilityPopoverHint={mutualAvailabilityPopoverHint}
            weekToolbarLabel={weekToolbarLabel}
            showWeekToggle={showWeekToggle}
            setLayoutMode={setLayoutMode}
            activateWeekView={activateWeekView}
            handleWeekPrev={handleWeekPrev}
            handleWeekNext={handleWeekNext}
            weekFocusedDate={weekFocusedDate}
            resolvedCalendars={resolvedCalendars}
            handleWeekDayHeaderPress={handleWeekDayHeaderPress}
            weekTimeSelectionEnabled={weekTimeSelectionEnabled}
            handleWeekTimeSlotDoubleClick={handleWeekTimeSlotDoubleClick}
            pendingStart={pendingStart}
            panelId={panelId}
            goPrevWindow={goPrevWindow}
            goNextWindow={goNextWindow}
            rangeTitle={rangeTitle}
            handlePickerViewModeChange={handlePickerViewModeChange}
            mutualAvailabilityHintsReady={mutualAvailabilityHintsReady}
            mutualDayKeys={mutualDayKeys}
            grid={grid}
            rangeLo={rangeLo}
            rangeHi={rangeHi}
            handleDayClick={handleDayClick}
          />
        )}
      </Popover>
      {helperText && !error ? (
        <BodyText as="p" size="xs" className="text-text-secondary mt-1">
          {helperText}
        </BodyText>
      ) : null}
      {error ? (
        <BodyText as="div" size="xs" className="text-destructive mt-1">
          {error}
        </BodyText>
      ) : null}
    </Box>
  );
}
