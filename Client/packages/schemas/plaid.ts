/**
 * Plaid Schema Types
 * Shared type definitions for Plaid integration across the application
 */

export interface PlaidItem {
  id: number;
  item_id: string;
  institution_id?: string;
  institution_name?: string;
  status: "active" | "error" | "disconnected";
  linked_at: string;
  last_sync: string;
  created_at: string;
  updated_at: string;
}

export interface PlaidAssetReport {
  id: number;
  asset_report_token: string;
  asset_report_id?: string;
  status: "pending" | "ready" | "error";
  days_requested: number;
  created_at: string;
  updated_at: string;
}

export interface PlaidStatement {
  statement_id: string;
  account_id: string;
  account_name: string;
  statement_date: string;
  statement_period_start: string;
  statement_period_end: string;
}

export interface PlaidLinkToken {
  link_token: string;
  expiration: string;
}

export interface PlaidAssetReportData {
  asset_report_id: string;
  asset_report_token: string;
  date_generated: string;
  days_requested: number;
  status: "pending" | "ready" | "error";
  accounts: PlaidAccount[];
  owners: PlaidOwner[];
}

export interface PlaidAccount {
  account_id: string;
  name: string;
  type: string;
  subtype: string;
  balances: {
    available: number | null;
    current: number | null;
    limit: number | null;
  };
}

export interface PlaidOwner {
  names: string[];
  addresses: PlaidAddress[];
  emails: PlaidEmail[];
  phone_numbers: PlaidPhone[];
}

export interface PlaidAddress {
  data: {
    city: string;
    region: string;
    street: string;
    postal_code: string;
    country: string;
  };
  primary: boolean;
}

export interface PlaidEmail {
  data: string;
  primary: boolean;
  type: string;
}

export interface PlaidPhone {
  data: string;
  primary: boolean;
  type: string;
}

// API Request/Response Types
export interface CreateLinkTokenRequest {
  products?: string[];
  user_id?: string;
  webhook?: string;
}

export interface ExchangeTokenRequest {
  public_token: string;
  institution_id?: string;
}

export interface CreateAssetReportRequest {
  days_requested?: number;
  item_ids?: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Plaid Link Configuration
export interface PlaidLinkConfig {
  token: string;
  onSuccess: (publicToken: string, metadata: any) => void;
  onExit: (error: any, metadata: any) => void;
  onEvent?: (eventName: string, metadata: any) => void;
}

// Utility Types
export type PlaidProduct =
  | "assets"
  | "transactions"
  | "identity"
  | "auth"
  | "investments";
export type PlaidEnvironment = "sandbox" | "development" | "production";
export type PlaidStatus = "pending" | "ready" | "error";
