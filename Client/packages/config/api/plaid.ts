import { apiGet, apiPost, buildApiUrl, apiDownloadBlob } from "../../services/http/compatibility";
import type {
  PlaidItem,
  PlaidAssetReport,
  PlaidStatement,
  PlaidLinkToken,
  PlaidAssetReportData,
  CreateLinkTokenRequest,
  ExchangeTokenRequest,
  CreateAssetReportRequest,
  ApiResponse,
} from "../../schemas/plaid";

/**
 * Plaid API client using centralized utilities
 * 
 * NOTE: Backend routes for Plaid endpoints need to be verified.
 * The service currently calls these endpoints but routes may not exist in the backend.
 */
export const plaidApi = {
  /**
   * Create a Plaid Link token for connecting bank accounts
   */
  createLinkToken: (
    request: CreateLinkTokenRequest = {},
  ): Promise<ApiResponse<PlaidLinkToken>> =>
    apiPost<ApiResponse<PlaidLinkToken>>(
      "/api/v1/plaid/link-token/create",
      request,
    ),

  /**
   * Exchange public token for access token
   */
  exchangeToken: (
    request: ExchangeTokenRequest,
  ): Promise<ApiResponse<{ item_id: string }>> =>
    apiPost<ApiResponse<{ item_id: string }>>(
      "/api/v1/plaid/item/public_token/exchange",
      request,
    ),

  /**
   * Get all connected Plaid items
   */
  getItems: (): Promise<ApiResponse<PlaidItem[]>> =>
    apiGet<ApiResponse<PlaidItem[]>>("/api/v1/plaid/items"),

  /**
   * Disconnect a Plaid item
   */
  disconnectItem: (itemId: string): Promise<ApiResponse<void>> =>
    apiPost<ApiResponse<void>>(`/api/v1/plaid/items/${itemId}/disconnect`, {}),

  /**
   * Create an asset report
   */
  createAssetReport: (
    request: CreateAssetReportRequest = {},
  ): Promise<ApiResponse<{ asset_report_token: string }>> =>
    apiPost<ApiResponse<{ asset_report_token: string }>>(
      "/api/v1/plaid/assets/report/create",
      request,
    ),

  /**
   * Get asset report data
   */
  getAssetReport: (
    assetReportToken: string,
  ): Promise<ApiResponse<PlaidAssetReportData>> => {
    const url = buildApiUrl("/api/v1/plaid/assets/report/get", {
      asset_report_token: assetReportToken,
    });
    return apiGet<ApiResponse<PlaidAssetReportData>>(url);
  },

  /**
   * Download asset report PDF
   */
  getAssetReportPdf: (assetReportToken: string): Promise<Blob> => {
    const url = buildApiUrl("/api/v1/plaid/assets/report/pdf", {
      asset_report_token: assetReportToken,
    });
    return apiDownloadBlob(url);
  },

  /**
   * Get all asset reports
   */
  getAssetReports: (): Promise<ApiResponse<PlaidAssetReport[]>> =>
    apiGet<ApiResponse<PlaidAssetReport[]>>("/api/v1/plaid/assets/report/get"),

  /**
   * Get bank statements
   */
  getStatements: (): Promise<ApiResponse<PlaidStatement[]>> =>
    apiGet<ApiResponse<PlaidStatement[]>>("/api/v1/plaid/statements/list"),

  /**
   * Download bank statement
   */
  downloadStatement: (statementId: string): Promise<Blob> => {
    const url = buildApiUrl("/api/v1/plaid/statements/download", {
      statement_id: statementId,
    });
    return apiDownloadBlob(url);
  },
};
