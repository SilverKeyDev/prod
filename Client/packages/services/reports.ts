import { reportApi } from "../config/api/documents/report";
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
