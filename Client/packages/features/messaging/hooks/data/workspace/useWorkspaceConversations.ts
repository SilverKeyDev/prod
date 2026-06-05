import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import {
  type WorkspaceConversation,
  workspaceConversationsApi,
} from "packages/features/messaging/api/workspaceConversations";
import type { WorkspaceMessagingPersonaConfig } from "packages/features/messaging/types/workspace/personas";

export function useWorkspaceConversations(persona: WorkspaceMessagingPersonaConfig) {
  return useQuery({
    queryKey: queryKeys.workspaceConversations.list(persona.id, persona.listKinds),
    queryFn: async () => {
      const res = await workspaceConversationsApi.listConversations({
        kinds: persona.listKinds,
        adminScope: persona.adminScope,
      });
      return (res.conversations ?? []) as WorkspaceConversation[];
    },
  });
}
