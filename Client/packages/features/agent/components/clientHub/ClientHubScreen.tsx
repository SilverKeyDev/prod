import React, { useEffect, useMemo, useState } from "react";

import { useLocalization } from "packages/contexts";
import { useClientHubChecklistPrefetch } from "packages/features/agent/hooks";
import {
  buildBuyerRoadmapPhases,
  CHECKLIST_TITLES,
  type ChecklistTab,
  useChecklistProgress,
  useResolvedTransactionId,
} from "packages/features/checklists";
import { useActiveWorkspace } from "packages/features/homeauth";
import { ProfileFeature, ProfileScreen } from "packages/features/profile";
import { useTransactionShellConfig } from "packages/hooks/store";
import { useNavigation } from "packages/navigation";
import { Box, Pressable, ScrollView, Text } from "packages/ui/components/structure/primitives";
import { isWeb } from "packages/utils/core/platform";

import { useClientHubRoute } from "@/features/agent/hooks/data/clientHub/useClientHubRoute";
import { useAgentClients } from "@/features/agent/hooks/data/clients/useAgentClients";
import { useAgentDashboardMockData } from "@/features/agent/hooks/data/clients/useAgentDashboardMockData";

import { ClientHubHeaderCard, type ClientHubTab } from "./ClientHubHeaderCard";
import { ClientHubRoadmapPanel } from "./ClientHubRoadmapPanel";
import { ClientHubLibraryPanel } from "./library/ClientHubLibraryPanel";
import ClientSavedHomes from "./saved-homes/ClientSavedHomes";
import { ClientHubSchedulePanel } from "./schedule/ClientHubSchedulePanel";

type ClientHubScreenProps = {
  /** Mobile stack may pass the resolved client id directly. Web reads `/dashboard/client/...`. */
  clientId?: string;
};

export function ClientHubScreen({ clientId: clientIdProp }: ClientHubScreenProps) {
  const { t } = useLocalization();
  const { goBack } = useNavigation();
  const activeWorkspace = useActiveWorkspace();
  const isAgentWorkspace = activeWorkspace === "agent";
  const transactionShellConfig = useTransactionShellConfig();
  const { clients, isLoading } = useAgentClients();
  const { enhanceClientWithDealInfo } = useAgentDashboardMockData();

  const { resolvedClientId, handleHubClientChange, navigateToDashboard } = useClientHubRoute({
    clientIdProp,
    clients,
  });

  const [activeTab, setActiveTab] = useState<ClientHubTab>("roadmap");
  const { transactionId } = useResolvedTransactionId(resolvedClientId);
  const {
    currentSection,
    isSectionUnlocked,
    isLoading: checklistProgressLoading,
    overallProgress,
    sectionProgress,
  } = useChecklistProgress({
    transactionId: transactionId ?? undefined,
    enabled: Boolean(transactionId),
  });
  const [checklistTab, setChecklistTab] = useState<ChecklistTab>(currentSection);

  useEffect(() => {
    if (activeTab === "roadmap") {
      setChecklistTab(currentSection);
    }
  }, [activeTab, currentSection]);

  useClientHubChecklistPrefetch(transactionId ?? "");

  const roadmapPhases = useMemo(
    () =>
      buildBuyerRoadmapPhases({
        sectionProgress,
        isSectionUnlocked,
        labelsByTab: CHECKLIST_TITLES,
        selectedPhaseId: checklistTab,
        journeyPhaseId: currentSection,
      }),
    [sectionProgress, isSectionUnlocked, checklistTab, currentSection]
  );

  const client = useMemo(
    () => (resolvedClientId ? clients.find((c) => c.id === resolvedClientId) : undefined),
    [clients, resolvedClientId]
  );

  const enhancedClient = useMemo(
    () => (client ? enhanceClientWithDealInfo(client, "search") : null),
    [client, enhanceClientWithDealInfo]
  );

  const tabs: { id: ClientHubTab; label: string }[] = [
    { id: "roadmap", label: t("dashboard.tab_roadmap") },
    { id: "profile", label: t("dashboard.tab_profile") },
    { id: "liked-homes", label: t("dashboard.tab_liked_homes") },
    { id: "library", label: t("dashboard.tab_library") },
    { id: "schedule", label: t("dashboard.tab_schedule") },
  ];

  const agentSubject = useMemo(
    () => (client != null ? { userId: client.id, displayName: client.name } : null),
    [client]
  );

  const progressLabel = checklistProgressLoading
    ? t("checklists.loading")
    : t("checklists.buyer_journey.progress", {
        completed: overallProgress.completed,
        total: overallProgress.total,
      });

  if (!isAgentWorkspace) {
    return (
      <Box className="flex-1 items-center justify-center p-6">
        <Text className="text-text-secondary mb-3 text-sm">Not available.</Text>
        <Pressable
          onPress={() => {
            goBack();
          }}
          className="border-border rounded-lg border px-4 py-2"
        >
          <Text className="text-primary text-sm font-medium">Back to dashboard</Text>
        </Pressable>
      </Box>
    );
  }

  if (!resolvedClientId && isLoading) {
    return (
      <Box className="flex-1 items-center justify-center">
        <Text className="text-text-secondary text-sm">Loading client...</Text>
      </Box>
    );
  }

  if (!resolvedClientId || !client || !enhancedClient || agentSubject == null) {
    return (
      <Box className="flex-1 items-center justify-center p-6">
        <Text className="text-text-secondary mb-3 text-sm">Client not found.</Text>
        <Pressable
          onPress={() => {
            goBack();
          }}
          className="border-border rounded-lg border px-4 py-2"
        >
          <Text className="text-primary text-sm font-medium">Back to dashboard</Text>
        </Pressable>
      </Box>
    );
  }

  const isSecondaryScrollTab = activeTab === "library" || activeTab === "schedule";

  return (
    <Box className="bg-background-base flex-1">
      <ClientHubHeaderCard
        resolvedClientId={resolvedClientId}
        enhancedClient={enhancedClient}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onClientChange={handleHubClientChange}
        onBack={navigateToDashboard}
        checklistProgressLoading={checklistProgressLoading}
        progressLabel={progressLabel}
        overallProgressPercent={overallProgress.percent}
      />
      <Box className="min-h-0 flex-1">
        <Box className={activeTab === "roadmap" ? "min-h-0 flex-1" : "hidden"}>
          <ClientHubRoadmapPanel
            roadmapPhases={roadmapPhases}
            checklistTab={checklistTab}
            currentSection={currentSection}
            onPhaseSelect={setChecklistTab}
            resolvedClientId={resolvedClientId}
            transactionId={transactionId ?? ""}
            hideIntegrationComponents={isAgentWorkspace}
            onChecklistTabChange={setChecklistTab}
            transactionShellConfig={transactionShellConfig}
          />
        </Box>

        <ScrollView
          className={isSecondaryScrollTab ? "flex-1" : "hidden"}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        >
          <Box className={activeTab === "library" ? "" : "hidden"}>
            <ClientHubLibraryPanel clientId={resolvedClientId} />
          </Box>
          <Box className={activeTab === "schedule" ? "" : "hidden"}>
            <ClientHubSchedulePanel clientId={resolvedClientId} />
          </Box>
        </ScrollView>

        <Box className={activeTab === "liked-homes" ? "min-h-0 flex-1 px-4" : "hidden"}>
          <ClientSavedHomes userId={resolvedClientId} />
        </Box>

        <Box className={activeTab === "profile" ? "min-h-0 min-w-0 flex-1 px-4 pb-4" : "hidden"}>
          {isWeb ? (
            <ProfileFeature agentSubject={agentSubject} />
          ) : (
            <ProfileScreen agentSubject={agentSubject} />
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default ClientHubScreen;
