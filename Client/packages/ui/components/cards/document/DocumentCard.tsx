import {
  formatDate,
  formatFilenameToAddress,
} from "packages/features/search/types/search/address";
import { useAuthStore } from "packages/store";

import BaseCard from "@/components/cards/BaseCard";
import { extractReportTitleFromPath } from "@/features/documents/utils/nameScrub";

import DocumentCardActions from "./DocumentCardActions";
import DocumentCardHeader from "./DocumentCardHeader";
import type { DocumentCardProps } from "./types";

export type { DocumentCardProps, DocumentData } from "./types";

/**
 * Enhanced document card component to display user documents with rich metadata.
 * Shows document info, location, creation date, and action buttons.
 * Action buttons (view, download, share) are handled internally by DocumentCardActions.
 */
export default function DocumentCard({
  doc,
  onDelete,
  showDelete = false,
  externalActionHandlers,
}: DocumentCardProps) {
  // Get current user ID to determine if document was uploaded by someone else
  const currentUser = useAuthStore((s) => s.user);
  const currentUserId = currentUser?.id;

  // Extract title from file path
  const baseName = doc.file_path
    ? extractReportTitleFromPath(doc.file_path)
    : doc.address || formatFilenameToAddress(doc.filename);

  // Format date using utility function
  const formattedDate = doc.created_at ? formatDate(doc.created_at) : "Unknown";

  // Determine if document was uploaded by someone else
  const isFromOtherUser =
    currentUserId && doc.user_id && currentUserId !== doc.user_id;

  // Show delete button for documents from other users or if explicitly requested
  const shouldShowDelete = isFromOtherUser || showDelete || !!onDelete;

  return (
    <BaseCard
      variant="default"
      padding="md"
      rounded="lg"
      shadow="sm"
      hover
      cardType="searchpage"
      scale="md"
      width="full"
      background="white"
    >
      <DocumentCardHeader
        title={baseName}
        documentType={doc.document_type}
        uploadedDate={formattedDate}
        status={doc.status}
        isAgreement={doc.library_kind === "agreement"}
        sentByName={doc.sent_by_name}
        sentByEmail={doc.sent_by_email}
        isFromOtherUser={isFromOtherUser}
      />

      {/* Action buttons */}
      <DocumentCardActions
        doc={doc}
        onDelete={onDelete}
        showDelete={shouldShowDelete}
        isFromOtherUser={isFromOtherUser}
        externalActionHandlers={externalActionHandlers}
      />
    </BaseCard>
  );
}
