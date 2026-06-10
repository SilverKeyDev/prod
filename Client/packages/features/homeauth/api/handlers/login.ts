import type { AuthResponse, LoginData } from "packages/features/homeauth/types";
import { log } from "packages/logger";
import { apiPost } from "packages/services/http";
import { HttpError } from "packages/services/http";
import { reportSecurityEvent } from "packages/services/security/errorReporting";
import { dateNow } from "packages/utils/core/date";

function maskEmail(email: string | undefined): string {
  if (!email) return "missing";
  return `${email.substring(0, 3)}***${email.substring(email.length - 3)}`;
}

function handleLoginApiResponse(
  response: AuthResponse,
  data: LoginData,
  requestId: string,
  duration: number
): void {
  if (!response.success && !response.needs_verification) {
    log.warn("AUTH", "Login request failed", {
      requestId,
      error: response.error,
      message: response.message,
      loginFailed: response.login_failed,
      duration: `${duration}ms`,
    });
    reportSecurityEvent({
      type: "authentication_failure",
      severity: response.login_failed ? "high" : "medium",
      description: "User login failed",
      metadata: {
        email: data.email,
        error: response.error,
        loginFailed: response.login_failed,
        requestId,
        duration: `${duration}ms`,
      },
    });
    return;
  }
  if (response.needs_verification) {
    log.info("AUTH", "User needs email verification", {
      requestId,
      email: maskEmail(data.email),
      duration: `${duration}ms`,
    });
  }
}

function handle401Response(
  parsedBody: Record<string, unknown>,
  data: LoginData,
  requestId: string,
  duration: number
): AuthResponse {
  if (parsedBody.needs_verification === true) {
    log.info("AUTH", "User needs email verification", {
      requestId,
      email: maskEmail(data.email),
      duration: `${duration}ms`,
    });
    return {
      success: false,
      error: (parsedBody.error as string) || "USER_NOT_VERIFIED",
      message: (parsedBody.message as string) || "Please verify your email address to continue.",
      needs_verification: true,
      code_delivery: parsedBody.code_delivery,
    };
  }
  const errorMessage =
    (parsedBody.message as string) || (parsedBody.error as string) || "Authentication failed";
  const errorCode = (parsedBody.error as string) || "AUTHENTICATION_FAILED";
  log.warn("AUTH", "Login failed with 401 error", {
    requestId,
    errorCode,
    errorMessage,
    duration: `${duration}ms`,
  });
  return {
    success: false,
    error: errorCode,
    message: errorMessage,
  };
}

type ErrorWithDetails = Error & {
  status?: string | number;
  errorCode?: string;
  bodyPreview?: string;
  url?: string;
};

function handleLoginException(
  err: ErrorWithDetails,
  data: LoginData,
  requestId: string,
  duration: number
): void {
  log.error("AUTH", "Login request failed with exception", {
    requestId,
    errorType: err?.constructor?.name || "Unknown",
    errorMessage: err?.message || "Unknown error",
    errorStatus: err?.status || "N/A",
    errorCode: err?.errorCode || "N/A",
    duration: `${duration}ms`,
    timestamp: dateNow().toISOString(),
    stack: err?.stack?.substring(0, 500) || "No stack trace",
  });

  const status = err?.status;
  const is502 = status === "502" || status === 502;
  if (is502) {
    log.error("AUTH", "Bad Gateway error during login", {
      requestId,
      errorDetails: {
        status: err.status,
        message: err.message,
        bodyPreview: err.bodyPreview || "No body preview",
        url: err.url || "Unknown URL",
      },
      duration: `${duration}ms`,
      timestamp: dateNow().toISOString(),
    });
    reportSecurityEvent({
      type: "authentication_failure",
      severity: "high",
      description: "Login failed due to server error (502 Bad Gateway)",
      metadata: {
        email: data.email,
        error: `HTTP ${err.status} for ${err.url}`,
        requestId,
        duration: `${duration}ms`,
        serverError: true,
      },
    });
    return;
  }
  if (typeof status === "number" && status >= 500) {
    log.error("AUTH", "Server error during login", {
      requestId,
      status,
      message: err.message,
      duration: `${duration}ms`,
    });
    return;
  }
  if (typeof status === "number" && status >= 400) {
    log.warn("AUTH", "Client error during login", {
      requestId,
      status,
      message: err.message,
      duration: `${duration}ms`,
    });
  }
}

export async function loginHandler(data: LoginData): Promise<AuthResponse> {
  const startTime = Date.now();
  const requestId = `login_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  log.info("AUTH", "Starting login request", {
    requestId,
    email: maskEmail(data.email),
  });

  try {
    const response = await apiPost<AuthResponse>("/api/v1/auth/login", data);
    const duration = Date.now() - startTime;
    handleLoginApiResponse(response, data, requestId, duration);
    return response;
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    const err = error as ErrorWithDetails;

    if (error instanceof HttpError && error.status === 401 && error.parsedBody) {
      return handle401Response(
        error.parsedBody as Record<string, unknown>,
        data,
        requestId,
        duration
      );
    }

    handleLoginException(err, data, requestId, duration);
    throw error;
  }
}
