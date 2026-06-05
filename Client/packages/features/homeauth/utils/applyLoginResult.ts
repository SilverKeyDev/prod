import type {
  ApplyLoginResultOptions,
  LoginResult,
} from "packages/features/homeauth/types/auth/login";
import { getSessionStorage } from "packages/utils/core/storage";

export type {
  ApplyLoginResultOptions,
  LoginResult,
} from "packages/features/homeauth/types/auth/login";

/**
 * Shared post-login handling: session persistence for verification flow and optional success callback.
 * Web passes onSuccess to navigate; native omits it (root re-renders).
 */
export function applyLoginResult(result: LoginResult, options: ApplyLoginResultOptions): void {
  const { email, password, onSuccess, onNeedsVerification } = options;

  if (result.success) {
    onSuccess?.();
    return;
  }

  if (result.needsVerification) {
    const session = getSessionStorage();
    session.setItem("signupEmail", email);
    session.setItem("signupPassword", password);
    onNeedsVerification();
  }
}
