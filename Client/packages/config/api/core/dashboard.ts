import { apiPatch, apiPost } from "packages/services/http/compatibility";

/**
 * Document shape as returned by dashboard API (ISO date strings).
 */
export type Document = {
  id: string;
  name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  category: string;
  property_id?: string;
  offer_id?: string;
  uploaded_by: string;
  uploaded_at: string;
  is_signed?: boolean;
  expiry_date?: string | null;
  status: "pending" | "approved" | "rejected" | "expired";
  address?: string;
  document_type?: string;
};

export type DashboardResponse = {
  success: boolean;
  document?: Document;
  error?: string;
};

export type ReportsResponse = {
  success: boolean;
  reports?: unknown[];
  message?: string;
  error?: string;
};

export const dashboardApi = {
  updateDocumentStatus(
    docId: string,
    status: Document["status"],
  ): Promise<DashboardResponse> {
    return apiPatch<DashboardResponse>(`/api/v1/documents/${docId}`, {
      status,
    });
  },

  signDocument(docId: string): Promise<DashboardResponse> {
    return apiPost<DashboardResponse>(`/api/v1/documents/${docId}/sign`);
  },
};
