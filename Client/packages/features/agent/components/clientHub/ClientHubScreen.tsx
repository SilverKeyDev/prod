import React, { useCallback, useEffect, useMemo, useState } from "react";

import { useLocalization } from "packages/contexts";
import { useClientHubChecklistPrefetch } from "packages/features/agent/hooks";
import {
  buildBuyerRoadmapPhases,
  CHECKLIST_TITLES,
  ChecklistProgressBar,
  type ChecklistTab,
  RoadmapTracker,
  useChecklistProgress,
} from "packages/features/checklists";
import { useActiveWorkspace } from "packages/features/homeauth";
import { ProfileFeature, ProfileScreen } from "packages/features/profile";
import { useTransactionShellConfig } from "packages/hooks/store";
import { useNavigation } from "packages/navigation";
import { ClientSelector } from "packages/ui";
import Card from "packages/ui/components/cards/Card";
import { Box, Pressable, ScrollView, Text } from "packages/ui/components/primitives";
import { UnderlineTabs } from "packages/ui/components/tabs";
import BodyText from "packages/ui/components/text/BodyText";
import {
  buildClientHubPath,
  parseClientHubPathname,
  resolveClientHubRouteClientId,
} from "packages/utils/dashboard";
import { dateParseISO } from "packages/utils/date";
import { stripWorkspaceShellPrefix } from "packages/utils/layout/dashboardLayoutConfig";
import { isWeb } from "packages/utils/platform";

import { useAgentClients } from "@/features/agent/hooks/data/clients/useAgentClients";
import { useAgentDashboardMockData } from "@/features/agent/hooks/data/clients/useAgentDashboardMockData";

import ClientChecklists from "./checklists/ClientChecklists";
import { ClientHubLibraryPanel } from "./library/ClientHubLibraryPanel";
import ClientSavedHomes from "./saved-homes/ClientSavedHomes";
import { ClientHubSchedulePanel } from "./schedule/ClientHubSchedulePanel";

type ClientHubScreenProps = {
  /** Mobile stack may pass the resolved client id directly. Web reads `/dashboard/client/...`. */
  clientId?: string;
};

type ClientHubTab = "roadmap" | "profile" | "liked-homes" | "library" | "schedule";

function formatRelativeDate(dateString: string) {
  const now = Date.now();
  const date = dateParseISO(dateString).valueOf();
  const diffMs = now - date;
  const oneDay = 1000 * 60 * 60 * 24;
  const days = Math.floor(diffMs / oneDay);
  if (days <= 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 14) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "1 week ago";
  return `${weeks} weeks ago`;
}

export function ClientHubScreen({ clientId: clientIdProp }: ClientHubScreenProps) {
  const { t } = useLocalization();
  const { navigateToPath, goBack, getCurrentRoute } = useNavigation();
  const { pathname: rawPathname } = getCurrentRoute();
  const pathname = stripWorkspaceShellPrefix(rawPathname);
  const activeWorkspace = useActiveWorkspace();
  const isAgentWorkspace = activeWorkspace === "agent";
  const transactionShellConfig = useTransactionShellConfig();
  const { clients, isLoading } = useAgentClients();
  const { enhanceClientWithDealInfo } = useAgentDashboardMockData();

  const parsedHubPath = useMemo(() => parseClientHubPathname(pathname), [pathname]);

  const resolvedClientId = useMemo(() => {
    const fromProp = clientIdProp?.trim();
    if (fromProp) return fromProp;
    if (!parsedHubPath) return null;
    return resolveClientHubRouteClientId(clients, parsedHubPath);
  }, [clientIdProp, parsedHubPath, clients]);

  const [activeTab, setActiveTab] = useState<ClientHubTab>("roadmap");
  const {
    currentSection,
    isSectionUnlocked,
    isLoading: checklistProgressLoading,
    overallProgress,
    sectionProgress,
  } = useChecklistProgress({ checklistSubjectUserId: resolvedClientId ?? "" });
  const [checklistTab, setChecklistTab] = useState<ChecklistTab>(currentSection);

  useEffect(() => {
    if (activeTab === "roadmap") {
      setChecklistTab(currentSection);
    }
  }, [activeTab, currentSection]);

  useClientHubChecklistPrefetch(resolvedClientId ?? "");

  useEffect(() => {
    if (!parsedHubPath || !resolvedClientId) return;
    const client = clients.find((row) => row.id === resolvedClientId);
    if (!client) return;
    const target = buildClientHubPath(client.id, client.name);
    if (pathname !== target) {
      navigateToPath(target, { replace: true });
    }
  }, [clients, navigateToPath, parsedHubPath, pathname, resolvedClientId]);

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

  const handleHubClientChange = useCallback(
    (nextId: string | null) => {
      if (nextId !== null) {
        const nextClient = clients.find((row) => row.id === nextId);
        if (nextClient) {
          navigateToPath(buildClientHubPath(nextClient.id, nextClient.name));
        }
      } else {
        navigateToPath("/dashboard");
      }
    },
    [clients, navigateToPath]
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

  const headerCard = (
    <Box className="mb-4 px-4 pt-6">
      <Card border="light" className="bg-background-base" padding="sm" hover={false}>
        <Box className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-3 sm:gap-y-2">
          <Box className="flex min-w-0 flex-row items-center gap-2 sm:flex-1 sm:gap-3">
            <Pressable
              onPress={() => {
                navigateToPath("/dashboard");
              }}
              className="shrink-0"
            >
              <Text className="text-text-secondary text-sm font-medium">← Back</Text>
            </Pressable>

            <Box className="min-w-0 flex-1">
              <ClientSelector
                selectedClientId={resolvedClientId}
                onClientChange={handleHubClientChange}
                hideMeOption
                className="w-full min-w-0"
              />
            </Box>

            <Box className="flex max-w-[38%] shrink-0 flex-col items-end gap-0.5 text-right sm:max-w-none">
              <Text className="text-text-secondary truncate text-xs">
                Stage: {enhancedClient.deal_stage.replace(/_/g, " ")}
              </Text>
              {enhancedClient.last_agent_action ? (
                <Text className="text-text-secondary truncate text-xs">
                  Last action: {formatRelativeDate(enhancedClient.last_agent_action)}
                </Text>
              ) : null}
            </Box>
          </Box>

          <Box className="flex w-full min-w-0 flex-col gap-1 sm:ml-auto sm:w-auto sm:max-w-xl sm:shrink-0 sm:items-end">
            <BodyText size="sm" className="text-text-secondary text-right" as="p">
              {checklistProgressLoading
                ? t("checklists.loading")
                : t("checklists.buyer_journey.progress", {
                    completed: overallProgress.completed,
                    total: overallProgress.total,
                  })}
            </BodyText>
            <Box className="w-full">
              <ChecklistProgressBar
                loading={checklistProgressLoading}
                percent={overallProgress.percent}
                variant="dashboard"
              />
            </Box>
          </Box>
        </Box>

        <Box className="mt-3">
          <UnderlineTabs
            items={tabs}
            activeId={activeTab}
            onChange={(id) => setActiveTab(id as ClientHubTab)}
          />
        </Box>
      </Card>
    </Box>
  );

  const isSecondaryScrollTab = activeTab === "library" || activeTab === "schedule";

  return (
    <Box className="bg-background-base flex-1">
      {headerCard}
      <Box className="min-h-0 flex-1">
        <ScrollView
          className={activeTab === "roadmap" ? "flex-1" : "hidden"}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        >
          <Card border="light" className="bg-background-base" padding="sm" hover={false}>
            <RoadmapTracker
              phases={roadmapPhases}
              activePhaseId={checklistTab}
              journeyPhaseId={currentSection}
              onPhaseSelect={(id) => {
                setChecklistTab(id as ChecklistTab);
              }}
            />
            <ClientChecklists
              userId={resolvedClientId}
              activeTab={checklistTab}
              hideIntegrationComponents={isAgentWorkspace}
              onTabChange={setChecklistTab}
              transactionShellConfig={transactionShellConfig}
            />
          </Card>
        </ScrollView>

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
