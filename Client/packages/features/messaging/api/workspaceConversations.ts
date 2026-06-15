import { apiGet, apiPost } from "packages/services/http";
import type { components } from "packages/types/api.generated";

export type WorkspaceConversation = components["schemas"]["WorkspaceConversation"];
export type WorkspaceConversationKind = components["schemas"]["WorkspaceConversationKind"];
export type WorkspaceMessage = components["schemas"]["WorkspaceMessage"];
export type WorkspaceConversationsResponse =
  components["schemas"]["WorkspaceConversationsResponse"];
export type WorkspaceConversationHistoryResponse =
  components["schemas"]["WorkspaceConversationHistoryResponse"];
export type CreateWorkspaceConversationRequest =
  components["schemas"]["CreateWorkspaceConversationRequest"];
export type CreateWorkspaceConversationResponse =
  components["schemas"]["CreateWorkspaceConversationResponse"];
export type SendWorkspaceMessageRequest = components["schemas"]["SendWorkspaceMessageRequest"];
export type EligibleContact = components["schemas"]["EligibleContact"];
export type EligibleContactsResponse = components["schemas"]["EligibleContactsResponse"];

export type ListWorkspaceConversationsParams = {
  kinds?: WorkspaceConversationKind[];
  adminScope?: boolean;
};

function kindsQuery(kinds?: WorkspaceConversationKind[]): string {
  if (!kinds?.length) return "";
  return `?kinds=${encodeURIComponent(kinds.join(","))}`;
}

export const workspaceConversationsApi = {
  listConversations: (params?: ListWorkspaceConversationsParams) => {
    const sp = new URLSearchParams();
    if (params?.kinds?.length) sp.set("kinds", params.kinds.join(","));
    if (params?.adminScope) sp.set("scope", "admin");
    const qs = sp.toString();
    return apiGet<WorkspaceConversationsResponse>(`/api/v1/conversations${qs ? `?${qs}` : ""}`);
  },

  createConversation: (body: CreateWorkspaceConversationRequest) =>
    apiPost<CreateWorkspaceConversationResponse>("/api/v1/conversations", body),

  getHistory: (conversationId: string) =>
    apiGet<WorkspaceConversationHistoryResponse>(
      `/api/v1/conversations/${encodeURIComponent(conversationId)}/history`
    ),

  sendMessage: (conversationId: string, message: string) =>
    apiPost<{ success: boolean; message_id?: string }>("/api/v1/conversations/message", {
      conversation_id: conversationId,
      message,
    } satisfies SendWorkspaceMessageRequest),

  markRead: (conversationId: string) =>
    apiPost<{ success: boolean }>(
      `/api/v1/conversations/${encodeURIComponent(conversationId)}/read`,
      {}
    ),

  listEligibleContacts: (kinds?: WorkspaceConversationKind[]) =>
    apiGet<EligibleContactsResponse>(`/api/v1/conversations/eligible-contacts${kindsQuery(kinds)}`),
};
