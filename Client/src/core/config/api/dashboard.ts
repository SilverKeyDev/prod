import type { UserProfile, Document } from '../../schemas';
import { apiGet, apiPost, apiDelete } from '../../services/http/compatibility';

export type PDFDocument = {
  id: string;
  user_id: string;
  filename: string;
  file_path: string;
  created_at: string;
  updated_at: string;
  status: string;
  primary_address?: string;
};

export type DashboardResponse = {
  success: boolean;
  user: UserProfile;
};

export type ReportsResponse = {
  success: boolean;
  documents: PDFDocument[];
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
  getDashboard: (): Promise<DashboardResponse> => apiGet<DashboardResponse>('/api/dashboard/'),

  /**
   * Get all reports for current user
   */
  getReports: (): Promise<ReportsResponse> => apiGet<ReportsResponse>('/api/dashboard/reports'),

  /**
   * Get all documents for current user
   */
  getDocuments: (): Promise<DocumentsResponse> =>
    apiGet<DocumentsResponse>('/api/v1/report/documents'),

  /**
   * Upload a document
   */
  uploadDocument: (formData: FormData): Promise<UploadResponse> =>
    apiPost<UploadResponse>('/api/v1/documents/upload', formData),

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
  updateDocumentStatus: (
    documentId: string,
    status: string
  ): Promise<{ success: boolean; document?: Document; error?: string }> =>
    apiPost<{ success: boolean; document?: Document; error?: string }>(
      `/api/v1/documents/${documentId}/status`,
      { status }
    ),

  /**
   * Sign a document
   */
  signDocument: (
    documentId: string
  ): Promise<{ success: boolean; document?: Document; error?: string }> =>
    apiPost<{ success: boolean; document?: Document; error?: string }>(
      `/api/v1/documents/${documentId}/sign`,
      {}
    ),
};
