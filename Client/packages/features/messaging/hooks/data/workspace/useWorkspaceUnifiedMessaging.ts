import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import type {
  EligibleContact,
  WorkspaceConversation,
} from "packages/features/messaging/api/workspaceConversations";
import { formatMessageTime } from "packages/features/messaging/hooks/data/messaging/helpers";
import type { UseMessagingReturn } from "packages/features/messaging/hooks/data/messaging/types";
import type { ChatMessage } from "packages/features/messaging/hooks/data/messaging/types";
import { eligibleContactKindsForPersona } from "packages/features/messaging/types/workspace/personas";
import { findPlatformSupportConversation } from "packages/features/messaging/utils/workspace/pinnedSupportSidebar";
import { useUserData } from "packages/hooks/data/user/useUserData";
import { getWorkspaceMessagingPersona } from "packages/utils/comms/messaging/personas/personasRegistry";
import { dateNow } from "packages/utils/core/date";

import { useWorkspaceConversationActions } from "./useWorkspaceConversationActions";
import { useWorkspaceConversations } from "./useWorkspaceConversations";
import { useWorkspaceEligibleContacts } from "./useWorkspaceEligibleContacts";
import { useWorkspaceMessaging } from "./useWorkspaceMessaging";
import {
  workspaceConversationDisplayName,
  workspaceConversationToPseudoAgentConversation,
} from "./workspaceUnifiedMessagingMap";

type UseWorkspaceUnifiedMessagingOptions = {
  /** When true, create platform_support on first load if missing. */
  autoEnsureSupport?: boolean;
};

/**
 * Adapts workspace conversation hooks to the UnifiedMessagingShell / UseMessagingReturn surface.
 */
export function useWorkspaceUnifiedMessaging(
  options: UseWorkspaceUnifiedMessagingOptions = {}
): UseMessagingReturn & {
  workspaceConversations: WorkspaceConversation[];
  eligibleContacts: EligibleContact[];
  contactNameById: ReadonlyMap<string, string>;
  isCreating: boolean;
  createSupportConversation: () => Promise<WorkspaceConversation | null>;
  createFromEligibleContact: (contact: EligibleContact) => Promise<WorkspaceConversation | null>;
  pinnedSupportTitle: string;
  isLoadingContacts: boolean;
} {
  const { autoEnsureSupport = true } = options;
  const persona = getWorkspaceMessagingPersona("brokerage");
  const { userProfile } = useUserData();
  const queryClient = useQueryClient();

  const [activeConversationId, setActiveConversationIdState] = useState("");
  const supportEnsureAttemptedRef = useRef(false);

  const contactKinds = useMemo(() => eligibleContactKindsForPersona(persona), [persona]);
  const {
    data: workspaceConversations = [],
    isLoading: isChatsLoading,
    refetch: refreshChatsQuery,
  } = useWorkspaceConversations(persona);
  const { data: eligibleContacts = [], isLoading: isLoadingContacts } =
    useWorkspaceEligibleContacts(contactKinds);
  const { isCreating, createSupportConversation, createFromEligibleContact } =
    useWorkspaceConversationActions("brokerage");

  const {
    localMessages: workspaceLocalMessages,
    isLoadingHistory,
    sendMessage: sendWorkspaceMessage,
    refreshHistory,
    acknowledgeAsRead,
  } = useWorkspaceMessaging(activeConversationId, userProfile?.id);

  const contactNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of eligibleContacts) {
      map.set(c.contact_id, c.display_name);
    }
    return map;
  }, [eligibleContacts]);

  const pinnedSupportTitle = persona.pinnedSupportTitle ?? "SilverKey support";

  const conversations = useMemo(
    () =>
      workspaceConversations.map((conv) =>
        workspaceConversationToPseudoAgentConversation(
          conv,
          workspaceConversationDisplayName(conv, contactNameById, pinnedSupportTitle)
        )
      ),
    [workspaceConversations, contactNameById, pinnedSupportTitle]
  );

  const activeConversation = useMemo(() => {
    if (!activeConversationId) return null;
    return conversations.find((c) => c.id === activeConversationId) ?? null;
  }, [activeConversationId, conversations]);

  const localMessages = useMemo((): ChatMessage[] => {
    return workspaceLocalMessages.map((m) => ({
      id: m.id,
      content: m.message,
      role: m.isOwn ? ("user" as const) : ("agent" as const),
      timestamp: m.timestamp ?? dateNow().toDate(),
      status: "delivered" as const,
    }));
  }, [workspaceLocalMessages]);

  // Auto-ensure platform_support thread once conversations have loaded
  useEffect(() => {
    if (!autoEnsureSupport) return;
    if (isChatsLoading) return;
    if (supportEnsureAttemptedRef.current) return;
    if (findPlatformSupportConversation(workspaceConversations)) {
      supportEnsureAttemptedRef.current = true;
      return;
    }
    supportEnsureAttemptedRef.current = true;
    void createSupportConversation().then((conv) => {
      if (conv?.id && !activeConversationId) {
        setActiveConversationIdState(conv.id);
      }
    });
  }, [
    autoEnsureSupport,
    isChatsLoading,
    workspaceConversations,
    createSupportConversation,
    activeConversationId,
  ]);

  const setActiveConversationId = useCallback((id: string) => {
    setActiveConversationIdState(id);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      await sendWorkspaceMessage(text);
    },
    [sendWorkspaceMessage]
  );

  const noopAsync = useCallback(async () => {}, []);

  const formatTime = useCallback((date: Date) => formatMessageTime(date), []);

  const canSendMessage = Boolean(activeConversationId);

  const acknowledgeActiveConversationAsRead = useCallback(() => {
    void acknowledgeAsRead();
  }, [acknowledgeAsRead]);

  const refreshActiveConversationHistory = useCallback(async () => {
    await refreshHistory();
  }, [refreshHistory]);

  const refreshChats = useCallback(async () => {
    await refreshChatsQuery();
    await queryClient.invalidateQueries({ queryKey: queryKeys.workspaceConversations.all });
  }, [refreshChatsQuery, queryClient]);

  return {
    localMessages,
    activeConversationId,
    isLoadingHistory,
    isChatsLoading,
    activeConversation,
    conversations,
    sendMessage,
    sendSharedHomes: noopAsync as UseMessagingReturn["sendSharedHomes"],
    sendSharedDocument: noopAsync as UseMessagingReturn["sendSharedDocument"],
    sendSharedDocuments: noopAsync as UseMessagingReturn["sendSharedDocuments"],
    sendSharedBundle: noopAsync as UseMessagingReturn["sendSharedBundle"],
    retryMessage: noopAsync as UseMessagingReturn["retryMessage"],
    setActiveConversationId,
    refreshActiveConversationHistory,
    refreshChats,
    formatTime,
    canSendMessage,
    acknowledgeActiveConversationAsRead,
    hasMoreOlder: false,
    isLoadingOlder: false,
    loadOlderMessages: noopAsync,
    workspaceConversations,
    eligibleContacts,
    contactNameById,
    isCreating,
    createSupportConversation,
    createFromEligibleContact,
    pinnedSupportTitle,
    isLoadingContacts,
  };
}
