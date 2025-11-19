import type { ReactNode } from "react";

/**
 * ChatsOnly provider component
 * Note: ChatsContext was migrated to useChats hook, so this is now a pass-through component
 * The useChats hook is used directly in components that need chat functionality
 */
export function ChatsOnly({ children }: { children: ReactNode }) {
  // Chats are now managed via the useChats hook, so no provider wrapper is needed
  return <>{children}</>;
}
