/**
 * Secure auth hook types and Window augmentation
 */

import type { UserProfile } from "packages/schemas/app/auth/user";

declare global {
  interface Window {
    getSecureAccessToken?: () => string | null;
    secureLogout?: () => void;
    clearSecureTokens?: () => void;
  }
}

export type SecureAuthState = {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
};

export type SecureAuthActions = {
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; needsVerification?: boolean }>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  clearError: () => void;
  needsVerification?: boolean;
};

export type UseSecureAuthReturn = SecureAuthState & SecureAuthActions;
