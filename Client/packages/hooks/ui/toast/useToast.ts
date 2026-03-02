import { useUIStore } from "packages/store";

/**
 * Hook for showing toast notifications
 * Replaces alert() calls with proper toast notifications
 */

export function useToast() {
  const enqueueToast = useUIStore((state) => state.enqueueToast);

  return {
    showToast: (message: string, type: "success" | "error" | "info" | "warning" = "info") => {
      enqueueToast({ message, type });
    },
    showSuccess: (message: string) => enqueueToast({ message, type: "success" }),
    showError: (message: string) => enqueueToast({ message, type: "error" }),
    showInfo: (message: string) => enqueueToast({ message, type: "info" }),
    showWarning: (message: string) => enqueueToast({ message, type: "warning" }),
  };
}

/**
 * Utility functions for showing toast notifications (non-hook version)
 * Use these in non-React contexts or when you can't use hooks
 */
export function showToast(
  message: string,
  type: "success" | "error" | "info" | "warning" = "info"
) {
  const { enqueueToast } = useUIStore.getState();
  enqueueToast({ message, type });
}

export function showSuccessToast(message: string) {
  showToast(message, "success");
}

export function showErrorToast(message: string) {
  showToast(message, "error");
}

export function showInfoToast(message: string) {
  showToast(message, "info");
}

export function showWarningToast(message: string) {
  showToast(message, "warning");
}
