import type { Agreement } from "packages/features/documents/types/agreements";
import { apiGet, apiPost } from "packages/services/http/compatibility";

export type SkyslopeForm = {
  id: number;
  name: string;
  libraryId?: number;
  attributes?: Record<string, string>;
};

export type SkyslopeFormsResponse = {
  success: boolean;
  data?: {
    suggested: SkyslopeForm[];
    other: SkyslopeForm[];
  };
  error?: string;
};

export type AttachFormsResponse = {
  success: boolean;
  data?: { agreements: Agreement[] };
  error?: string;
};

export type ChecklistItemDocumentsResponse = {
  success: boolean;
  data?: { agreements: Agreement[] };
  error?: string;
};

export async function getSkyslopeFormsForStep(
  transactionId: string,
  section: string,
  itemId: number
): Promise<{ suggested: SkyslopeForm[]; other: SkyslopeForm[] }> {
  const suggestedFor = `${section}.${itemId}`;
  const response = await apiGet<SkyslopeFormsResponse>(
    `/api/v1/transactions/${transactionId}/skyslope/forms?suggested_for=${encodeURIComponent(suggestedFor)}`
  );
  if (!response.success || !response.data) {
    throw new Error(response.error ?? "Failed to fetch SkySlope forms");
  }
  return response.data;
}

export async function attachSkyslopeForms(
  transactionId: string,
  formIds: number[],
  section: string,
  itemId: number
): Promise<Agreement[]> {
  const response = await apiPost<AttachFormsResponse>(
    `/api/v1/transactions/${transactionId}/skyslope/attach`,
    {
      form_ids: formIds,
      checklist_section: section,
      checklist_item_id: itemId,
    }
  );
  if (!response.success || !response.data?.agreements) {
    throw new Error(response.error ?? "Failed to attach forms");
  }
  return response.data.agreements;
}

export async function getChecklistItemDocuments(
  transactionId: string,
  section: string,
  itemId: number
): Promise<Agreement[]> {
  const response = await apiGet<ChecklistItemDocumentsResponse>(
    `/api/v1/transactions/${transactionId}/checklist-items/${section}/${itemId}/documents`
  );
  if (!response.success || !response.data) {
    throw new Error(response.error ?? "Failed to fetch documents");
  }
  return response.data.agreements ?? [];
}

export type LinkDocumentResponse = {
  success: boolean;
  data?: { agreement: Agreement };
  error?: string;
};

export async function linkDocumentToChecklistItem(
  transactionId: string,
  section: string,
  itemId: number,
  documentId: string
): Promise<Agreement> {
  const response = await apiPost<LinkDocumentResponse>(
    `/api/v1/transactions/${transactionId}/checklist-items/${section}/${itemId}/documents`,
    { document_id: documentId }
  );
  if (!response.success || !response.data?.agreement) {
    throw new Error(response.error ?? "Failed to link document to checklist item");
  }
  return response.data.agreement;
}
