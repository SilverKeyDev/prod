/**
 * Types for the messaging hook (client and agent modes)
 */

import type { AgentConversation } from "packages/api";
import type { SavedHome } from "packages/schemas/property";
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
};

export type UseMessagingReturn = {
  localMessages: ChatMessage[];
  activeConversationId: string;
  isLoadingHistory: boolean;
  activeConversation: AgentConversation | null | undefined;
  conversations: AgentConversation[];
  sendMessage: (message: string, options?: MessagingSendMessageOptions) => Promise<void>;
  sendSharedHome: (home: SavedHome) => Promise<void>;
  sendSharedDocument: (document: DocumentData) => Promise<void>;
  retryMessage: (messageId: string) => Promise<void>;
  setActiveConversationId: (id: string) => void;
  refreshActiveConversationHistory: () => Promise<void>;
  refreshChats: () => Promise<void>;
  formatTime: (date: Date) => string;
  canSendMessage: boolean;
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
