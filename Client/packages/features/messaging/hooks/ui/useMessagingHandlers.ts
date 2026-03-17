import { useCallback } from "react";

import { useMessaging } from "packages/hooks/data/chat/messaging";
import { useAgentChats } from "packages/hooks/data/chat/useAgentChats";
import { log, LOG_CATEGORIES } from "packages/logger";
import type { SavedHome } from "packages/schemas/property";
import { useUIStore } from "packages/store";
import type { DocumentData } from "packages/ui/components/cards/document/types";

import { useEventRequests } from "@/features/agent/hooks/data/useEventRequests";
import { useGoogleEvents } from "@/features/calendar/hooks/data/useGoogleEvents";
import type { EventRequestPayload } from "@/features/messaging/utils/eventRequestPayload";

// Parity note: this hook is used by both web (AgentMessaging, ClientMessaging) and mobile (MessagingScreen.native).
// When adding new messaging attachment or event-request behaviors, update both platforms and
// keep `documentation/client/mobile-parity/messaging-mobile-parity.md` in sync.

type UseMessagingHandlersArgs = {
  mode: "agent" | "client";
  activeConversationId: string | null;
  activeConversation: { client_email?: string; agent_email?: string } | null;
  setShowSelectHomeModal: (v: boolean) => void;
  setShowSelectDocumentModal: (v: boolean) => void;
  setShowCalendarEventModal: (v: boolean) => void;
  setAcceptingEventRequestId: (v: string | null) => void;
  refreshActiveConversationHistory: () => Promise<void>;
  refreshChats: () => Promise<void>;
  // Agent-only
  selectedClientId?: string | null;
  setShowSelectAgreementModal?: (v: boolean) => void;
  // Client-only (conversationSelector for useMessaging when mode is client)
  agentId?: string | null;
  clientUserId?: string | null;
};

export function useMessagingHandlers({
  mode,
  activeConversationId,
  activeConversation,
  setShowSelectHomeModal,
  setShowSelectDocumentModal,
  setShowCalendarEventModal,
  setAcceptingEventRequestId,
  refreshActiveConversationHistory,
  refreshChats,
  selectedClientId,
  agentId,
  clientUserId,
  setShowSelectAgreementModal,
}: UseMessagingHandlersArgs) {
  const enqueueToast = useUIStore((s) => s.enqueueToast);
  const { sendMessage: sendMessageApi } = useMessaging({
    mode,
    conversationSelector:
      mode === "agent" ? selectedClientId : (clientUserId ?? activeConversationId),
    clientIdForSending: mode === "agent" ? selectedClientId : undefined,
    agentId: mode === "client" ? agentId : undefined,
  });
  const { sendMessage: sendMessageWithAttachment } = useAgentChats();
  const { updateEventRequestStatus } = useEventRequests();
  const { createEvent } = useGoogleEvents({ enabled: false });

  const clientIdForAttachment = mode === "agent" ? selectedClientId : undefined;
  const canShare = mode === "agent" ? !!selectedClientId : !!(activeConversationId || agentId);

  const handleSelectHome = useCallback(
    async (home: SavedHome) => {
      if (!canShare) return;
      const conversationId = activeConversationId || "new";
      const propertyId = home.home_id || home.address || "";
      try {
        await sendMessageWithAttachment(
          conversationId,
          "",
          clientIdForAttachment ?? undefined,
          propertyId
        );
        setShowSelectHomeModal(false);
      } catch (error) {
        log.error(LOG_CATEGORIES.MESSAGES, "Error sharing home", error);
      }
    },
    [
      canShare,
      activeConversationId,
      clientIdForAttachment,
      sendMessageWithAttachment,
      setShowSelectHomeModal,
    ]
  );

  const handleSelectDocument = useCallback(
    async (document: DocumentData) => {
      if (!canShare) {
        if (mode === "client") {
          log.error(
            LOG_CATEGORIES.MESSAGES,
            "Cannot share document: missing conversation or agent",
            {
              hasActiveConversationId: !!activeConversationId,
              hasAgentId: !!agentId,
            }
          );
        }
        return;
      }
      const conversationId = activeConversationId || "new";
      try {
        await sendMessageWithAttachment(
          conversationId,
          "",
          clientIdForAttachment ?? undefined,
          undefined,
          document.id
        );
        if (mode === "client") {
          log.info(LOG_CATEGORIES.MESSAGES, "Document shared successfully", {
            documentId: document.id,
            conversationId,
          });
        }
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
    [
      canShare,
      mode,
      activeConversationId,
      agentId,
      clientIdForAttachment,
      sendMessageWithAttachment,
      setShowSelectDocumentModal,
    ]
  );

  const handleSelectAgreement = useCallback(
    async (agreement: { title?: string }) => {
      if (mode !== "agent" || !selectedClientId || !setShowSelectAgreementModal) return;
      try {
        await sendMessageApi(`Shared agreement: ${agreement.title}`);
        setShowSelectAgreementModal(false);
      } catch (error) {
        log.error(LOG_CATEGORIES.MESSAGES, "Error sharing agreement", error);
      }
    },
    [mode, selectedClientId, sendMessageApi, setShowSelectAgreementModal]
  );

  const handleCalendarEventSuccess = useCallback(() => {
    setShowCalendarEventModal(false);
  }, [setShowCalendarEventModal]);

  const otherEmail =
    mode === "agent" ? activeConversation?.client_email : activeConversation?.agent_email;
  const otherEmailError =
    mode === "agent"
      ? "Could not add event. Client email is missing."
      : "Could not add event. Other party email is missing.";

  const handleAcceptEventRequest = useCallback(
    async (messageId: string, payload: EventRequestPayload) => {
      if (!otherEmail) {
        enqueueToast({
          type: "error",
          message: otherEmailError,
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
        if (mode === "client") {
          await refreshActiveConversationHistory();
          await refreshChats();
        }
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
      otherEmail,
      otherEmailError,
      enqueueToast,
      updateEventRequestStatus,
      createEvent,
      mode,
      refreshActiveConversationHistory,
      refreshChats,
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
    [enqueueToast, updateEventRequestStatus, refreshActiveConversationHistory, refreshChats]
  );

  return {
    handleSelectHome,
    handleSelectDocument,
    handleSelectAgreement: mode === "agent" ? handleSelectAgreement : undefined,
    handleCalendarEventSuccess,
    handleAcceptEventRequest,
    handleCancelEventRequest,
  };
}
