import { useCallback, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import {
  type CreateWorkspaceConversationRequest,
  type EligibleContact,
  type WorkspaceConversation,
  workspaceConversationsApi,
} from "packages/features/messaging/api/workspaceConversations";
import type { WorkspaceMessagingPersonaId } from "packages/features/messaging/types/workspace/personas";
import { createConversationPayloadFromContact } from "packages/features/messaging/utils/workspace/createConversationFromContact";

export function useWorkspaceConversationActions(personaId: WorkspaceMessagingPersonaId) {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  const invalidateLists = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.workspaceConversations.all });
  }, [queryClient]);

  const createConversation = useCallback(
    async (payload: CreateWorkspaceConversationRequest): Promise<WorkspaceConversation | null> => {
      setIsCreating(true);
      try {
        const res = await workspaceConversationsApi.createConversation(payload);
        await invalidateLists();
        return (res.conversation as WorkspaceConversation | undefined) ?? null;
      } finally {
        setIsCreating(false);
      }
    },
    [invalidateLists]
  );

  const createSupportConversation = useCallback(async (): Promise<WorkspaceConversation | null> => {
    const supportCategory = personaId === "integrator" ? "integrator" : "brokerage";
    return createConversation({
      kind: "platform_support",
      support_category: supportCategory,
    });
  }, [createConversation, personaId]);

  const createFromEligibleContact = useCallback(
    async (contact: EligibleContact): Promise<WorkspaceConversation | null> => {
      const payload = createConversationPayloadFromContact(contact);
      return createConversation(payload);
    },
    [createConversation]
  );

  return {
    isCreating,
    createSupportConversation,
    createFromEligibleContact,
    createConversation,
  };
}
