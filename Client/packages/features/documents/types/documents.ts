/**
 * Document-domain types: workflow UI models and upload UI state.
 * API contracts use OpenAPI-generated names (`WorkflowDocumentRecord`, `UploadedDocumentRecord`, etc.).
 */

import type { components } from "packages/types/api.generated";

/** Dashboard workflow document from OpenAPI `WorkflowDocumentRecord` (string dates). */
export type WorkflowDocumentRecord =
  components["schemas"]["WorkflowDocumentRecord"];

/** In-memory workflow document with parsed dates (store / document service). */
export type WorkflowDocument = Omit<
  WorkflowDocumentRecord,
  "uploaded_at" | "expiry_date"
> & {
  uploaded_at: Date;
  expiry_date?: Date;
};

export type DocumentCategory = {
  id: string;
  name: string;
  description: string;
  required_for: string[];
  template_url?: string;
};

export type UploadedFile = {
  id: string;
  file: File;
  progress: number;
  status: "uploading" | "completed" | "failed";
  error?: string;
};
