import type { ReactNode } from "react";

/**
 * Minimal auth providers for lightweight routes that don't need reports, chats, or saved homes
 * Excludes ReportsProvider, ChatsProvider, and SavedHomesProvider to prevent unnecessary API calls
 * UserProvider is now at CoreProviders level to prevent remounting
 */
export function MinimalAuthProviders({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
