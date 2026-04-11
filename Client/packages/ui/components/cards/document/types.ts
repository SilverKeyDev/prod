/**
 * Shared types for document card components.
 * Extracted to avoid circular imports between DocumentCard and DocumentCardActions.
 */

export type DocumentLibraryKind = "upload" | "agreement";

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
  library_item_id?: string;
  library_kind?: DocumentLibraryKind;
  agreement_type?: string | null;
  sent_by_name?: string | null;
  sent_by_email?: string | null;
}

/** When provided, view/download/share use these handlers and no in-card PdfModal is rendered. */
export type DocumentCardExternalActionHandlers = {
  handleViewDocument: (documentId: string, documentName: string) => void;
  handleDownloadDocument: (
    documentId: string,
    documentName: string,
  ) => Promise<void>;
  handleShareDocument: (
    documentId: string,
    documentName: string,
  ) => Promise<{ success: boolean; message: string }>;
  handleSendForSignature?: (document: DocumentData) => void;
  handleSignNow?: (document: DocumentData) => void;
  isAgent?: boolean;
};

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
  /**
   * Use a single PDF modal owned by the page (e.g. Saved layout) instead of one modal per card.
   */
  externalActionHandlers?: DocumentCardExternalActionHandlers;
}
