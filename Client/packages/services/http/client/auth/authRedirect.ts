import { getWindow } from "packages/utils/core/platform";

export function redirectToLoginIfNeeded(): void {
  const win = getWindow();
  if (!win) return;
  const path = win.location.pathname ?? "";
  if (path.startsWith("/login") || path.startsWith("/signup")) return;
  // Public agent site pages (`/a/{slug}`, `/agent-profile/...`) work without a session;
  // a stray 401 there must not bounce anonymous visitors to the login screen (SIL-291).
  if (path.startsWith("/a/") || path.startsWith("/agent-profile/")) return;
  win.location.href = "/login";
}
