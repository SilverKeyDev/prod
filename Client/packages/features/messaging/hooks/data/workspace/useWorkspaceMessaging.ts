import { useCallback, useEffect, useMemo, useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import {
  workspaceConversationsApi,
  type WorkspaceMessage,
} from "packages/features/messaging/api/workspaceConversations";
import { dateParseISO } from "packages/utils/core/date";

export type WorkspaceChatMessage = {
  id: string;
  role: string;
  message: string;
  senderId: string | null;
  timestamp: Date | null;
  isOwn: boolean;
};

function mapMessages(
  rows: WorkspaceMessage[],
  currentUserId: string | undefined
): WorkspaceChatMessage[] {
  return rows.map((m) => ({
    id: m.id,
    role: m.role,
    message: m.message,
    senderId: m.sender_id ?? null,
    timestamp: m.timestamp ? dateParseISO(m.timestamp) : null,
    isOwn: Boolean(currentUserId && m.sender_id === currentUserId),
  }));
}

export function useWorkspaceMessaging(activeConversationId: string, currentUserId?: string) {
  const queryClient = useQueryClient();
  const [isSending, setIsSending] = useState(false);

  const historyQuery = useQuery({
    queryKey: queryKeys.workspaceConversations.history(activeConversationId),
    queryFn: async () => {
      const res = await workspaceConversationsApi.getHistory(activeConversationId);
      return (res.messages ?? []) as WorkspaceMessage[];
    },
    enabled: Boolean(activeConversationId),
  });

  const localMessages = useMemo(
    () => mapMessages(historyQuery.data ?? [], currentUserId),
    [historyQuery.data, currentUserId]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!activeConversationId || !text.trim()) return;
      setIsSending(true);
      try {
        await workspaceConversationsApi.sendMessage(activeConversationId, text.trim());
        await queryClient.invalidateQueries({
          queryKey: queryKeys.workspaceConversations.history(activeConversationId),
        });
        await queryClient.invalidateQueries({ queryKey: queryKeys.workspaceConversations.all });
      } finally {
        setIsSending(false);
      }
    },
    [activeConversationId, queryClient]
  );

  const acknowledgeAsRead = useCallback(async () => {
    if (!activeConversationId) return;
    await workspaceConversationsApi.markRead(activeConversationId);
    await queryClient.invalidateQueries({ queryKey: queryKeys.workspaceConversations.all });
  }, [activeConversationId, queryClient]);

  useEffect(() => {
    if (!activeConversationId) return;
    void acknowledgeAsRead();
  }, [activeConversationId, acknowledgeAsRead]);

  return {
    localMessages,
    isLoadingHistory: historyQuery.isLoading,
    isSending,
    sendMessage,
    refreshHistory: historyQuery.refetch,
    acknowledgeAsRead,
  };
}
