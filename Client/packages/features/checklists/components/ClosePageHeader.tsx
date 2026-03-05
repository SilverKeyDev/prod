import React from "react";

import { Icon } from "@ui/icons";

import { CHECKLIST_TITLES, type ChecklistTab } from "packages/features/checklists/types/checklists";
import { BodyText, Button, Title } from "packages/ui/components/index.web";

import MiniLogo from "@/components/asset/MiniLogo";
import Card from "@/components/layout/Card.web";
type ClosePageHeaderProps = {
  title: string;
  subtitle: string;
  completedCount: number;
  totalCount: number;
  loading?: boolean;
  activeTab?: ChecklistTab;
  onTabChange?: (tab: ChecklistTab) => void;
};
const tabs: Array<{
  id: ChecklistTab;
  label: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
}> = [
  {
    id: "escrow",
    label: CHECKLIST_TITLES.escrow,
    icon: (props) => <Icon name="file-text" {...props} />,
  },
  {
    id: "inspections",
    label: CHECKLIST_TITLES.inspections,
    icon: (props) => <Icon name="clipboard-check" {...props} />,
  },
  {
    id: "financing",
    label: CHECKLIST_TITLES.financing,
    icon: (props) => <Icon name="dollar-sign" {...props} />,
  },
  {
    id: "closing",
    label: CHECKLIST_TITLES.closing,
    icon: (props) => <Icon name="home" {...props} />,
  },
];
export default function ClosePageHeader({
  title,
  subtitle: _subtitle, // hidden below the main title per design
  completedCount,
  totalCount,
  loading = false,
  activeTab,
  onTabChange,
}: ClosePageHeaderProps) {
  return (
    <div className="mx-auto w-full max-w-[90vw] xl:px-6 2xl:px-8">
      <Card className="border-beige/40 relative z-30 border-b pt-3" padding="none">
        <div className="px-2">
          <div className="flex justify-center">
            <div className="flex flex-col items-center">
              {/* Title row with logo */}
              <div className="flex items-center justify-center">
                <div className="flex-shrink-0">
                  <MiniLogo size="xs" className="sm:hidden" />
                  <MiniLogo size="sm" className="hidden sm:block lg:hidden" />
                  <MiniLogo size="md" className="hidden lg:block xl:hidden" />
                  <MiniLogo size="lg" className="hidden xl:block" />
                </div>
                <Title
                  as="h1"
                  size="md"
                  className="lg:heading-responsive-md text-navy text-sm font-semibold sm:text-base lg:font-normal"
                >
                  {title}
                </Title>
              </div>

              {/* Subtitle visible on lg+ screens (1024px+), hidden below */}
              <BodyText
                as="p"
                size="sm"
                className="lg:text-responsive-sm text-navy/55 mt-1 hidden lg:block"
              >
                {_subtitle}
              </BodyText>
            </div>
          </div>

          {/* Progress Bar */}
          {!loading && (
            <div className="mt-1 lg:mt-2">
              <div className="bg-beige/30 h-1 w-full rounded lg:h-2">
                <div
                  className="bg-olive h-full rounded transition-all duration-500"
                  style={{ width: `${(completedCount / totalCount) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Tabs Bar */}
        {activeTab && onTabChange && (
          <div className="mt-2 lg:mt-3">
            <div className="scrollbar-hide flex items-center justify-center overflow-x-auto">
              {tabs.map((tab, index) => {
                const isFirst = index === 0;
                const isLast = index === tabs.length - 1;
                return (
                  <div key={tab.id} className="flex min-w-0 flex-1 items-center">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => onTabChange(tab.id)}
                      className={`relative flex flex-1 items-center justify-center gap-1 whitespace-nowrap py-1 text-center transition-all duration-200 lg:py-1.5 ${
                        activeTab === tab.id
                          ? "text-navy/70 text-[11px] font-semibold lg:text-base"
                          : "text-navy/70 rounded-lg text-[10px] font-medium hover:bg-gray-100 lg:text-sm"
                      }`}
                    >
                      <tab.icon className="h-[1em] w-[1em]" />
                      {tab.label}
                      {activeTab === tab.id && (
                        <BodyText
                          as="span"
                          className={`bg-olive absolute bottom-0 h-0.5 ${
                            isFirst
                              ? "left-2 right-2 rounded-l-full"
                              : isLast
                                ? "left-2 right-2 rounded-r-full"
                                : "left-2 right-2 rounded-full"
                          }`}
                        />
                      )}
                    </Button>
                    {index < tabs.length - 1 && (
                      <div className="h-4 w-px flex-shrink-0 bg-gray-300 lg:h-6" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
