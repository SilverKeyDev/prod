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
      {calendarGrid.map((day, index) => (
        <DayCell
          key={`${day.date.toISOString().split("T")[0]}-${index}`}
          day={day}
          index={index}
          onDateClick={onDateClick}
          silverKeyCalendarId={silverKeyCalendarId}
          showAvailability={showAvailability}
        />
      ))}
    </Box>
  );
}
