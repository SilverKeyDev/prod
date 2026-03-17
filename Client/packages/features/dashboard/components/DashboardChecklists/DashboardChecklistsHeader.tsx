import React from "react";

import { Icon } from "@ui/icons";

import { CHECKLIST_TITLES, type ChecklistTab } from "packages/types";
import Card from "packages/ui/components/cards/Card";
import { Box } from "packages/ui/components/primitives";
import { UnderlineTabs } from "packages/ui/components/tabs";
import BodyText from "packages/ui/components/text/BodyText";
import Title from "packages/ui/components/text/Title";

type DashboardChecklistsHeaderProps = {
  title: string;
  subtitle: string;
  completedCount: number;
  totalCount: number;
  loading?: boolean;
  activeTab?: ChecklistTab;
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
  title,
  subtitle,
  completedCount,
  totalCount,
  loading = false,
  activeTab,
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
    <Card className="bg-background-surface" padding="none" hover={false}>
      <Box className="px-2 pl-4 pt-2">
        <Box className="items-center">
          <Title size="lg" as="h2" className="text-text-primary font-semibold">
            {title}
          </Title>
          <BodyText size="sm" className="text-text-secondary mt-1" as="p">
            {subtitle}
          </BodyText>
        </Box>

        {!loading && (
          <Box className="mt-2">
            <Box className="bg-card-muted-30 h-1 w-full overflow-hidden rounded">
              <Box
                className="bg-primary h-full rounded"
                style={{
                  width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
                }}
              />
            </Box>
          </Box>
        )}
      </Box>

      {activeTab != null && onTabChange != null && (
        <Box className="mt-4">
          <UnderlineTabs
            items={tabs}
            activeId={activeTab}
            onChange={(id) => onTabChange(id as ChecklistTab)}
          />
        </Box>
      )}
    </Card>
  );
}
