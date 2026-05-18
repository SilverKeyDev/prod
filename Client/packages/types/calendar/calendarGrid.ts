export type CalendarViewType = "week" | "month";

export interface CalendarGridDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  isFirstOfMonth: boolean;
}
