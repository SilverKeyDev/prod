import { apiGet, apiPost, apiDelete } from './utils/index';
import { secureClipboardCopy } from '../lib/security/clipboardSecurity';
import { log } from '../lib/security/secureLogger';
import { captureError } from '../lib/security/errorReporting';

// Types for report API
export interface GenerateReportRequest {
  address: string;
  comparisonAddress?: string;
  user_id?: string; // For agent client selection
  marketing_model?: boolean;
}

export interface ReportDocument {
  id: string;
  user_id: string;
  filename: string;
  file_path: string;
  created_at: string;
  updated_at: string;
  status: 'generating' | 'completed' | 'error' | 'processed';
  primary_address?: string;
  comparison_address?: string;
  report_type?: string;
}

export interface GenerateReportResponse {
  success: boolean;
  document_id?: string;
  message?: string;
  error?: string;
}

export interface ReportsListResponse {
  success: boolean;
  reports?: ReportDocument[];
  message?: string;
  error?: string;
}

export interface PollReportResponse {
  success: boolean;
  report?: ReportDocument;
  error?: string;
}

export interface DownloadUrlResponse {
  success: boolean;
  downloadUrl?: string;
  expires_at?: string;
  error?: string;
}

export interface ViewUrlResponse {
  success: boolean;
  viewUrl?: string;
  expires_at?: string;
  error?: string;
}

export interface CompareReportsRequest {
  report_ids: string[];
  s3Keys?: string[];
}

interface ComparisonData {
  summary?: string;
  differences?: Record<string, unknown>;
  recommendations?: string[];
}

interface ComparisonTable {
  headers?: string[];
  rows?: Array<Record<string, unknown>>;
}

export interface CompareReportsResponse {
  success: boolean;
  comparison_data?: ComparisonData;
  table?: ComparisonTable;
  error?: string;
}

export interface DeleteReportResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Report API client using centralized utilities
 */
export const reportApi = {
  /**
   * Generate a property report
   */
  generate: (data: GenerateReportRequest): Promise<GenerateReportResponse> =>
    apiPost<GenerateReportResponse>('/api/v1/report/generate', data),

  /**
   * Get all reports for current user
   */
  getAll: (): Promise<ReportsListResponse> =>
    apiGet<ReportsListResponse>('/api/v1/report/all'),

  /**
   * List all reports (alias for getAll)
   */
  list: (): Promise<ReportsListResponse> =>
    apiGet<ReportsListResponse>('/api/v1/report/list'),

  /**
   * Poll for a specific report's status by document ID
   */
  poll: (documentId: string): Promise<PollReportResponse> =>
    apiGet<PollReportResponse>(`/api/v1/report/poll/${documentId}`),

  /**
   * Get almost all reports (alternative endpoint)
   */
  getAlmostAll: (): Promise<ReportsListResponse> =>
    apiGet<ReportsListResponse>('/api/v1/report/almostall'),

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
  shareDocument: async (documentId: string, documentName: string): Promise<{ success: boolean; message: string }> => {
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
          log.info('REPORT_API', 'Report shared via Web Share API', { documentName });
          return { success: true, message: "Report shared successfully" };
        } catch (shareError) {
          // User cancelled or share failed, fall through to clipboard
          if (shareError instanceof Error && shareError.name === 'AbortError') {
            return { success: false, message: "Share cancelled" };
          }
        }
      }

      // Fallback: Copy shareable URL to clipboard
      const success = await secureClipboardCopy(shareUrl, 'report-share');
      if (success) {
        log.info('REPORT_API', 'Report URL copied to clipboard', { documentName });
        return { success: true, message: "Shareable link copied to clipboard" };
      } else {
        return { success: false, message: "Failed to copy shareable link" };
      }
    } catch (error) {
      log.error('REPORT_API', 'Share failed', error);
      captureError(error, { context: 'shareDocument', documentName });
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to share report"
      };
    }
  },

  /**
   * Compare multiple reports
   */
  compare: (data: CompareReportsRequest): Promise<CompareReportsResponse> =>
    apiPost<CompareReportsResponse>('/api/v1/report/compare', data),

  /**
   * Delete a report
   */
  delete: (reportId: string, s3Key?: string): Promise<DeleteReportResponse> =>
    apiDelete<DeleteReportResponse>(`/api/v1/report/${reportId}`, { s3_key: s3Key }),

  /**
   * Get user documents
   */
  getDocuments: (): Promise<ReportsListResponse> =>
    apiGet<ReportsListResponse>('/api/v1/report/documents'),

  /**
   * Serve static report file (fallback for local files)
   */
  getStaticReport: (filename: string): Promise<Blob> =>
    apiGet<Blob>(`/api/v1/report/static/reports/${filename}`),
};