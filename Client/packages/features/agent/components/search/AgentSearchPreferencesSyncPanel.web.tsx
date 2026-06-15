import React, { useState } from "react";

import BodyText from "@ui/text/BodyText";

import { useLocalization } from "packages/contexts";
import type { OnboardingData } from "packages/features/profile";
import { ClientSelector } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";

import { useAgentClients } from "@/features/agent/hooks/data/clients/useAgentClients";
import { useSyncAgentPreferencesFromClient } from "@/features/agent/hooks/data/search/useSyncAgentPreferencesFromClient";

export type AgentSearchPreferencesSyncPanelProps = {
  /** When an agent is viewing a client in Search, show copy that edits apply to the agent only. */
  viewingClientId?: string | null;
  /**
   * When the agent uses “Match my preferences to a client” while viewing their own profile (not a client),
   * called immediately after client prefs load so the form can snap to those values before POST finishes.
   */
  onAgentSyncPreferencesFetched?: (onboarding: Partial<OnboardingData>) => void;
};

export default function AgentSearchPreferencesSyncPanel({
  viewingClientId = null,
  onAgentSyncPreferencesFetched,
}: AgentSearchPreferencesSyncPanelProps): React.ReactElement {
  const { t } = useLocalization();
  const showAgentClientViewNote = viewingClientId != null && viewingClientId !== "";
  const { clients } = useAgentClients();
  const { syncFromClient, isSyncing } = useSyncAgentPreferencesFromClient();
  const [syncPickerClientId, setSyncPickerClientId] = useState<string | null>(null);

  const handleAgentSyncClientChange = (clientId: string | null) => {
    if (clientId === null) {
      setSyncPickerClientId(null);
      return;
    }
    setSyncPickerClientId(clientId);
    const client = clients.find((c) => c.id === clientId);
    const displayName = client?.name?.trim() || client?.email?.trim() || undefined;
    const viewingClient = viewingClientId != null && viewingClientId !== "";
    void syncFromClient(clientId, displayName, {
      onFetched: (onboarding) => {
        // When viewing a client’s prefs, keep showing that client’s data; preview applies to self-view only.
        if (!viewingClient) {
          onAgentSyncPreferencesFetched?.(onboarding);
        }
      },
    });
  };

  return (
    <Box className="space-y-6">
      {showAgentClientViewNote ? (
        <BodyText as="p" size="sm" className="text-text-secondary">
          {t("search.agent_filter_edits_save_to_your_profile")}
        </BodyText>
      ) : null}

      <Box className="space-y-2">
        <BodyText as="p" size="sm" className="text-text-primary font-medium">
          {t("search.agent_sync_preferences_label")}
        </BodyText>
        <BodyText as="p" size="sm" className="text-text-secondary">
          {t("search.agent_sync_preferences_hint")}
        </BodyText>
        <Box className={isSyncing ? "pointer-events-none opacity-60" : undefined}>
          <ClientSelector
            selectedClientId={syncPickerClientId}
            onClientChange={handleAgentSyncClientChange}
            hideMeOption
            className="max-w-full"
          />
        </Box>
      </Box>
    </Box>
  );
}
