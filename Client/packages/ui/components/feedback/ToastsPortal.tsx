import { useEffect } from "react";

import { useUIStore } from "packages/store";

import ErrorToast from "./ErrorToast";
import SuccessToast from "./SuccessToast";
import WarningToast from "./WarningToast";

export default function ToastsPortal() {
  const activeToastId = useUIStore((s) => s.activeToastId);
  const toastQueue = useUIStore((s) => s.toastQueue);
  const dequeueToast = useUIStore((s) => s.dequeueToast);

  const activeToast =
    toastQueue.find((t) => t.id === activeToastId) ?? toastQueue[0];

  useEffect(() => {
    // If nothing active but queue has items, set first as active by dequeue/enqueue cycle
  }, [activeToastId, toastQueue]);

  if (!activeToast) return null;

  const onClose = () => dequeueToast(activeToast.id);

  if (activeToast.type === "success") {
    return (
      <SuccessToast
        message={activeToast.message}
        onClose={onClose}
        duration={3000}
      />
    );
  }

  if (activeToast.type === "error") {
    return (
      <ErrorToast
        message={activeToast.message}
        onClose={onClose}
        duration={5000}
      />
    );
  }

  if (activeToast.type === "warning") {
    return (
      <WarningToast
        message={activeToast.message}
        onClose={onClose}
        duration={4000}
      />
    );
  }

  return (
    <SuccessToast
      message={activeToast.message}
      onClose={onClose}
      duration={3000}
    />
  );
}
