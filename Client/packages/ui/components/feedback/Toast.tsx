import { useEffect, useState } from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import IconButton from "packages/ui/components/button/IconButton";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";

import { TOAST_DURATION_DEFAULT_MS, TOAST_DURATION_ERROR_MS } from "./toastDurations";

export type ToastVariant = "success" | "error" | "warning" | "info";

export type ToastProps = {
  variant: ToastVariant;
  message: string;
  onClose: () => void;
  /** When omitted, uses {@link TOAST_DURATION_ERROR_MS} for errors, else {@link TOAST_DURATION_DEFAULT_MS}. */
  duration?: number;
};

const SURFACE = "border-border max-w-xs rounded-lg border p-2 sm:max-w-md";
const SHELL = "z-toast fixed bottom-1.5 right-1.5 sm:bottom-2 sm:right-2";
const ROW = "gap-responsive-sm flex items-start justify-between";

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

  if (variant === "error") {
    return (
      <Box className={SHELL}>
        <Box className={`${SURFACE} bg-red-50`}>
          <Box className={ROW}>
            <Box className="min-w-0 flex-1">
              <BodyText as="p" size="sm" className="text-responsive-sm font-medium text-red-800">
                {t("feedback.error_title")}
              </BodyText>
              <BodyText
                as="p"
                size="xs"
                className="text-responsive-xs mt-1 break-words text-red-700"
              >
                {message}
              </BodyText>
            </Box>
            <IconButton
              variant="ghost"
              size="sm"
              label={t("feedback.close_aria")}
              onClick={dismiss}
              className="flex-shrink-0 text-red-500 hover:text-red-700"
            >
              <Icon name="x" className="mobile-icon-sm" />
            </IconButton>
          </Box>
        </Box>
      </Box>
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
    variant === "success"
      ? `${SURFACE} bg-green-50`
      : variant === "warning"
        ? `${SURFACE} bg-amber-50`
        : `${SURFACE} bg-sky-50`;

  const iconButtonClass =
    variant === "success"
      ? "flex-shrink-0 text-green-500 hover:text-green-700"
      : variant === "warning"
        ? "flex-shrink-0 text-amber-500 hover:text-amber-700"
        : "flex-shrink-0 text-sky-600 hover:text-sky-800";

  return (
    <Box className={SHELL}>
      <Box className={surfaceClass}>
        <Box className={ROW}>
          {messageBlock}
          <IconButton
            variant="ghost"
            size="sm"
            label={t("feedback.close_aria")}
            onClick={dismiss}
            className={iconButtonClass}
          >
            <Icon name="x" className="mobile-icon-sm" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}
