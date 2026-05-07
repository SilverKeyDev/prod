import { useEffect } from "react";

import { useUIStore } from "packages/store";
import { ToastNative } from "packages/ui/components/feedback/Toast.native";
import { toastDurationForType } from "packages/ui/components/feedback/toastDurations";

export function ToastsPortalNative() {
  const activeToastId = useUIStore((s) => s.activeToastId);
  const toastQueue = useUIStore((s) => s.toastQueue);
  const dequeueToast = useUIStore((s) => s.dequeueToast);

  const activeToast = toastQueue.find((t) => t.id === activeToastId) ?? toastQueue[0];

  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      dequeueToast(activeToast.id);
    }, toastDurationForType(activeToast.type));
    return () => clearTimeout(timer);
  }, [activeToast?.id, activeToast?.type, dequeueToast]);

  if (!activeToast) return null;

  return (
    <ToastNative
      variant={activeToast.type}
      message={activeToast.message}
      onClose={() => dequeueToast(activeToast.id)}
    />
  );
}
