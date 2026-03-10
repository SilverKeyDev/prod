import type { FreebusyTimeBlock } from "packages/schemas/scheduling";

import type { ExtendedGoogleEvent } from "../../../types/calendar";

export type CalendarViewProps = {
  currentDate: Date;
  availability?: FreebusyTimeBlock[];
  onDateClick?: (date: Date) => void;
  silverKeyCalendarId?: string | null;
  onVisibleDatesChange?: (firstDate: Date, lastDate: Date) => void;
};

export type GridDay = {
  date: Date;
  isFirstOfMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  events: ExtendedGoogleEvent[];
  availability: FreebusyTimeBlock[];
};
