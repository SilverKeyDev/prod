/**
 * Authentication action hooks
 * Provides hooks for signup, password reset, and other auth actions
 */

import { useCallback, useState } from "react";

import { log, LOG_CATEGORIES } from "logger";

import { authApi } from "packages/config/api";
import { HttpError } from "packages/services/http/compatibility";

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
      agency_name?: string;
    }) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await authApi.signup(data);
        if (!response.success) {
          const errorMessage = response.error ?? "Signup failed";
          setError(errorMessage);
          log.warn(LOG_CATEGORIES.AUTH, "Signup failed", {
            email: data.email,
            error: errorMessage,
          });
          return {
            success: false,
            error: errorMessage,
            needsVerification: response.needs_verification,
          };
        }

        log.info(LOG_CATEGORIES.AUTH, "Signup successful", {
          email: data.email,
          needsVerification: response.needs_verification,
        });
        return {
          success: true,
          needsVerification: response.needs_verification,
        };
      } catch (err: unknown) {
        let errorMessage = "Signup failed";

        // Extract error message from HttpError parsedBody
        if (err instanceof HttpError && err.parsedBody) {
          const parsedBody = err.parsedBody as Record<string, unknown>;
          if (typeof parsedBody.message === "string") {
            errorMessage = parsedBody.message;
          } else if (typeof parsedBody.error === "string") {
            errorMessage = parsedBody.error;
          }
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }

        setError(errorMessage);
        log.error(LOG_CATEGORIES.AUTH, "Signup error", err);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [],
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
        const errorMessage = response.error ?? "Failed to send reset code";
        setError(errorMessage);
        log.warn(LOG_CATEGORIES.AUTH, "Forgot password failed", {
          email,
          error: errorMessage,
        });
        return { success: false, error: errorMessage };
      }

      log.info(LOG_CATEGORIES.AUTH, "Password reset code sent", { email });
      return { success: true };
    } catch (err: unknown) {
      let errorMessage = "Failed to send reset code";

      // Extract error message from HttpError parsedBody
      if (err instanceof HttpError && err.parsedBody) {
        const parsedBody = err.parsedBody as Record<string, unknown>;
        if (typeof parsedBody.message === "string") {
          errorMessage = parsedBody.message;
        } else if (typeof parsedBody.error === "string") {
          errorMessage = parsedBody.error;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      log.error(LOG_CATEGORIES.AUTH, "Forgot password error", err);
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

  const resetPassword = useCallback(
    async (email: string, code: string, newPassword: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await authApi.resetPassword(email, code, newPassword);
        if (!response.success) {
          const errorMessage = response.error ?? "Failed to reset password";
          setError(errorMessage);
          log.warn(LOG_CATEGORIES.AUTH, "Reset password failed", {
            email,
            error: errorMessage,
          });
          return { success: false, error: errorMessage };
        }

        log.info(LOG_CATEGORIES.AUTH, "Password reset successful", { email });
        return {
          success: true,
          user: response.user,
          message: response.message,
        };
      } catch (err: unknown) {
        let errorMessage = "Failed to reset password";

        // Extract error message from HttpError parsedBody
        if (err instanceof HttpError && err.parsedBody) {
          const parsedBody = err.parsedBody as Record<string, unknown>;
          if (typeof parsedBody.message === "string") {
            errorMessage = parsedBody.message;
          } else if (typeof parsedBody.error === "string") {
            errorMessage = parsedBody.error;
          }
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }

        setError(errorMessage);
        log.error(LOG_CATEGORIES.AUTH, "Reset password error", err);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { resetPassword, isLoading, error, clearError: () => setError(null) };
}
