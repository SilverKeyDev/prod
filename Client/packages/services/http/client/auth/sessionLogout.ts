import type { AuthenticationError } from "packages/services/http/client/errors";
import { useAuthStore } from "packages/store";

import { broadcastAuthLogout } from "./authBroadcast";
import { notifyAuthenticationError } from "./authErrorNotify";
import { redirectToLoginIfNeeded } from "./authRedirect";
import { clearLegacyAuthStorage } from "./authStorage";

export { broadcastAuthLogout, getAuthBC } from "./authBroadcast";
export { redirectToLoginIfNeeded } from "./authRedirect";
export { clearLegacyAuthStorage } from "./authStorage";

/** Clears client auth state but keeps authReady true so bootstrap does not re-lock the UI. */
export function applyLocalUnauthenticatedState(): void {
  const store = useAuthStore.getState();
  store.setUser(null);
  store.setIsAuthenticated(false);
  store.setAuthStatus("unauthenticated");
  store.setAuthReady(true);
}

export type ClientSessionLogoutOptions = {
  redirect?: boolean;
  broadcast?: boolean;
};

export function performClientSessionLogout(options: ClientSessionLogoutOptions = {}): void {
  const { redirect = false, broadcast = true } = options;
  clearLegacyAuthStorage();
  applyLocalUnauthenticatedState();
  if (broadcast) {
    broadcastAuthLogout();
  }
  if (redirect) {
    redirectToLoginIfNeeded();
  }
}

export function handleAuthenticationError(error: AuthenticationError): void {
  notifyAuthenticationError(error);
  applyLocalUnauthenticatedState();
}
