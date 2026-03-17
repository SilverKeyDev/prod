import React from "react";

import { Icon } from "@ui/icons";

import { CHECKLIST_TITLES, type ChecklistTab } from "packages/features/checklists/types/checklists";
import { Box } from "packages/ui/components/primitives";
import { UnderlineTabs } from "packages/ui/components/tabs";

import MiniLogo from "@/components/asset/MiniLogo";
import Card from "@/components/layout/Card.web";
import { BodyText, Title } from "@/components/ui";
type ClosePageHeaderProps = {
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
  search: { label: CHECKLIST_TITLES.search, icon: <Icon name="search" className="h-4 w-4" /> },
  offer: {
    label: CHECKLIST_TITLES.offer,
    icon: <Icon name="file-signature" className="h-4 w-4" />,
  },
  escrow: { label: CHECKLIST_TITLES.escrow, icon: <Icon name="file-text" className="h-4 w-4" /> },
  inspections: {
    label: CHECKLIST_TITLES.inspections,
    icon: <Icon name="clipboard-check" className="h-4 w-4" />,
  },
  financing: {
    label: CHECKLIST_TITLES.financing,
    icon: <Icon name="dollar-sign" className="h-4 w-4" />,
  },
  closing: { label: CHECKLIST_TITLES.closing, icon: <Icon name="home" className="h-4 w-4" /> },
};
export default function ClosePageHeader({
  title,
  subtitle: _subtitle, // hidden below the main title per design
  completedCount,
  totalCount,
  loading = false,
  activeTab,
  onTabChange,
  isSectionUnlocked,
}: ClosePageHeaderProps) {
  const tabs = TAB_IDS.map((id) => ({
    id,
    label: TAB_CONFIG[id].label,
    icon: TAB_CONFIG[id].icon,
    locked: isSectionUnlocked ? !isSectionUnlocked(id) : false,
  }));
  return (
    <Box className="m-4 w-full max-w-[90%] self-center xl:px-6 2xl:px-8">
      <Card border="charcoal" className="relative z-30 pt-3" padding="none">
        <Box className="px-4">
          <Box className="flex flex-row flex-col items-center justify-center text-center">
            {/* Title row with logo */}
            <Box className="flex flex-row items-center justify-center">
              <Box className="flex-shrink-0">
                <MiniLogo size="xs" className="sm:hidden" />
                <MiniLogo size="sm" className="hidden sm:flex sm:flex-col lg:hidden" />
                <MiniLogo size="md" className="hidden lg:flex lg:flex-col xl:hidden" />
                <MiniLogo size="lg" className="hidden xl:flex xl:flex-col" />
              </Box>
              <Title
                as="h1"
                size="md"
                className="lg:heading-responsive-md text-text-primary text-sm font-semibold sm:text-base lg:font-normal"
              >
                {title}
              </Title>
            </Box>

            {/* Subtitle visible on lg+ screens (1024px+), hidden below */}
            <BodyText
              as="p"
              size="sm"
              className="lg:text-responsive-sm text-text-secondary mt-1 hidden text-center lg:flex lg:flex-col"
            >
              {_subtitle}
            </BodyText>
          </Box>

          {/* Progress Bar */}
          {!loading && (
            <Box className="mt-1 lg:mt-2">
              <Box className="bg-bg-card-muted-30 h-1 w-full rounded lg:h-2">
                <Box
                  className="bg-primary h-full rounded"
                  style={{ width: `${(completedCount / totalCount) * 100}%` }}
                />
              </Box>
            </Box>
          )}
        </Box>

        {/* Tabs Bar - unified with search Results/Saved */}
        {activeTab && onTabChange && (
          <Box className="mt-2 lg:mt-3">
            <UnderlineTabs
              items={tabs}
              activeId={activeTab}
              onChange={(id) => onTabChange(id as ChecklistTab)}
              className="flex-1"
            />
          </Box>
        )}
      </Card>
    </Box>
  );
}
