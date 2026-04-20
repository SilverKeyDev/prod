import React from "react";

import AgreementEventCard from "packages/features/messaging/components/cards/AgreementEventCard";
import type {
  ChatMessage,
  EventRequestStatus,
} from "packages/features/messaging/hooks/data/messaging/types";
import type { AgreementEventPayload } from "packages/features/messaging/utils/agreementEventPayload";
import type { EventRequestPayload } from "packages/features/messaging/utils/eventRequestPayload";
import {
  mergeSharedHomeForDisplay,
  type SharedAttachmentSnapshotV1,
  type SharedChecklistFormSnapshot,
} from "packages/features/messaging/utils/sharedAttachmentSnapshot";
import type { SavedHome } from "packages/types/domain/savedHome";
import type { DocumentData } from "packages/ui/components/cards/document/types";
import type { HomeDescription } from "packages/ui/components/cards/HomeCard";
import { Box, Text } from "packages/ui/components/primitives";

import {
  type ChecklistFormAvailabilityOptions,
  MessagingBundleDocumentCardNative,
  MessagingChecklistFormCardNative,
  MessagingMergedSharedDocumentNative,
} from "./MessagingMessageRowNativeAttachmentCards";
import { MessagingEventRequestCardNative } from "./MessagingMessageRowNativeEventRequest";
import {
  MessagingSharedHomeBundleNative,
  MessagingSharedHomeMiniNativeCard,
} from "./MessagingMessageRowNativeSharedHomes";

export type SharedBundleAttachmentSnapshot = Extract<
  SharedAttachmentSnapshotV1,
  { kind: "bundle" }
>;

export type MessagingMessageRowNativeBubbleBodyProps = {
  message: ChatMessage;
  mode: "client" | "agent";
  isCurrentUserMessage: boolean;
  formatTime: (date: Date) => string;
  agreementEventPayload: AgreementEventPayload | null;
  showAgreementEventCard: boolean;
  agreementRemovedFromLibrary: boolean;
  viewerUserId: string | null;
  agreementOnSignNow: (agreementId: string) => void;
  agreementOnViewDocument: (agreementId: string, documentName: string) => void;
  showEventRequestCard: boolean;
  eventRequestPayload: EventRequestPayload | null;
  eventRequestStatus: EventRequestStatus;
  isAccepting: boolean;
  onAcceptEventRequest?: (
    messageId: string,
    payload: { title: string; start: string; end: string; description?: string }
  ) => Promise<void>;
  onCancelEventRequest?: (messageId: string) => Promise<void>;
  showChecklistFormCard: boolean;
  sharedAttachmentSnap: SharedAttachmentSnapshotV1 | null;
  checklistFormAvailability: ChecklistFormAvailabilityOptions;
  bundleSnap: SharedBundleAttachmentSnapshot | null;
  bundleHomes: HomeDescription[];
  bundleDocs: DocumentData[];
  bundleChecklistForms: SharedChecklistFormSnapshot[];
  sharedHomeSubtitle: string;
  documents: DocumentData[];
  getSavedHome: (id: string) => SavedHome | undefined;
};

export function MessagingMessageRowNativeBubbleBody({
  message,
  mode,
  isCurrentUserMessage,
  formatTime,
  agreementEventPayload,
  showAgreementEventCard,
  agreementRemovedFromLibrary,
  viewerUserId,
  agreementOnSignNow,
  agreementOnViewDocument,
  showEventRequestCard,
  eventRequestPayload,
  eventRequestStatus,
  isAccepting,
  onAcceptEventRequest,
  onCancelEventRequest,
  showChecklistFormCard,
  sharedAttachmentSnap,
  checklistFormAvailability,
  bundleSnap,
  bundleHomes,
  bundleDocs,
  bundleChecklistForms,
  sharedHomeSubtitle,
  documents,
  getSavedHome,
}: MessagingMessageRowNativeBubbleBodyProps) {
  return (
    <>
      {showAgreementEventCard && agreementEventPayload ? (
        <Box className="mb-2 w-full min-w-0 max-w-full">
          <AgreementEventCard
            payload={agreementEventPayload}
            isRemovedFromLibrary={agreementRemovedFromLibrary}
            isAgent={mode === "agent"}
            viewerUserId={viewerUserId}
            onSignNow={agreementOnSignNow}
            onViewDocument={agreementOnViewDocument}
          />
        </Box>
      ) : null}
      {showEventRequestCard && eventRequestPayload ? (
        <MessagingEventRequestCardNative
          messageId={message.id}
          payload={eventRequestPayload}
          eventRequestStatus={eventRequestStatus}
          isCurrentUserMessage={isCurrentUserMessage}
          isAccepting={isAccepting}
          onAcceptEventRequest={onAcceptEventRequest}
          onCancelEventRequest={onCancelEventRequest}
        />
      ) : null}
      {showChecklistFormCard && sharedAttachmentSnap?.kind === "checklist_form" ? (
        <MessagingChecklistFormCardNative
          form={sharedAttachmentSnap.checklistForm}
          checklistFormAvailability={checklistFormAvailability}
        />
      ) : null}
      {bundleSnap && bundleHomes.length > 0 ? (
        <MessagingSharedHomeBundleNative homes={bundleHomes} cardSubtitle={sharedHomeSubtitle} />
      ) : null}
      {bundleSnap
        ? bundleDocs.map((document) => (
            <MessagingBundleDocumentCardNative key={document.id} document={document} />
          ))
        : null}
      {bundleSnap
        ? bundleChecklistForms.map((cf) => (
            <MessagingChecklistFormCardNative
              key={cf.id}
              form={cf}
              checklistFormAvailability={checklistFormAvailability}
            />
          ))
        : null}
      {!bundleSnap && message.shared_home_id ? (
        <MessagingSharedHomeMiniNativeCard
          homeData={mergeSharedHomeForDisplay(
            message.shared_home_id,
            message.content,
            getSavedHome
          )}
          subtitle={sharedHomeSubtitle}
        />
      ) : null}
      {!bundleSnap && message.shared_document_id && !showAgreementEventCard ? (
        <MessagingMergedSharedDocumentNative
          content={message.content}
          sharedDocumentId={message.shared_document_id}
          documents={documents}
        />
      ) : null}
      {!bundleSnap &&
      !message.shared_home_id &&
      !message.shared_document_id &&
      !showEventRequestCard &&
      !showAgreementEventCard &&
      !showChecklistFormCard &&
      message.content.trim() ? (
        <Text className={isCurrentUserMessage ? "text-white" : "text-text-primary"} selectable>
          {message.content}
        </Text>
      ) : null}
      <Text
        className={
          isCurrentUserMessage ? "mt-1 text-xs text-white/80" : "text-text-secondary mt-1 text-xs"
        }
      >
        {formatTime(message.timestamp)}
      </Text>
    </>
  );
}
