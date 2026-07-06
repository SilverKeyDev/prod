import { DEFAULT_AUTHENTICATED_PATH, ROUTES } from "packages/navigation/types/routes";

export type PostAuthFlow = "login" | "signup";

export type GetPostAuthDestinationOptions = {
  flow: PostAuthFlow;
  /** Router `from` pathname preserved across login → verification (login only). */
  returnPath?: string | null;
};

const AUTH_ENTRY_PATHS = new Set<string>([
  ROUTES.LOGIN,
  ROUTES.SIGNUP,
  ROUTES.VERIFICATION,
  ROUTES.FORGOT_PASSWORD,
]);

function normalizeReturnPath(returnPath: string | null | undefined): string | null {
  const candidate = returnPath?.trim();
  if (!candidate?.startsWith("/")) return null;
  if (AUTH_ENTRY_PATHS.has(candidate)) return null;
  return candidate;
}

/**
 * Single source of truth for where to send the user immediately after auth completes
 * (login success or email/phone verification success). Signup always goes to onboarding;
 * login respects the protected-route return path when present.
 */
export function getPostAuthDestination(options: GetPostAuthDestinationOptions): string {
  if (options.flow === "signup") {
    return ROUTES.ONBOARDING;
  }
  return normalizeReturnPath(options.returnPath) ?? DEFAULT_AUTHENTICATED_PATH;
}
