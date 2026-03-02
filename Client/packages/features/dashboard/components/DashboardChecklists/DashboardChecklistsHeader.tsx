import React from "react";

import { ClipboardCheck, DollarSign, FileText, Home } from "lucide-react";

import { CHECKLIST_TITLES, type ChecklistTab } from "packages/types";
import { BodyText, Button, Title } from "packages/ui/components/index.web";

import Card from "@/components/layout/Card.web";

type DashboardChecklistsHeaderProps = {
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
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "escrow", label: CHECKLIST_TITLES.escrow, icon: FileText },
  {
    id: "inspections",
    label: CHECKLIST_TITLES.inspections,
    icon: ClipboardCheck,
  },
  { id: "financing", label: CHECKLIST_TITLES.financing, icon: DollarSign },
  { id: "closing", label: CHECKLIST_TITLES.closing, icon: Home },
];

export default function DashboardChecklistsHeader({
  title,
  subtitle,
  completedCount,
  totalCount,
  loading = false,
  activeTab,
  onTabChange,
}: DashboardChecklistsHeaderProps) {
  return (
    <Card className="border-beige/40 border-b" padding="none">
      <div className="px-2 pt-2">
        <div className="flex flex-col items-center">
          <Title size="lg" as="h2" className="text-navy font-semibold">
            {title}
          </Title>
          <BodyText as="p" size="sm" className="text-navy/55 mt-1 hidden lg:block">
            {subtitle}
          </BodyText>
        </div>

        {!loading && (
          <div className="mt-1 lg:mt-2">
            <div className="bg-beige/30 h-1 w-full rounded lg:h-2">
              <div
                className="bg-olive h-full rounded transition-all duration-500"
                style={{
                  width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

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
                    className={`relative flex flex-1 items-center justify-center py-1 text-center transition-all duration-200 lg:py-1.5 ${
                      activeTab === tab.id
                        ? "text-navy/70 text-[11px] font-semibold lg:text-base"
                        : "text-navy/70 rounded-lg text-[10px] font-medium hover:bg-gray-100 lg:text-sm"
                    }`}
                  >
                    <BodyText
                      as="span"
                      className="inline-flex flex-nowrap items-center justify-center gap-1.5"
                    >
                      <tab.icon className="h-[1em] w-[1em] shrink-0" />
                      <BodyText as="span" className="whitespace-nowrap">
                        {tab.label}
                      </BodyText>
                    </BodyText>
                    {activeTab === tab.id && (
                      <BodyText
                        as="span"
                        className={`bg-gold absolute bottom-0 h-0.5 ${
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
  );
}
