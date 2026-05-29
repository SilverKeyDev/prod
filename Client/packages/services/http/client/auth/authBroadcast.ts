let authBroadcastChannel: BroadcastChannel | null = null;

export function getAuthBC(): BroadcastChannel | null {
  if (authBroadcastChannel) return authBroadcastChannel;
  try {
    authBroadcastChannel = new BroadcastChannel("auth");
  } catch {
    authBroadcastChannel = null;
  }
  return authBroadcastChannel;
}

export function broadcastAuthLogout(): void {
  try {
    getAuthBC()?.postMessage({ type: "logout" });
  } catch {
    /* ignore */
  }
}
