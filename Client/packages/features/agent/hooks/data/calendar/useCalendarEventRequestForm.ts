import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  CALENDAR_EVENT_KIND_ORDER,
  CALENDAR_EVENT_KINDS,
  type CalendarEventKindId,
} from "packages/features/calendar";
import { useEventRequestScheduleAvailability } from "packages/features/calendar/hooks/data/availability/useEventRequestScheduleAvailability";
import { buildEventRequestMessage, type EventRequestPayload } from "packages/features/messaging";
// Import path avoids messaging barrel cycle (messaging barrel → AgentMessaging → MessagingModals → agent).
import { useAgentChats } from "packages/features/messaging/hooks/data/useAgentChats";
import { useIsAgent } from "packages/hooks/store";
import { log } from "packages/logger";
import { type UIState, useUIStore } from "packages/store";
import { dateNow, dateParseISO } from "packages/utils/core/date";

import { useAgentClients } from "@/features/agent/hooks/data/clients/useAgentClients";
import type { MessagingSendMessageOptions } from "@/features/messaging/hooks/data/messaging/types";

const DEFAULT_KIND_ID: CalendarEventKindId = "meeting";

export type UseCalendarEventRequestFormParams = {
  onClose: () => void;
  onSuccess?: () => void;
  sendCalendarEventMessage?: (
    message: string,
    options: MessagingSendMessageOptions & { conversationId: string }
  ) => Promise<void>;
};

export function useCalendarEventRequestForm({
  onClose,
  onSuccess,
  sendCalendarEventMessage,
}: UseCalendarEventRequestFormParams) {
  const isAgent = useIsAgent();
  const enqueueToast = useUIStore((s: UIState) => s.enqueueToast);
  const { clients, isLoading: isLoadingClients } = useAgentClients();
  const { conversations, sendMessage: sendMessageDirect } = useAgentChats();

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [eventKindId, setEventKindId] = useState<CalendarEventKindId>(DEFAULT_KIND_ID);
  const [eventTitle, setEventTitle] = useState(CALENDAR_EVENT_KINDS[DEFAULT_KIND_ID].label);
  const [eventDescription, setEventDescription] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [isSending, setIsSending] = useState(false);

  const kindSeededRef = useRef(false);

  useEffect(() => {
    kindSeededRef.current = false;
  }, [selectedClientId]);

  useEffect(() => {
    if (kindSeededRef.current) {
      return;
    }
    setEventKindId(DEFAULT_KIND_ID);
    setEventTitle(CALENDAR_EVENT_KINDS[DEFAULT_KIND_ID].label);
    kindSeededRef.current = true;
  }, [selectedClientId]);

  const handleEventKindIdChange = useCallback((id: CalendarEventKindId) => {
    setEventKindId(id);
    if (id !== "other") {
      setEventTitle(CALENDAR_EVENT_KINDS[id].label);
    } else {
      setEventTitle("");
    }
  }, []);

  const getConversationId = useCallback(
    (clientId: string): string | null => {
      const conversation = conversations.find((c) => c.client_id === clientId);
      return conversation?.id ?? null;
    },
    [conversations]
  );

  const clientConversation = !isAgent && conversations.length > 0 ? conversations[0] : null;

  const minDate = dateNow().add(1, "day").format("YYYY-MM-DD");

  const { dateOptions: eventRequestDateOptions, buildTimeOptionsForDate } =
    useEventRequestScheduleAvailability({
      minDateYmd: minDate,
    });

  const eventRequestTimeOptions = useMemo(
    () => buildTimeOptionsForDate(eventDate),
    [buildTimeOptionsForDate, eventDate]
  );

  useEffect(() => {
    if (!eventTime) {
      return;
    }
    const opt = eventRequestTimeOptions.find((o) => o.value === eventTime);
    if (opt?.disabled) {
      setEventTime("");
    }
  }, [eventDate, eventTime, eventRequestTimeOptions]);

  const canSend = Boolean(
    eventTitle.trim() &&
    eventDate &&
    eventTime &&
    (isAgent ? selectedClientId !== null : clientConversation !== null)
  );

  const resetForm = useCallback(() => {
    setEventKindId(DEFAULT_KIND_ID);
    setEventTitle(CALENDAR_EVENT_KINDS[DEFAULT_KIND_ID].label);
    setEventDescription("");
    setEventLocation("");
    setEventDate("");
    setEventTime("");
    setSelectedClientId(null);
    kindSeededRef.current = false;
  }, []);

  const handleSend = useCallback(async () => {
    if (!eventTitle.trim() || !eventDate || !eventTime) {
      return;
    }
    let conversationId: string | null = null;
    if (isAgent) {
      if (!selectedClientId) {
        return;
      }
      conversationId = getConversationId(selectedClientId);
      if (!conversationId) {
        conversationId = "new";
      }
    } else {
      if (!clientConversation) {
        return;
      }
      conversationId = clientConversation.id;
    }
    if (!conversationId) {
      return;
    }
    const dateTime = dateParseISO(`${eventDate}T${eventTime}`);
    const endTime = dateTime.add(30, "minute");
    const payload: EventRequestPayload = {
      title: eventTitle.trim(),
      start: dateTime.toISOString(),
      end: endTime.toISOString(),
      description: eventDescription.trim() || undefined,
      location: eventLocation.trim() || undefined,
    };
    const message = buildEventRequestMessage(payload);
    setIsSending(true);
    try {
      const clientIdToPass = isAgent && conversationId === "new" ? selectedClientId : undefined;
      if (sendCalendarEventMessage) {
        await sendCalendarEventMessage(message, {
          conversationId,
          clientIdForAgent: clientIdToPass ?? undefined,
        });
      } else {
        await sendMessageDirect(conversationId, message, clientIdToPass ?? undefined);
      }
      resetForm();
      onSuccess?.();
      onClose();
    } catch (error) {
      log.error("CALENDAR", "Error sending event request", error);
      enqueueToast({
        type: "error",
        message: error instanceof Error ? error.message : "Could not send event request",
      });
    } finally {
      setIsSending(false);
    }
  }, [
    clientConversation,
    enqueueToast,
    eventDate,
    eventDescription,
    eventLocation,
    eventTime,
    eventTitle,
    getConversationId,
    isAgent,
    onClose,
    onSuccess,
    resetForm,
    selectedClientId,
    sendCalendarEventMessage,
    sendMessageDirect,
  ]);

  return {
    isAgent,
    clients,
    isLoadingClients,
    clientConversation,
    selectedClientId,
    setSelectedClientId,
    eventKindId,
    onEventKindIdChange: handleEventKindIdChange,
    allowedKindIds: CALENDAR_EVENT_KIND_ORDER,
    eventTitle,
    setEventTitle,
    eventDescription,
    setEventDescription,
    eventLocation,
    setEventLocation,
    eventDate,
    setEventDate,
    eventTime,
    setEventTime,
    isSending,
    canSend,
    minDate,
    handleSend,
    eventRequestDateOptions,
    eventRequestTimeOptions,
  };
}
