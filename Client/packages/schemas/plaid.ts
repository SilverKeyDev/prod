/**
 * Plaid API request/response types (stub for schema exports).
 * Used by config and API layers; full shapes may come from Plaid SDK at runtime.
 */

export interface CreateLinkTokenRequest {
  client_name?: string;
  user?: { client_user_id?: string };
  products?: string[];
  country_codes?: string[];
  language?: string;
  [key: string]: unknown;
}

export interface ExchangeTokenRequest {
  public_token: string;
  [key: string]: unknown;
}

export interface CreateAssetReportRequest {
  access_tokens: string[];
  days_requested: number;
  options?: { client_report_id?: string; webhook?: string };
  [key: string]: unknown;
}

export interface PlaidLinkToken {
  link_token: string;
  expiration?: string;
  [key: string]: unknown;
}

export interface PlaidItem {
  item_id: string;
  [key: string]: unknown;
}

export interface PlaidStatement {
  statement_id?: string;
  [key: string]: unknown;
}

export interface PlaidAssetReportData {
  [key: string]: unknown;
}

export interface PlaidAssetReport {
  asset_report_id?: string;
  [key: string]: unknown;
}
