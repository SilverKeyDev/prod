import { reportApi, CompareReportsRequest, CompareReportsResponse } from '../api/report';
import { log } from '../lib/security/secureLogger';
import { captureError } from '../lib/security/errorReporting';

/**
 * Service for handling report comparison operations
 * Provides business logic layer on top of the report API
 */
export class ReportComparisonService {
  /**
   * Compare multiple reports using their S3 keys
   * @param s3Keys Array of S3 keys for the reports to compare
   * @param reportIds Optional array of report IDs for additional context
   * @returns Promise with comparison data and table
   */
  static async compareReports(
    s3Keys: string[], 
    reportIds?: string[]
  ): Promise<CompareReportsResponse> {
    try {
      log.info('REPORT_COMPARISON', 'Starting report comparison', { 
        s3KeyCount: s3Keys.length, 
        reportIdCount: reportIds?.length || 0 
      });

      if (s3Keys.length === 0) {
        throw new Error('At least one S3 key is required for comparison');
      }

      const requestData: CompareReportsRequest = {
        report_ids: reportIds || [],
        s3Keys: s3Keys
      };

      const response = await reportApi.compare(requestData);

      if (!response.success) {
        throw new Error(response.error || 'Comparison failed');
      }

      log.info('REPORT_COMPARISON', 'Report comparison completed successfully', {
        hasTable: !!response.table,
        hasComparisonData: !!response.comparison_data
      });

      return response;
    } catch (error) {
      log.error('REPORT_COMPARISON', 'Failed to compare reports', error);
      captureError(error, { 
        context: 'ReportComparisonService.compareReports',
        s3KeyCount: s3Keys.length,
        reportIdCount: reportIds?.length || 0
      });
      
      // Re-throw with more context
      throw new Error(
        error instanceof Error 
          ? `Report comparison failed: ${error.message}`
          : 'Report comparison failed with unknown error'
      );
    }
  }

  /**
   * Transform PDF S3 keys to JSON S3 keys for comparison
   * @param pdfKeys Array of PDF S3 keys
   * @returns Array of corresponding JSON S3 keys
   */
  static transformToJsonKeys(pdfKeys: string[]): string[] {
    return pdfKeys.map(key => this.toJsonKey(key));
  }

  /**
   * Convert a single PDF S3 key to JSON S3 key
   * @param key PDF S3 key
   * @returns Corresponding JSON S3 key
   */
  private static toJsonKey(key: string): string {
    if (!key) return "";

    // If it's already a JSON key, return it directly
    if (key.endsWith(".json")) return key;

    // Transform PDF key to JSON key based on actual storage structure
    // PDF: user_id/reports/type/filename.pdf
    // JSON: user_id/json/type/filename.json

    // Extract user_id, report_type, and filename from PDF key
    const pdfMatch = key.match(/^([^\/]+)\/reports\/([^\/]+)\/(.+)\.pdf$/);
    if (pdfMatch) {
      const [, userId, reportType, filename] = pdfMatch;
      return `${userId}/json/${reportType}/${filename}.json`;
    }

    // Fallback: if pattern doesn't match, try simple transformation
    const baseName = key.replace(/\.pdf$/, "");
    return `${baseName}.json`;
  }

  /**
   * Validate that all required keys are present for comparison
   * @param keys Array of S3 keys to validate
   * @returns Boolean indicating if keys are valid
   */
  static validateComparisonKeys(keys: string[]): boolean {
    if (keys.length === 0) {
      log.warn('REPORT_COMPARISON', 'No keys provided for validation');
      return false;
    }

    const invalidKeys = keys.filter(key => !key || key.trim() === '');
    if (invalidKeys.length > 0) {
      log.warn('REPORT_COMPARISON', 'Invalid keys found', { invalidKeyCount: invalidKeys.length });
      return false;
    }

    log.info('REPORT_COMPARISON', 'All keys validated successfully', { keyCount: keys.length });
    return true;
  }

  /**
   * Get comparison status message based on selection count
   * @param selectedCount Number of selected reports
   * @returns Status message for user feedback
   */
  static getComparisonStatusMessage(selectedCount: number): string {
    if (selectedCount === 0) {
      return "Select reports to compare";
    } else if (selectedCount === 1) {
      return "Select at least one more report to compare";
    } else {
      return `Comparing ${selectedCount} reports`;
    }
  }
}

export default ReportComparisonService;
