import type { ChecklistLinkedDocument } from "packages/features/documents/types/checklistLinkedDocument";
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

type AttachFormsResponse = {
  success: boolean;
  data?: { agreements?: unknown[] };
  error?: string;
};

type ChecklistItemDocumentsResponse = {
  success: boolean;
  data?: { agreements?: unknown[] };
  error?: string;
};

type LinkDocumentResponse = {
  success: boolean;
  data?: { agreement?: unknown };
  error?: string;
};

function mapToLinkedDocument(item: unknown): ChecklistLinkedDocument {
  const o = item as Record<string, unknown>;
  return {
    id: String(o.id ?? ""),
    title: String(o.title ?? ""),
    status: String(o.status ?? ""),
  };
}

function mapToLinkedDocuments(items: unknown[] | undefined): ChecklistLinkedDocument[] {
  if (!items?.length) return [];
  return items.map(mapToLinkedDocument);
}

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
): Promise<ChecklistLinkedDocument[]> {
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
  return mapToLinkedDocuments(response.data.agreements);
}

export async function getChecklistItemDocuments(
  transactionId: string,
  section: string,
  itemId: number
): Promise<ChecklistLinkedDocument[]> {
  const response = await apiGet<ChecklistItemDocumentsResponse>(
    `/api/v1/transactions/${transactionId}/checklist-items/${section}/${itemId}/documents`
  );
  if (!response.success || !response.data) {
    throw new Error(response.error ?? "Failed to fetch documents");
  }
  return mapToLinkedDocuments(response.data.agreements);
}

export async function linkDocumentToChecklistItem(
  transactionId: string,
  section: string,
  itemId: number,
  documentId: string
): Promise<ChecklistLinkedDocument> {
  const response = await apiPost<LinkDocumentResponse>(
    `/api/v1/transactions/${transactionId}/checklist-items/${section}/${itemId}/documents`,
    { document_id: documentId }
  );
  if (!response.success || !response.data?.agreement) {
    throw new Error(response.error ?? "Failed to link document to checklist item");
  }
  return mapToLinkedDocument(response.data.agreement);
}
