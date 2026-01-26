import {
  formatFilenameToAddress,
  formatDate,
} from "../../../../../packages/utils/search/address";
import { extractReportTitleFromPath } from "../../../../../packages/utils/documents/nameScrub";
import BaseCard from "../BaseCard";
import DocumentCardActions from "./DocumentCardActions";
import DocumentCardHeader from "./DocumentCardHeader";

export interface DocumentData {
  id: string;
  filename: string;
  file_path: string;
  status: string;
  created_at: string | null;
  updated_at: string | null;
  user_id: string;
  document_type: string | null;
  address: string | null;
}

export interface DocumentCardProps {
  /**
   * Document data from the backend
   */
  doc: DocumentData;
  /**
   * Optional callback for when document is deleted
   */
  onDelete?: (doc: DocumentData) => void;
  /**
   * Whether to show the delete button
   */
  showDelete?: boolean;
}

/**
 * Enhanced document card component to display user documents with rich metadata.
 * Shows document info, location, creation date, and action buttons.
 * Action buttons (view, download, share) are handled internally by DocumentCardActions.
 */
export default function DocumentCard({
  doc,
  onDelete,
  showDelete = false,
}: DocumentCardProps) {
  // Extract title from file path
  const baseName = doc.file_path
    ? extractReportTitleFromPath(doc.file_path)
    : doc.address || formatFilenameToAddress(doc.filename);

  // Format date using utility function
  const formattedDate = doc.created_at
    ? formatDate(doc.created_at)
    : "Unknown";

  return (
    <BaseCard
      variant="default"
      padding="md"
      rounded="lg"
      shadow="sm"
      hover
      cardType="regular"
      width="full"
    >
      <DocumentCardHeader
        title={baseName}
        documentType={doc.document_type}
        uploadedDate={formattedDate}
      />

      {/* Action buttons */}
      <DocumentCardActions
        doc={doc}
        onDelete={onDelete}
        showDelete={showDelete || !!onDelete}
      />
    </BaseCard>
  );
}
