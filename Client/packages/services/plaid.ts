/**
 * Plaid API Service
 * Handles all Plaid-related API calls for proof of funds and bank statements
 * Follows established service class patterns
 */

import { apiGet, apiPost } from "../config/api";
import { buildApiUrl, apiDownloadBlob } from "./http/compatibility";
import { log } from "./security/secureLogger";
import {
  handleAuthenticationError,
  isAbortError,
  isAuthenticationError,
  type AuthenticationError,
} from "./http";
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
} from "../schemas/plaid";

// API Endpoints
const ENDPOINTS = {
  LINK_TOKEN_CREATE: "/api/v1/plaid/link-token/create",
  TOKEN_EXCHANGE: "/api/v1/plaid/item/public_token/exchange",
  ITEMS: "/api/v1/plaid/items",
  ITEM_DISCONNECT: "/api/v1/plaid/items",
  ASSET_REPORT_CREATE: "/api/v1/plaid/assets/report/create",
  ASSET_REPORT_GET: "/api/v1/plaid/assets/report/get",
  ASSET_REPORT_PDF: "/api/v1/plaid/assets/report/pdf",
  STATEMENTS: "/api/v1/plaid/statements/list",
  STATEMENT_DOWNLOAD: "/api/v1/plaid/statements/download",
} as const;

/**
 * Plaid service - I/O only, no state management
 * All state management is handled by React Query
 */
export class PlaidService {
  private static instance: PlaidService;

  private constructor() {}

  public static getInstance(): PlaidService {
    if (!PlaidService.instance) {
      PlaidService.instance = new PlaidService();
    }
    return PlaidService.instance;
  }

  /**
   * Create a Plaid Link token for connecting bank accounts
   */
  public async createLinkToken(
    request: CreateLinkTokenRequest = {},
  ): Promise<ApiResponse<PlaidLinkToken>> {
    try {
      log.info("PLAID_SERVICE", "Creating link token", {
        products: request.products,
      });

      const response = await apiPost<ApiResponse<PlaidLinkToken>>(
        ENDPOINTS.LINK_TOKEN_CREATE,
        request,
      );

      if (response.success) {
        log.info("PLAID_SERVICE", "Link token created successfully");
        return response;
      } else {
        log.warn("PLAID_SERVICE", "Link token creation failed", {
          error: response.error,
        });
        throw new Error(response.error ?? "Failed to create link token");
      }
    } catch (error: unknown) {
      if (!isAbortError(error)) {
        if (isAuthenticationError(error)) {
          handleAuthenticationError(error as AuthenticationError);
          throw error;
        }
        log.error("PLAID_SERVICE", "Link token creation error", { error });
      }
      throw error;
    }
  }

  /**
   * Exchange public token for access token
   */
  public async exchangeToken(
    request: ExchangeTokenRequest,
  ): Promise<ApiResponse<{ item_id: string }>> {
    try {
      log.info("PLAID_SERVICE", "Exchanging public token");

      const response = await apiPost<ApiResponse<{ item_id: string }>>(
        ENDPOINTS.TOKEN_EXCHANGE,
        request,
      );

      if (response.success) {
        log.info("PLAID_SERVICE", "Token exchanged successfully", {
          itemId: response.data?.item_id,
        });
        return response;
      } else {
        log.warn("PLAID_SERVICE", "Token exchange failed", {
          error: response.error,
        });
        throw new Error(response.error ?? "Failed to exchange token");
      }
    } catch (error: unknown) {
      if (!isAbortError(error)) {
        if (isAuthenticationError(error)) {
          handleAuthenticationError(error as AuthenticationError);
          throw error;
        }
        log.error("PLAID_SERVICE", "Token exchange error", { error });
      }
      throw error;
    }
  }

  /**
   * Get all connected Plaid items
   */
  public async getItems(): Promise<ApiResponse<PlaidItem[]>> {
    try {
      log.info("PLAID_SERVICE", "Fetching Plaid items");

      const response = await apiGet<ApiResponse<PlaidItem[]>>(ENDPOINTS.ITEMS);

      if (response.success) {
        log.info("PLAID_SERVICE", "Plaid items fetched successfully", {
          count: response.data?.length,
        });
        return response;
      } else {
        log.warn("PLAID_SERVICE", "Failed to fetch Plaid items", {
          error: response.error,
        });
        throw new Error(response.error ?? "Failed to fetch Plaid items");
      }
    } catch (error: unknown) {
      if (!isAbortError(error)) {
        if (isAuthenticationError(error)) {
          handleAuthenticationError(error as AuthenticationError);
          throw error;
        }
        log.error("PLAID_SERVICE", "Plaid items fetch error", { error });
      }
      throw error;
    }
  }

  /**
   * Disconnect a Plaid item
   */
  public async disconnectItem(itemId: string): Promise<ApiResponse<void>> {
    try {
      log.info("PLAID_SERVICE", "Disconnecting Plaid item", { itemId });

      const url = `${ENDPOINTS.ITEM_DISCONNECT}/${itemId}/disconnect`;
      const response = await apiPost<ApiResponse<void>>(url, {});

      if (response.success) {
        log.info("PLAID_SERVICE", "Plaid item disconnected successfully", {
          itemId,
        });
        return response;
      } else {
        log.warn("PLAID_SERVICE", "Failed to disconnect Plaid item", {
          itemId,
          error: response.error,
        });
        throw new Error(response.error ?? "Failed to disconnect Plaid item");
      }
    } catch (error: unknown) {
      if (!isAbortError(error)) {
        if (isAuthenticationError(error)) {
          handleAuthenticationError(error as AuthenticationError);
          throw error;
        }
        log.error("PLAID_SERVICE", "Plaid item disconnect error", {
          itemId,
          error,
        });
      }
      throw error;
    }
  }

  /**
   * Create an asset report
   */
  public async createAssetReport(
    request: CreateAssetReportRequest = {},
  ): Promise<ApiResponse<{ asset_report_token: string }>> {
    try {
      log.info("PLAID_SERVICE", "Creating asset report", {
        days: request.days_requested,
      });

      const response = await apiPost<
        ApiResponse<{ asset_report_token: string }>
      >(ENDPOINTS.ASSET_REPORT_CREATE, request);

      if (response.success) {
        log.info("PLAID_SERVICE", "Asset report created successfully", {
          token: response.data?.asset_report_token,
        });
        return response;
      } else {
        log.warn("PLAID_SERVICE", "Asset report creation failed", {
          error: response.error,
        });
        throw new Error(response.error ?? "Failed to create asset report");
      }
    } catch (error: unknown) {
      if (!isAbortError(error)) {
        if (isAuthenticationError(error)) {
          handleAuthenticationError(error as AuthenticationError);
          throw error;
        }
        log.error("PLAID_SERVICE", "Asset report creation error", { error });
      }
      throw error;
    }
  }

  /**
   * Get asset report data
   */
  public async getAssetReport(
    assetReportToken: string,
  ): Promise<ApiResponse<PlaidAssetReportData>> {
    try {
      log.info("PLAID_SERVICE", "Fetching asset report", {
        token: assetReportToken,
      });

      const url = buildApiUrl(ENDPOINTS.ASSET_REPORT_GET, {
        asset_report_token: assetReportToken,
      });
      const response = await apiGet<ApiResponse<PlaidAssetReportData>>(url);

      if (response.success) {
        log.info("PLAID_SERVICE", "Asset report fetched successfully");
        return response;
      } else {
        log.warn("PLAID_SERVICE", "Failed to fetch asset report", {
          error: response.error,
        });
        throw new Error(response.error ?? "Failed to fetch asset report");
      }
    } catch (error: unknown) {
      if (!isAbortError(error)) {
        if (isAuthenticationError(error)) {
          handleAuthenticationError(error as AuthenticationError);
          throw error;
        }
        log.error("PLAID_SERVICE", "Asset report fetch error", { error });
      }
      throw error;
    }
  }

  /**
   * Download asset report PDF
   */
  public async getAssetReportPdf(assetReportToken: string): Promise<Blob> {
    try {
      log.info("PLAID_SERVICE", "Downloading asset report PDF", {
        token: assetReportToken,
      });

      const url = buildApiUrl(ENDPOINTS.ASSET_REPORT_PDF, {
        asset_report_token: assetReportToken,
      });
      const blob = await apiDownloadBlob(url);

      log.info("PLAID_SERVICE", "Asset report PDF downloaded successfully");
      return blob;
    } catch (error: unknown) {
      if (!isAbortError(error)) {
        if (isAuthenticationError(error)) {
          handleAuthenticationError(error as AuthenticationError);
          throw error;
        }
        log.error("PLAID_SERVICE", "Asset report PDF download error", {
          error,
        });
      }
      throw error;
    }
  }

  /**
   * Get all asset reports
   */
  public async getAssetReports(): Promise<ApiResponse<PlaidAssetReport[]>> {
    try {
      log.info("PLAID_SERVICE", "Fetching asset reports");

      const response = await apiGet<ApiResponse<PlaidAssetReport[]>>(
        ENDPOINTS.ASSET_REPORT_GET,
      );

      if (response.success) {
        log.info("PLAID_SERVICE", "Asset reports fetched successfully", {
          count: response.data?.length,
        });
        return response;
      } else {
        log.warn("PLAID_SERVICE", "Failed to fetch asset reports", {
          error: response.error,
        });
        throw new Error(response.error ?? "Failed to fetch asset reports");
      }
    } catch (error: unknown) {
      if (!isAbortError(error)) {
        if (isAuthenticationError(error)) {
          handleAuthenticationError(error as AuthenticationError);
          throw error;
        }
        log.error("PLAID_SERVICE", "Asset reports fetch error", { error });
      }
      throw error;
    }
  }

  /**
   * Get bank statements
   */
  public async getStatements(): Promise<ApiResponse<PlaidStatement[]>> {
    try {
      log.info("PLAID_SERVICE", "Fetching bank statements");

      const response = await apiGet<ApiResponse<PlaidStatement[]>>(
        ENDPOINTS.STATEMENTS,
      );

      if (response.success) {
        log.info("PLAID_SERVICE", "Bank statements fetched successfully", {
          count: response.data?.length,
        });
        return response;
      } else {
        log.warn("PLAID_SERVICE", "Failed to fetch bank statements", {
          error: response.error,
        });
        throw new Error(response.error ?? "Failed to fetch bank statements");
      }
    } catch (error: unknown) {
      if (!isAbortError(error)) {
        if (isAuthenticationError(error)) {
          handleAuthenticationError(error as AuthenticationError);
          throw error;
        }
        log.error("PLAID_SERVICE", "Bank statements fetch error", { error });
      }
      throw error;
    }
  }

  /**
   * Download bank statement
   */
  public async downloadStatement(statementId: string): Promise<Blob> {
    try {
      log.info("PLAID_SERVICE", "Downloading bank statement", { statementId });

      const url = buildApiUrl(ENDPOINTS.STATEMENT_DOWNLOAD, {
        statement_id: statementId,
      });
      const blob = await apiDownloadBlob(url);

      log.info("PLAID_SERVICE", "Bank statement downloaded successfully");
      return blob;
    } catch (error: unknown) {
      if (!isAbortError(error)) {
        if (isAuthenticationError(error)) {
          handleAuthenticationError(error as AuthenticationError);
          throw error;
        }
        log.error("PLAID_SERVICE", "Bank statement download error", { error });
      }
      throw error;
    }
  }
}

// Export singleton instance
export const plaidService = PlaidService.getInstance();

// Legacy export for backward compatibility
export const plaidApi = {
  createLinkToken: (request: CreateLinkTokenRequest = {}) =>
    plaidService.createLinkToken(request),
  exchangeToken: (request: ExchangeTokenRequest) =>
    plaidService.exchangeToken(request),
  getItems: () => plaidService.getItems(),
  disconnectItem: (itemId: string) => plaidService.disconnectItem(itemId),
  createAssetReport: (request: CreateAssetReportRequest = {}) =>
    plaidService.createAssetReport(request),
  getAssetReport: (assetReportToken: string) =>
    plaidService.getAssetReport(assetReportToken),
  getAssetReportPdf: (assetReportToken: string) =>
    plaidService.getAssetReportPdf(assetReportToken),
  getAssetReports: () => plaidService.getAssetReports(),
  getStatements: () => plaidService.getStatements(),
  downloadStatement: (statementId: string) =>
    plaidService.downloadStatement(statementId),
};

// Utility functions
export const plaidUtils = {
  formatDate: (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  },

  formatCurrency: (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  },

  getStatusColor: (status: string): string => {
    switch (status) {
      case "active":
      case "ready":
        return "green";
      case "pending":
        return "yellow";
      case "error":
      case "disconnected":
        return "red";
      default:
        return "gray";
    }
  },
};
