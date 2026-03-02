import { getSessionStorage } from "packages/utils/storage";

export type LoginResult = {
  success: boolean;
  needsVerification?: boolean;
};

export type ApplyLoginResultOptions = {
  email: string;
  password: string;
  /** Called when login succeeded (e.g. web: navigateToPath(safe); native: no-op). */
  onSuccess?: () => void;
  /** Called when needsVerification; session is already updated with signupEmail/signupPassword. */
  onNeedsVerification: () => void;
};

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
