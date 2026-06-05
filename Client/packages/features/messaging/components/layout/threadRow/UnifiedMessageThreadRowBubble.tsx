import React from "react";

import { EventRequestCard } from "packages/features/calendar";
import type { DocumentData } from "packages/features/documents";
import AgreementEventCard from "packages/features/messaging/components/cards/AgreementEventCard";
import SharedDocumentCard from "packages/features/messaging/components/cards/SharedDocumentCard";
import { SharedHomeBundleCard } from "packages/features/messaging/components/cards/SharedHomeBundleCard";
import { ChecklistFormMessagingCard } from "packages/features/messaging/components/layout/chrome/ChecklistFormMessagingCard";
import type { AgreementEventPayload } from "packages/features/messaging/utils/agreementEventPayload";
import type {
  SharedAttachmentSnapshotV1,
  SharedChecklistFormSnapshot,
} from "packages/features/messaging/utils/sharedAttachmentSnapshot";
import { SearchResultListingCard } from "packages/features/search";
import { Box } from "packages/ui/components/structure/primitives";
import type { HomeDescription } from "packages/ui/components/surfaces/cards/HomeCard";
import { homeDescriptionToSearchResult } from "packages/utils/product/search/scoring/homeDescriptionToSearchResult";

import { BodyText } from "@/components/ui";
import type { MessagingConfig } from "@/features/agent/components/messaging/screen/messagingConfig";
import type { EventRequestStatus } from "@/features/messaging/hooks/data/messaging/types";
import type { EventRequestPayload } from "@/features/messaging/utils/eventRequestPayload";
import {
  mergeSharedDocumentForDisplay,
  mergeSharedHomeForDisplay,
  parseSharedAttachmentSnapshot,
} from "@/features/messaging/utils/sharedAttachmentSnapshot";

import type { UnifiedMessageThreadRowProps } from "./UnifiedMessageThreadRow.types";

type MessageStyleConfig = MessagingConfig["messageStyles"]["agent"];

export type BundleSnapshot = Extract<SharedAttachmentSnapshotV1, { kind: "bundle" }>;

export type UnifiedMessageThreadRowBubbleProps = Pick<
  UnifiedMessageThreadRowProps,
  | "msg"
  | "mode"
  | "getSavedHome"
  | "isHomeSaved"
  | "saveHome"
  | "removeSavedHome"
  | "documents"
  | "formsLibraryLoading"
  | "formsLibraryError"
  | "checklistFormIdsInLibrary"
  | "t"
  | "openSharedHomeDetails"
  | "onAgreementView"
  | "onAgreementSignNow"
  | "viewerUserId"
  | "onAcceptEventRequest"
  | "onCancelEventRequest"
  | "acceptingEventRequestId"
> & {
  messageConfig: MessageStyleConfig;
  isCurrentUserMessage: boolean;
  eventRequestPayload: EventRequestPayload | null;
  showEventRequestCard: boolean;
  agreementEventPayload: AgreementEventPayload | null;
  showAgreementEventCard: boolean;
  agreementRemovedFromLibrary: boolean;
  bundleSnap: BundleSnapshot | null;
  sharedAttachmentSnap: SharedAttachmentSnapshotV1 | null;
  showChecklistFormCard: boolean;
  eventRequestStatus: EventRequestStatus;
  bundleHomes: HomeDescription[];
  bundleDocs: DocumentData[];
  bundleChecklistForms: SharedChecklistFormSnapshot[];
};

export function UnifiedMessageThreadRowBubble({
  msg,
  mode,
  messageConfig,
  isCurrentUserMessage,
  eventRequestPayload,
  showEventRequestCard,
  agreementEventPayload,
  showAgreementEventCard,
  agreementRemovedFromLibrary,
  bundleSnap,
  sharedAttachmentSnap,
  showChecklistFormCard,
  eventRequestStatus,
  bundleHomes,
  bundleDocs,
  bundleChecklistForms,
  getSavedHome,
  isHomeSaved,
  saveHome,
  removeSavedHome,
  documents,
  formsLibraryLoading,
  formsLibraryError,
  checklistFormIdsInLibrary,
  t,
  openSharedHomeDetails,
  onAgreementView,
  onAgreementSignNow,
  viewerUserId,
  onAcceptEventRequest,
  onCancelEventRequest,
  acceptingEventRequestId,
}: UnifiedMessageThreadRowBubbleProps) {
  return (
    <Box
      className={`min-w-0 max-w-[85%] overflow-hidden rounded-xl md:max-w-[60%] ${
        bundleSnap ||
        msg.shared_home_id ||
        msg.shared_document_id ||
        showEventRequestCard ||
        showAgreementEventCard ||
        showChecklistFormCard
          ? ""
          : `px-4 py-3 ${messageConfig.bgColor}`
      }`}
    >
      {showEventRequestCard && eventRequestPayload && (
        <Box className="mb-2 w-full min-w-0 max-w-full overflow-hidden">
          <EventRequestCard
            payload={eventRequestPayload}
            onAccept={() => onAcceptEventRequest?.(msg.id, eventRequestPayload)}
            onCancel={() => onCancelEventRequest?.(msg.id)}
            isFromCurrentUser={isCurrentUserMessage}
            status={eventRequestStatus}
            messageId={msg.id}
            acceptingMessageId={acceptingEventRequestId}
          />
        </Box>
      )}
      {showAgreementEventCard && agreementEventPayload && (
        <Box className="mb-2 w-full min-w-0 max-w-full overflow-hidden">
          <AgreementEventCard
            payload={agreementEventPayload}
            isRemovedFromLibrary={agreementRemovedFromLibrary}
            isAgent={mode === "agent"}
            viewerUserId={viewerUserId}
            onViewDocument={onAgreementView}
            onSignNow={onAgreementSignNow}
          />
        </Box>
      )}
      {showChecklistFormCard && sharedAttachmentSnap?.kind === "checklist_form" && (
        <ChecklistFormMessagingCard
          form={sharedAttachmentSnap.checklistForm}
          formsLibraryLoading={formsLibraryLoading}
          formsLibraryError={formsLibraryError}
          checklistFormIdsInLibrary={checklistFormIdsInLibrary}
          t={t}
        />
      )}
      {bundleSnap && bundleHomes.length > 0 && (
        <SharedHomeBundleCard
          homes={bundleHomes}
          openSharedHomeDetails={openSharedHomeDetails}
          isHomeSaved={isHomeSaved}
          saveHome={saveHome}
          removeSavedHome={removeSavedHome}
        />
      )}
      {bundleSnap &&
        bundleDocs.map((doc) => (
          <Box key={doc.id} className="mb-2 w-full min-w-0 max-w-full overflow-hidden">
            <SharedDocumentCard doc={doc} />
          </Box>
        ))}
      {bundleSnap &&
        bundleChecklistForms.map((cf) => (
          <ChecklistFormMessagingCard
            key={cf.id}
            form={cf}
            formsLibraryLoading={formsLibraryLoading}
            formsLibraryError={formsLibraryError}
            checklistFormIdsInLibrary={checklistFormIdsInLibrary}
            t={t}
          />
        ))}
      {!bundleSnap &&
        msg.shared_home_id &&
        (() => {
          const homeData = mergeSharedHomeForDisplay(msg.shared_home_id, msg.content, getSavedHome);
          const searchProperty = homeDescriptionToSearchResult(homeData);
          return (
            <Box
              role="button"
              tabIndex={0}
              className="mb-2 w-full min-w-0 max-w-full cursor-pointer overflow-hidden"
              onClick={() => void openSharedHomeDetails(searchProperty)}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  void openSharedHomeDetails(searchProperty);
                }
              }}
            >
              <SearchResultListingCard
                property={searchProperty}
                activeTab="results"
                isHomeSaved={isHomeSaved}
                saveHome={saveHome}
                removeSavedHome={removeSavedHome}
                showNotInterested={false}
                showMatchScore={false}
              />
            </Box>
          );
        })()}
      {!bundleSnap &&
        msg.shared_document_id &&
        !showAgreementEventCard &&
        (() => {
          const document = mergeSharedDocumentForDisplay(
            msg.content,
            msg.shared_document_id,
            documents
          );
          const snap = parseSharedAttachmentSnapshot(msg.content);
          const previewLabel = snap?.kind === "document" ? snap.displayLine : msg.content?.trim();
          if (!document) {
            if (previewLabel) {
              return (
                <Box className="border-border bg-primary-muted mb-2 rounded-lg border p-4">
                  <BodyText as="p" size="xs" className="text-text-secondary font-medium">
                    {t("agent.share_document")}
                  </BodyText>
                  <BodyText as="p" size="sm" className="text-text-primary mt-1">
                    {previewLabel}
                  </BodyText>
                </Box>
              );
            }
            return (
              <Box className="border-border bg-primary-muted mb-2 rounded-lg border p-4">
                <BodyText as="p" size="sm" className="text-text-secondary">
                  {t("agent.document_not_found")}
                </BodyText>
              </Box>
            );
          }
          return (
            <Box className="mb-2 w-full min-w-0 max-w-full overflow-hidden">
              <SharedDocumentCard doc={document} />
            </Box>
          );
        })()}
      {!bundleSnap &&
        !msg.shared_home_id &&
        !msg.shared_document_id &&
        !showEventRequestCard &&
        !showAgreementEventCard &&
        !showChecklistFormCard &&
        msg.content.trim() && (
          <BodyText as="p" size="sm" className={`whitespace-pre-line ${messageConfig.textColor}`}>
            {msg.content}
          </BodyText>
        )}
    </Box>
  );
}
