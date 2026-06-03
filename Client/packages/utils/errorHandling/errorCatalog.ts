/**
 * Maps stable API error codes to i18n keys and English fallbacks.
 * Keep in sync with Server GENERIC_ERROR_MESSAGES and auth error codes.
 */

export type ErrorCatalogEntry = {
  i18nKey: string;
  fallbackEn: string;
};

/** Default fallback when no user-safe message can be resolved. */
export const GENERIC_ERROR_I18N_KEY = "errors.generic";

export const GENERIC_ERROR_FALLBACK_EN = "Something went wrong. Please try again later.";

/**
 * Catalog keyed by normalized error code (case-sensitive lookup, then uppercase).
 */
export const ERROR_CATALOG: Record<string, ErrorCatalogEntry> = {
  // SecureErrorHandler / GENERIC_ERROR_MESSAGES
  authentication_failed: {
    i18nKey: "errors.authentication_failed",
    fallbackEn: "Authentication required",
  },
  authorization_failed: {
    i18nKey: "errors.authorization_failed",
    fallbackEn: "Access denied",
  },
  invalid_request: {
    i18nKey: "errors.invalid_request",
    fallbackEn: "Invalid request",
  },
  resource_not_found: {
    i18nKey: "errors.resource_not_found",
    fallbackEn: "Resource not found",
  },
  validation_error: {
    i18nKey: "errors.validation_error",
    fallbackEn: "Invalid input provided",
  },
  server_error: {
    i18nKey: "errors.server_error",
    fallbackEn: "An error occurred processing your request",
  },
  rate_limit_exceeded: {
    i18nKey: "errors.rate_limit_exceeded",
    fallbackEn: "Too many requests. Please try again later.",
  },
  file_upload_error: {
    i18nKey: "errors.file_upload_error",
    fallbackEn: "File upload failed",
  },
  database_error: {
    i18nKey: "errors.database_error",
    fallbackEn: "Unable to process request",
  },
  external_api_error: {
    i18nKey: "errors.external_api_error",
    fallbackEn: "External service temporarily unavailable",
  },
  configuration_error: {
    i18nKey: "errors.configuration_error",
    fallbackEn: "Service temporarily unavailable",
  },
  agreement_state_error: {
    i18nKey: "errors.agreement_state_error",
    fallbackEn: "Agreement cannot be sent in its current state",
  },
  agreement_not_found: {
    i18nKey: "errors.agreement_not_found",
    fallbackEn: "Agreement not found",
  },
  participant_not_found: {
    i18nKey: "errors.participant_not_found",
    fallbackEn: "Participant not found",
  },
  revision_not_found: {
    i18nKey: "errors.revision_not_found",
    fallbackEn: "Agreement revision not found",
  },
  template_not_found: {
    i18nKey: "errors.template_not_found",
    fallbackEn: "Template not found",
  },
  docusign_error: {
    i18nKey: "errors.docusign_error",
    fallbackEn: "Document signing service error",
  },

  // Auth / token codes
  INVALID_CREDENTIALS: {
    i18nKey: "errors.invalid_credentials",
    fallbackEn: "The provided email or password is incorrect",
  },
  AUTHENTICATION_FAILED: {
    i18nKey: "errors.authentication_failed",
    fallbackEn: "Authentication required",
  },
  TOKEN_EXPIRED: {
    i18nKey: "errors.token_expired",
    fallbackEn: "Your session has expired. Please log in again.",
  },
  INVALID_TOKEN: {
    i18nKey: "errors.invalid_token",
    fallbackEn: "Your session is invalid. Please log in again.",
  },
  UNAUTHORIZED: {
    i18nKey: "errors.unauthorized",
    fallbackEn: "Authentication required",
  },
  NO_TOKEN: {
    i18nKey: "errors.no_token",
    fallbackEn: "Authentication required",
  },
  ACCESS_TOKEN_MISSING: {
    i18nKey: "errors.access_token_missing",
    fallbackEn: "Authentication required",
  },
  REFRESH_TOKEN_EXPIRED: {
    i18nKey: "errors.refresh_token_expired",
    fallbackEn: "Your session has expired. Please log in again.",
  },
  REFRESH_TOKEN_INVALID: {
    i18nKey: "errors.refresh_token_invalid",
    fallbackEn: "Your session is invalid. Please log in again.",
  },
  REFRESH_TOKEN_MISSING: {
    i18nKey: "errors.refresh_token_missing",
    fallbackEn: "Your session has expired. Please log in again.",
  },

  // Admin / rev_share (post server migration)
  super_admin_required: {
    i18nKey: "errors.super_admin_required",
    fallbackEn: "Super admin access required",
  },
  partner_not_found: {
    i18nKey: "errors.partner_not_found",
    fallbackEn: "Partner not found",
  },
  transaction_not_found: {
    i18nKey: "errors.transaction_not_found",
    fallbackEn: "Transaction not found",
  },
};

/** All i18n keys referenced by the catalog (for translation coverage tests). */
export function getErrorCatalogI18nKeys(): string[] {
  const keys = new Set<string>([GENERIC_ERROR_I18N_KEY]);
  for (const entry of Object.values(ERROR_CATALOG)) {
    keys.add(entry.i18nKey);
  }
  return [...keys].sort();
}

export function lookupErrorCatalogEntry(code: string): ErrorCatalogEntry | undefined {
  if (!code.trim()) return undefined;
  return (
    ERROR_CATALOG[code] ?? ERROR_CATALOG[code.toUpperCase()] ?? ERROR_CATALOG[code.toLowerCase()]
  );
}
