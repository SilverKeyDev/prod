import React, { useMemo } from "react";

import { View } from "react-native";

import { useLocalization } from "packages/contexts";
import { useDocumentsData, useFormsLibrary } from "packages/features/documents";
import type {
  ChatMessage,
  EventRequestStatus,
} from "packages/features/messaging/hooks/data/messaging/types";
import { parseAgreementEventPayload } from "packages/features/messaging/utils/agreementEventPayload";
import { parseEventRequestPayload } from "packages/features/messaging/utils/eventRequestPayload";
import { getDateDividerText } from "packages/features/messaging/utils/messageDateUtils";
import { isAgreementMessagingAttachmentUnavailable } from "packages/features/messaging/utils/messagingAttachmentAvailability";
import {
  mergeBundleChecklistFormsForDisplay,
  mergeBundleDocumentsForDisplay,
  mergeBundleHomesForDisplay,
  parseSharedAttachmentSnapshot,
} from "packages/features/messaging/utils/sharedAttachmentSnapshot";
import { useSavedHomesData } from "packages/features/search";
import { useNavigation } from "packages/navigation";
import { useAuthStore } from "packages/store";
import { Pressable, Text } from "packages/ui/components/primitives";

import { messagingMessageRowNativeStyles as styles } from "./MessagingMessageRowNative.styles";
import {
  MessagingMessageRowNativeBubbleBody,
  type SharedBundleAttachmentSnapshot,
} from "./MessagingMessageRowNativeBubbleBody";

type MessagingMessageRowNativeProps = {
  message: ChatMessage;
  previousMessage: ChatMessage | null;
  mode: "client" | "agent";
  formatTime: (date: Date) => string;
  /** When true, "Delivered" is shown for the latest user message (matches web ClientMessageRow). */
  isMostRecentMessage?: boolean;
  onRetryMessage?: (messageId: string) => void;
  onAcceptEventRequest?: (
    messageId: string,
    payload: {
      title: string;
      start: string;
      end: string;
      description?: string;
    }
  ) => Promise<void>;
  onCancelEventRequest?: (messageId: string) => Promise<void>;
  acceptedEventRequestIds?: Set<string>;
  acceptingEventRequestId?: string | null;
  /** Same as document cards: opens agreement PDF viewer (web parity). */
  onAgreementViewDocument?: (agreementId: string, documentName: string) => void;
  onAgreementSignNow?: (agreementId: string) => void;
};

function resolveMessagingBubbleSurfaceStyle(
  bundleSnap: SharedBundleAttachmentSnapshot | null,
  showAgreementEventCard: boolean,
  showChecklistFormCard: boolean,
  isCurrentUserMessage: boolean
) {
  if (bundleSnap || showAgreementEventCard || showChecklistFormCard) {
    return styles.bubbleAgreementEmbed;
  }
  return isCurrentUserMessage ? styles.bubbleUser : styles.bubbleAgent;
}

function getMessagingNativeOutboundStatusLabel(
  status: NonNullable<ChatMessage["status"]>,
  shouldShowDelivered: boolean
): string {
  if (status === "sending") return "Sending...";
  if (shouldShowDelivered) return "Delivered";
  if (status === "delivered") return "";
  if (status === "failed") return "Failed to send";
  return "";
}

type MessagingMessageRowNativeStatusFooterProps = {
  isCurrentUserMessage: boolean;
  message: ChatMessage;
  onRetryMessage?: (messageId: string) => void;
  shouldShowDelivered: boolean;
};

function MessagingMessageRowNativeStatusFooter({
  isCurrentUserMessage,
  message,
  onRetryMessage,
  shouldShowDelivered,
}: MessagingMessageRowNativeStatusFooterProps) {
  if (!isCurrentUserMessage || !message.status) return null;

  const statusLabel = getMessagingNativeOutboundStatusLabel(message.status, shouldShowDelivered);

  return (
    <View style={[styles.statusRow, isCurrentUserMessage ? styles.statusRowEnd : undefined]}>
      {message.status === "failed" && onRetryMessage ? (
        <Pressable onPress={() => onRetryMessage(message.id)}>
          <Text className="text-xs font-medium text-red-500">Retry</Text>
        </Pressable>
      ) : null}
      <Text
        className={`text-xs font-medium ${
          message.status === "failed" ? "text-red-500" : "text-text-secondary"
        }`}
      >
        {statusLabel}
      </Text>
    </View>
  );
}

export function MessagingMessageRowNative({
  message,
  previousMessage,
  mode,
  formatTime,
  isMostRecentMessage = false,
  onRetryMessage,
  onAcceptEventRequest,
  onCancelEventRequest,
  acceptedEventRequestIds = new Set(),
  acceptingEventRequestId = null,
  onAgreementViewDocument,
  onAgreementSignNow,
}: MessagingMessageRowNativeProps) {
  const { t } = useLocalization();
  const { navigateToPath } = useNavigation();
  const { getSavedHome } = useSavedHomesData();
  const { documents, isLoading: documentsLoading, error: documentsError } = useDocumentsData();
  const {
    categories: formsLibraryCategories,
    isLoading: formsLibraryLoading,
    error: formsLibraryError,
  } = useFormsLibrary(mode === "agent");

  const checklistFormIdsInLibrary = useMemo(() => {
    if (mode !== "agent") return null;
    const next = new Set<string>();
    for (const cat of formsLibraryCategories) {
      for (const f of cat.forms) {
        next.add(f.id);
      }
    }
    return next;
  }, [mode, formsLibraryCategories]);

  const checklistFormAvailability = {
    formsLibraryLoading,
    formsLibraryError,
    checklistFormIdsInLibrary,
  };
  const viewerUserId = useAuthStore((s) => s.user?.id ?? null);
  const currentUserRole = mode === "client" ? "user" : "agent";
  const isCurrentUserMessage = message.role === currentUserRole;
  const shouldShowDelivered =
    isCurrentUserMessage && message.status === "delivered" && isMostRecentMessage;
  const agreementEventPayload = parseAgreementEventPayload(message.content);
  const showAgreementEventCard = !!agreementEventPayload;
  const eventRequestPayload = parseEventRequestPayload(message.content);
  const sharedAttachmentSnap = parseSharedAttachmentSnapshot(message.content);
  const bundleSnap = sharedAttachmentSnap?.kind === "bundle" ? sharedAttachmentSnap : null;
  const bundleHomes = bundleSnap ? mergeBundleHomesForDisplay(message.content, getSavedHome) : [];
  const bundleDocs = bundleSnap ? mergeBundleDocumentsForDisplay(message.content, documents) : [];
  const bundleChecklistForms = bundleSnap
    ? mergeBundleChecklistFormsForDisplay(message.content)
    : [];
  const showChecklistFormCard = sharedAttachmentSnap?.kind === "checklist_form";
  const showEventRequestCard =
    !!eventRequestPayload && !!(onAcceptEventRequest || onCancelEventRequest);
  const eventRequestStatus: EventRequestStatus =
    message.event_request_status ??
    (acceptedEventRequestIds.has(message.id) ? "accepted" : "pending");
  const isAccepting = message.id === acceptingEventRequestId;

  const agreementRemovedFromLibrary =
    !!agreementEventPayload &&
    isAgreementMessagingAttachmentUnavailable(
      agreementEventPayload.agreement_id,
      documents,
      documentsLoading,
      documentsError
    );

  const dateDividerText = getDateDividerText(message.timestamp, previousMessage?.timestamp ?? null);

  const agreementOnSignNow =
    onAgreementSignNow ?? ((_agreementId: string) => void navigateToPath("/saved?view=agreements"));
  const agreementOnViewDocument =
    onAgreementViewDocument ??
    ((_agreementId: string, _documentName: string) =>
      void navigateToPath("/saved?view=agreements"));

  const bubbleSurfaceStyle = resolveMessagingBubbleSurfaceStyle(
    bundleSnap,
    showAgreementEventCard,
    showChecklistFormCard,
    isCurrentUserMessage
  );

  return (
    <>
      {dateDividerText ? (
        <View style={styles.dateDividerWrap}>
          <View style={styles.dateDivider}>
            <Text className="text-text-secondary text-xs font-medium">{dateDividerText}</Text>
          </View>
        </View>
      ) : null}
      <View style={[styles.row, isCurrentUserMessage ? styles.rowEnd : styles.rowStart]}>
        <View style={[styles.bubble, bubbleSurfaceStyle]}>
          <MessagingMessageRowNativeBubbleBody
            message={message}
            mode={mode}
            isCurrentUserMessage={isCurrentUserMessage}
            formatTime={formatTime}
            agreementEventPayload={agreementEventPayload}
            showAgreementEventCard={showAgreementEventCard}
            agreementRemovedFromLibrary={agreementRemovedFromLibrary}
            viewerUserId={viewerUserId}
            agreementOnSignNow={agreementOnSignNow}
            agreementOnViewDocument={agreementOnViewDocument}
            showEventRequestCard={showEventRequestCard}
            eventRequestPayload={eventRequestPayload}
            eventRequestStatus={eventRequestStatus}
            isAccepting={isAccepting}
            onAcceptEventRequest={onAcceptEventRequest}
            onCancelEventRequest={onCancelEventRequest}
            showChecklistFormCard={showChecklistFormCard}
            sharedAttachmentSnap={sharedAttachmentSnap}
            checklistFormAvailability={checklistFormAvailability}
            bundleSnap={bundleSnap}
            bundleHomes={bundleHomes}
            bundleDocs={bundleDocs}
            bundleChecklistForms={bundleChecklistForms}
            sharedHomeSubtitle={t("agent.shared_home_in_message")}
            documents={documents}
            getSavedHome={getSavedHome}
          />
        </View>
      </View>
      <MessagingMessageRowNativeStatusFooter
        isCurrentUserMessage={isCurrentUserMessage}
        message={message}
        onRetryMessage={onRetryMessage}
        shouldShowDelivered={shouldShowDelivered}
      />
    </>
  );
}
