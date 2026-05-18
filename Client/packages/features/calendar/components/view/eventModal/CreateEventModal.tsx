import { useCreateEventModal } from "@/features/calendar/hooks/data/createEvent/useCreateEventModal";
import type { CreateModalPrefilledCreateSnapshot } from "@/features/calendar/hooks/data/createEvent/useCreateEventModal.types";
import type { Calendar, ExtendedGoogleEvent } from "@/features/calendar/types/calendar";
import type { CreateEventModalAddWithoutSchedulePayload } from "@/features/calendar/types/createEventModal";
import type { GoogleEvent } from "@/features/calendar/types/googleEvent";

import type { CreateEventFormPopoverAnchorRect } from "./CreateEventFormPopover";
import { CreateEventFormPopover } from "./CreateEventFormPopover";
import { CreateEventModalForm } from "./CreateEventModalForm";

export type { CreateEventFormPopoverAnchorRect } from "./CreateEventFormPopover";
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
  /** When set with `presentation: "popover"`, renders the create form in a portaled panel (no modal chrome). */
  presentation?: "modal" | "popover";
  anchorRect?: CreateEventFormPopoverAnchorRect | null;
  registerOutsideClickSafeTarget?: (element: HTMLElement) => () => void;
};

export function CreateEventModal(props: CreateEventModalProps) {
  const { presentation = "modal", anchorRect, ...modalParams } = props;
  const { formProps } = useCreateEventModal(modalParams);

  if (presentation === "popover") {
    if (!props.isOpen || !anchorRect) {
      return null;
    }
    return (
      <CreateEventFormPopover
        {...formProps}
        anchorRect={anchorRect}
        registerOutsideClickSafeTarget={modalParams.registerOutsideClickSafeTarget}
      />
    );
  }

  return <CreateEventModalForm {...formProps} />;
}
