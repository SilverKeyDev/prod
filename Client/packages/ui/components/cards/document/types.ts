/**
 * Shared types for document card components.
 * Extracted to avoid circular imports between DocumentCard and DocumentCardActions.
 */

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
