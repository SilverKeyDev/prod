/**
 * Centralized PII Security Utilities
 * Single source of truth for sensitive data detection, masking, and scrubbing
 * Used by clipboardSecurity, secureLogger, and other security modules
 */

// Comprehensive PII patterns - centralized to avoid duplication
export const PII_PATTERNS = [
  // Email addresses
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  // Phone numbers (various formats)
  /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
  // SSN patterns
  /\b\d{3}-?\d{2}-?\d{4}\b/g,
  // Credit card numbers
  /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  // JWT tokens
  /eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g,
  // API keys (common patterns)
  /[Aa][Pp][Ii][-_]?[Kk][Ee][Yy][-_]?[A-Za-z0-9]{16,}/g,
  // Bearer tokens
  /[Bb]earer\s+[A-Za-z0-9-._~+/]+=*/g,
  // Passwords in URLs or objects
  /password["\s]*[:=]["\s]*[^"\s&]+/gi,
  // Common sensitive field patterns
  /("(?:password|token|key|secret|auth|credential|ssn|social)"\s*:\s*")[^"]*"/gi,
  // Long alphanumeric strings (potential keys/tokens)
  /[A-Za-z0-9]{32,}/g,
];

// Sensitive keys that should be completely removed from objects
export const SENSITIVE_KEYS = [
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'idToken',
  'id_token',
  'access_token',
  'refresh_token',
  'authorization',
  'auth',
  'secret',
  'key',
  'apiKey',
  'api_key',
  'credential',
  'credentials',
  'ssn',
  'social_security_number',
  'credit_card',
  'creditCard',
  'cc',
  'cvv',
  'pin',
];

/**
 * Check if text contains sensitive data
 */
export function containsSensitiveData(text: string): boolean {
  return PII_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Mask sensitive data in strings for logging
 */
export function maskSensitiveData(text: string): string {
  let masked = text;

  PII_PATTERNS.forEach((pattern) => {
    masked = masked.replace(pattern, (match) => {
      if (match.length <= 4) return '[REDACTED]';
      return match[0] + '*'.repeat(match.length - 2) + match[match.length - 1];
    });
  });

  return masked;
}

/**
 * Scrub PII from any value (string, object, array)
 */
export function scrubPII(value: unknown): unknown {
  if (typeof value === 'string') {
    return maskSensitiveData(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => scrubPII(item));
  }

  if (value && typeof value === 'object') {
    return scrubObjectPII(value);
  }

  return value;
}

/**
 * Scrub sensitive keys from objects
 */
export function scrubObjectPII(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;

  const scrubbed: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();

    if (SENSITIVE_KEYS.some((sensitiveKey) => lowerKey.includes(sensitiveKey))) {
      scrubbed[key] = '[REDACTED]';
    } else {
      scrubbed[key] = scrubPII(value);
    }
  }

  return scrubbed;
}

/**
 * Check if a key is considered sensitive
 */
export function isSensitiveKey(key: string): boolean {
  const lowerKey = key.toLowerCase();
  return SENSITIVE_KEYS.some((sensitiveKey) => lowerKey.includes(sensitiveKey));
}

/**
 * Redact sensitive data from error messages
 */
export function redactErrorMessage(message: string): string {
  return maskSensitiveData(message);
}

/**
 * Create a safe version of an object for logging
 */
export function createSafeLogObject(obj: unknown): unknown {
  try {
    return scrubPII(obj);
  } catch {
    return { error: 'Failed to scrub PII', original: '[OBJECT_SCRUB_ERROR]' };
  }
}
