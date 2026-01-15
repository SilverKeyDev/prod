import { apiGet, apiDelete } from "../../../services/http/compatibility";
import { secureClipboardCopy } from "../../../services/security/clipboardSecurity";
import { captureError } from "../../../services/security/errorReporting";
import { log } from "../../../services/security/secureLogger";
import { asError } from "../../../utils/error";

// Types for report API
export type GenerateReportRequest = {
  address: string;
  user_id?: string; // For agent client selection
  marketing_model?: boolean;
};

export type ReportDocument = {
  id: string;
  user_id: string;
  filename: string;
  file_path: string;
  created_at: string;
  updated_at: string;
  status: "generating" | "completed" | "error" | "processed";
  primary_address?: string;
  report_type?: string;
};

export type GenerateReportResponse = {
  success: boolean;
  document_id?: string;
  message?: string;
  error?: string;
};

export type ReportsListResponse = {
  success: boolean;
  reports?: ReportDocument[];
  message?: string;
  error?: string;
};

export type PollReportResponse = {
  success: boolean;
  report?: ReportDocument;
  error?: string;
};

export type DownloadUrlResponse = {
  success: boolean;
  downloadUrl?: string;
  expires_at?: string;
  error?: string;
};

export type ViewUrlResponse = {
  success: boolean;
  viewUrl?: string;
  expires_at?: string;
  error?: string;
};

export type CompareReportsRequest = {
  report_ids: string[];
  s3Keys?: string[];
};

export type CompareReportsResponse = {
  success: boolean;
  comparison_data?: unknown;
  table?: unknown;
  error?: string;
};

export type DeleteReportResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

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
   * Share document using Web Share API or fallback to URL sharing
   */
  shareDocument: async (
    documentId: string,
    documentName: string,
  ): Promise<{ success: boolean; message: string }> => {
    try {
      // Get a fresh view URL for sharing
      const viewResponse = await reportApi.getViewUrl(documentId);
      if (!viewResponse.success || !viewResponse.viewUrl) {
        return { success: false, message: "Unable to generate shareable link" };
      }

      const shareTitle = `Property Report - ${documentName.replace(/_/g, " ").slice(0, -18).trim()}`;
      const shareUrl = viewResponse.viewUrl;

      // Try Web Share API first (mobile/modern browsers)
      if (navigator.share) {
        try {
          await navigator.share({
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
   */
  getDocuments: (): Promise<ReportsListResponse> =>
    apiGet<ReportsListResponse>("/api/v1/report/documents"),

  /**
   * Serve static report file (fallback for local files)
   */
  getStaticReport: (filename: string): Promise<Blob> =>
    apiGet<Blob>(`/api/v1/report/static/reports/${filename}`),
};
