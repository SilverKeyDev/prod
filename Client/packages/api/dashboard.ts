import type { UserProfile } from "packages/features/homeauth/types/index";
import { apiDelete, apiGet, apiPatch, apiPost } from "packages/services/http/compatibility";

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

export type GetDashboardResponse = {
  success: boolean;
  user: UserProfile;
};

/** Response for updateDocumentStatus and signDocument */
export type DashboardResponse = {
  success: boolean;
  document?: Document;
  error?: string;
};

export type ReportsResponse = {
  success: boolean;
  documents?: Document[];
  reports?: unknown[];
  message?: string;
  error?: string;
};

export type DocumentsResponse = {
  success: boolean;
  documents?: Document[];
  message?: string;
  error?: string;
};

export type UploadResponse = {
  success: boolean;
  document?: Document;
  message?: string;
  error?: string;
};

/**
 * Dashboard API client using centralized utilities
 */
export const dashboardApi = {
  /**
   * Get dashboard data for current user
   */
  getDashboard: (): Promise<GetDashboardResponse> =>
    apiGet<GetDashboardResponse>("/api/dashboard/"),

  /**
   * Get all reports for current user
   */
  getReports: (): Promise<ReportsResponse> => apiGet<ReportsResponse>("/api/dashboard/reports"),

  /**
   * Get all documents for current user
   */
  getDocuments: (): Promise<DocumentsResponse> =>
    apiGet<DocumentsResponse>("/api/v1/report/documents"),

  /**
   * Upload a document
   */
  uploadDocument: (formData: FormData): Promise<UploadResponse> =>
    apiPost<UploadResponse>("/api/v1/documents/upload", formData),

  /**
   * Delete a document
   */
  deleteDocument: (documentId: string): Promise<{ success: boolean; message?: string }> =>
    apiDelete<{ success: boolean; message?: string }>(`/api/v1/documents/${documentId}`),

  /**
   * Get documents by property
   */
  getDocumentsByProperty: (propertyId: string): Promise<DocumentsResponse> =>
    apiGet<DocumentsResponse>(`/api/v1/documents/property/${propertyId}`),

  /**
   * Get documents by offer
   */
  getDocumentsByOffer: (offerId: string): Promise<DocumentsResponse> =>
    apiGet<DocumentsResponse>(`/api/v1/documents/offer/${offerId}`),

  /**
   * Update document status
   */
  updateDocumentStatus: (docId: string, status: Document["status"]): Promise<DashboardResponse> =>
    apiPatch<DashboardResponse>(`/api/v1/documents/${docId}`, { status }),

  /**
   * Sign a document
   */
  signDocument: (docId: string): Promise<DashboardResponse> =>
    apiPost<DashboardResponse>(`/api/v1/documents/${docId}/sign`, {}),
};
