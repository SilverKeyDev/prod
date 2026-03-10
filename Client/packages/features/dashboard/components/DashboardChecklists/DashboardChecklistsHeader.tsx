import React from "react";

import { Icon } from "@ui/icons";

import { useFeature } from "packages/contexts";
import { CHECKLIST_TITLES, type ChecklistTab } from "packages/types";
import Button from "packages/ui/components/button/Button";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import Title from "packages/ui/components/text/Title";

const DASHBOARD_CHECKLIST_WEB_CLICKS = "dashboard_checklist_web_clicks";

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
  icon: React.ComponentType<{ className?: string; size?: number; color?: string }>;
}> = [
  { id: "escrow", label: CHECKLIST_TITLES.escrow, icon: (p) => <Icon name="file-text" {...p} /> },
  {
    id: "inspections",
    label: CHECKLIST_TITLES.inspections,
    icon: (p) => <Icon name="clipboard-check" {...p} />,
  },
  {
    id: "financing",
    label: CHECKLIST_TITLES.financing,
    icon: (p) => <Icon name="dollar-sign" {...p} />,
  },
  { id: "closing", label: CHECKLIST_TITLES.closing, icon: (p) => <Icon name="home" {...p} /> },
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
  const useWebClickHandlers = useFeature(DASHBOARD_CHECKLIST_WEB_CLICKS);

  const getTabPressProps = (tab: ChecklistTab): { onClick?: () => void; onPress?: () => void } => {
    return useWebClickHandlers
      ? { onClick: () => onTabChange?.(tab) }
      : { onPress: () => onTabChange?.(tab) };
  };
  return (
    <Box className="border-beige/40 rounded-lg border-b bg-white">
      <Box className="px-2 pt-2">
        <Box className="items-center">
          <Title size="lg" as="h2" className="text-navy font-semibold">
            {title}
          </Title>
          <BodyText size="sm" className="text-navy/55 mt-1" as="p">
            {subtitle}
          </BodyText>
        </Box>

        {!loading && (
          <Box className="mt-2">
            <Box className="bg-beige/30 h-1 w-full overflow-hidden rounded">
              <Box
                className="bg-olive h-full rounded"
                style={{
                  width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
                }}
              />
            </Box>
          </Box>
        )}
      </Box>

      {activeTab != null && onTabChange != null && (
        <Box className="mt-4 flex flex-row items-center justify-center gap-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Box key={tab.id} className="flex-1">
                <Button
                  variant="ghost"
                  {...getTabPressProps(tab)}
                  className={`relative flex w-full items-center justify-center gap-2 px-responsive-sm py-responsive-sm ${
                    isActive ? "font-semibold text-navy" : "font-medium text-navy/70 hover:text-navy/90"
                  }`}
                >
                  <tab.icon className="h-4 w-4 shrink-0" />
                  <BodyText as="span" size="sm" numberOfLines={1}>
                    {tab.label}
                  </BodyText>
                  {isActive && (
                    <Box className="bg-gold absolute bottom-0 left-3 right-3 h-0.5 rounded-full" />
                  )}
                </Button>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
