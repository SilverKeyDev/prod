import { useCallback } from "react";

import { log, LOG_CATEGORIES } from "logger";

import { useEventRequests } from "packages/hooks/data/agent/useEventRequests";
import { useGoogleEvents } from "packages/hooks/data/calendar/useGoogleEvents";
import { useMessaging } from "packages/hooks/data/chat/messaging";
import { useAgentChats } from "packages/hooks/data/chat/useAgentChats";
import type { SavedHome } from "packages/schemas/search/property";
import { useUIStore } from "packages/store";
import type { EventRequestPayload } from "packages/utils/domain/messaging/eventRequestPayload";

import type { DocumentData } from "@/components/cards/documents/DocumentCard";

type UseAgentMessagingHandlersArgs = {
  selectedClientId: string | null;
  activeConversationId: string | null;
  activeConversation: { client_email?: string } | null;
  setShowSelectHomeModal: (v: boolean) => void;
  setShowSelectDocumentModal: (v: boolean) => void;
  setShowSelectAgreementModal: (v: boolean) => void;
  setShowCalendarEventModal: (v: boolean) => void;
  setAcceptingEventRequestId: (v: string | null) => void;
  refreshActiveConversationHistory: () => Promise<void>;
  refreshChats: () => Promise<void>;
};

export function useAgentMessagingHandlers({
  selectedClientId,
  activeConversationId,
  activeConversation,
  setShowSelectHomeModal,
  setShowSelectDocumentModal,
  setShowSelectAgreementModal,
  setShowCalendarEventModal,
  setAcceptingEventRequestId,
  refreshActiveConversationHistory,
  refreshChats,
}: UseAgentMessagingHandlersArgs) {
  const enqueueToast = useUIStore((s) => s.enqueueToast);
  const { sendMessage: sendMessageApi } = useMessaging({
    mode: "agent",
    conversationSelector: selectedClientId,
    clientIdForSending: selectedClientId,
  });
  const { sendMessage: sendMessageWithAttachment } = useAgentChats();
  const { updateEventRequestStatus } = useEventRequests();
  const { createEvent } = useGoogleEvents({ enabled: false });

  const handleSelectHome = useCallback(
    async (home: SavedHome) => {
      if (!selectedClientId) return;
      const conversationId = activeConversationId || "new";
      const propertyId = home.home_id || home.address || "";
      try {
        await sendMessageWithAttachment(
          conversationId,
          "",
          selectedClientId,
          propertyId,
        );
        setShowSelectHomeModal(false);
      } catch (error) {
        log.error(LOG_CATEGORIES.MESSAGES, "Error sharing home", error);
      }
    },
    [
      selectedClientId,
      activeConversationId,
      sendMessageWithAttachment,
      setShowSelectHomeModal,
    ],
  );

  const handleSelectDocument = useCallback(
    async (document: DocumentData) => {
      if (!selectedClientId) return;
      const conversationId = activeConversationId || "new";
      try {
        await sendMessageWithAttachment(
          conversationId,
          "",
          selectedClientId,
          undefined,
          document.id,
        );
        setShowSelectDocumentModal(false);
      } catch (error) {
        log.error(LOG_CATEGORIES.MESSAGES, "Error sharing document", error);
      }
    },
    [
      selectedClientId,
      activeConversationId,
      sendMessageWithAttachment,
      setShowSelectDocumentModal,
    ],
  );

  const handleSelectAgreement = useCallback(
    async (agreement: { title?: string }) => {
      if (!selectedClientId) return;
      try {
        await sendMessageApi(`Shared agreement: ${agreement.title}`);
        setShowSelectAgreementModal(false);
      } catch (error) {
        log.error(LOG_CATEGORIES.MESSAGES, "Error sharing agreement", error);
      }
    },
    [selectedClientId, sendMessageApi, setShowSelectAgreementModal],
  );

  const handleCalendarEventSuccess = useCallback(() => {
    setShowCalendarEventModal(false);
  }, [setShowCalendarEventModal]);

  const handleAcceptEventRequest = useCallback(
    async (messageId: string, payload: EventRequestPayload) => {
      const otherEmail = activeConversation?.client_email;
      if (!otherEmail) {
        enqueueToast({
          type: "error",
          message: "Could not add event. Client email is missing.",
        });
        return;
      }
      setAcceptingEventRequestId(messageId);
      try {
        const statusRes = await updateEventRequestStatus(messageId, "accepted");
        if (!statusRes.success) {
          enqueueToast({
            type: "error",
            message: statusRes.error ?? "Could not accept event request.",
          });
          return;
        }
        const timeZone =
          Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
        const event = {
          summary: payload.title,
          description: payload.description ?? undefined,
          start: { dateTime: payload.start, timeZone },
          end: { dateTime: payload.end, timeZone },
          attendees: [{ email: otherEmail }],
          calendarId: "primary",
        };
        await createEvent(event);
        enqueueToast({
          type: "success",
          message: "Event added to your calendar and invite sent.",
        });
      } catch (error) {
        log.error(
          LOG_CATEGORIES.CALENDAR,
          "Error creating event from request",
          error,
        );
        enqueueToast({
          type: "error",
          message: "Could not add event. Connect Google Calendar in Settings.",
        });
      } finally {
        setAcceptingEventRequestId(null);
      }
    },
    [
      activeConversation?.client_email,
      enqueueToast,
      updateEventRequestStatus,
      createEvent,
      setAcceptingEventRequestId,
    ],
  );

  const handleCancelEventRequest = useCallback(
    async (messageId: string) => {
      try {
        const res = await updateEventRequestStatus(messageId, "cancelled");
        if (res.success) {
          await refreshActiveConversationHistory();
          await refreshChats();
        } else {
          enqueueToast({
            type: "error",
            message: res.error ?? "Could not cancel event request.",
          });
        }
      } catch (error) {
        log.error(
          LOG_CATEGORIES.CALENDAR,
          "Error cancelling event request",
          error,
        );
        enqueueToast({
          type: "error",
          message: "Could not cancel event request.",
        });
      }
    },
    [
      enqueueToast,
      updateEventRequestStatus,
      refreshActiveConversationHistory,
      refreshChats,
    ],
  );

  return {
    handleSelectHome,
    handleSelectDocument,
    handleSelectAgreement,
    handleCalendarEventSuccess,
    handleAcceptEventRequest,
    handleCancelEventRequest,
  };
}
