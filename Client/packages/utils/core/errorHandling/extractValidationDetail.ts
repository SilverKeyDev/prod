/**
 * Extract user-visible validation text from API error bodies.
 * Prefer `field_errors`; one-release fallback for deprecated `validation_errors`.
 */

function readTrimmedString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function firstStringFromFieldValue(value: unknown): string | undefined {
  if (typeof value === "string") return readTrimmedString(value);
  if (Array.isArray(value)) {
    for (const item of value) {
      const text = readTrimmedString(item);
      if (text) return text;
    }
  }
  return undefined;
}

function firstFromFieldMap(map: unknown): string | undefined {
  if (!map || typeof map !== "object" || Array.isArray(map)) return undefined;
  for (const value of Object.values(map as Record<string, unknown>)) {
    const text = firstStringFromFieldValue(value);
    if (text) return text;
  }
  return undefined;
}

/** Prefer field_errors; one-release fallback for deprecated validation_errors. */
export function extractFirstValidationMessage(body: Record<string, unknown>): string | undefined {
  const message = readTrimmedString(body.message);
  if (message) return message;

  const fromFieldErrors = firstFromFieldMap(body.field_errors);
  if (fromFieldErrors) return fromFieldErrors;

  const legacy = body.validation_errors;
  if (Array.isArray(legacy)) {
    for (const item of legacy) {
      const text = readTrimmedString(item);
      if (text) return text;
    }
  }

  return firstFromFieldMap(legacy);
}
