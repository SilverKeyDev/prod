import type { AgentChatMessage, AgentConversation } from "packages/api";

/** API shape returned from agent send message mutation (shared to avoid import cycles). */
export type SendMessageApiResult = {
  message_id?: string | null;
};

export type AgentChatHistoryCacheEntry = {
  messages: AgentChatMessage[];
  conversation?: AgentConversation;
  has_more_older?: boolean;
  has_more_newer?: boolean;
};

export type GetAgentChatHistoryOptions = {
  limit?: number;
  beforeTimestamp?: string;
  beforeMessageId?: string;
  afterTimestamp?: string;
  afterMessageId?: string;
};

export type UseAgentChatsReturn = {
  conversations: AgentConversation[];
  isLoading: boolean;
  error: string | null;
  refreshChats: () => Promise<void>;
  sendMessage: (
    conversationId: string,
    message: string,
    clientId?: string,
    sharedHomeId?: string,
    sharedDocumentId?: string
  ) => Promise<SendMessageApiResult>;
  getChatHistory: (
    conversationId: string,
    options?: GetAgentChatHistoryOptions
  ) => Promise<AgentChatHistoryCacheEntry>;
  isSendingMessage: boolean;
  lastFetchedAt: number | null;
};

export type UseAgentChatsOptions = {
  /**
   * When false, skips queries and side-effect syncs so a parent can own the live subscription
   * (see `useMessaging` agent path with `agentChats`).
   */
  fetchEnabled?: boolean;
};
