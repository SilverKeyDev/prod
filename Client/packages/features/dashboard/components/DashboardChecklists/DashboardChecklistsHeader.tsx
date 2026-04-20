import React from "react";

import { Icon } from "@ui/icons";

import { ChecklistProgressBar } from "packages/features/checklists";
import { CHECKLIST_TITLES, type ChecklistTab } from "packages/types";
import Card from "packages/ui/components/cards/Card";
import { Box } from "packages/ui/components/primitives";
import { UnderlineTabs } from "packages/ui/components/tabs";
import BodyText from "packages/ui/components/text/BodyText";
import Title from "packages/ui/components/text/Title";

type DashboardChecklistsHeaderProps = {
  journeyTitle: string;
  journeyProgressLabel: string;
  currentPhaseLabel: string;
  overallPercent: number;
  overallLoading: boolean;
  activeTab?: ChecklistTab;
  /** Journey phase tab (first incomplete section); distinct from {@link activeTab}. */
  phaseIndicatorId?: ChecklistTab;
  onTabChange?: (tab: ChecklistTab) => void;
  isSectionUnlocked?: (section: ChecklistTab) => boolean;
};

const TAB_IDS: ChecklistTab[] = [
  "search",
  "offer",
  "escrow",
  "inspections",
  "financing",
  "closing",
];

const TAB_CONFIG: Record<ChecklistTab, { label: string; icon: React.ReactNode }> = {
  search: {
    label: CHECKLIST_TITLES.search,
    icon: <Icon name="search" className="h-4 w-4" />,
  },
  offer: {
    label: CHECKLIST_TITLES.offer,
    icon: <Icon name="file-signature" className="h-4 w-4" />,
  },
  escrow: {
    label: CHECKLIST_TITLES.escrow,
    icon: <Icon name="file-text" className="h-4 w-4" />,
  },
  inspections: {
    label: CHECKLIST_TITLES.inspections,
    icon: <Icon name="clipboard-check" className="h-4 w-4" />,
  },
  financing: {
    label: CHECKLIST_TITLES.financing,
    icon: <Icon name="dollar-sign" className="h-4 w-4" />,
  },
  closing: {
    label: CHECKLIST_TITLES.closing,
    icon: <Icon name="home" className="h-4 w-4" />,
  },
};

export default function DashboardChecklistsHeader({
  journeyTitle,
  journeyProgressLabel,
  currentPhaseLabel,
  overallPercent,
  overallLoading,
  activeTab,
  phaseIndicatorId,
  onTabChange,
  isSectionUnlocked,
}: DashboardChecklistsHeaderProps) {
  const tabs = TAB_IDS.map((id) => ({
    id,
    label: TAB_CONFIG[id].label,
    icon: TAB_CONFIG[id].icon,
    locked: isSectionUnlocked ? !isSectionUnlocked(id) : false,
  }));

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

        <BodyText size="sm" className="text-text-secondary mt-2" as="p">
          {currentPhaseLabel}
        </BodyText>
      </Box>

      {activeTab != null && onTabChange != null && (
        <Box className="mt-4">
          <UnderlineTabs
            items={tabs}
            activeId={activeTab}
            phaseIndicatorId={phaseIndicatorId}
            onChange={(id) => onTabChange(id as ChecklistTab)}
          />
        </Box>
      )}
    </Card>
  );
}
