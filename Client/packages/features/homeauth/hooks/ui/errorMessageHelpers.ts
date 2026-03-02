/**
 * Safe stringification of unknown errors for logging.
 * Reduces complexity in hooks that handle catch blocks.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    try {
      return JSON.stringify(error);
    } catch {
      return "[Object]";
    }
  }
  if (typeof error === "string") return error;
  if (typeof error === "number") return String(error);
  if (typeof error === "boolean") return String(error);
  if (error === null || error === undefined) return "Unknown error";
  return "[Unknown]";
}
