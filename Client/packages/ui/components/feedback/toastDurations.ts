/** Auto-dismiss for success, info, and warning toasts (ms). */
export const TOAST_DURATION_DEFAULT_MS = 2500;

/** Auto-dismiss for error toasts (ms). */
export const TOAST_DURATION_ERROR_MS = 3800;

export function toastDurationForType(type: "success" | "error" | "info" | "warning"): number {
  return type === "error" ? TOAST_DURATION_ERROR_MS : TOAST_DURATION_DEFAULT_MS;
}
