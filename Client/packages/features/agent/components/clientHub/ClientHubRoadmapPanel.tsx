import React from "react";

import { type ChecklistTab, RoadmapTracker } from "packages/features/checklists";
import type { Phase } from "packages/features/checklists/types/roadmapTracker";
import { ScrollView } from "packages/ui/components/structure/primitives";
import Card from "packages/ui/components/surfaces/cards/Card";
import type { TransactionShellConfig } from "packages/utils/product/workspace";

import ClientChecklists from "./checklists/ClientChecklists";

type ClientHubRoadmapPanelProps = {
  roadmapPhases: Phase[];
  checklistTab: ChecklistTab;
  currentSection: ChecklistTab;
  onPhaseSelect: (id: ChecklistTab) => void;
  resolvedClientId: string;
  transactionId: string;
  hideIntegrationComponents: boolean;
  onChecklistTabChange: (tab: ChecklistTab) => void;
  transactionShellConfig: TransactionShellConfig;
};

export function ClientHubRoadmapPanel({
  roadmapPhases,
  checklistTab,
  currentSection,
  onPhaseSelect,
  resolvedClientId,
  transactionId,
  hideIntegrationComponents,
  onChecklistTabChange,
  transactionShellConfig,
}: ClientHubRoadmapPanelProps) {
  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
    >
      <Card border="light" className="bg-background-base" padding="sm" hover={false}>
        <RoadmapTracker
          phases={roadmapPhases}
          activePhaseId={checklistTab}
          journeyPhaseId={currentSection}
          onPhaseSelect={(id) => onPhaseSelect(id as ChecklistTab)}
        />
        <ClientChecklists
          userId={resolvedClientId}
          transactionId={transactionId}
          activeTab={checklistTab}
          hideIntegrationComponents={hideIntegrationComponents}
          onTabChange={onChecklistTabChange}
          transactionShellConfig={transactionShellConfig}
        />
      </Card>
    </ScrollView>
  );
}
