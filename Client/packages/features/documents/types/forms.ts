/**
 * MIGRATION SHIM (DO NOT ADD NEW TYPES HERE)
 *
 * Checklist form types re-exported from the generated API contract (api.generated.ts).
 * To add/modify API types: edit openapi/openapi.yaml, run `pnpm generate:api-types`.
 */

import type { components } from "packages/types/api.generated";

export type ChecklistForm = components["schemas"]["ChecklistFormWithDownload"];
export type ChecklistFormRecord = components["schemas"]["ChecklistForm"];

export type SendFormRequest = components["schemas"]["ChecklistFormSendRequest"];

export type GetFormsResponse = components["schemas"]["GetChecklistItemFormsResponse"];
export type DownloadFormResponse = components["schemas"]["DownloadChecklistFormResponse"];
export type FormsLibraryResponse = components["schemas"]["FormsLibraryResponse"];
export type FormsLibraryDownloadResponse = components["schemas"]["FormsLibraryDownloadResponse"];

export type SendFormResponse = {
  success: boolean;
  error?: string;
  message?: string;
  message_id?: string;
  agreement_id?: string;
  partial_errors?: Array<{ step: string; error: string }> | null;
};
