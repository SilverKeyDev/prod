import { Title } from "@/components/ui";
import { formatDateRange } from "@/features/calendar/utils/date";

type CalendarDateRangeProps = {
  firstDate: Date;
  lastDate: Date;
};

/**
 * Component that displays the date range of visible days in the calendar view.
 * Shows the first and last dates that are currently displayed in the calendar grid.
 */
export function CalendarDateRange({ firstDate, lastDate }: CalendarDateRangeProps) {
  const dateRange = formatDateRange(firstDate, lastDate);

  return (
    <Title size="md" as="h2" className="font-semibold text-gray-900">
      {dateRange}
    </Title>
  );
}
