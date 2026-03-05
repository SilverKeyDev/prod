import { useCallback } from "react";

import { useAgentChats } from "packages/hooks/data/chat/useAgentChats";
import { log, LOG_CATEGORIES } from "packages/logger";
import type { SavedHome } from "packages/schemas/property";
import { useUIStore } from "packages/store";
import type { DocumentData } from "packages/ui/components/cards/document/DocumentCard";

import { useEventRequests } from "@/features/agent/hooks/data/useEventRequests";
import { useGoogleEvents } from "@/features/calendar/hooks/data/useGoogleEvents";
import type { EventRequestPayload } from "@/features/messaging/utils/eventRequestPayload";

// Parity note: this hook is used by both web (`ClientMessaging`) and mobile (`MessagingScreen.native`).
// When adding new messaging attachment or event-request behaviors, update both platforms and
// keep `documentation/client/mobile-parity/messaging-mobile-parity.md` in sync.

type UseClientMessagingHandlersArgs = {
  activeConversationId: string | null;
  agentId: string | undefined;
  activeConversation: { agent_email?: string } | null;
  setShowSelectHomeModal: (v: boolean) => void;
  setShowSelectDocumentModal: (v: boolean) => void;
  setShowCalendarEventModal: (v: boolean) => void;
  setAcceptingEventRequestId: (v: string | null) => void;
  refreshActiveConversationHistory: () => Promise<void>;
  refreshChats: () => Promise<void>;
};

export function useClientMessagingHandlers({
  activeConversationId,
  agentId,
  activeConversation,
  setShowSelectHomeModal,
  setShowSelectDocumentModal,
  setShowCalendarEventModal,
  setAcceptingEventRequestId,
  refreshActiveConversationHistory,
  refreshChats,
}: UseClientMessagingHandlersArgs) {
  const enqueueToast = useUIStore((s) => s.enqueueToast);
  const { sendMessage: sendMessageWithAttachment } = useAgentChats();
  const { updateEventRequestStatus } = useEventRequests();
  const { createEvent } = useGoogleEvents({ enabled: false });

  const handleSelectHome = useCallback(
    async (home: SavedHome) => {
      if (!activeConversationId && !agentId) return;
      const conversationId = activeConversationId || "new";
      const propertyId = home.home_id || home.address || "";
      try {
        await sendMessageWithAttachment(conversationId, "", undefined, propertyId);
        setShowSelectHomeModal(false);
      } catch (error) {
        log.error(LOG_CATEGORIES.MESSAGES, "Error sharing home", error);
      }
    },
    [activeConversationId, agentId, sendMessageWithAttachment, setShowSelectHomeModal]
  );

  const handleSelectDocument = useCallback(
    async (document: DocumentData) => {
      if (!activeConversationId && !agentId) {
        log.error(LOG_CATEGORIES.MESSAGES, "Cannot share document: missing conversation or agent", {
          hasActiveConversationId: !!activeConversationId,
          hasAgentId: !!agentId,
        });
        return;
      }
      const conversationId = activeConversationId || "new";
      try {
        await sendMessageWithAttachment(conversationId, "", undefined, undefined, document.id);
        log.info(LOG_CATEGORIES.MESSAGES, "Document shared successfully", {
          documentId: document.id,
          conversationId,
        });
        setShowSelectDocumentModal(false);
      } catch (error) {
        log.error(LOG_CATEGORIES.MESSAGES, "Error sharing document", {
          error,
          documentId: document.id,
          conversationId,
          agentId,
        });
      }
    },
    [activeConversationId, agentId, sendMessageWithAttachment, setShowSelectDocumentModal]
  );

  const handleCalendarEventSuccess = useCallback(() => {
    setShowCalendarEventModal(false);
  }, [setShowCalendarEventModal]);

  const handleAcceptEventRequest = useCallback(
    async (messageId: string, payload: EventRequestPayload) => {
      const otherEmail = activeConversation?.agent_email;
      if (!otherEmail) {
        enqueueToast({
          type: "error",
          message: "Could not add event. Other party email is missing.",
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
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
        const event = {
          summary: payload.title,
          description: payload.description ?? undefined,
          start: { dateTime: payload.start, timeZone },
          end: { dateTime: payload.end, timeZone },
          attendees: [{ email: otherEmail }],
          calendarId: "primary",
        };
        await createEvent(event);
        await refreshActiveConversationHistory();
        await refreshChats();
        enqueueToast({
          type: "success",
          message: "Event added to your calendar and invite sent.",
        });
      } catch (error) {
        log.error(LOG_CATEGORIES.CALENDAR, "Error creating event from request", error);
        enqueueToast({
          type: "error",
          message: "Could not add event. Connect Google Calendar in Settings.",
        });
      } finally {
        setAcceptingEventRequestId(null);
      }
    },
    [
      activeConversation?.agent_email,
      enqueueToast,
      refreshActiveConversationHistory,
      refreshChats,
      updateEventRequestStatus,
      createEvent,
      setAcceptingEventRequestId,
    ]
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
        log.error(LOG_CATEGORIES.CALENDAR, "Error cancelling event request", error);
        enqueueToast({
          type: "error",
          message: "Could not cancel event request.",
        });
      }
    },
    [enqueueToast, refreshActiveConversationHistory, refreshChats, updateEventRequestStatus]
  );

  return {
    handleSelectHome,
    handleSelectDocument,
    handleCalendarEventSuccess,
    handleAcceptEventRequest,
    handleCancelEventRequest,
  };
}
