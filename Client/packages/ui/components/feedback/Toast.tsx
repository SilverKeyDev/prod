import { useEffect, useState } from "react";

import { useLocalization } from "packages/contexts";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";

import BaseToastFrame from "./BaseToastFrame";
import { TOAST_DURATION_DEFAULT_MS, TOAST_DURATION_ERROR_MS } from "./toastDurations";
import type { ToastVariant } from "./toastTypes";

export type { ToastVariant } from "./toastTypes";

export type ToastProps = {
  variant: ToastVariant;
  message: string;
  onClose: () => void;
  /** When omitted, uses {@link TOAST_DURATION_ERROR_MS} for errors, else {@link TOAST_DURATION_DEFAULT_MS}. */
  duration?: number;
};

export default function Toast({ variant, message, onClose, duration }: ToastProps) {
  const { t } = useLocalization();
  const resolvedDuration =
    duration ?? (variant === "error" ? TOAST_DURATION_ERROR_MS : TOAST_DURATION_DEFAULT_MS);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose();
    }, resolvedDuration);
    return () => clearTimeout(timer);
  }, [resolvedDuration, onClose]);

  const dismiss = () => {
    setVisible(false);
    onClose();
  };

  if (!visible) return null;

  const closeLabel = t("feedback.close_aria");

  if (variant === "error") {
    return (
      <BaseToastFrame surfaceClassName="bg-red-50" closeLabel={closeLabel} onClose={dismiss}>
        <Box className="min-w-0 flex-1">
          <BodyText as="p" size="sm" className="text-responsive-sm font-medium text-red-800">
            {t("feedback.error_title")}
          </BodyText>
          <BodyText as="p" size="xs" className="text-responsive-xs mt-1 break-words text-red-700">
            {message}
          </BodyText>
        </Box>
      </BaseToastFrame>
    );
  }

  const messageBlock = !message ? (
    <Box className="min-w-0 flex-1" />
  ) : variant === "success" ? (
    <BodyText
      as="p"
      size="sm"
      className="text-responsive-sm min-w-0 flex-1 break-words font-medium text-green-800"
    >
      {message}
    </BodyText>
  ) : variant === "warning" ? (
    <BodyText
      as="p"
      size="sm"
      className="text-responsive-sm min-w-0 flex-1 break-words font-medium text-amber-800"
    >
      {message}
    </BodyText>
  ) : (
    <BodyText
      as="p"
      size="sm"
      className="text-responsive-sm min-w-0 flex-1 break-words font-medium text-sky-900"
    >
      {message}
    </BodyText>
  );

  const surfaceClass =
    variant === "success" ? "bg-green-50" : variant === "warning" ? "bg-amber-50" : "bg-sky-50";

  return (
    <BaseToastFrame surfaceClassName={surfaceClass} closeLabel={closeLabel} onClose={dismiss}>
      {messageBlock}
    </BaseToastFrame>
  );
}
