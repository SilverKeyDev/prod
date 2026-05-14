import { useCallback, useEffect, useRef } from "react";

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

  // Pause-on-hover/focus to satisfy WCAG 2.2.1 (Timing Adjustable). We track remaining
  // ms in a ref so resume restarts from where the user paused, not from the full duration.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remainingRef = useRef<number>(resolvedDuration);
  const startedAtRef = useRef<number>(Date.now());
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(
    (ms: number) => {
      clearTimer();
      startedAtRef.current = Date.now();
      timerRef.current = setTimeout(() => {
        onCloseRef.current();
      }, ms);
    },
    [clearTimer]
  );

  useEffect(() => {
    remainingRef.current = resolvedDuration;
    startTimer(resolvedDuration);
    return clearTimer;
  }, [resolvedDuration, startTimer, clearTimer]);

  const pause = useCallback(() => {
    if (timerRef.current == null) return;
    const elapsed = Date.now() - startedAtRef.current;
    remainingRef.current = Math.max(0, remainingRef.current - elapsed);
    clearTimer();
  }, [clearTimer]);

  const resume = useCallback(() => {
    if (timerRef.current != null) return;
    startTimer(remainingRef.current);
  }, [startTimer]);

  const closeLabel = t("feedback.close_aria");
  const role: "alert" | "status" = variant === "error" ? "alert" : "status";
  const ariaLive: "assertive" | "polite" = variant === "error" ? "assertive" : "polite";

  if (variant === "error") {
    return (
      <BaseToastFrame
        surfaceClassName="bg-red-50"
        closeLabel={closeLabel}
        onClose={onClose}
        role={role}
        ariaLive={ariaLive}
        onMouseEnter={pause}
        onMouseLeave={resume}
        onFocus={pause}
        onBlur={resume}
      >
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
    <BaseToastFrame
      surfaceClassName={surfaceClass}
      closeLabel={closeLabel}
      onClose={onClose}
      role={role}
      ariaLive={ariaLive}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
    >
      {messageBlock}
    </BaseToastFrame>
  );
}
