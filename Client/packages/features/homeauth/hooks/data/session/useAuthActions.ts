/**
 * Authentication action hooks
 * Provides hooks for signup, password reset, and other auth actions
 */

import { useCallback, useState } from "react";

import { log } from "packages/logger";
import {
  resolveApiResultErrorMessage,
  resolveUserFacingMessage,
} from "packages/utils/errorHandling";

import { authApi } from "@/features/homeauth/api/auth";

/**
 * Hook for signup functionality
 */
export function useSignup() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signup = useCallback(
    async (data: {
      name: string;
      email: string;
      password: string;
      phone?: string;
      brokerage?: string;
    }) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await authApi.signup(data);
        if (!response.success) {
          const errorMessage = resolveApiResultErrorMessage(response, "Signup failed");
          setError(errorMessage);
          log.warn("AUTH", "Signup failed", {
            email: data.email,
            error: response.error,
            message: errorMessage,
          });
          return {
            success: false,
            error: errorMessage,
            needsVerification: response.needs_verification,
          };
        }

        log.info("AUTH", "Signup successful", {
          email: data.email,
          needsVerification: response.needs_verification,
        });
        return {
          success: true,
          needsVerification: response.needs_verification,
        };
      } catch (err: unknown) {
        const errorMessage = resolveUserFacingMessage(err, { fallbackMessage: "Signup failed" });
        setError(errorMessage);
        log.error("AUTH", "Signup error", err);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { signup, isLoading, error, clearError: () => setError(null) };
}

/**
 * Hook for forgot password functionality
 */
export function useForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const forgotPassword = useCallback(async (email: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.forgotPassword(email);
      if (!response.success) {
        const errorMessage = resolveApiResultErrorMessage(response, "Failed to send reset code");
        setError(errorMessage);
        log.warn("AUTH", "Forgot password failed", {
          email,
          error: response.error,
          message: errorMessage,
        });
        return { success: false, error: errorMessage };
      }

      log.info("AUTH", "Password reset code sent", { email });
      return { success: true };
    } catch (err: unknown) {
      const errorMessage = resolveUserFacingMessage(err, {
        fallbackMessage: "Failed to send reset code",
      });
      setError(errorMessage);
      log.error("AUTH", "Forgot password error", err);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { forgotPassword, isLoading, error, clearError: () => setError(null) };
}

/**
 * Hook for reset password functionality
 */
export function useResetPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetPassword = useCallback(async (email: string, code: string, newPassword: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.resetPassword(email, code, newPassword);
      if (!response.success) {
        const errorMessage = resolveApiResultErrorMessage(response, "Failed to reset password");
        setError(errorMessage);
        log.warn("AUTH", "Reset password failed", {
          email,
          error: response.error,
          message: errorMessage,
        });
        return { success: false, error: errorMessage };
      }

      log.info("AUTH", "Password reset successful", { email });
      return {
        success: true,
        user: response.user,
        message: response.message,
      };
    } catch (err: unknown) {
      const errorMessage = resolveUserFacingMessage(err, {
        fallbackMessage: "Failed to reset password",
      });
      setError(errorMessage);
      log.error("AUTH", "Reset password error", err);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { resetPassword, isLoading, error, clearError: () => setError(null) };
}
