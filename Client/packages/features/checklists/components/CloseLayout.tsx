import React, { type ReactNode, useEffect } from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import {
  type ChecklistType,
  useChecklistData,
} from "packages/features/checklists/hooks/data/useChecklistData";
import Card from "packages/ui/components/cards/Card";
import ChecklistCheckbox from "packages/ui/components/form/ChecklistCheckbox";

import { BodyText } from "@/components/ui";
// Shared CSS classes - now using Card component instead with mobile-first responsive design
const sectionTitle =
  "text-responsive-xs font-semibold text-navy flex items-center gap-responsive-xs mb-responsive-md";
const checkboxContainer = "flex items-start gap-responsive-xs mt-responsive-sm mb-responsive-md";
const itemLabel = "font-medium text-navy text-responsive-sm";
const itemExplanation =
  "text-navy/80 text-responsive-xs mt-1 transition-opacity duration-300 ease-in-out";
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
  children,
  showLoadingScreen = false,
  containerClassName = "py-0",
  showMinLoadingText = false,
  setClosePageHeaderData,
}: CloseLayoutProps) {
  const { t } = useLocalization();
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
  // Use React Query hook for checklist data (items + checkedIds from unified task API)
  const {
    items: itemsFromHook,
    checkedIds,
    isLoading: loading,
    toggleItem,
  } = useChecklistData(checklistType);
  const items = itemsFromHook;
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
  // Primitives for effect deps - avoid object reference changes causing loops
  const completedCount = checkedIds.length;
  const totalCount = items.length;
  // Toggle checkbox state
  const toggle = (id: number) => {
    void toggleItem(id);
  };
  // Update header data when checklist state changes
  // Use primitive deps only; guard setState to avoid unnecessary parent re-renders
  useEffect(() => {
    if (!setClosePageHeaderData) return;
    const next = {
      title,
      subtitle,
      completedCount,
      totalCount,
      loading,
    };
    setClosePageHeaderData((prev) => {
      if (
        prev &&
        prev.title === next.title &&
        prev.subtitle === next.subtitle &&
        prev.completedCount === next.completedCount &&
        prev.totalCount === next.totalCount &&
        prev.loading === next.loading
      ) {
        return prev;
      }
      return next;
    });
  }, [setClosePageHeaderData, title, subtitle, completedCount, totalCount, loading]);
  // Cleanup header data when component unmounts
  useEffect(() => {
    return () => {
      if (setClosePageHeaderData) {
        setClosePageHeaderData(null);
      }
    };
  }, [setClosePageHeaderData]);
  // Show loading screen for pages that need it when no items loaded yet
  if (showLoadingScreen && loading && items.length === 0) {
    return (
      <div className="bg-off-white text-navy flex items-center justify-center">
        {t("close.loading_checklist")}
      </div>
    );
  }
  return (
    <div className="bg-off-white">
      {/* Custom content before checklist */}
      {children && <div className="mb-responsive-sm">{children}</div>}

      {/* Main checklist section */}
      <div className={containerClassName}>
        {loading && showMinLoadingText && (
          <BodyText as="p" className="mb-responsive-sm">
            {t("close.loading_checklist")}
          </BodyText>
        )}

        <div className="px-responsive-sm mx-auto w-full max-w-none">
          <Card className="mb-responsive-md" padding="sm">
            <div className={`${sectionTitle} mb-3`}>
              <Icon
                name="check-square"
                className="text-brown h-3.5 w-3.5 flex-shrink-0 lg:h-4 lg:w-4"
              />
              <BodyText as="span">{sectionTitleText}</BodyText>
            </div>

            <fieldset className="mt-responsive-xs">
              <legend className="sr-only">{t("close.checklist_legend")}</legend>
              <div className="space-y-responsive-md">
                {items.map((item, index) => (
                  <ChecklistCheckbox
                    key={item.id}
                    item={item}
                    checked={!!checked[item.id]}
                    onToggle={() => toggle(item.id)}
                    itemLabelClass={itemLabel}
                    itemExplanationClass={itemExplanation}
                    checkboxContainerClass={checkboxContainer}
                    number={index + 1}
                  />
                ))}
              </div>
            </fieldset>
          </Card>
        </div>
      </div>
    </div>
  );
}
