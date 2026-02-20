import { useCallback, useEffect, useState } from "react";

export type UseCountdownReturn = {
  countdown: number;
  canResend: boolean;
  startCountdown: () => void;
};

/**
 * Countdown timer for resend/cooldown flows (e.g. verification code resend).
 * When countdown reaches 0, canResend becomes true.
 */
export function useCountdown(initialSeconds: number): UseCountdownReturn {
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);

  const startCountdown = useCallback(() => {
    setCountdown(initialSeconds);
    setCanResend(false);
  }, [initialSeconds]);

  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  return { countdown, canResend, startCountdown };
}
