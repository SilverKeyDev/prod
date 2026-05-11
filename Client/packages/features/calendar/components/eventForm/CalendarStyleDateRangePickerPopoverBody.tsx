import { type RefObject } from "react";

import { Icon } from "@ui/icons";

import Button from "packages/ui/components/button/Button";
import { OliveCheckboxRowLabel } from "packages/ui/components/form/checkbox/OliveCheckboxRowLabel";
import OliveCheckbox from "packages/ui/components/form/OliveCheckbox";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import { dayjs } from "packages/utils/date";

import type { GoogleCalendar } from "@/features/calendar/api/types";
import { CalendarWeekView } from "@/features/calendar/components/shell/CalendarWeekView";
import { CalendarToolbar } from "@/features/calendar/components/view/CalendarToolbar";
import { WeekDayHeaders } from "@/features/calendar/components/view/calendarView/WeekDayHeaders";
import { CalendarViewModeToggle } from "@/features/calendar/components/view/CalendarViewModeToggle";
import type { CalendarViewType } from "@/features/calendar/types/calendar";

import { isInInclusiveRange } from "./calendarStyleDateRangePickerHelpers";

type GridCell = { date: Date; isCurrentMonth: boolean; isPast: boolean };

export type CalendarStyleDateRangePickerPopoverBodyProps = {
  popoverPanelContentRef: RefObject<HTMLDivElement | null>;
  rangeMode: boolean;
  setRangeMode: (next: boolean) => void;
  setPendingStart: (next: string | null) => void;
  onClose: () => void;
  effectiveLayout: "grid" | "week";
  mutualAvailabilityEnabled: boolean;
  mutualAvailabilityPopoverHint?: string;
  weekToolbarLabel: string;
  showWeekToggle: boolean;
  setLayoutMode: (next: "grid" | "week") => void;
  activateWeekView: () => void;
  handleWeekPrev: () => void;
  handleWeekNext: () => void;
  weekFocusedDate: Date;
  resolvedCalendars: GoogleCalendar[];
  handleWeekDayHeaderPress: (date: Date) => void;
  weekTimeSelectionEnabled: boolean;
  handleWeekTimeSlotDoubleClick: (payload: { date: Date; minutesFromMidnight: number }) => void;
  pendingStart: string | null;
  panelId?: string;
  goPrevWindow: () => void;
  goNextWindow: () => void;
  rangeTitle: string;
  handlePickerViewModeChange: (mode: CalendarViewType) => void;
  mutualAvailabilityHintsReady: boolean;
  mutualDayKeys?: Set<string>;
  grid: GridCell[];
  rangeLo: string;
  rangeHi: string;
  handleDayClick: (key: string) => void;
};

export function CalendarStyleDateRangePickerPopoverBody({
  popoverPanelContentRef,
  rangeMode,
  setRangeMode,
  setPendingStart,
  onClose,
  effectiveLayout,
  mutualAvailabilityEnabled,
  mutualAvailabilityPopoverHint,
  weekToolbarLabel,
  showWeekToggle,
  setLayoutMode,
  activateWeekView,
  handleWeekPrev,
  handleWeekNext,
  weekFocusedDate,
  resolvedCalendars,
  handleWeekDayHeaderPress,
  weekTimeSelectionEnabled,
  handleWeekTimeSlotDoubleClick,
  pendingStart,
  panelId,
  goPrevWindow,
  goNextWindow,
  rangeTitle,
  handlePickerViewModeChange,
  mutualAvailabilityHintsReady,
  mutualDayKeys,
  grid,
  rangeLo,
  rangeHi,
  handleDayClick,
}: CalendarStyleDateRangePickerPopoverBodyProps) {
  const handleRangeModeToggle = () => {
    const next = !rangeMode;
    setRangeMode(next);
    if (!next) {
      setPendingStart(null);
    }
  };
  return (
    <Box ref={popoverPanelContentRef} className="min-w-0">
      <Box className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <Box className="flex min-w-0 flex-1 items-center gap-2">
          <OliveCheckboxRowLabel onPress={handleRangeModeToggle}>Date range</OliveCheckboxRowLabel>
          <OliveCheckbox checked={rangeMode} onToggle={handleRangeModeToggle} />
        </Box>
        <Button type="button" variant="ghost" size="sm" onPress={onClose} iconName="x">
          Close
        </Button>
      </Box>

      {effectiveLayout === "week" ? (
        <>
          {mutualAvailabilityEnabled && mutualAvailabilityPopoverHint ? (
            <BodyText as="p" size="xs" className="text-text-secondary mb-2">
              {mutualAvailabilityPopoverHint}
            </BodyText>
          ) : null}
          <CalendarToolbar
            toolbarLabel={weekToolbarLabel}
            viewMode="week"
            onViewModeChange={(m) => {
              if (m === "month") {
                setLayoutMode("grid");
              } else {
                activateWeekView();
              }
            }}
            showViewModeToggle={showWeekToggle}
            onPrev={handleWeekPrev}
            onNext={handleWeekNext}
          >
            <CalendarWeekView
              focusedDate={weekFocusedDate}
              events={[]}
              calendars={resolvedCalendars}
              onDayHeaderPress={handleWeekDayHeaderPress}
              onWeekTimeSlotDoubleClick={
                weekTimeSelectionEnabled ? handleWeekTimeSlotDoubleClick : undefined
              }
              weekInteractionEnabled={weekTimeSelectionEnabled}
            />
          </CalendarToolbar>
          {weekTimeSelectionEnabled ? (
            <BodyText as="p" size="xs" className="text-text-secondary mt-2">
              Double-click a time slot to set the start time (default 1 hour). Tap a day header to
              pick a date without changing times.
            </BodyText>
          ) : rangeMode ? (
            pendingStart ? (
              <BodyText as="p" size="xs" className="text-text-secondary mt-2">
                Tap another day column header for the end of the range, or the same day to finish
                with one day.
              </BodyText>
            ) : (
              <BodyText as="p" size="xs" className="text-text-secondary mt-2">
                Tap the first day header, then the last day header for your range.
              </BodyText>
            )
          ) : (
            <BodyText as="p" size="xs" className="text-text-secondary mt-2">
              Tap a day header to choose that date — same as the profile week calendar.
            </BodyText>
          )}
        </>
      ) : (
        <>
          <Box className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 shrink-0 p-0"
              onPress={goPrevWindow}
              label="Previous dates"
            >
              <Icon name="chevron-left" className="h-4 w-4" />
            </Button>
            <Box
              id={panelId ? `${panelId}-title` : undefined}
              className="text-text-primary min-w-0 flex-1 truncate text-center text-sm font-semibold"
            >
              {rangeTitle}
            </Box>
            <Box className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 shrink-0 p-0"
                onPress={goNextWindow}
                label="Next dates"
              >
                <Icon name="chevron-right" className="h-4 w-4" />
              </Button>
              {showWeekToggle ? (
                <CalendarViewModeToggle
                  viewMode="month"
                  onViewModeChange={handlePickerViewModeChange}
                />
              ) : null}
            </Box>
          </Box>
          <WeekDayHeaders />
          {mutualAvailabilityEnabled && mutualAvailabilityPopoverHint ? (
            <BodyText as="p" size="xs" className="text-text-secondary mb-2">
              {mutualAvailabilityPopoverHint}
            </BodyText>
          ) : null}
          <Box className="grid grid-cols-7 gap-1">
            {grid.map((cell) => {
              const key = dayjs(cell.date).format("YYYY-MM-DD");
              const inRange = rangeLo && rangeHi && isInInclusiveRange(key, rangeLo, rangeHi);
              const isPending = pendingStart === key;

              const muted = !cell.isCurrentMonth || cell.isPast ? "opacity-40" : "";
              const selected =
                inRange || isPending
                  ? "border-border bg-accent-muted text-text-primary font-semibold"
                  : "border-border bg-background-surface text-text-primary";
              const mutualHighlight =
                mutualAvailabilityEnabled &&
                mutualAvailabilityHintsReady &&
                mutualDayKeys?.has(key) &&
                !muted
                  ? "ring-2 ring-emerald-500/55 bg-emerald-500/10"
                  : "";
              return (
                <Button
                  key={key}
                  type="button"
                  variant="ghost"
                  onPress={() => handleDayClick(key)}
                  className={`hover:bg-accent-muted relative flex h-10 min-h-10 w-full min-w-0 items-center justify-center rounded border p-0 text-sm transition-colors hover:border-neutral-400 ${selected} ${muted} ${mutualHighlight}`}
                >
                  {cell.date.getDate()}
                </Button>
              );
            })}
          </Box>
          {rangeMode ? (
            pendingStart ? (
              <BodyText as="p" size="xs" className="text-text-secondary mt-2">
                Tap another day for the end of the range, or tap the same day again to finish with
                one day.
              </BodyText>
            ) : (
              <BodyText as="p" size="xs" className="text-text-secondary mt-2">
                Tap the first day, then the last day of your range.
              </BodyText>
            )
          ) : (
            <BodyText as="p" size="xs" className="text-text-secondary mt-2">
              Tap a day to select — the calendar closes when you choose.
            </BodyText>
          )}
        </>
      )}
    </Box>
  );
}
