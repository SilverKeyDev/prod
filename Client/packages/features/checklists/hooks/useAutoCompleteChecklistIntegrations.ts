import { useEffect, useMemo, useRef } from "react";

import type { TaskChecklistItem } from "packages/features/checklists/api/checklists";
import type { ChecklistTab } from "packages/features/checklists/types/checklists";
import {
  type ChecklistComponentKey,
  isChecklistComponentKey,
} from "packages/features/checklists/types/componentRegistry";
import { listConnectedAgentsForPartnerStep } from "packages/features/checklists/utils/integration/checklistIntegrationCompleteness";
import { isChecklistIntegrationStepComplete } from "packages/features/checklists/utils/integration/checklistIntegrationCompletenessByKey";
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

  const attemptedRef = useRef<Set<number>>(new Set());
  const lastPrefsSyncKeyRef = useRef<string | null>(null);
  const lastConversationsSyncKeyRef = useRef<string | null>(null);

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
    if (
      !enabled ||
      prefsLoading ||
      agentChatsLoading ||
      isChecklistLoading ||
      isChecklistUpdatePending
    ) {
      return;
    }

    for (const item of items) {
      if (checkedSet.has(item.id)) continue;
      if (attemptedRef.current.has(item.id)) continue;

      const rawKey = item.component_key;
      if (!isChecklistComponentKey(rawKey)) continue;
      const componentKey = rawKey as ChecklistComponentKey;

      if (!isChecklistIntegrationStepComplete(componentKey, formData, conversations)) {
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
    isChecklistLoading,
    isChecklistUpdatePending,
    items,
    checkedSet,
    formData,
    conversations,
    getItemToggleEligibility,
    roadmapTab,
    toggleItem,
  ]);
}
