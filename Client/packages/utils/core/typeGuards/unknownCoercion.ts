/**
 * Narrow unknown API/stream payloads to primitive field types.
 * Plain objects and arrays yield undefined so callers do not surface "[object Object]".
 */

export function unknownToNumberOrString(value: unknown): string | number | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string" || typeof value === "number") return value;
  if (typeof value === "object" && value !== null) return undefined;
  return String(value);
}

export function unknownToString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "object" && value !== null) return undefined;
  return String(value);
}
