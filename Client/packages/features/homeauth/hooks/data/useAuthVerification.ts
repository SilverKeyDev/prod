/**
 * Hook that exposes auth verification and resend code.
 * Wraps config/api so components use hooks only.
 */
import { useCallback } from "react";

import { authApi } from "@/features/homeauth/api/auth";

export function useAuthVerification() {
  const verify = useCallback(
    (email: string, code: string, password: string) => authApi.verify(email, code, password),
    []
  );

  const resendCode = useCallback((email: string) => authApi.resendCode(email), []);

  return { verify, resendCode };
}
