import type { ChangeEvent } from "react";

import type { CreateEventMutualAvailability } from "@/features/calendar/hooks/data/createEvent/useCreateEventMutualAvailability";
import type { Calendar, ExtendedGoogleEvent } from "@/features/calendar/types/calendar";
import type { CalendarEventKindId } from "@/features/calendar/utils/createEventModal/calendarEventKinds";

export type CreateEventModalFormFieldsProps = {
  mode: "create" | "edit";
  calendars: Calendar[];
  selectedCalendarId: string;
  onCalendarChange: (id: string) => void;
  hideCalendarPicker?: boolean;
  eventKindId: CalendarEventKindId;
  onEventKindIdChange: (id: CalendarEventKindId) => void;
  allowedKindIds: CalendarEventKindId[];
  eventTitle: string;
  onEventTitleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  isAllDay: boolean;
  onIsAllDayChange: (next: boolean) => void;
  startDate: string;
  endDate: string;
  onDateRangeChange: (startYmd: string, endYmd: string) => void;
  startTime: string;
  endTime: string;
  onStartTimeChange: (hhmm: string) => void;
  onEndTimeChange: (hhmm: string) => void;
  eventLocation: string;
  onEventLocationChange: (value: string) => void;
  locationScriptsReady: boolean;
  loadError: string | null;
  eventDescription: string;
  onEventDescriptionChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  addGoogleMeet: boolean;
  onAddGoogleMeetChange: (next: boolean) => void;
  showGoogleMeetOption: boolean;
  existingEvent?: ExtendedGoogleEvent;
  mutualSchedule: CreateEventMutualAvailability | null;
  registerOutsideClickSafeTarget?: (element: HTMLElement) => () => void;
  onCalendarTimedSlotPick: (payload: { startTime: string; endTime: string }) => void;
  /** Messaging calendar request: date/time required (not optional to-do). */
  scheduleRequired?: boolean;
};
