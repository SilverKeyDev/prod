import type { UserProfile } from "@/features/homeauth/types";

export type SignupData = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  agency_name?: string;
};

export type LoginData = {
  email: string;
  password: string;
};

export type AuthResponse = {
  success: boolean;
  /**
   * @deprecated Tokens are stored in HTTP-only cookies by the backend.
   * These fields are returned for logging/debugging only and should NOT be stored client-side.
   * The browser automatically sends tokens via cookies with credentials: "include".
   */
  access_token?: string;
  /**
   * @deprecated Tokens are stored in HTTP-only cookies by the backend.
   * These fields are returned for logging/debugging only and should NOT be stored client-side.
   */
  id_token?: string;
  /**
   * @deprecated Tokens are stored in HTTP-only cookies by the backend.
   * These fields are returned for logging/debugging only and should NOT be stored client-side.
   */
  refresh_token?: string;
  user?:
    | UserProfile
    | {
        email: string;
        user_sub: string;
        name: string;
        id: string;
      };
  message?: string;
  error?: string;
  user_sub?: string;
  verification_complete?: boolean;
  login_failed?: boolean;
  auto_login_failed?: boolean;
  code_delivery?: unknown;
  needs_verification?: boolean;
};
