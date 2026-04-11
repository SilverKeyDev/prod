import React, { type ReactNode, useCallback, useEffect, useState } from "react";

import { Icon } from "@ui/icons";

import {
  type ChecklistType,
  useChecklistData,
} from "packages/features/checklists/hooks/data/useChecklistData";
import Card from "packages/ui/components/cards/Card";
import ChecklistCheckbox from "packages/ui/components/form/ChecklistCheckbox";
import { Box, Text } from "packages/ui/components/primitives";
import { DOTTED_BORDER_LIGHT_GRAY } from "packages/ui/components/primitives/divider/dividerStyles";

import { BodyText, IconButton } from "@/components/ui";

import ChecklistIntegrationSlot from "./ChecklistIntegrationSlot";

// Shared CSS classes - now using Card component instead with mobile-first responsive design
const sectionTitle =
  "text-responsive-sm font-semibold text-text-primary flex flex-row items-center gap-responsive-xs";
const checkboxContainer = "flex flex-row w-full items-start gap-responsive-xs";
const itemLabel = "text-left font-medium text-text-primary text-responsive-sm";
const itemExplanation = "text-left text-text-secondary text-responsive-xs mt-1";
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
  /** @deprecated Items are now fetched from useChecklistData; this prop is ignored. */
  items?: ChecklistItem[];
  children?: ReactNode;
  showLoadingScreen?: boolean;
  containerClassName?: string;
  showMinLoadingText?: boolean;
  setClosePageHeaderData?: React.Dispatch<
    React.SetStateAction<ClosePageHeaderData | null>
  >;
};
export default function CloseLayout({
  title,
  subtitle,
  sectionTitle: sectionTitleText,
  apiEndpoint,
  children,
  showLoadingScreen = false,
  containerClassName = "py-0",
  showMinLoadingText = false,
  setClosePageHeaderData,
}: CloseLayoutProps) {
  // Extract checklist type from apiEndpoint (e.g., "/api/v1/tasks?type=search" -> "search")
  const checklistType = React.useMemo<ChecklistType>(() => {
    const match = apiEndpoint.match(/type=(\w+)/);
    if (match && match[1]) {
      const type = match[1] as ChecklistType;
      if (
        [
          "search",
          "offer",
          "escrow",
          "financing",
          "closing",
          "insurance",
        ].includes(type)
      ) {
        return type;
      }
    }
    // Fallback to escrow if extraction fails
    return "escrow";
  }, [apiEndpoint]);
  // Use React Query hook for checklist data (uses prefetched data when available)
  const {
    items,
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
  // Expansion state: active item starts expanded; sync when activeItemId or checkedIds change
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() =>
    activeItemId != null ? new Set([activeItemId]) : new Set(),
  );
  useEffect(() => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (activeItemId != null) next.add(activeItemId);
      return next;
    });
  }, [activeItemId]);
  // When an item is checked off, collapse it
  useEffect(() => {
    setExpandedIds((prev) => {
      if (checkedIds.length === 0) return prev;
      const next = new Set(prev);
      let changed = false;
      checkedIds.forEach((id) => {
        if (next.has(id)) {
          next.delete(id);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [checkedIds]);
  const toggleExpand = useCallback((id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);
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
      <Box className="bg-background-base text-text-primary flex flex-row items-center justify-center">
        <BodyText as="p" size="sm">
          Loading checklist…
        </BodyText>
      </Box>
    );
  }
  return (
    <Box className="bg-background-base">
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
          <Card border="light" className="mb-responsive-md" padding="sm">
            <Box className={sectionTitle}>
              <Box className="flex h-4 w-4 flex-shrink-0 flex-row items-center justify-center lg:h-5 lg:w-5">
                <Icon
                  name="check-square"
                  className="text-foreground h-4 w-4 lg:h-5 lg:w-5"
                />
              </Box>
              {sectionTitleText}
            </Box>

            <Box className="mt-responsive-xs text-left">
              <Text className="sr-only">Checklist</Text>
              <Box className="flex flex-col gap-2 overflow-visible">
                {items.map((item, index) => {
                  const isActive =
                    activeItemId != null && item.id === activeItemId;
                  const shouldShowIntegration =
                    (item as { component_key?: string }).component_key != null;
                  const isExpanded = expandedIds.has(item.id);
                  return (
                    <Box
                      key={item.id}
                      className={`w-full rounded-lg px-3 py-2 ${DOTTED_BORDER_LIGHT_GRAY} ${
                        isActive
                          ? "ring-gold relative z-10 overflow-visible shadow-[0_0_3px_rgba(181,168,138,0.6),0_0_10px_rgba(181,168,138,0.35),0_0_20px_rgba(181,168,138,0.15)] ring-1"
                          : ""
                      }`}
                    >
                      <Box className="flex flex-row items-start gap-2">
                        <Box className="min-w-0 flex-1">
                          <ChecklistCheckbox
                            item={item}
                            checked={!!checked[item.id]}
                            onToggle={() => toggle(item.id)}
                            itemLabelClass={itemLabel}
                            itemExplanationClass={itemExplanation}
                            checkboxContainerClass={checkboxContainer}
                            number={index + 1}
                            showDetails={isExpanded}
                          />
                        </Box>
                        <IconButton
                          variant="ghost"
                          size="sm"
                          iconName={
                            isExpanded ? "chevron-down" : "chevron-right"
                          }
                          label={isExpanded ? "Collapse step" : "Expand step"}
                          onPress={() => toggleExpand(item.id)}
                          className="text-text-secondary hover:text-text-primary mt-0.5 flex h-6 w-6 flex-shrink-0"
                        />
                      </Box>
                      {
                        /* isExpanded && */ shouldShowIntegration && (
                          <ChecklistIntegrationSlot
                            componentKey={
                              (item as { component_key?: string }).component_key
                            }
                            isCurrent={true}
                            onComplete={() => void toggleItem(item.id)}
                          />
                        )
                      }
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
