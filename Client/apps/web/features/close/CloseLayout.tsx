import { CheckSquare } from "lucide-react";
import React, { useState, useEffect, type ReactNode } from "react";

import Card from "../../components/layout/Card";
import ChecklistCheckbox from "../../components/ui/form/ChecklistCheckbox";
import { apiRequest } from "../../../../packages/services/http";
import { asError } from "../../../../packages/utils/error";

// Shared CSS classes - now using Card component instead with mobile-first responsive design
const sectionTitle =
  "text-responsive-sm font-semibold text-navy flex items-center gap-responsive-xs mb-responsive-md";
const checkboxContainer =
  "flex items-start gap-responsive-xs mt-responsive-sm mb-responsive-md";
const itemLabel = "font-medium text-navy text-responsive-xs";
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
  const [checked, setChecked] = useState<{ [id: number]: boolean }>({});
  const [loading, setLoading] = useState(false);

  // Utility function to convert checked state to array of IDs
  const idsFromChecked = (state: { [id: number]: boolean }) =>
    Object.entries(state)
      .filter(([_, v]) => v)
      .map(([k]) => Number(k));

  // Fetch existing checklist from API
  const fetchChecklist = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<{ success: boolean; data: number[] }>(
        apiEndpoint
      );

      // Handle backend response format: {success: true, data: [1, 3, 5]}
      const checklist = res?.data ?? res;

      if (Array.isArray(checklist)) {
        const mapping: { [id: number]: boolean } = {};
        checklist.forEach((id: number) => (mapping[id] = true));
        setChecked(mapping);
      }
    } catch (err: unknown) {
      const error = asError(err);
      console.error(`❌ Failed to fetch ${apiEndpoint} checklist`, error);
    } finally {
      setLoading(false);
    }
  };

  // Update checklist via API
  const updateChecklist = async (newState: { [id: number]: boolean }) => {
    try {
      const body = idsFromChecked(newState);
      await apiRequest(apiEndpoint, {
        method: "PUT",
        body: JSON.stringify(body),
      });
    } catch (err: unknown) {
      const error = asError(err);
      console.error(`❌ Failed to update ${apiEndpoint} checklist`, error);
    }
  };

  // Toggle checkbox state with optimistic update
  const toggle = (id: number) =>
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      void updateChecklist(next);
      return next;
    });

  // Fetch checklist on component mount
  useEffect(() => {
    void fetchChecklist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  if (loading && showLoadingScreen) {
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
              <div className="space-y-responsive-sm">
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
