import { useMemo } from "react";

import type { UseCalendarEventRequestFormParams } from "@/features/agent/hooks/data/calendar/useCalendarEventRequestForm";
import { CreateEventModalForm } from "@/features/calendar/components/view/eventModal/CreateEventModalForm";
import { useCreateEventModal } from "@/features/calendar/hooks/data/createEvent/useCreateEventModal";
import { useGoogleCalendarStoreIntegration } from "@/features/calendar/hooks/store/useGoogleCalendarStoreIntegration";
import { useAgentChats } from "@/features/messaging/hooks/data/useAgentChats";

export type CalendarEventRequestModalProps = UseCalendarEventRequestFormParams & {
  isOpen: boolean;
  /** Agent: client already selected in messaging — prefill so Send Request can enable. */
  initialClientId?: string | null;
  /** Client: active messaging thread id for recipient + submit routing. */
  activeConversationId?: string | null;
};

export default function CalendarEventRequestModal({
  isOpen,
  onClose,
  onSuccess,
  sendCalendarEventMessage,
  initialClientId = null,
  activeConversationId = null,
}: CalendarEventRequestModalProps) {
  const { calendars } = useGoogleCalendarStoreIntegration();
  const scopedCalendars = useMemo(() => calendars ?? [], [calendars]);
  const defaultCalendarId = useMemo(() => scopedCalendars[0]?.id ?? "primary", [scopedCalendars]);
  const { conversations, sendMessage: sendMessageDirect } = useAgentChats();

  const { formProps } = useCreateEventModal({
    isOpen,
    onClose,
    calendars: scopedCalendars,
    defaultCalendarId,
    calendarEventRequest: {
      conversations,
      sendMessageDirect,
      onSuccess,
      sendCalendarEventMessage,
      initialClientId,
      activeConversationId,
    },
  });

  return <CreateEventModalForm {...formProps} modalTitle="Request Calendar Event" />;
}
