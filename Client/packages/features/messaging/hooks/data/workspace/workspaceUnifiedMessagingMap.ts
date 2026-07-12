import type { AgentConversation } from "packages/api";
import type {
  WorkspaceConversation,
  WorkspaceMessage,
} from "packages/features/messaging/api/workspaceConversations";
import type { ChatMessage } from "packages/features/messaging/hooks/data/messaging/types";
import { workspaceConversationTitle } from "packages/features/messaging/utils/workspace/conversationDisplayLabels";
import { dateNow, dateParseISO } from "packages/utils/core/date";

/**
 * Map workspace API messages into the UnifiedMessagesList ChatMessage shape.
 * Own messages use role "user" (client-style bubbles); counterparts use "agent".
 */
export function mapWorkspaceMessagesToChatMessages(
  rows: readonly WorkspaceMessage[],
  currentUserId: string | undefined
): ChatMessage[] {
  return rows.map((m) => {
    const isOwn = Boolean(currentUserId && m.sender_id === currentUserId);
    return {
      id: m.id,
      content: m.message,
      role: isOwn ? ("user" as const) : ("agent" as const),
      timestamp: m.timestamp ? dateParseISO(m.timestamp).toDate() : dateNow().toDate(),
      status: "delivered" as const,
    };
  });
}

/** Display title for a workspace conversation (support pin or agent name). */
export function workspaceConversationDisplayName(
  conv: WorkspaceConversation,
  contactNameById: ReadonlyMap<string, string>,
  pinnedSupportTitle = "SilverKey support"
): string {
  if (conv.kind === "platform_support") {
    return pinnedSupportTitle;
  }
  return workspaceConversationTitle(conv, "Agents", contactNameById);
}

/**
 * Build a pseudo AgentConversation so Unified* chrome can reuse activeConversation slots
 * (agent_name for header, last_message for list preview).
 */
export function workspaceConversationToPseudoAgentConversation(
  conv: WorkspaceConversation,
  displayName: string
): AgentConversation {
  return {
    id: conv.id,
    agent_id: conv.agent_user_id ?? conv.kind,
    client_id: conv.subject_user_id ?? "",
    agent_name: displayName,
    agent_email: null,
    agent_profile_picture: null,
    client_name: null,
    client_email: null,
    client_profile_picture: null,
    last_message: conv.last_message ?? null,
    last_message_at: conv.last_message_at ?? null,
    created_at: conv.created_at,
    updated_at: conv.updated_at,
    unread_count: conv.unread_count ?? null,
    last_read_at: conv.last_read_at ?? null,
  };
}
