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
  apiHead,
  apiPost,
} from "packages/services/http/compatibility";
import { secureClipboardCopy } from "packages/services/security/clipboardSecurity";
import { captureError } from "packages/services/security/errorReporting";
import { log } from "packages/services/security/secureLogger";
import type { components } from "packages/types/api.generated";
import type { ShareDocumentResult } from "packages/types/ui";
import { asError, getNavigator } from "packages/utils";

// Re-export types from generated schema
export type GenerateReportRequest =
  components["schemas"]["GenerateReportRequest"];
/** Report /documents rows — same shape as `UploadedDocumentRecord` in OpenAPI */
export type ReportDocument = components["schemas"]["UploadedDocumentRecord"];
export type ReportDocumentsListResponse =
  components["schemas"]["ReportDocumentsListResponse"];
export type DocumentLibraryResponse =
  components["schemas"]["DocumentLibraryResponse"];
export type GenerateReportResponse =
  components["schemas"]["GenerateReportResponse"];
export type ReportsListResponse = components["schemas"]["ReportsListResponse"];
export type PollReportResponse = components["schemas"]["PollReportResponse"];
export type DownloadUrlResponse = components["schemas"]["DownloadUrlResponse"];
export type ViewUrlResponse = components["schemas"]["ViewUrlResponse"];
export type CompareReportsRequest =
  components["schemas"]["CompareReportsRequest"];
export type CompareReportsResponse =
  components["schemas"]["CompareReportsResponse"];
export type DeleteReportResponse =
  components["schemas"]["DeleteReportResponse"];
export type SuccessResponse = components["schemas"]["SuccessResponse"];

export type { ShareDocumentResult };

/**
 * Report API client using centralized utilities
 */
export const reportApi = {
  /**
   * List all reports
   */
  list: (): Promise<ReportsListResponse> =>
    apiGet<ReportsListResponse>("/api/v1/report/list"),

  /**
   * Poll for a specific report's status by document ID
   */
  poll: (documentId: string): Promise<PollReportResponse> =>
    apiGet<PollReportResponse>(`/api/v1/report/poll/${documentId}`),

  /**
   * Get almost all reports (alternative endpoint)
   */
  getAlmostAll: (): Promise<ReportsListResponse> =>
    apiGet<ReportsListResponse>("/api/v1/report/almostall"),

  /**
   * Get download URL for a specific report
   */
  getDownloadUrl: (reportId: string): Promise<DownloadUrlResponse> =>
    apiGet<DownloadUrlResponse>(`/api/v1/report/${reportId}/download-url`),

  /**
   * Get view URL for a specific report (inline viewing)
   */
  getViewUrl: (reportId: string): Promise<ViewUrlResponse> =>
    apiGet<ViewUrlResponse>(`/api/v1/report/${reportId}/view-url`),

  /**
   * HEAD request to check view endpoint (for diagnostics: headers, status)
   */
  checkViewUrl: (reportId: string) =>
    apiHead(`/api/v1/report/${reportId}/view`),

  /**
   * Share document using Web Share API or fallback to URL sharing
   */
  shareDocument: async (
    documentId: string,
    documentName: string,
  ): Promise<ShareDocumentResult> => {
    try {
      // Get a fresh view URL for sharing
      const viewResponse = await reportApi.getViewUrl(documentId);
      if (!viewResponse.success || !viewResponse.viewUrl) {
        return { success: false, message: "Unable to generate shareable link" };
      }

      const shareTitle = `Property Report - ${documentName
        .replace(/_/g, " ")
        .slice(0, -18)
        .trim()}`;
      const shareUrl = viewResponse.viewUrl;

      // Try Web Share API first (mobile/modern browsers). RN-safe via platform adapter.
      const nav = getNavigator();
      if (nav?.share) {
        try {
          await nav.share({
            title: shareTitle,
            text: "Check out this property report",
            url: shareUrl,
          });
          log.info("REPORT_API", "Report shared via Web Share API", {
            documentName,
          });
          return { success: true, message: "Report shared successfully" };
        } catch (shareError: unknown) {
          const error = asError(shareError);
          // User cancelled or share failed, fall through to clipboard
          if (error instanceof Error && error.name === "AbortError") {
            return { success: false, message: "Share cancelled" };
          }
        }
      }

      // Fallback to clipboard copy
      const success = await secureClipboardCopy(shareUrl);
      if (success) {
        log.info("REPORT_API", "Report URL copied to clipboard", {
          documentName,
        });
        return { success: true, message: "Report link copied to clipboard" };
      } else {
        return { success: false, message: "Failed to copy link to clipboard" };
      }
    } catch (error: unknown) {
      log.error("REPORT_API", "Share failed", error);
      captureError(asError(error), { context: "shareDocument", documentName });
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to share report",
      };
    }
  },

  /**
   * Delete a report
   */
  delete: (reportId: string, s3Key?: string): Promise<DeleteReportResponse> =>
    apiDelete<DeleteReportResponse>(`/api/v1/report/${reportId}`, {
      s3_key: s3Key,
    }),

  /**
   * Get user documents
   * Note: Backend returns 'documents' field, not 'reports'
   * @param clientId - Optional client ID for agents to view client's documents
   */
  getDocuments: (clientId?: string): Promise<ReportDocumentsListResponse> => {
    const params = clientId ? `?client_id=${encodeURIComponent(clientId)}` : "";
    return apiGet<ReportDocumentsListResponse>(
      `/api/v1/report/documents${params}`,
    );
  },

  /**
   * Unified library: file uploads + DocuSign agreements (Saved / documents).
   */
  getDocumentLibrary: (clientId?: string): Promise<DocumentLibraryResponse> => {
    const params = clientId ? `?client_id=${encodeURIComponent(clientId)}` : "";
    return apiGet<DocumentLibraryResponse>(
      `/api/v1/report/document-library${params}`,
    );
  },

  /**
   * Remove a document from the user's library (does not delete the actual document)
   */
  removeFromLibrary: (libraryItemId: string): Promise<SuccessResponse> =>
    apiDelete<SuccessResponse>(
      `/api/v1/report/document-library/${libraryItemId}`,
    ),

  /**
   * Serve static report file (fallback for local files)
   */
  getStaticReport: (filename: string): Promise<Blob> =>
    apiGet<Blob>(`/api/v1/report/static/reports/${filename}`),

  /**
   * Compare multiple reports
   */
  compare: (request: CompareReportsRequest): Promise<CompareReportsResponse> =>
    apiPost<CompareReportsResponse>("/api/v1/report/compare", request),
};
