import type { DocumentData } from "packages/ui/components/cards/document/DocumentCard";

/**
 * Minimal shape of a document from the documents store (avoids importing from features).
 * Used so agent modals can map store documents without cross-feature imports.
 */
export type StoreDocumentLike = {
  id: string;
  name: string;
  file_path: string;
  status: string;
  uploaded_at?: Date;
  uploaded_by: string;
  document_type?: string | null;
  address?: string | null;
};

/**
 * Maps store-like documents to DocumentData[] for SelectDocumentModal and other
 * components. Shared by agent (web + native) and documents feature; lives in
 * packages/utils for reuse across features.
 */
export function mapStoreDocumentsToDocumentData(documents: StoreDocumentLike[]): DocumentData[] {
  return documents.map((d) => ({
    id: d.id,
    filename: d.name,
    file_path: d.file_path,
    status: d.status,
    created_at: d.uploaded_at ? d.uploaded_at.toISOString() : null,
    updated_at: null,
    user_id: d.uploaded_by,
    document_type: d.document_type ?? null,
    address: d.address ?? null,
  }));
}
