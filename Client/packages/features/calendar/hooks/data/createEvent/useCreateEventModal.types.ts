import type { Calendar, ExtendedGoogleEvent } from "@/features/calendar/types/calendar";
import type { CreateEventModalAddWithoutSchedulePayload } from "@/features/calendar/types/createEventModal";
import type { GoogleEvent } from "@/features/calendar/types/googleEvent";

export type CreateModalPrefilledCreateSnapshot = {
  eventTitle: string;
  eventDescription: string;
  eventLocation: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
};

export type UseCreateEventModalParams = {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date;
  calendars: Calendar[];
  defaultCalendarId?: string | null;
  onEventCreated?: () => void;
  onAddWithoutSchedule?: (payload: CreateEventModalAddWithoutSchedulePayload) => Promise<void>;
  mode?: "create" | "edit";
  existingEvent?: ExtendedGoogleEvent;
  updateEvent?: (eventId: string, event: GoogleEvent, calendarId?: string) => Promise<unknown>;
  /**
   * When opening create mode from quick-create “Edit details”, bump `prefilledCreateKey`
   * and pass field snapshot so the modal matches the inline draft.
   */
  prefilledCreateSnapshot?: CreateModalPrefilledCreateSnapshot | null;
  prefilledCreateKey?: number;
};
