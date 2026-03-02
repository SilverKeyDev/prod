import { formatDate, formatFilenameToAddress } from "packages/features/search/types/search/address";

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
export default function DocumentCard({ doc, onDelete, showDelete = false }: DocumentCardProps) {
  // Extract title from file path
  const baseName = doc.file_path
    ? extractReportTitleFromPath(doc.file_path)
    : doc.address || formatFilenameToAddress(doc.filename);

  // Format date using utility function
  const formattedDate = doc.created_at ? formatDate(doc.created_at) : "Unknown";

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
    >
      <DocumentCardHeader
        title={baseName}
        documentType={doc.document_type}
        uploadedDate={formattedDate}
      />

      {/* Action buttons */}
      <DocumentCardActions doc={doc} onDelete={onDelete} showDelete={showDelete || !!onDelete} />
    </BaseCard>
  );
}
