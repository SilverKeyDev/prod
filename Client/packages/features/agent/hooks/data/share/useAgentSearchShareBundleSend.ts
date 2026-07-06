import { useCallback, useState } from "react";

import { useAgentChats } from "packages/features/messaging/hooks/data/useAgentChats";
import { buildSharedHomesAttachmentMessage } from "packages/features/messaging/utils/sharedAttachmentSnapshot";
import type { SearchResult } from "packages/features/search/types/domain/result";
import { log } from "packages/logger";
import { getShareHomeConversationId } from "packages/utils/comms/share";
import { searchResultsToSavedHomesForShare } from "packages/utils/product/search/share/searchResultsToSavedHomesForShare";

export function useAgentSearchShareBundleSend(): {
  sendBundle: (properties: SearchResult[], clientId: string | null) => Promise<boolean>;
  isSending: boolean;
} {
  const { conversations, sendMessage } = useAgentChats();
  const [isSending, setIsSending] = useState(false);

  const sendBundle = useCallback(
    async (properties: SearchResult[], clientId: string | null): Promise<boolean> => {
      if (!clientId || properties.length === 0) {
        return false;
      }
      let conversationId = getShareHomeConversationId(conversations, clientId);
      if (!conversationId) {
        conversationId = "new";
      }
      const homes = searchResultsToSavedHomesForShare(properties);
      const messageBody = buildSharedHomesAttachmentMessage(homes);
      const first = homes[0];
      const sharedHomeId = (first.home_id || first.address || "").trim();
      if (!sharedHomeId) {
        return false;
      }
      const clientIdToPass = conversationId === "new" ? clientId : undefined;
      setIsSending(true);
      try {
        await sendMessage(conversationId, messageBody, clientIdToPass, sharedHomeId);
        return true;
      } catch (error) {
        log.error("MESSAGES", "Error sending shared home bundle from search", error);
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [conversations, sendMessage]
  );

  return { sendBundle, isSending };
}
