import React from "react";
import { FileText, ClipboardCheck, DollarSign, Home } from "lucide-react";
import Card from "../../../components/layout/Card";
import {
  CHECKLIST_TITLES,
  type ChecklistTab,
} from "../../../../../packages/schemas";

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
    <Card className="border-b border-beige/40" padding="none">
      <div className="px-2 pt-2">
        <div className="flex flex-col items-center">
          <h2
            className="text-sm sm:text-base font-semibold text-navy"
            role="heading"
            aria-level={2}
          >
            {title}
          </h2>
          <p className="hidden lg:block text-sm text-navy/70 mt-1">
            {subtitle}
          </p>
        </div>

        {!loading && (
          <div className="mt-1 lg:mt-2">
            <div className="h-1 lg:h-2 w-full rounded bg-beige/30">
              <div
                className="h-full rounded bg-olive transition-all duration-500"
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
          <div className="flex justify-center items-center overflow-x-auto scrollbar-hide">
            {tabs.map((tab, index) => {
              const isFirst = index === 0;
              const isLast = index === tabs.length - 1;
              return (
                <div key={tab.id} className="flex items-center flex-1 min-w-0">
                  <button
                    onClick={() => onTabChange(tab.id)}
                    className={`relative flex-1 py-1 lg:py-1.5 transition-all duration-200 whitespace-nowrap text-center flex items-center justify-center gap-1 ${
                      activeTab === tab.id
                        ? "text-[11px] lg:text-base font-semibold text-navy/70"
                        : "text-[10px] lg:text-sm font-medium text-navy/70 hover:bg-gray-100 rounded-lg"
                    }`}
                  >
                    <tab.icon className="w-[1em] h-[1em]" />
                    {tab.label}
                    {activeTab === tab.id && (
                      <span
                        className={`absolute bottom-0 h-0.5 bg-gold ${
                          isFirst
                            ? "left-2 right-2 rounded-l-full"
                            : isLast
                              ? "left-2 right-2 rounded-r-full"
                              : "left-2 right-2 rounded-full"
                        }`}
                      />
                    )}
                  </button>
                  {index < tabs.length - 1 && (
                    <div className="h-4 lg:h-6 w-px bg-gray-300 flex-shrink-0" />
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
