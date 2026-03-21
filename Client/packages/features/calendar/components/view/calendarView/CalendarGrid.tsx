import { Fragment } from "react";

import { Box } from "packages/ui/components/primitives";

import { DayCell } from "./DayCell";
import type { GridDay } from "./types";

type CalendarGridProps = {
  calendarGrid: GridDay[];
  onDateClick?: (date: Date) => void;
  silverKeyCalendarId?: string | null;
  showAvailability?: boolean;
};

export function CalendarGrid({
  calendarGrid,
  onDateClick,
  silverKeyCalendarId,
  showAvailability = false,
}: CalendarGridProps) {
  return (
    <Box className="grid min-w-0 grid-cols-7 gap-1">
      {calendarGrid.map((day, index) => {
        const rowIndex = Math.floor(index / 7);
        const isFirstCellOfRow = index % 7 === 0;
        const showMonthBorderAbove =
          isFirstCellOfRow &&
          rowIndex >= 1 &&
          calendarGrid[rowIndex * 7].isFirstOfMonth;

        return (
          <Fragment key={`${day.date.toISOString().split("T")[0]}-${index}`}>
            {showMonthBorderAbove ? (
              <Box
                className="col-span-7 border-t-2 border-border"
                aria-hidden
              />
            ) : null}
            <DayCell
              day={day}
              index={index}
              onDateClick={onDateClick}
              silverKeyCalendarId={silverKeyCalendarId}
              showAvailability={showAvailability}
            />
          </Fragment>
        );
      })}
    </Box>
  );
}
