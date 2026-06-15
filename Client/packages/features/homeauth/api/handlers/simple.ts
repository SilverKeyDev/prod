import type { AuthResponse, SignupData } from "packages/features/homeauth/types";
import { log } from "packages/logger";
import { apiPost } from "packages/services/http";
import { reportSecurityEvent } from "packages/services/security/errorReporting";

export async function signupHandler(data: SignupData): Promise<AuthResponse> {
  const response = await apiPost<AuthResponse>("/api/v1/auth/signup", data);

  if (!response.success) {
    reportSecurityEvent({
      type: "authentication_failure",
      severity: "medium",
      description: "User signup failed",
      metadata: { email: data.email, error: response.error },
    });
  }

  return response;
}

export const resendCodeHandler = (email: string): Promise<AuthResponse> =>
  apiPost<AuthResponse>("/api/v1/auth/resend-code", { email });

export async function forgotPasswordHandler(email: string): Promise<AuthResponse> {
  const response = await apiPost<AuthResponse>("/api/v1/auth/forgot-password", {
    email,
  });

  if (!response.success) {
    reportSecurityEvent({
      type: "authentication_failure",
      severity: "low",
      description: "Password reset request failed",
      metadata: { email, error: response.error },
    });
  }

  return response;
}

export async function resetPasswordHandler(
  email: string,
  code: string,
  new_password: string
): Promise<AuthResponse> {
  const response = await apiPost<AuthResponse>("/api/v1/auth/reset-password", {
    email,
    code,
    new_password,
  });

  if (response.success) {
    log.security("AUTH", "Password reset successful", { email });
  } else {
    reportSecurityEvent({
      type: "authentication_failure",
      severity: "medium",
      description: "Password reset confirmation failed",
      metadata: { email, error: response.error },
    });
  }

  return response;
}

export async function logoutHandler(): Promise<AuthResponse> {
  try {
    const response = await apiPost<AuthResponse>("/api/v1/auth/logout", {});

    if (response.success) {
      log.info("AUTH", "Logout successful - cookies cleared");
    } else {
      log.warn("AUTH", "Logout request failed", {
        error: response.error,
      });
    }

    return response;
  } catch (error: unknown) {
    const err = error as Error;
    log.error("AUTH", "Logout request failed with exception", {
      errorMessage: err?.message || "Unknown error",
    });
    return {
      success: false,
      error: "LOGOUT_FAILED",
      message: "Failed to logout",
    };
  }
}
