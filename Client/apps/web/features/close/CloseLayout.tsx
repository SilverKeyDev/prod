import { CheckSquare } from "lucide-react";
import React, { useEffect, type ReactNode } from "react";

import Card from "../../components/layout/Card";
import ChecklistCheckbox from "../../components/ui/form/ChecklistCheckbox";
import { useChecklistData, type ChecklistType } from "../../../../packages/hooks/data/useChecklistData";

// Shared CSS classes - now using Card component instead with mobile-first responsive design
const sectionTitle =
  "text-responsive-sm font-semibold text-navy flex items-center gap-responsive-xs mb-responsive-md";
const checkboxContainer =
  "flex items-start gap-responsive-xs mt-responsive-sm mb-responsive-md";
const itemLabel = "font-medium text-navy text-responsive-sm";
const itemExplanation =
  "text-navy/80 text-responsive-xs mt-1 transition-opacity duration-300 ease-in-out";

// Shared interfaces
export type ResourceLink = {
  label: string;
  href?: string;
};

export type ChecklistItem = {
  id: number;
  label: string;
  explanation: string;
  bullets?: string[];
  tip?: string;
  resource?: ResourceLink;
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
  setClosePageHeaderData?: React.Dispatch<
    React.SetStateAction<ClosePageHeaderData | null>
  >;
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
  const { checkedIds, isLoading: loading, toggleItem } = useChecklistData(checklistType);

  // Convert checkedIds array to checked state object
  const checked = React.useMemo(() => {
    const mapping: { [id: number]: boolean } = {};
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

      void void setClosePageHeaderData({
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
      <div className="flex items-center justify-center bg-off-white text-navy">
        Loading checklist...
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
          <p className="mb-responsive-sm">Loading checklist…</p>
        )}

        <div className="px-responsive-sm mx-auto w-full max-w-none">
          <Card className="mb-responsive-md" padding="sm">
            <div className={`${sectionTitle} mb-[12px]`}>
              <div className="flex h-4 w-4 lg:h-5 lg:w-5 items-center justify-center flex-shrink-0">
                <CheckSquare className="h-4 w-4 lg:h-5 lg:w-5 text-brown" />
              </div>
              {sectionTitleText}
            </div>

            <fieldset className="mt-responsive-xs">
              <legend className="sr-only">Checklist</legend>
              <div className="space-y-responsive-md">
                {items.map((item) => (
                  <ChecklistCheckbox
                    key={item.id}
                    item={item}
                    checked={!!checked[item.id]}
                    onToggle={() => toggle(item.id)}
                    itemLabelClass={itemLabel}
                    itemExplanationClass={itemExplanation}
                    checkboxContainerClass={checkboxContainer}
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
