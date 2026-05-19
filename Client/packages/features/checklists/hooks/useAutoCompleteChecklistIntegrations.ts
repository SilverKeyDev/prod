import { useEffect, useMemo, useRef } from "react";

import { useQuery } from "@tanstack/react-query";

import type { TaskChecklistItem } from "packages/features/checklists/api/checklists";
import { getTransactionAddress } from "packages/features/checklists/api/checklists";
import type { ChecklistTab } from "packages/features/checklists/types/checklists";
import {
  type ChecklistComponentKey,
  isChecklistComponentKey,
} from "packages/features/checklists/types/componentRegistry";
import { listConnectedAgentsForPartnerStep } from "packages/features/checklists/utils/integration/checklistIntegrationCompleteness";
import {
  isChecklistIntegrationStepComplete,
  isPreferenceBackedChecklistIntegrationKey,
} from "packages/features/checklists/utils/integration/checklistIntegrationCompletenessByKey";
import type { ChecklistItemToggleEligibility } from "packages/features/checklists/utils/rules/checklistRules";
import { useAgentChats } from "packages/features/messaging/hooks/data/useAgentChats";
import { useUserPreferences } from "packages/hooks/data/auth/useUserData";

import { userPreferencesToOnboardingData } from "@/features/profile/utils";

export type UseAutoCompleteChecklistIntegrationsArgs = {
  items: TaskChecklistItem[];
  checkedIds: readonly number[];
  toggleItem: (id: number) => Promise<void>;
  getItemToggleEligibility: (
    section: ChecklistTab,
    itemId: number
  ) => ChecklistItemToggleEligibility;
  roadmapTab: ChecklistTab;
  enabled?: boolean;
  isChecklistUpdatePending?: boolean;
  isChecklistLoading?: boolean;
};

/**
 * When profile/preferences already satisfy an integration step, mark the checklist item
 * complete without requiring a manual Submit click.
 */
export function useAutoCompleteChecklistIntegrations({
  items,
  checkedIds,
  toggleItem,
  getItemToggleEligibility,
  roadmapTab,
  enabled = true,
  isChecklistUpdatePending = false,
  isChecklistLoading = false,
}: UseAutoCompleteChecklistIntegrationsArgs): void {
  const { userPreferences, isLoading: prefsLoading } = useUserPreferences();
  const { conversations, isLoading: agentChatsLoading } = useAgentChats();

  const hasFindingHomeItem = useMemo(
    () => items.some((item) => item.component_key === "finding_home"),
    [items]
  );

  const { data: transactionAddress, isLoading: transactionAddressLoading } = useQuery({
    queryKey: ["transaction", "address"],
    queryFn: getTransactionAddress,
    staleTime: 60 * 1000,
    enabled: enabled && hasFindingHomeItem,
  });

  const checkedSet = useMemo(() => new Set(checkedIds), [checkedIds]);
  const formData = useMemo(() => {
    if (!userPreferences) return null;
    return userPreferencesToOnboardingData(userPreferences as Record<string, unknown>);
  }, [userPreferences]);

  const prefsSyncKey = useMemo(
    () => String(userPreferences?.preferences_version ?? ""),
    [userPreferences?.preferences_version]
  );

  const conversationsSyncKey = useMemo(
    () =>
      listConnectedAgentsForPartnerStep([...conversations])
        .map((agent) => agent.agentId)
        .sort()
        .join(","),
    [conversations]
  );

  const transactionAddressSyncKey = useMemo(
    () => String(transactionAddress?.address ?? "").trim(),
    [transactionAddress?.address]
  );

  const attemptedRef = useRef<Set<number>>(new Set());
  const lastPrefsSyncKeyRef = useRef<string | null>(null);
  const lastConversationsSyncKeyRef = useRef<string | null>(null);
  const lastTransactionAddressSyncKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (lastPrefsSyncKeyRef.current !== prefsSyncKey) {
      attemptedRef.current = new Set();
      lastPrefsSyncKeyRef.current = prefsSyncKey;
    }
  }, [prefsSyncKey]);

  useEffect(() => {
    if (lastConversationsSyncKeyRef.current !== conversationsSyncKey) {
      attemptedRef.current = new Set();
      lastConversationsSyncKeyRef.current = conversationsSyncKey;
    }
  }, [conversationsSyncKey]);

  useEffect(() => {
    if (lastTransactionAddressSyncKeyRef.current !== transactionAddressSyncKey) {
      attemptedRef.current = new Set();
      lastTransactionAddressSyncKeyRef.current = transactionAddressSyncKey;
    }
  }, [transactionAddressSyncKey]);

  useEffect(() => {
    if (!enabled || isChecklistLoading || isChecklistUpdatePending) {
      return;
    }

    for (const item of items) {
      if (checkedSet.has(item.id)) continue;
      if (attemptedRef.current.has(item.id)) continue;

      const rawKey = item.component_key;
      if (!isChecklistComponentKey(rawKey)) continue;
      const componentKey = rawKey as ChecklistComponentKey;

      if (isPreferenceBackedChecklistIntegrationKey(componentKey) && prefsLoading) {
        continue;
      }
      if (componentKey === "partner_agent" && agentChatsLoading) {
        continue;
      }
      if (componentKey === "finding_home" && transactionAddressLoading) {
        continue;
      }

      if (
        !isChecklistIntegrationStepComplete(
          componentKey,
          formData,
          conversations,
          transactionAddress
        )
      ) {
        continue;
      }

      const { canMarkChecked } = getItemToggleEligibility(roadmapTab, item.id);
      if (!canMarkChecked) continue;

      attemptedRef.current.add(item.id);
      void toggleItem(item.id);
    }
  }, [
    enabled,
    prefsLoading,
    agentChatsLoading,
    transactionAddressLoading,
    isChecklistLoading,
    isChecklistUpdatePending,
    items,
    checkedSet,
    formData,
    conversations,
    transactionAddress,
    getItemToggleEligibility,
    roadmapTab,
    toggleItem,
  ]);
}
