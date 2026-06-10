import { Box } from "packages/ui/components/structure/primitives";

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function WeekDayHeaders() {
  return (
    <Box className="mb-2 grid grid-cols-7 gap-1">
      {WEEK_DAYS.map((day) => (
        <Box
          key={day}
          className="text-text-secondary py-2 text-center text-xs font-semibold sm:text-sm"
        >
          {day}
        </Box>
      ))}
    </Box>
  );
}
