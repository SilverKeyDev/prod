import { log } from "packages/logger";
import { getPostAuthDestination } from "packages/navigation/postAuthDestination";

type VerifyFn = (
  email: string,
  code: string,
  password: string
) => Promise<{ success: boolean; error?: string; message?: string }>;

/**
 * Perform verify API call; on success clears signup storage and navigates.
 * Throws on failure. Storage and navigate are injected so packages/utils stays free of globals.
 */
export async function performVerify(
  verify: VerifyFn,
  userEmail: string,
  verificationCode: string,
  getStoredPassword: () => string | null,
  clearSignupStorage: () => void,
  navigate: (path: string) => void,
  options?: { postSuccessPath?: string }
): Promise<void> {
  const storedPassword = getStoredPassword();
  log.debug("AUTH", "Verification retrieved stored data", {
    hasEmail: !!userEmail,
    hasPassword: !!storedPassword,
    email: userEmail,
  });

  if (!userEmail || !storedPassword) {
    log.error("AUTH", "Verification missing email or password");
    throw new Error("Email or password not found. Please go back and sign up again.");
  }

  log.debug("AUTH", "Verification calling authApi.verify");
  const {
    success,
    error: apiError,
    message,
  } = await verify(userEmail, verificationCode, storedPassword);
  log.debug("AUTH", "Verification authApi.verify response", {
    success,
    error: apiError,
    message,
  });

  if (!success) {
    throw new Error(apiError ?? message ?? "Failed to verify email. Please try again.");
  }

  log.debug("AUTH", "Verification successful, clearing storage and navigating");
  clearSignupStorage();
  const postSuccessPath = options?.postSuccessPath ?? getPostAuthDestination({ flow: "signup" });
  setTimeout(() => void navigate(postSuccessPath), 500);
}
