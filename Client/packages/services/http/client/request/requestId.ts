/**
 * Per-request id for log correlation with server `g.request_id` / `X-Request-ID`.
 */
export function createHttpRequestId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    /* ignore */
  }
  return `cl_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}
