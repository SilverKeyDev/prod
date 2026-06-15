import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import {
  type EligibleContact,
  type WorkspaceConversationKind,
  workspaceConversationsApi,
} from "packages/features/messaging/api/workspaceConversations";
import { isActionableEligibleContact } from "packages/features/messaging/utils/workspace/createConversationFromContact";

export function useWorkspaceEligibleContacts(kinds: WorkspaceConversationKind[]) {
  return useQuery({
    queryKey: queryKeys.workspaceConversations.eligibleContacts(kinds),
    queryFn: async () => {
      const res = await workspaceConversationsApi.listEligibleContacts(kinds);
      return ((res.contacts ?? []) as EligibleContact[]).filter(isActionableEligibleContact);
    },
    enabled: kinds.length > 0,
  });
}
