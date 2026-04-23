import { useUIStore } from "packages/store";

import Toast from "./Toast";
import { toastDurationForType } from "./toastDurations";

export default function ToastsPortal() {
  const activeToastId = useUIStore((s) => s.activeToastId);
  const toastQueue = useUIStore((s) => s.toastQueue);
  const dequeueToast = useUIStore((s) => s.dequeueToast);

  const activeToast = toastQueue.find((t) => t.id === activeToastId) ?? toastQueue[0];

  if (!activeToast) return null;

  const onClose = () => dequeueToast(activeToast.id);

  return (
    <Toast
      variant={activeToast.type}
      message={activeToast.message}
      onClose={onClose}
      duration={toastDurationForType(activeToast.type)}
    />
  );
}
