/**
 * MIGRATION SHIM (DO NOT ADD NEW TYPES HERE)
 *
 * This file re-exports types from the generated API contract (api.generated.ts).
 * All type definitions have been moved to openapi.yaml.
 *
 * To add/modify API types:
 * 1. Edit openapi.yaml
 * 2. Run `pnpm generate:api-types`
 * 3. Types will be auto-generated in packages/types/api.generated.ts
 *
 * This shim maintains backward compatibility for existing imports.
 */

import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from "packages/services/http/compatibility";
import type { components } from "packages/types/api.generated";

// Re-export types from generated schema
export type WorkflowDocumentRecord =
  components["schemas"]["WorkflowDocumentRecord"];
export type GetDashboardResponse =
  components["schemas"]["GetDashboardResponse"];
export type DashboardResponse = components["schemas"]["DashboardResponse"];
export type ReportsResponse = components["schemas"]["ReportsResponse"];
export type DocumentsResponse = components["schemas"]["DocumentsResponse"];
export type UploadResponse = components["schemas"]["UploadResponse"];
export type SuccessResponse = components["schemas"]["SuccessResponse"];

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
  getReports: (): Promise<ReportsResponse> =>
    apiGet<ReportsResponse>("/api/dashboard/reports"),

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
  deleteDocument: (documentId: string): Promise<SuccessResponse> =>
    apiDelete<SuccessResponse>(`/api/v1/documents/${documentId}`),

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
    docId: string,
    status: WorkflowDocumentRecord["status"],
  ): Promise<DashboardResponse> =>
    apiPatch<DashboardResponse>(`/api/v1/documents/${docId}`, { status }),

  /**
   * Sign a document
   */
  signDocument: (docId: string): Promise<DashboardResponse> =>
    apiPost<DashboardResponse>(`/api/v1/documents/${docId}/sign`, {}),
};
