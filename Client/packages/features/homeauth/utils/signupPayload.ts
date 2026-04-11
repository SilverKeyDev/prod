import type { SignupFormPayload } from "packages/features/homeauth/types/auth/signupForm";
import { getSessionStorage } from "packages/utils/storage";

import type { SignupData } from "@/features/homeauth/api/types";

export type { SignupFormPayload } from "packages/features/homeauth/types/auth/signupForm";

/**
 * Build API SignupData from form state. Shared by web and native signup screens.
 */
export function getSignupPayload(form: SignupFormPayload): SignupData {
  return {
    name: form.name,
    email: form.email,
    password: form.password,
    ...(form.phone?.trim() ? { phone: form.phone.trim() } : {}),
    ...(form.agencyName?.trim() ? { brokerage: form.agencyName.trim() } : {}),
  };
}

/**
 * Persist email and password in session for the verification step. Shared by web and native.
 */
export function persistSignupEmailForVerification(
  email: string,
  password: string,
): void {
  const session = getSessionStorage();
  session.setItem("signupEmail", email);
  session.setItem("signupPassword", password);
}
