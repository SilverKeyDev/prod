import type { DocumentData } from "packages/features/documents";

import type { SharedChecklistFormSnapshot } from "./sharedAttachmentSnapshot";

export function isAgreementMessagingAttachmentUnavailable(
  agreementId: string,
  documents: DocumentData[],
  documentsLoading: boolean,
  documentsError: string | null
): boolean {
  if (documentsLoading || documentsError) return false;
  return !documents.some((d) => d.id === agreementId && d.library_kind === "agreement");
}

/**
 * Checklist forms are not document-library rows. When `checklistFormIdsInLibrary`
 * is null (e.g. client inbox), only an empty download URL counts as unavailable.
 */
export function isChecklistFormMessagingAttachmentUnavailable(
  form: SharedChecklistFormSnapshot,
  options: {
    formsLibraryLoading: boolean;
    /** When set, skip template-id check (e.g. forms library request failed). */
    formsLibraryError: Error | null;
    /** When non-null, missing id after load means the template was removed (agent view). */
    checklistFormIdsInLibrary: Set<string> | null;
  }
): boolean {
  if (!form.download_url?.trim()) return true;
  if (
    options.formsLibraryLoading ||
    options.formsLibraryError ||
    options.checklistFormIdsInLibrary == null
  ) {
    return false;
  }
  return !options.checklistFormIdsInLibrary.has(form.id);
}
