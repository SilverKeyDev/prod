import { useCallback, useState } from "react";

// eslint-disable-next-line silverkey/no-cross-feature-internals -- barrel import creates cycle (messaging barrel → AgentMessaging → MessagingModals → agent → here → messaging barrel)
import { useAgentChats } from "packages/features/messaging/hooks/data/useAgentChats";
import { useIsAgent } from "packages/hooks/store";
import { log, LOG_CATEGORIES } from "packages/logger";
import { dateNow, dateParseISO } from "packages/utils/date";

import { useAgentClients } from "@/features/agent/hooks/data/useAgentClients";
import type { MessagingSendMessageOptions } from "@/features/messaging/hooks/data/messaging/types";
import {
  buildEventRequestMessage,
  type EventRequestPayload,
} from "@/features/messaging/utils/eventRequestPayload";

export type UseCalendarEventRequestFormParams = {
  onClose: () => void;
  onSuccess?: () => void;
  sendCalendarEventMessage?: (
    message: string,
    options: MessagingSendMessageOptions & { conversationId: string },
  ) => Promise<void>;
};

export function useCalendarEventRequestForm({
  onClose,
  onSuccess,
  sendCalendarEventMessage,
}: UseCalendarEventRequestFormParams) {
  const isAgent = useIsAgent();
  const { clients, isLoading: isLoadingClients } = useAgentClients();
  const { conversations, sendMessage: sendMessageDirect } = useAgentChats();

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [isSending, setIsSending] = useState(false);

  const getConversationId = useCallback(
    (clientId: string): string | null => {
      const conversation = conversations.find((c) => c.client_id === clientId);
      return conversation?.id ?? null;
    },
    [conversations],
  );

  const clientConversation =
    !isAgent && conversations.length > 0 ? conversations[0] : null;

  const minDate = dateNow().add(1, "day").format("YYYY-MM-DD");

  const canSend = Boolean(
    eventTitle.trim() &&
      eventDate &&
      eventTime &&
      (isAgent ? selectedClientId !== null : clientConversation !== null),
  );

  const resetForm = useCallback(() => {
    setEventTitle("");
    setEventDescription("");
    setEventLocation("");
    setEventDate("");
    setEventTime("");
    setSelectedClientId(null);
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
      const clientIdToPass =
        isAgent && conversationId === "new" ? selectedClientId : undefined;
      if (sendCalendarEventMessage) {
        await sendCalendarEventMessage(message, {
          conversationId,
          clientIdForAgent: clientIdToPass ?? undefined,
        });
      } else {
        await sendMessageDirect(
          conversationId,
          message,
          clientIdToPass ?? undefined,
        );
      }
      resetForm();
      onSuccess?.();
      onClose();
    } catch (error) {
      log.error(LOG_CATEGORIES.CALENDAR, "Error sending event request", error);
    } finally {
      setIsSending(false);
    }
  }, [
    clientConversation,
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
  };
}
