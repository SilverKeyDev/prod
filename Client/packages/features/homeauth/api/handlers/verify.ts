import type { AuthResponse } from "packages/features/homeauth/types";
import { log, LOG_CATEGORIES } from "packages/logger";
import { apiPost } from "packages/services/http/compatibility";
import { reportSecurityEvent } from "packages/services/security/errorReporting";
import { dateNow } from "packages/utils/date";

function maskEmail(email: string): string {
  if (!email) return "missing";
  return `${email.substring(0, 3)}***${email.substring(email.length - 3)}`;
}

function handleVerifySuccess(response: AuthResponse, requestId: string, duration: number): void {
  if (!response.success) return;
  log.info(LOG_CATEGORIES.AUTH, "Email verification successful", {
    requestId,
    verificationComplete: response.verification_complete,
    loginFailed: response.login_failed,
    duration: `${duration}ms`,
  });
}

function handleVerifyFailure(
  response: AuthResponse,
  email: string,
  requestId: string,
  duration: number
): void {
  if (response.success) return;
  log.warn(LOG_CATEGORIES.AUTH, "Email verification failed", {
    requestId,
    error: response.error,
    message: response.message,
    duration: `${duration}ms`,
  });
  reportSecurityEvent({
    type: "authentication_failure",
    severity: "medium",
    description: "Email verification failed",
    metadata: {
      email,
      error: response.error,
      requestId,
      duration: `${duration}ms`,
    },
  });
}

function handleVerifyException(
  err: Error,
  email: string,
  requestId: string,
  duration: number
): void {
  log.error(LOG_CATEGORIES.AUTH, "❌ AUTH_VERIFY_ERROR", {
    requestId,
    errorType: err?.constructor?.name || "Unknown",
    errorMessage: err?.message || "Unknown error",
    duration: `${duration}ms`,
    timestamp: dateNow().toISOString(),
  });
  log.error(LOG_CATEGORIES.AUTH, "Verification request failed with exception", {
    requestId,
    errorMessage: err?.message || "Unknown error",
    duration: `${duration}ms`,
  });
  reportSecurityEvent({
    type: "authentication_failure",
    severity: "high",
    description: "Email verification exception",
    metadata: {
      email,
      error: err?.message,
      requestId,
      duration: `${duration}ms`,
    },
  });
}

export async function verifyHandler(
  email: string,
  code: string,
  password: string
): Promise<AuthResponse> {
  const startTime = Date.now();
  const requestId = `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  log.info(LOG_CATEGORIES.AUTH, "Starting email verification request", {
    requestId,
    email: maskEmail(email),
    codeLength: code?.length || 0,
    hasPassword: !!password,
    timestamp: dateNow().toISOString(),
  });
  log.debug(LOG_CATEGORIES.AUTH, "🔵 AUTH_VERIFY_API_CALL", {
    requestId,
    url: "/api/v1/auth/verify",
    method: "POST",
    email,
    codeLength: code?.length,
    hasPassword: !!password,
    timestamp: dateNow().toISOString(),
  });

  try {
    const response = await apiPost<AuthResponse>("/api/v1/auth/verify", {
      email,
      code,
      password,
    });
    const duration = Date.now() - startTime;

    log.debug(LOG_CATEGORIES.AUTH, "✅ AUTH_VERIFY_RESPONSE", {
      requestId,
      success: response.success,
      verificationComplete: response.verification_complete,
      loginFailed: response.login_failed,
      hasAccessToken: !!response.access_token,
      hasUser: !!response.user,
      duration: `${duration}ms`,
      timestamp: dateNow().toISOString(),
    });

    handleVerifySuccess(response, requestId, duration);
    handleVerifyFailure(response, email, requestId, duration);
    return response;
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    const err = error as Error;
    handleVerifyException(err, email, requestId, duration);
    throw error;
  }
}
