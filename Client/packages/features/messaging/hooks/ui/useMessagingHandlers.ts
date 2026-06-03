import { useCallback } from "react";

import { log } from "packages/logger";
import { useUIStore } from "packages/store";
import type { components } from "packages/types/api.generated";
import type { SavedHome } from "packages/types/domain/savedHome";
import type { DocumentData } from "packages/ui/components/cards/document/types";

import { useEventRequests } from "@/features/agent/hooks/data/calendar/useEventRequests";
import { useGoogleEvents } from "@/features/calendar/hooks/data/google/useGoogleEvents";
import type { EventRequestPayload } from "@/features/messaging/utils/eventRequestPayload";

// Parity note: this hook is used by both web (AgentMessaging, ClientMessaging) and mobile (MessagingScreen.native).
// When adding new messaging attachment or event-request behaviors, update both platforms.

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
  sendSharedHomes: (homes: SavedHome[]) => Promise<void>;
  sendSharedDocument: (document: DocumentData) => Promise<void>;
  // Agent-only
  selectedClientId?: string | null;
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
  sendSharedHomes,
  sendSharedDocument,
  selectedClientId,
  agentId,
  clientUserId: _clientUserId,
}: UseMessagingHandlersArgs) {
  const enqueueToast = useUIStore((s) => s.enqueueToast);
  const { updateEventRequestStatus } = useEventRequests();
  const { createEvent } = useGoogleEvents({ enabled: false });

  const canShare = mode === "agent" ? !!selectedClientId : !!(activeConversationId || agentId);

  const handleSelectHomes = useCallback(
    async (homes: SavedHome[]) => {
      if (!canShare || homes.length === 0) return;
      try {
        await sendSharedHomes(homes);
        setShowSelectHomeModal(false);
      } catch (error) {
        log.error("MESSAGES", "Error sharing home", error);
      }
    },
    [canShare, sendSharedHomes, setShowSelectHomeModal]
  );

  const handleSelectDocument = useCallback(
    async (document: DocumentData) => {
      if (!canShare) {
        if (mode === "client") {
          log.error("MESSAGES", "Cannot share document: missing conversation or agent", {
            hasActiveConversationId: !!activeConversationId,
            hasAgentId: !!agentId,
          });
        }
        return;
      }
      const conversationId = activeConversationId || "new";
      try {
        await sendSharedDocument(document);
        if (mode === "client") {
          log.info("MESSAGES", "Document shared successfully", {
            documentId: document.id,
            conversationId,
          });
        }
        setShowSelectDocumentModal(false);
      } catch (error) {
        log.error("MESSAGES", "Error sharing document", {
          error,
          documentId: document.id,
          conversationId,
          agentId,
        });
      }
    },
    [canShare, mode, activeConversationId, agentId, sendSharedDocument, setShowSelectDocumentModal]
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
        const event: components["schemas"]["GoogleCalendarEventCreateBody"] = {
          summary: payload.title,
          description: payload.description ?? undefined,
          location: payload.location?.trim() || undefined,
          start: { dateTime: payload.start, timeZone },
          end: { dateTime: payload.end, timeZone },
          attendees: [{ email: otherEmail }],
          calendarId: "primary",
        };
        if (payload.itinerary) {
          event.itinerary = payload.itinerary;
        }
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
        log.error("CALENDAR", "Error creating event from request", error);
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
        log.error("CALENDAR", "Error cancelling event request", error);
        enqueueToast({
          type: "error",
          message: "Could not cancel event request.",
        });
      }
    },
    [enqueueToast, updateEventRequestStatus, refreshActiveConversationHistory, refreshChats]
  );

  return {
    handleSelectHomes,
    handleSelectDocument,
    handleCalendarEventSuccess,
    handleAcceptEventRequest,
    handleCancelEventRequest,
  };
}
