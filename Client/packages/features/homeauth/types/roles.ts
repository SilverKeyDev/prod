// User role and auth method types

export type UserRole =
  | "admin"
  | "super_admin"
  | "agent"
  | "buyer"
  | "seller"
  | "brokerage_admin"
  | "integration_partner"
  | "client"
  | "viewer"
  | "manager"
  | "dev_test_account";

export type AuthMethod = "cognito" | "google" | "both" | "dev_session" | "unknown";
