/**
 * Types for the messaging hook (client and agent modes)
 */

import type { AgentConversation } from "packages/api";
import type { UseAgentChatsReturn } from "packages/features/messaging/hooks/data/useAgentChats";
import type { SharedBundleItemV1 } from "packages/features/messaging/utils/sharedAttachmentSnapshot";
import type { SavedHome } from "packages/types/domain/savedHome";
import type { DocumentData } from "packages/ui/components/cards/document/types";

export type EventRequestStatus = "pending" | "accepted" | "cancelled";

/** Optional args when sending from a modal that already resolved conversation + client. */
export type MessagingSendMessageOptions = {
  conversationId?: string;
  clientIdForAgent?: string;
};

export type ChatMessage = {
  id: string;
  content: string;
  role: "user" | "agent";
  timestamp: Date;
  shared_home_id?: string | null;
  shared_document_id?: string | null;
  is_read?: boolean;
  read_at?: string | null;
  status?: "sending" | "delivered" | "failed";
  event_request_status?: EventRequestStatus | null;
};

export type UseMessagingConfig = {
  mode: "client" | "agent";
  conversationSelector: string | null | undefined;
  clientIdForSending?: string | null;
  agentId?: string | null;
  /**
   * When set for `mode: "agent"`, `useMessaging` uses this subscription instead of calling
   * `useAgentChats` again (avoids duplicate observers/effects on the agent dashboard).
   */
  agentChats?: UseAgentChatsReturn;
};

export type UseMessagingReturn = {
  localMessages: ChatMessage[];
  activeConversationId: string;
  isLoadingHistory: boolean;
  isChatsLoading: boolean;
  activeConversation: AgentConversation | null | undefined;
  conversations: AgentConversation[];
  sendMessage: (message: string, options?: MessagingSendMessageOptions) => Promise<void>;
  sendSharedHomes: (homes: SavedHome[]) => Promise<void>;
  sendSharedDocument: (document: DocumentData) => Promise<void>;
  sendSharedDocuments: (documents: DocumentData[]) => Promise<void>;
  sendSharedBundle: (items: SharedBundleItemV1[]) => Promise<void>;
  retryMessage: (messageId: string) => Promise<void>;
  setActiveConversationId: (id: string) => void;
  refreshActiveConversationHistory: () => Promise<void>;
  refreshChats: () => Promise<void>;
  formatTime: (date: Date) => string;
  canSendMessage: boolean;
  /** Call when the user is viewing the active thread (e.g. tab focused) so read state syncs without re-selecting the conversation. */
  acknowledgeActiveConversationAsRead: () => void;
  /** True when the server indicates older messages exist beyond the loaded window. */
  hasMoreOlder: boolean;
  isLoadingOlder: boolean;
  /** Load the next page of older messages (scroll-up). */
  loadOlderMessages: () => Promise<void>;
};

export type ApiMessageForMapping = {
  id: string;
  message: string;
  role: string;
  timestamp: string;
  shared_home_id?: string | null;
  shared_document_id?: string | null;
  is_read?: boolean;
  read_at?: string | null;
  event_request_status?: "pending" | "accepted" | "cancelled" | null;
};
