import { getWindow } from "packages/utils/core/platform";

export function redirectToLoginIfNeeded(): void {
  const win = getWindow();
  if (!win) return;
  const path = win.location.pathname ?? "";
  if (path.startsWith("/login") || path.startsWith("/signup")) return;
  win.location.href = "/login";
}
