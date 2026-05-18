import React, { useMemo } from "react";

import {
  buildBuyerRoadmapPhases,
  CHECKLIST_TITLES,
  ChecklistProgressBar,
  type ChecklistTab,
  RoadmapTracker,
} from "packages/features/checklists";
import Card from "packages/ui/components/cards/Card";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import Title from "packages/ui/components/text/Title";

type SectionProgress = Record<
  ChecklistTab,
  { completed: number; total: number; isComplete: boolean }
>;

type DashboardChecklistsHeaderProps = {
  journeyTitle: string;
  journeyProgressLabel: string;
  overallPercent: number;
  overallLoading: boolean;
  activeTab?: ChecklistTab;
  currentSection: ChecklistTab;
  onTabChange?: (tab: ChecklistTab) => void;
  isSectionUnlocked?: (section: ChecklistTab) => boolean;
  sectionProgress: SectionProgress;
};

export default function DashboardChecklistsHeader({
  journeyTitle,
  journeyProgressLabel,
  overallPercent,
  overallLoading,
  activeTab,
  currentSection,
  onTabChange,
  isSectionUnlocked,
  sectionProgress,
}: DashboardChecklistsHeaderProps) {
  const phases = useMemo(
    () =>
      buildBuyerRoadmapPhases({
        sectionProgress,
        isSectionUnlocked: isSectionUnlocked ?? (() => true),
        labelsByTab: CHECKLIST_TITLES,
        selectedPhaseId: activeTab ?? "search",
        journeyPhaseId: currentSection,
      }),
    [sectionProgress, isSectionUnlocked, activeTab, currentSection]
  );

  return (
    <Card border="light" className="bg-background-surface" padding="none" hover={false}>
      <Box className="px-2 pl-4 pt-2">
        <Box className="items-center">
          <Title size="lg" as="h2" className="text-text-primary font-semibold">
            {journeyTitle}
          </Title>
          <BodyText size="sm" className="text-text-secondary mt-1" as="p">
            {journeyProgressLabel}
          </BodyText>
        </Box>

        <Box className="mt-2">
          <ChecklistProgressBar
            loading={overallLoading}
            percent={overallPercent}
            variant="dashboard"
          />
        </Box>
      </Box>

      {activeTab != null && onTabChange != null ? (
        <Box className="mt-4 px-2 pb-2">
          <RoadmapTracker
            phases={phases}
            activePhaseId={activeTab}
            journeyPhaseId={currentSection}
            onPhaseSelect={(id) => {
              onTabChange(id as ChecklistTab);
            }}
          />
        </Box>
      ) : null}
    </Card>
  );
}
