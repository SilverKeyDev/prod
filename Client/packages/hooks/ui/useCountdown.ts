import { useCallback, useEffect, useState } from "react";

/**
 * Countdown timer for resend/cooldown flows (e.g. verification code).
 * When countdown is running, canResend is false; when it reaches 0, canResend becomes true.
 */
export function useCountdown(initialSeconds: number): {
  countdown: number;
  canResend: boolean;
  startCountdown: () => void;
} {
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);

  const startCountdown = useCallback(() => {
    setCountdown(initialSeconds);
    setCanResend(false);
  }, [initialSeconds]);

  useEffect(() => {
    if (countdown <= 0 || canResend) return;

    const id = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [countdown, canResend]);

  return { countdown, canResend, startCountdown };
}
