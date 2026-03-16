import React from "react";

import { Icon } from "@ui/icons";

import { CHECKLIST_TITLES, type ChecklistTab } from "packages/features/checklists/types/checklists";
import { Box } from "packages/ui/components/primitives";

import MiniLogo from "@/components/asset/MiniLogo";
import Card from "@/components/layout/Card.web";
import { BodyText, Button, Title } from "@/components/ui";
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

const TAB_CONFIG: Record<
  ChecklistTab,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  search: {
    label: CHECKLIST_TITLES.search,
    icon: (props) => <Icon name="search" {...props} />,
  },
  offer: {
    label: CHECKLIST_TITLES.offer,
    icon: (props) => <Icon name="file-signature" {...props} />,
  },
  escrow: {
    label: CHECKLIST_TITLES.escrow,
    icon: (props) => <Icon name="file-text" {...props} />,
  },
  inspections: {
    label: CHECKLIST_TITLES.inspections,
    icon: (props) => <Icon name="clipboard-check" {...props} />,
  },
  financing: {
    label: CHECKLIST_TITLES.financing,
    icon: (props) => <Icon name="dollar-sign" {...props} />,
  },
  closing: {
    label: CHECKLIST_TITLES.closing,
    icon: (props) => <Icon name="home" {...props} />,
  },
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
      <Card className="border-border-card-subtle relative z-30 border-b pt-3" padding="none">
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
                className="lg:heading-responsive-md text-navy text-sm font-semibold sm:text-base lg:font-normal"
              >
                {title}
              </Title>
            </Box>

            {/* Subtitle visible on lg+ screens (1024px+), hidden below */}
            <BodyText
              as="p"
              size="sm"
              className="lg:text-responsive-sm mt-1 hidden text-center text-neutral-600 lg:flex lg:flex-col"
            >
              {_subtitle}
            </BodyText>
          </Box>

          {/* Progress Bar */}
          {!loading && (
            <Box className="mt-1 lg:mt-2">
              <Box className="bg-bg-card-muted-30 h-1 w-full rounded lg:h-2">
                <Box
                  className="bg-olive h-full rounded"
                  style={{ width: `${(completedCount / totalCount) * 100}%` }}
                />
              </Box>
            </Box>
          )}
        </Box>

        {/* Tabs Bar */}
        {activeTab && onTabChange && (
          <Box className="mt-2 lg:mt-3">
            <Box className="scrollbar-hide flex flex-row items-center justify-center overflow-x-auto">
              {tabs.map((tab, index) => {
                const isFirst = index === 0;
                const isLast = index === tabs.length - 1;
                const locked = tab.locked ?? false;
                return (
                  <Box key={tab.id} className="flex min-w-0 flex-1 flex-row items-center">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => onTabChange(tab.id)}
                      // eslint-disable-next-line silverkey/no-dynamic-class-names -- refactor to static cn() or add to safelist
                      className={`relative flex flex-1 flex-row items-center justify-center gap-1 whitespace-nowrap py-1 text-center lg:py-1.5 ${locked ? "opacity-60" : ""} ${activeTab === tab.id ? "text-xs font-semibold text-neutral-600 lg:text-base" : "rounded-lg text-[0.625rem] font-medium text-neutral-600 hover:bg-gray-100 active:bg-gray-200 active:opacity-90 lg:text-sm"}`}
                    >
                      <tab.icon className="h-[1em] w-[1em]" />
                      {tab.label}
                      {activeTab === tab.id && (
                        <BodyText
                          as="span"
                          // eslint-disable-next-line silverkey/no-dynamic-class-names -- refactor to static cn() or add to safelist
                          className={`bg-olive absolute bottom-0 h-0.5 ${isFirst ? "left-2 right-2 rounded-l-full" : isLast ? "left-2 right-2 rounded-r-full" : "left-2 right-2 rounded-full"}`}
                          children={""}
                        />
                      )}
                    </Button>
                    {index < tabs.length - 1 && (
                      <Box className="h-4 w-px flex-shrink-0 bg-gray-300 lg:h-6" />
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}
      </Card>
    </Box>
  );
}
