import React, { type ReactNode, useEffect } from "react";

import { Icon } from "@ui/icons";

import {
  type ChecklistType,
  useChecklistData,
} from "packages/features/checklists/hooks/data/useChecklistData";
import Card from "packages/ui/components/cards/Card";
import ChecklistCheckbox from "packages/ui/components/form/ChecklistCheckbox";
import { Box, Text } from "packages/ui/components/primitives";

import { BodyText } from "@/components/ui";

import ChecklistIntegrationSlot from "./ChecklistIntegrationSlot";

// Shared CSS classes - now using Card component instead with mobile-first responsive design
const sectionTitle =
  "text-responsive-sm font-semibold text-navy flex flex-row items-center gap-responsive-xs";
const checkboxContainer = "flex flex-row w-full items-start gap-responsive-xs";
const itemLabel = "text-left font-medium text-navy text-responsive-sm";
const itemExplanation = "text-left text-neutral-700 text-responsive-xs mt-1";
// Shared interfaces
type ResourceLink = {
  label: string;
  href?: string;
};
type ChecklistItem = {
  id: number;
  label: string;
  explanation: string;
  bullets?: string[];
  tip?: string;
  resource?: ResourceLink;
  optional?: boolean;
};
type ClosePageHeaderData = {
  title: string;
  subtitle: string;
  completedCount: number;
  totalCount: number;
  loading: boolean;
};
type CloseLayoutProps = {
  title: string;
  subtitle: string;
  sectionTitle: string;
  apiEndpoint: string;
  items: ChecklistItem[];
  children?: ReactNode;
  showLoadingScreen?: boolean;
  containerClassName?: string;
  showMinLoadingText?: boolean;
  setClosePageHeaderData?: React.Dispatch<React.SetStateAction<ClosePageHeaderData | null>>;
};
export default function CloseLayout({
  title,
  subtitle,
  sectionTitle: sectionTitleText,
  apiEndpoint,
  items,
  children,
  showLoadingScreen = false,
  containerClassName = "py-0",
  showMinLoadingText = false,
  setClosePageHeaderData,
}: CloseLayoutProps) {
  // Extract checklist type from apiEndpoint (e.g., "/api/v1/user/close?type=escrow" -> "escrow")
  const checklistType = React.useMemo<ChecklistType>(() => {
    const match = apiEndpoint.match(/type=(\w+)/);
    if (match && match[1]) {
      const type = match[1] as ChecklistType;
      if (["escrow", "financing", "closing", "insurance"].includes(type)) {
        return type;
      }
    }
    // Fallback to escrow if extraction fails
    return "escrow";
  }, [apiEndpoint]);
  // Use React Query hook for checklist data (uses prefetched data when available)
  const {
    checkedIds,
    activeItemId,
    isLoading: loading,
    toggleItem,
  } = useChecklistData(checklistType);
  // Convert checkedIds array to checked state object
  const checked = React.useMemo(() => {
    const mapping: {
      [id: number]: boolean;
    } = {};
    checkedIds.forEach((id: number) => {
      mapping[id] = true;
    });
    return mapping;
  }, [checkedIds]);
  // Toggle checkbox state
  const toggle = (id: number) => {
    void toggleItem(id);
  };
  // Update header data when checklist state changes
  useEffect(() => {
    if (setClosePageHeaderData) {
      const completedCount = Object.values(checked).filter(Boolean).length;
      const totalCount = items.length;
      setClosePageHeaderData({
        title,
        subtitle,
        completedCount,
        totalCount,
        loading,
      });
    }
  }, [checked, loading, title, subtitle, items.length, setClosePageHeaderData]);
  // Cleanup header data when component unmounts
  useEffect(() => {
    return () => {
      if (setClosePageHeaderData) {
        setClosePageHeaderData(null);
      }
    };
  }, [setClosePageHeaderData]);
  // Show loading screen for pages that need it
  // Only show if no data exists AND is loading
  if (showLoadingScreen && loading && checkedIds.length === 0) {
    return (
      <Box className="bg-off-white text-navy flex flex-row items-center justify-center">
        <BodyText as="p" size="sm">
          Loading checklist…
        </BodyText>
      </Box>
    );
  }
  return (
    <Box className="bg-off-white">
      {/* Custom content before checklist */}
      {children && <Box className="mb-responsive-sm">{children}</Box>}

      {/* Main checklist section */}
      <Box className={containerClassName}>
        {loading && showMinLoadingText && (
          <BodyText size="sm" className="mb-responsive-sm">
            Loading checklist…
          </BodyText>
        )}

        <Box className="w-full max-w-none self-center">
          <Card className="mb-responsive-md" padding="sm">
            <Box className={sectionTitle}>
              <Box className="flex h-4 w-4 flex-shrink-0 flex-row items-center justify-center lg:h-5 lg:w-5">
                <Icon name="check-square" className="text-foreground h-4 w-4 lg:h-5 lg:w-5" />
              </Box>
              {sectionTitleText}
            </Box>

            <Box className="mt-responsive-xs text-left">
              <Text className="sr-only">Checklist</Text>
              <Box className="divide-y divide-gray-200 overflow-visible">
                {items.map((item, index) => {
                  const isActive = activeItemId != null && item.id === activeItemId;
                  const shouldShowIntegration =
                    (item as { component_key?: string }).component_key != null;
                  return (
                    <Box
                      key={item.id}
                      // eslint-disable-next-line silverkey/no-dynamic-class-names -- refactor to static cn() or add to safelist
                      className={`w-full py-2.5 first:pt-0 last:pb-0 ${isActive ? "relative z-10 overflow-visible" : ""}`}
                    >
                      <ChecklistCheckbox
                        item={item}
                        checked={!!checked[item.id]}
                        onToggle={() => toggle(item.id)}
                        itemLabelClass={itemLabel}
                        itemExplanationClass={itemExplanation}
                        checkboxContainerClass={checkboxContainer}
                        number={index + 1}
                        isActive={isActive}
                      />
                      {isActive && shouldShowIntegration && (
                        <ChecklistIntegrationSlot
                          componentKey={(item as { component_key?: string }).component_key}
                          isCurrent={true}
                          onComplete={() => void toggleItem(item.id)}
                        />
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
