import { useCreateEventModal } from "@/features/calendar/hooks/data/createEvent/useCreateEventModal";
import type { CreateModalPrefilledCreateSnapshot } from "@/features/calendar/hooks/data/createEvent/useCreateEventModal.types";
import type { Calendar, ExtendedGoogleEvent } from "@/features/calendar/types/calendar";
import type { CreateEventModalAddWithoutSchedulePayload } from "@/features/calendar/types/createEventModal";
import type { GoogleEvent } from "@/features/calendar/types/googleEvent";

import { CreateEventModalForm } from "./CreateEventModalForm";

export type { CreateEventModalAddWithoutSchedulePayload } from "@/features/calendar/types/createEventModal";

type CreateEventModalProps = {
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
  prefilledCreateSnapshot?: CreateModalPrefilledCreateSnapshot | null;
  prefilledCreateKey?: number;
};

export function CreateEventModal(props: CreateEventModalProps) {
  const { formProps } = useCreateEventModal(props);
  return <CreateEventModalForm {...formProps} />;
}
