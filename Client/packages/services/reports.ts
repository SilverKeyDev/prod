import { reportApi } from "../config/api/report";

import {
  handleAuthenticationError,
  isAbortError,
  isAuthenticationError,
  type AuthenticationError,
} from "./http";
import { log } from "./security/secureLogger";

/**
 * Reports service - I/O only, no state management
 * All state management is now handled by React Query
 */
export class ReportsService {
  private static instance: ReportsService;

  private constructor() {}

  public static getInstance(): ReportsService {
    if (!ReportsService.instance) {
      ReportsService.instance = new ReportsService();
    }
    return ReportsService.instance;
  }

  /**
   * Fetch all reports data
   * @deprecated API endpoint removed - this method no longer fetches data
   */
  public async fetchAllReportsData(): Promise<unknown> {
    log.warn("REPORTS_SERVICE", "fetchAllReportsData called but API endpoint removed");
    (
      window as unknown as { sharedReportsData: unknown }
    ).sharedReportsData = null;
    return { success: false, reports: [], error: "API endpoint removed" };
  }

  /**
   * Generate a new report
   */
  public async generateReport(data: {
    address: string;
    comparisonAddress?: string;
    user_id?: string;
    marketing_model?: boolean;
  }): Promise<{ success: boolean; documentId?: string; error?: string }> {
    try {
      const response = await reportApi.generate(data);

      if (response.success) {
        return {
          success: true,
          documentId: response.document_id,
        };
      } else {
        const errorMsg = response.error ?? "Failed to generate report";
        log.error("REPORTS_SERVICE", "Report generation failed", {
          error: errorMsg,
        });
        return {
          success: false,
          error: errorMsg,
        };
      }
    } catch (error: unknown) {
      log.error("REPORTS_SERVICE", "Report generation error", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to generate report",
      };
    }
  }

  /**
   * Delete a report
   */
  public async deleteReport(
    reportId: string,
    s3Key?: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await reportApi.delete(reportId, s3Key);

      if (response.success) {
        return { success: true };
      } else {
        const errorMsg = response.error ?? "Failed to delete report";
        log.error("REPORTS_SERVICE", "Report deletion failed", {
          error: errorMsg,
        });
        return {
          success: false,
          error: errorMsg,
        };
      }
    } catch (error: unknown) {
      log.error("REPORTS_SERVICE", "Report deletion error", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete report",
      };
    }
  }

  /**
   * Share a report
   */
  public async shareReport(
    documentId: string,
    documentName: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const result = await reportApi.shareDocument(documentId, documentName);

      if (!result.success) {
        log.warn("REPORTS_SERVICE", "Report sharing failed", {
          documentId,
          error: result.message,
        });
      }

      return result;
    } catch (error: unknown) {
      log.error("REPORTS_SERVICE", "Report sharing error", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to share report",
      };
    }
  }

  /**
   * Compare multiple reports
   */
  public async compareReports(
    reportIds: string[],
    s3Keys?: string[],
  ): Promise<{
    success: boolean;
    comparisonData?: unknown;
    table?: unknown;
    error?: string;
  }> {
    try {
      // Normalize provided keys to JSON keys expected by backend
      const toJsonKey = (maybePdfKey: string): string => {
        if (!maybePdfKey) return maybePdfKey;
        const key = maybePdfKey.replace(/^\/+/, "");
        const parts = key.split("/");
        if (parts.length >= 4 && parts[1] === "reports") {
          const userId = parts[0];
          const reportType = parts[2];
          const filename = parts[3];
          const base = filename.endsWith(".pdf")
            ? filename.slice(0, -4)
            : filename;
          return `${userId}/json/${reportType}/${base}.json`;
        }
        return key.endsWith(".pdf") ? key.slice(0, -4) + ".json" : key;
      };

      const normalizedKeys = Array.isArray(s3Keys)
        ? s3Keys.filter(Boolean).map(toJsonKey)
        : undefined;

      const response = await reportApi.compare({
        report_ids: reportIds,
        s3Keys: normalizedKeys,
      });

      if (response.success) {
        return {
          success: true,
          comparisonData: response.comparison_data,
          table: response.table,
        };
      } else {
        const errorMsg = response.error ?? "Failed to compare reports";
        log.error("REPORTS_SERVICE", "Report comparison failed", {
          error: errorMsg,
        });
        return {
          success: false,
          error: errorMsg,
        };
      }
    } catch (error: unknown) {
      log.error("REPORTS_SERVICE", "Report comparison error", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to compare reports",
      };
    }
  }

  /**
   * Get download URL for a report
   */
  public async getDownloadUrl(reportId: string): Promise<{
    success: boolean;
    downloadUrl?: string;
    expiresAt?: string;
    error?: string;
  }> {
    try {
      const response = await reportApi.getDownloadUrl(reportId);

      if (response.success) {
        return {
          success: true,
          downloadUrl: response.downloadUrl,
          expiresAt: response.expires_at,
        };
      } else {
        const errorMsg = response.error ?? "Failed to get download URL";
        log.error("REPORTS_SERVICE", "Download URL retrieval failed", {
          error: errorMsg,
        });
        return {
          success: false,
          error: errorMsg,
        };
      }
    } catch (error: unknown) {
      log.error("REPORTS_SERVICE", "Download URL retrieval error", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get download URL",
      };
    }
  }

  /**
   * Get view URL for a report
   */
  public async getViewUrl(reportId: string): Promise<{
    success: boolean;
    viewUrl?: string;
    expiresAt?: string;
    error?: string;
  }> {
    try {
      const response = await reportApi.getViewUrl(reportId);

      if (response.success) {
        return {
          success: true,
          viewUrl: response.viewUrl,
          expiresAt: response.expires_at,
        };
      } else {
        const errorMsg = response.error ?? "Failed to get view URL";
        log.error("REPORTS_SERVICE", "View URL retrieval failed", {
          error: errorMsg,
        });
        return {
          success: false,
          error: errorMsg,
        };
      }
    } catch (error: unknown) {
      log.error("REPORTS_SERVICE", "View URL retrieval error", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get view URL",
      };
    }
  }

  /**
   * Clear shared data (for logout)
   */
  public clearData(): void {
    (window as unknown as { sharedReportsData: unknown }).sharedReportsData =
      null;
  }
}

// Export singleton instance
export const reportsService = ReportsService.getInstance();
