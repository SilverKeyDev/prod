import React from "react";

import { parseAgreementEventPayload } from "packages/features/messaging/utils/agreementEventPayload";
import { Box } from "packages/ui/components/structure/primitives";

import { parseEventRequestPayload } from "@/features/messaging/utils/eventRequestPayload";
import { getDateDividerText } from "@/features/messaging/utils/messageDateUtils";
import { isAgreementMessagingAttachmentUnavailable } from "@/features/messaging/utils/messagingAttachmentAvailability";
import {
  mergeBundleChecklistFormsForDisplay,
  mergeBundleDocumentsForDisplay,
  mergeBundleHomesForDisplay,
  parseSharedAttachmentSnapshot,
} from "@/features/messaging/utils/sharedAttachmentSnapshot";

import type { UnifiedMessageThreadRowProps } from "./UnifiedMessageThreadRow.types";
import { UnifiedMessageThreadRowBubble } from "./UnifiedMessageThreadRowBubble";
import { UnifiedMessageThreadRowDateDivider } from "./UnifiedMessageThreadRowDateDivider";
import { UnifiedMessageThreadRowStatusFooter } from "./UnifiedMessageThreadRowStatusFooter";

export type { UnifiedMessageThreadRowProps } from "./UnifiedMessageThreadRow.types";

export function UnifiedMessageThreadRow({
  msg,
  index,
  localMessages,
  mode,
  config,
  activeConversation,
  onAcceptEventRequest,
  onCancelEventRequest,
  acceptedEventRequestIds,
  acceptingEventRequestId,
  viewerUserId,
  onAgreementView,
  onAgreementSignNow,
  getSavedHome,
  isHomeSaved,
  saveHome,
  removeSavedHome,
  documents,
  documentsLoading,
  documentsError,
  formsLibraryLoading,
  formsLibraryError,
  checklistFormIdsInLibrary,
  t,
  openSharedHomeDetails,
  onRetryMessage,
}: UnifiedMessageThreadRowProps) {
  const messageConfig =
    msg.role === "agent" ? config.messageStyles.agent : config.messageStyles.user;
  const isMostRecentMessage = index === localMessages.length - 1;
  const currentUserRole = mode === "client" ? "user" : "agent";
  const isCurrentUserMessage = msg.role === currentUserRole;
  const shouldShowDelivered =
    isCurrentUserMessage && msg.status === "delivered" && isMostRecentMessage;
  const previousMessage = index > 0 ? localMessages[index - 1] : null;
  const dateDividerText = getDateDividerText(msg.timestamp, previousMessage?.timestamp ?? null);
  const eventRequestPayload = parseEventRequestPayload(msg.content);
  const showEventRequestCard =
    eventRequestPayload &&
    activeConversation !== undefined &&
    (onAcceptEventRequest || onCancelEventRequest);
  const agreementEventPayload = parseAgreementEventPayload(msg.content);
  const showAgreementEventCard = !!agreementEventPayload;
  const sharedAttachmentSnap = parseSharedAttachmentSnapshot(msg.content);
  const bundleSnap = sharedAttachmentSnap?.kind === "bundle" ? sharedAttachmentSnap : null;
  const bundleHomes = bundleSnap ? mergeBundleHomesForDisplay(msg.content, getSavedHome) : [];
  const bundleDocs = bundleSnap ? mergeBundleDocumentsForDisplay(msg.content, documents) : [];
  const bundleChecklistForms = bundleSnap ? mergeBundleChecklistFormsForDisplay(msg.content) : [];
  const showChecklistFormCard = sharedAttachmentSnap?.kind === "checklist_form";
  const eventRequestStatus =
    msg.event_request_status ?? (acceptedEventRequestIds.has(msg.id) ? "accepted" : "pending");

  const agreementRemovedFromLibrary =
    !!agreementEventPayload &&
    isAgreementMessagingAttachmentUnavailable(
      agreementEventPayload.agreement_id,
      documents,
      documentsLoading,
      documentsError
    );

  return (
    <>
      {dateDividerText && <UnifiedMessageThreadRowDateDivider text={dateDividerText} />}
      <Box
        className={`flex w-full min-w-0 max-w-full flex-col overflow-hidden ${
          messageConfig.justify === "end" ? "items-end" : "items-start"
        }`}
      >
        <UnifiedMessageThreadRowBubble
          msg={msg}
          mode={mode}
          messageConfig={messageConfig}
          isCurrentUserMessage={isCurrentUserMessage}
          eventRequestPayload={eventRequestPayload}
          showEventRequestCard={!!showEventRequestCard}
          agreementEventPayload={agreementEventPayload}
          showAgreementEventCard={showAgreementEventCard}
          agreementRemovedFromLibrary={agreementRemovedFromLibrary}
          bundleSnap={bundleSnap}
          sharedAttachmentSnap={sharedAttachmentSnap}
          showChecklistFormCard={!!showChecklistFormCard}
          eventRequestStatus={eventRequestStatus}
          bundleHomes={bundleHomes}
          bundleDocs={bundleDocs}
          bundleChecklistForms={bundleChecklistForms}
          getSavedHome={getSavedHome}
          isHomeSaved={isHomeSaved}
          saveHome={saveHome}
          removeSavedHome={removeSavedHome}
          documents={documents}
          formsLibraryLoading={formsLibraryLoading}
          formsLibraryError={formsLibraryError}
          checklistFormIdsInLibrary={checklistFormIdsInLibrary}
          t={t}
          openSharedHomeDetails={openSharedHomeDetails}
          onAgreementView={onAgreementView}
          onAgreementSignNow={onAgreementSignNow}
          viewerUserId={viewerUserId}
          onAcceptEventRequest={onAcceptEventRequest}
          onCancelEventRequest={onCancelEventRequest}
          acceptingEventRequestId={acceptingEventRequestId}
        />

        <UnifiedMessageThreadRowStatusFooter
          msg={msg}
          isCurrentUserMessage={isCurrentUserMessage}
          shouldShowDelivered={shouldShowDelivered}
          messageConfig={messageConfig}
          t={t}
          onRetryMessage={onRetryMessage}
        />
      </Box>
    </>
  );
}
