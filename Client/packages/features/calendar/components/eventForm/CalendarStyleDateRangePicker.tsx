import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Icon } from "@ui/icons";
import type { MouseEvent } from "react";

import Button from "packages/ui/components/button/Button";
import Popover from "packages/ui/components/popover/Popover";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import Label from "packages/ui/components/text/Label.web";
import { dayjs } from "packages/utils/date";

import { WeekDayHeaders } from "@/features/calendar/components/view/calendarView/WeekDayHeaders";
import { buildMonthPickerGrid } from "@/features/calendar/utils/eventFormMonthGrid";

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
};

function orderedRange(a: string, b: string): { lo: string; hi: string } {
  const da = dayjs(a, "YYYY-MM-DD", true);
  const db = dayjs(b, "YYYY-MM-DD", true);
  if (!da.isValid() || !db.isValid()) {
    return { lo: a, hi: b };
  }
  return da.isAfter(db) ? { lo: b, hi: a } : { lo: a, hi: b };
}

function isInInclusiveRange(key: string, lo: string, hi: string): boolean {
  return key >= lo && key <= hi;
}

function formatRangeButtonLabel(start: string, end: string): string {
  if (!start) {
    return "Select date or range";
  }
  const s = dayjs(start, "YYYY-MM-DD", true);
  if (!s.isValid()) {
    return "Select date or range";
  }
  if (!end || end === start) {
    return s.format("ddd, MMM D, YYYY");
  }
  const e = dayjs(end, "YYYY-MM-DD", true);
  if (!e.isValid()) {
    return s.format("ddd, MMM D, YYYY");
  }
  const { lo, hi } = orderedRange(start, end);
  const loD = dayjs(lo, "YYYY-MM-DD", true);
  const hiD = dayjs(hi, "YYYY-MM-DD", true);
  if (loD.year() === hiD.year()) {
    return `${loD.format("MMM D")} – ${hiD.format("MMM D, YYYY")}`;
  }
  return `${loD.format("MMM D, YYYY")} – ${hiD.format("MMM D, YYYY")}`;
}

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
}: CalendarStyleDateRangePickerProps) {
  const { lo: rangeLo, hi: rangeHi } = useMemo(
    () =>
      startDate && endDate
        ? orderedRange(startDate, endDate)
        : { lo: "", hi: "" },
    [startDate, endDate],
  );

  const initialMonth = useMemo(() => {
    const trimmed = startDate?.trim() ?? "";
    if (trimmed && dayjs(trimmed, "YYYY-MM-DD", true).isValid()) {
      return dayjs(trimmed, "YYYY-MM-DD", true).startOf("month");
    }
    return dayjs().startOf("month");
  }, [startDate]);

  const [visibleMonth, setVisibleMonth] = useState(initialMonth);
  const [pendingStart, setPendingStart] = useState<string | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const wasPopoverOpenRef = useRef(false);

  // Sync month and clear range-in-progress only when the popover opens — not when
  // startDate updates after the first tap (that would clear pendingStart and block two-tap ranges).
  useEffect(() => {
    if (popoverOpen && !wasPopoverOpenRef.current) {
      setVisibleMonth(initialMonth);
      setPendingStart(null);
    }
    wasPopoverOpenRef.current = popoverOpen;
  }, [popoverOpen, initialMonth]);

  const grid = useMemo(
    () => buildMonthPickerGrid(visibleMonth.year(), visibleMonth.month()),
    [visibleMonth],
  );

  const monthTitle = visibleMonth.isValid()
    ? visibleMonth.format("MMMM YYYY")
    : dayjs().format("MMMM YYYY");

  const handleDayClick = useCallback(
    (key: string) => {
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
    [pendingStart, onRangeChange],
  );

  const goPrevMonth = useCallback(() => {
    setVisibleMonth((m) => m.subtract(1, "month"));
  }, []);

  const goNextMonth = useCallback(() => {
    setVisibleMonth((m) => m.add(1, "month"));
  }, []);

  const hasSelection = Boolean(startDate?.trim() || endDate?.trim());
  const showClear = Boolean(onClear && hasSelection);

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
        side="overlap"
        panelMinWidth="320px"
        panelClassName="p-3"
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
              <Icon
                name="calendar"
                className="text-text-secondary h-4 w-4 shrink-0"
              />
              <BodyText
                as="span"
                size="sm"
                className="text-text-primary min-w-0 flex-1 truncate"
              >
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
          <Box className="min-w-0">
            <Box className="mb-2 flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 shrink-0 p-0"
                onClick={goPrevMonth}
                label="Previous month"
              >
                <Icon name="chevron-left" className="h-4 w-4" />
              </Button>
              <Box
                id={panelId ? `${panelId}-title` : undefined}
                className="text-text-primary flex-1 truncate text-center text-sm font-semibold"
              >
                {monthTitle}
              </Box>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 shrink-0 p-0"
                onClick={goNextMonth}
                label="Next month"
              >
                <Icon name="chevron-right" className="h-4 w-4" />
              </Button>
            </Box>
            <WeekDayHeaders />
            <Box className="grid grid-cols-7 gap-1">
              {grid.map((cell) => {
                const inRange =
                  rangeLo &&
                  rangeHi &&
                  isInInclusiveRange(cell.key, rangeLo, rangeHi);
                const isPending = pendingStart === cell.key;

                const muted = !cell.inMonth ? "opacity-40" : "";
                const selected =
                  inRange || isPending
                    ? "border-border bg-accent-muted text-text-primary font-semibold"
                    : "border-border bg-background-surface text-text-primary";
                return (
                  <Button
                    key={cell.key}
                    type="button"
                    variant="ghost"
                    onClick={() => handleDayClick(cell.key)}
                    className={`hover:bg-accent-muted relative flex h-10 min-h-10 w-full min-w-0 items-center justify-center rounded border p-0 text-sm transition-colors hover:border-neutral-400 ${selected} ${muted}`}
                  >
                    {cell.dayOfMonth}
                  </Button>
                );
              })}
            </Box>
            {pendingStart ? (
              <BodyText as="p" size="xs" className="text-text-secondary mt-2">
                Tap another day to set a range, or tap the same day again or
                Close to finish.
              </BodyText>
            ) : (
              <BodyText as="p" size="xs" className="text-text-secondary mt-2">
                Tap a day — it saves immediately. Tap a second day for a date
                range.
              </BodyText>
            )}
            <Box className="mt-3 flex flex-wrap items-center justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Close
              </Button>
            </Box>
          </Box>
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
