import type { AgentConversation } from "packages/api";

import type { Calendar, ExtendedGoogleEvent } from "@/features/calendar/types/calendar";
import type { CreateEventModalAddWithoutSchedulePayload } from "@/features/calendar/types/createEventModal";
import type { GoogleEvent } from "@/features/calendar/types/googleEvent";
import type { MessagingSendMessageOptions } from "@/features/messaging/hooks/data/messaging/types";

/** Injected by messaging so calendar code does not subscribe to chat queries unless this flow is used. */
export type CalendarEventRequestModalIntegration = {
  conversations: AgentConversation[];
  sendMessageDirect: (conversationId: string, message: string, clientId?: string) => Promise<void>;
  onSuccess?: () => void;
  sendCalendarEventMessage?: (
    message: string,
    options: MessagingSendMessageOptions & { conversationId: string }
  ) => Promise<void>;
};

export type CreateModalPrefilledCreateSnapshot = {
  eventTitle: string;
  eventDescription: string;
  eventLocation: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  /** When true, create flow treats times as chosen from a week grid slot (same as date picker week pick). */
  timesChosenViaWeekSlot?: boolean;
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
  /**
   * When set (create mode only), primary action sends a structured calendar request message
   * instead of creating a Google Calendar event.
   */
  calendarEventRequest?: CalendarEventRequestModalIntegration;
  /** Week create popover: register portaled menu roots for outside-click guards. */
  registerOutsideClickSafeTarget?: (element: HTMLElement) => () => void;
};
