import { useMemo } from "react";

import { useAgentChats } from "packages/features/messaging/hooks/data/useAgentChats";
import { getShareHomeConversationId } from "packages/utils/share";

/**
 * Resolves the agent–client conversation for sending checklist forms from the client hub.
 * `hubClientUserId` is the buyer’s user id (same value passed as checklist `userId`).
 */
export function useChecklistFormSendContext(hubClientUserId: string): {
  conversationId: string | null;
} {
  const { conversations } = useAgentChats();
  const conversationId = useMemo(
    () => getShareHomeConversationId(conversations, hubClientUserId),
    [conversations, hubClientUserId]
  );
  return { conversationId };
}
